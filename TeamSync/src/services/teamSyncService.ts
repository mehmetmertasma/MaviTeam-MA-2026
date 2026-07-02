import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit as firestoreLimit,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import type { QueryDocumentSnapshot } from "firebase/firestore";

import { requireFirebaseServices } from "@/lib/firebase";
import { authService } from "@/services/authService";
import { firestoreTeamSyncService } from "@/services/firestoreTeamSyncService";
import type {
  Announcement,
  AttendanceRecord,
  AttendanceStatus,
  ChatGroup,
  ChatMessage,
  Club,
  JoinRequest,
  Payment,
  PaymentStatus,
  Replay,
  ScheduleEvent,
  Team,
  TeamSyncAppData,
  UserProfile,
  UserRole,
} from "@/types/teamSync";

const MAX_FIRESTORE_ROWS = 500;

type CreateClubWorkspaceInput = { ownerFullName: string; ownerEmail: string; clubName: string; sport: string; city: string };
type CreateJoinRequestInput = { fullName: string; email: string; inviteCode: string; requestedRole?: UserRole };
type SaveAttendanceInput = { teamId?: string; sessionDate: string; records: { userId: string; status: AttendanceStatus }[] };
type UpdateMyProfileInput = Partial<Pick<UserProfile, "fullName" | "email">>;
type FirestoreWorkspace = NonNullable<Awaited<ReturnType<typeof firestoreTeamSyncService.getCurrentWorkspace>>>;
type FirestoreRow = Record<string, unknown>;

function nowIso() { return new Date().toISOString(); }
function normalizeClubCode(value: string) { return value.trim().toUpperCase().replace(/[^A-Z0-9ÇĞİÖŞÜ]/g, ""); }
function generateClubCode(clubName: string) { const prefix = normalizeClubCode(clubName).slice(0, 3); return `${prefix || "MT"}${new Date().getFullYear()}`; }
function readString(value: unknown, fallback = "") { return typeof value === "string" && value.trim() !== "" ? value : fallback; }
function readStringArray(value: unknown) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }
function readTimestampString(value: unknown, fallback = nowIso()) {
  if (typeof value === "string" && value.trim() !== "") return value;
  if (typeof value === "object" && value !== null && "toDate" in value && typeof value.toDate === "function") return value.toDate().toISOString();
  return fallback;
}
function readOptionalTimestamp(value: unknown) { const timestamp = readTimestampString(value, ""); return timestamp === "" ? undefined : timestamp; }
function readRole(value: unknown): UserRole { return value === "superAdmin" || value === "clubAdmin" || value === "coach" || value === "parent" || value === "athlete" ? value : "athlete"; }
function readUserStatus(value: unknown): UserProfile["status"] {
  if (value === "active" || value === "pending" || value === "removed") return value;
  if (value === "emailVerified" || value === "pendingApproval") return "pending";
  return "active";
}
function readPaymentStatus(value: unknown): PaymentStatus { return value === "paid" || value === "late" ? value : "unpaid"; }
function readAttendanceStatus(value: unknown): AttendanceStatus { return value === "absent" || value === "late" || value === "excused" ? value : "present"; }
function readReplayType(value: unknown): Replay["type"] { return value === "practice" || value === "drill" ? value : "match"; }
function readJoinRequestStatus(value: unknown): JoinRequest["status"] { return value === "approved" || value === "rejected" ? value : "pending"; }
function getData(snapshot: QueryDocumentSnapshot): FirestoreRow { return snapshot.data() as FirestoreRow; }

function getVerifiedFirebaseUserOrThrow() {
  if (!authService.isConfigured()) throw new Error("FIREBASE_CONFIG_MISSING");
  const firebaseUser = authService.getCurrentUser();
  if (firebaseUser === null || !firebaseUser.emailVerified) throw new Error("AUTH_USER_MISSING");
  return firebaseUser;
}

async function getWorkspaceOrThrow() {
  const workspace = await firestoreTeamSyncService.getCurrentWorkspace(getVerifiedFirebaseUserOrThrow());
  if (workspace === null || workspace.club === null) throw new Error("FIRESTORE_WORKSPACE_MISSING");
  return workspace;
}

async function listClubDocs<T>(collectionName: string, clubId: string, mapper: (snapshot: QueryDocumentSnapshot) => T) {
  const { db } = requireFirebaseServices();
  const snapshots = await getDocs(query(collection(db, collectionName), where("clubId", "==", clubId), firestoreLimit(MAX_FIRESTORE_ROWS)));
  return snapshots.docs.map(mapper);
}

function mapUser(snapshot: QueryDocumentSnapshot): UserProfile {
  const data = getData(snapshot);
  return { id: snapshot.id, fullName: readString(data.fullName, "MaviTeam User"), email: readString(data.email), role: readRole(data.role), status: readUserStatus(data.status), clubId: readString(data.clubId), teamIds: readStringArray(data.teamIds), createdAt: readTimestampString(data.createdAt), updatedAt: readTimestampString(data.updatedAt) };
}
function mapAttendance(snapshot: QueryDocumentSnapshot): AttendanceRecord {
  const data = getData(snapshot);
  return { id: snapshot.id, clubId: readString(data.clubId), teamId: readString(data.teamId) || undefined, userId: readString(data.userId), status: readAttendanceStatus(data.status), sessionDate: readTimestampString(data.sessionDate), recordedByUserId: readString(data.recordedByUserId), recordedAt: readTimestampString(data.recordedAt), updatedAt: readOptionalTimestamp(data.updatedAt) };
}
function mapChatGroup(snapshot: QueryDocumentSnapshot): ChatGroup {
  const data = getData(snapshot);
  return { id: snapshot.id, clubId: readString(data.clubId), teamId: readString(data.teamId) || undefined, name: readString(data.name, "Konuşma"), visibleUserIds: readStringArray(data.visibleUserIds), createdAt: readTimestampString(data.createdAt), updatedAt: readTimestampString(data.updatedAt) };
}
function mapChatMessage(snapshot: QueryDocumentSnapshot): ChatMessage {
  const data = getData(snapshot); const directUserIds = readStringArray(data.directUserIds);
  return { id: snapshot.id, clubId: readString(data.clubId), groupId: readString(data.groupId) || undefined, directUserIds: directUserIds.length > 0 ? directUserIds : undefined, senderUserId: readString(data.senderUserId), text: readString(data.text), createdAt: readTimestampString(data.createdAt) };
}
function mapPayment(snapshot: QueryDocumentSnapshot): Payment {
  const data = getData(snapshot);
  return { id: snapshot.id, clubId: readString(data.clubId), userId: readString(data.userId), title: readString(data.title, "Ödeme"), amountCents: typeof data.amountCents === "number" ? data.amountCents : 0, status: readPaymentStatus(data.status), dueAt: readTimestampString(data.dueAt), paidAt: readOptionalTimestamp(data.paidAt), updatedAt: readTimestampString(data.updatedAt) };
}
function mapReplay(snapshot: QueryDocumentSnapshot): Replay {
  const data = getData(snapshot);
  return { id: snapshot.id, clubId: readString(data.clubId), teamId: readString(data.teamId) || undefined, title: readString(data.title, "Replay"), description: readString(data.description), type: readReplayType(data.type), videoUrl: readString(data.videoUrl), visibleUserIds: readStringArray(data.visibleUserIds), createdByUserId: readString(data.createdByUserId), createdAt: readTimestampString(data.createdAt), updatedAt: readTimestampString(data.updatedAt) };
}
function mapJoinRequest(snapshot: QueryDocumentSnapshot): JoinRequest {
  const data = getData(snapshot);
  return { id: snapshot.id, clubId: readString(data.clubId), userId: readString(data.userId), requestedRole: readRole(data.requestedRole), status: readJoinRequestStatus(data.status), createdAt: readTimestampString(data.createdAt), reviewedByUserId: readString(data.reviewedByUserId) || undefined, reviewedAt: readOptionalTimestamp(data.reviewedAt) };
}

function canManage(role: UserRole) { return role === "superAdmin" || role === "clubAdmin"; }
function canManageSchedule(role: UserRole) { return canManage(role) || role === "coach"; }
function canPublishContent(role: UserRole) { return canManage(role) || role === "coach"; }

async function assertUserBelongsToClub(userId: string, clubId: string) {
  const { db } = requireFirebaseServices();
  const userSnapshot = await getDoc(doc(db, "users", userId));
  if (!userSnapshot.exists() || readString(userSnapshot.data().clubId) !== clubId) throw new Error("USER_NOT_IN_CLUB");
}
async function assertTeamBelongsToClub(teamId: string | undefined, clubId: string) {
  if (teamId === undefined) return;
  const { db } = requireFirebaseServices();
  const teamSnapshot = await getDoc(doc(db, "teams", teamId));
  if (!teamSnapshot.exists() || readString(teamSnapshot.data().clubId) !== clubId) throw new Error("TEAM_NOT_IN_CLUB");
}

async function buildAppData(workspace: FirestoreWorkspace): Promise<TeamSyncAppData> {
  if (workspace.club === null) throw new Error("FIRESTORE_WORKSPACE_MISSING");
  const firebaseUser = getVerifiedFirebaseUserOrThrow();
  const club = workspace.club;
  const [users, teams, announcements, scheduleEvents, attendanceRecords, chatGroups, chatMessages, payments, replays, joinRequests] = await Promise.all([
    listClubDocs("users", club.id, mapUser),
    firestoreTeamSyncService.listTeamsForClub(club.id),
    firestoreTeamSyncService.listAnnouncementsForCurrentClub(firebaseUser),
    firestoreTeamSyncService.listScheduleEventsForClub(club.id),
    listClubDocs("attendanceRecords", club.id, mapAttendance),
    listClubDocs("chatGroups", club.id, mapChatGroup),
    listClubDocs("chatMessages", club.id, mapChatMessage),
    listClubDocs("payments", club.id, mapPayment),
    listClubDocs("replays", club.id, mapReplay),
    listClubDocs("joinRequests", club.id, mapJoinRequest),
  ]);
  const currentUser = { ...workspace.currentUser, clubId: club.id };
  return { club, currentUser, users: users.some((user) => user.id === currentUser.id) ? users : [currentUser, ...users], teams, announcements, scheduleEvents, attendanceRecords, chatGroups: chatGroups.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), chatMessages: chatMessages.sort((a, b) => a.createdAt.localeCompare(b.createdAt)), payments: payments.sort((a, b) => b.dueAt.localeCompare(a.dueAt)), replays: replays.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), joinRequests: joinRequests.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
}

async function reloadCurrentAppData() { return buildAppData(await getWorkspaceOrThrow()); }

export const teamSyncService = {
  async getAppData() { return reloadCurrentAppData(); },
  async resetAppData() { return reloadCurrentAppData(); },
  async getCurrentUser() { return (await getWorkspaceOrThrow()).currentUser; },
  async getCurrentClub() { return (await getWorkspaceOrThrow()).club; },

  async createClubWorkspace(input: CreateClubWorkspaceInput) {
    const firebaseUser = getVerifiedFirebaseUserOrThrow();
    const clubName = input.clubName.trim() || "MaviTeam Kulübü";
    const sport = input.sport.trim() || "Voleybol";
    const clubId = `club-${Date.now()}`;
    await firestoreTeamSyncService.createClubWorkspace({ firebaseUser, clubId, clubName, sport, city: input.city.trim() || "Şehir yok", clubCode: generateClubCode(clubName) });
    await firestoreTeamSyncService.createTeam(firebaseUser, { name: `${sport} Takımı`, ageGroup: "Genel", memberIds: [firebaseUser.uid] });
    return reloadCurrentAppData();
  },

  async createJoinRequest(input: CreateJoinRequestInput) {
    await firestoreTeamSyncService.requestJoinClub({ firebaseUser: getVerifiedFirebaseUserOrThrow(), inviteCode: input.inviteCode, requestedRole: input.requestedRole ?? "athlete" });
  },
  async approveJoinRequest(joinRequestId: string) { await firestoreTeamSyncService.approveJoinRequest(getVerifiedFirebaseUserOrThrow(), joinRequestId); return reloadCurrentAppData(); },
  async rejectJoinRequest(joinRequestId: string) { await firestoreTeamSyncService.rejectJoinRequest(getVerifiedFirebaseUserOrThrow(), joinRequestId); return reloadCurrentAppData(); },

  async updateCurrentUser(updates: UpdateMyProfileInput) {
    const firebaseUser = getVerifiedFirebaseUserOrThrow();
    const updateData: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (updates.fullName !== undefined) updateData.fullName = updates.fullName.trim() || firebaseUser.displayName || "MaviTeam User";
    if (updates.email !== undefined) updateData.email = updates.email.trim().toLowerCase() || (firebaseUser.email ?? "");
    const { db } = requireFirebaseServices();
    await setDoc(doc(db, "users", firebaseUser.uid), updateData, { merge: true });
    return reloadCurrentAppData();
  },

  async updateCurrentClub(updates: Partial<Pick<Club, "name" | "sport" | "city" | "code" | "logoUrl" | "primaryColor">>) {
    const firebaseUser = getVerifiedFirebaseUserOrThrow();
    const workspace = await getWorkspaceOrThrow();
    if (!canManage(workspace.currentUser.role)) throw new Error("CLUB_PERMISSION_DENIED");
    await firestoreTeamSyncService.updateCurrentWorkspace({ firebaseUser, fullName: workspace.currentUser.fullName, clubName: updates.name ?? workspace.club.name, clubSport: updates.sport ?? workspace.club.sport, clubCity: updates.city ?? workspace.club.city, clubCode: updates.code ?? workspace.club.code });
    return reloadCurrentAppData();
  },

  async listUsersByClub(clubId: string) { return listClubDocs("users", clubId, mapUser); },
  async listTeamsByClub(clubId: string) { return firestoreTeamSyncService.listTeamsForClub(clubId); },
  async listAnnouncementsByClub() { return firestoreTeamSyncService.listAnnouncementsForCurrentClub(getVerifiedFirebaseUserOrThrow()); },
  async listScheduleEventsByClub(clubId: string) { return firestoreTeamSyncService.listScheduleEventsForClub(clubId); },

  async createTeam(input: Omit<Team, "id" | "createdAt" | "updatedAt">) {
    await firestoreTeamSyncService.createTeam(getVerifiedFirebaseUserOrThrow(), { name: input.name, ageGroup: input.ageGroup, coachIds: input.coachIds, memberIds: input.memberIds });
    return reloadCurrentAppData();
  },
  async removeTeam(teamId: string) { await firestoreTeamSyncService.removeTeam(getVerifiedFirebaseUserOrThrow(), teamId); return reloadCurrentAppData(); },
  async createAnnouncement(input: Omit<Announcement, "id" | "createdAt" | "updatedAt">) {
    await firestoreTeamSyncService.createAnnouncement(getVerifiedFirebaseUserOrThrow(), { title: input.title, message: input.message, targetType: input.targetType, targetTeamId: input.targetTeamId });
    return reloadCurrentAppData();
  },
  async updateAnnouncement(announcementId: string, updates: Partial<Pick<Announcement, "title" | "message" | "targetType" | "targetTeamId">>) {
    const workspace = await getWorkspaceOrThrow();
    if (!canPublishContent(workspace.currentUser.role)) throw new Error("ANNOUNCEMENT_PERMISSION_DENIED");
    const { db } = requireFirebaseServices();
    const announcementRef = doc(db, "announcements", announcementId);
    const announcementSnapshot = await getDoc(announcementRef);
    if (!announcementSnapshot.exists() || readString(announcementSnapshot.data().clubId) !== workspace.club.id) throw new Error("ANNOUNCEMENT_MISSING");
    await setDoc(announcementRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
    return reloadCurrentAppData();
  },
  async removeAnnouncement(announcementId: string) { await firestoreTeamSyncService.removeAnnouncement(getVerifiedFirebaseUserOrThrow(), announcementId); return reloadCurrentAppData(); },
  async createScheduleEvent(input: Omit<ScheduleEvent, "id" | "createdAt" | "updatedAt">) {
    await firestoreTeamSyncService.createScheduleEvent(getVerifiedFirebaseUserOrThrow(), { teamId: input.teamId, title: input.title, type: input.type, startsAt: input.startsAt, endsAt: input.endsAt, location: input.location, note: input.note });
    return reloadCurrentAppData();
  },
  async updateScheduleEvent(eventId: string, updates: Partial<Pick<ScheduleEvent, "title" | "type" | "startsAt" | "endsAt" | "location" | "note" | "teamId">>) {
    await firestoreTeamSyncService.updateScheduleEvent(getVerifiedFirebaseUserOrThrow(), eventId, updates);
    return reloadCurrentAppData();
  },

  async createChatGroup(input: Omit<ChatGroup, "id" | "createdAt" | "updatedAt">) {
    const firebaseUser = getVerifiedFirebaseUserOrThrow();
    const workspace = await getWorkspaceOrThrow();
    await assertTeamBelongsToClub(input.teamId, workspace.club.id);
    const visibleUserIds = Array.from(new Set([firebaseUser.uid, ...input.visibleUserIds]));
    await Promise.all(visibleUserIds.map((userId) => assertUserBelongsToClub(userId, workspace.club.id)));
    const { db } = requireFirebaseServices();
    const groupId = `chat-${Date.now()}`;
    await setDoc(doc(db, "chatGroups", groupId), { id: groupId, clubId: workspace.club.id, teamId: input.teamId ?? null, name: input.name.trim() || "Yeni konuşma", visibleUserIds, createdByUserId: firebaseUser.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return reloadCurrentAppData();
  },

  async createChatMessage(input: Omit<ChatMessage, "id" | "createdAt">) {
    const firebaseUser = getVerifiedFirebaseUserOrThrow();
    const workspace = await getWorkspaceOrThrow();
    const text = input.text.trim();
    if (text === "") throw new Error("MESSAGE_TEXT_REQUIRED");
    const { db } = requireFirebaseServices();
    const messageId = `message-${Date.now()}`;
    const messageData: Record<string, unknown> = { id: messageId, clubId: workspace.club.id, senderUserId: firebaseUser.uid, text, createdAt: serverTimestamp() };
    if (input.groupId !== undefined) {
      const groupRef = doc(db, "chatGroups", input.groupId);
      const groupSnapshot = await getDoc(groupRef);
      if (!groupSnapshot.exists() || readString(groupSnapshot.data().clubId) !== workspace.club.id) throw new Error("CHAT_GROUP_MISSING");
      const visibleUserIds = readStringArray(groupSnapshot.data().visibleUserIds);
      if (!visibleUserIds.includes(firebaseUser.uid)) throw new Error("CHAT_GROUP_PERMISSION_DENIED");
      messageData.groupId = input.groupId;
      await setDoc(groupRef, { updatedAt: serverTimestamp() }, { merge: true });
    } else {
      const targetUserId = (input.directUserIds ?? []).find((userId) => userId !== firebaseUser.uid);
      if (targetUserId === undefined) throw new Error("DIRECT_MESSAGE_TARGET_REQUIRED");
      await assertUserBelongsToClub(targetUserId, workspace.club.id);
      messageData.directUserIds = [firebaseUser.uid, targetUserId];
    }
    await setDoc(doc(db, "chatMessages", messageId), messageData);
    return reloadCurrentAppData();
  },

  async createPayment(input: Omit<Payment, "id" | "updatedAt">) {
    const workspace = await getWorkspaceOrThrow();
    if (!canManage(workspace.currentUser.role)) throw new Error("PAYMENT_PERMISSION_DENIED");
    await assertUserBelongsToClub(input.userId, workspace.club.id);
    const { db } = requireFirebaseServices();
    const paymentId = `payment-${Date.now()}`;
    await setDoc(doc(db, "payments", paymentId), { id: paymentId, clubId: workspace.club.id, userId: input.userId, title: input.title.trim(), amountCents: input.amountCents, status: input.status, dueAt: input.dueAt, paidAt: input.paidAt ?? null, createdByUserId: workspace.currentUser.id, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return reloadCurrentAppData();
  },
  async updatePaymentStatus(paymentId: string, status: PaymentStatus) {
    const workspace = await getWorkspaceOrThrow();
    if (!canManage(workspace.currentUser.role)) throw new Error("PAYMENT_PERMISSION_DENIED");
    const { db } = requireFirebaseServices();
    const paymentRef = doc(db, "payments", paymentId);
    const paymentSnapshot = await getDoc(paymentRef);
    if (!paymentSnapshot.exists() || readString(paymentSnapshot.data().clubId) !== workspace.club.id) throw new Error("PAYMENT_MISSING");
    await setDoc(paymentRef, { status, paidAt: status === "paid" ? serverTimestamp() : null, updatedAt: serverTimestamp() }, { merge: true });
    return reloadCurrentAppData();
  },

  async createReplay(input: Omit<Replay, "id" | "createdAt" | "updatedAt">) {
    const firebaseUser = getVerifiedFirebaseUserOrThrow();
    const workspace = await getWorkspaceOrThrow();
    if (!canPublishContent(workspace.currentUser.role)) throw new Error("REPLAY_PERMISSION_DENIED");
    await assertTeamBelongsToClub(input.teamId, workspace.club.id);
    const visibleUserIds = Array.from(new Set([firebaseUser.uid, ...input.visibleUserIds]));
    await Promise.all(visibleUserIds.map((userId) => assertUserBelongsToClub(userId, workspace.club.id)));
    const { db } = requireFirebaseServices();
    const replayId = `replay-${Date.now()}`;
    await setDoc(doc(db, "replays", replayId), { id: replayId, clubId: workspace.club.id, teamId: input.teamId ?? null, title: input.title.trim(), description: input.description.trim(), type: input.type, videoUrl: input.videoUrl.trim(), visibleUserIds, createdByUserId: firebaseUser.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return reloadCurrentAppData();
  },
  async removeReplay(replayId: string) {
    const workspace = await getWorkspaceOrThrow();
    if (!canPublishContent(workspace.currentUser.role)) throw new Error("REPLAY_PERMISSION_DENIED");
    const { db } = requireFirebaseServices();
    const replayRef = doc(db, "replays", replayId);
    const replaySnapshot = await getDoc(replayRef);
    if (!replaySnapshot.exists() || readString(replaySnapshot.data().clubId) !== workspace.club.id) throw new Error("REPLAY_MISSING");
    await deleteDoc(replayRef);
    return reloadCurrentAppData();
  },

  async saveAttendance(input: SaveAttendanceInput) {
    const workspace = await getWorkspaceOrThrow();
    if (!canManageSchedule(workspace.currentUser.role)) throw new Error("ATTENDANCE_PERMISSION_DENIED");
    await assertTeamBelongsToClub(input.teamId, workspace.club.id);
    const { db } = requireFirebaseServices();
    const batch = writeBatch(db);
    await Promise.all(input.records.map((record) => assertUserBelongsToClub(record.userId, workspace.club.id)));
    input.records.forEach((record) => {
      const recordId = `attendance-${input.teamId ?? "club"}-${record.userId}-${input.sessionDate}`;
      batch.set(doc(db, "attendanceRecords", recordId), { id: recordId, clubId: workspace.club.id, teamId: input.teamId ?? null, userId: record.userId, status: record.status, sessionDate: input.sessionDate, recordedByUserId: workspace.currentUser.id, recordedAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
    });
    await batch.commit();
    return reloadCurrentAppData();
  },

  async removeUserFromClub(userId: string) {
    const workspace = await getWorkspaceOrThrow();
    if (!canManage(workspace.currentUser.role)) throw new Error("USER_PERMISSION_DENIED");
    await assertUserBelongsToClub(userId, workspace.club.id);
    const { db } = requireFirebaseServices();
    await setDoc(doc(db, "users", userId), { status: "removed", teamIds: [], updatedAt: serverTimestamp() }, { merge: true });
    return reloadCurrentAppData();
  },
};

export type TeamSyncService = typeof teamSyncService;
