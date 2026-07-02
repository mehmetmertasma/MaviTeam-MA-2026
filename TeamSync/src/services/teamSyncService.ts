import {
  collection,
  doc,
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

type CreateClubWorkspaceInput = {
  ownerFullName: string;
  ownerEmail: string;
  clubName: string;
  sport: string;
  city: string;
};

type CreateJoinRequestInput = {
  fullName: string;
  email: string;
  inviteCode: string;
  requestedRole?: UserRole;
};

type SaveAttendanceInput = {
  teamId?: string;
  sessionDate: string;
  records: { userId: string; status: AttendanceStatus }[];
};

type FirestoreWorkspace = NonNullable<Awaited<ReturnType<typeof firestoreTeamSyncService.getCurrentWorkspace>>>;

type FirestoreRow = Record<string, unknown>;

function nowIso() {
  return new Date().toISOString();
}

function normalizeClubCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9ÇĞİÖŞÜ]/g, "");
}

function generateClubCode(clubName: string) {
  const prefix = normalizeClubCode(clubName).slice(0, 3);
  return `${prefix || "MT"}${new Date().getFullYear()}`;
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() !== "" ? value : fallback;
}

function readStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function readTimestampString(value: unknown, fallback = nowIso()) {
  if (typeof value === "string" && value.trim() !== "") return value;
  if (typeof value === "object" && value !== null && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return fallback;
}

function readOptionalTimestamp(value: unknown) {
  const timestamp = readTimestampString(value, "");
  return timestamp === "" ? undefined : timestamp;
}

function readRole(value: unknown): UserRole {
  if (value === "superAdmin" || value === "clubAdmin" || value === "coach" || value === "parent" || value === "athlete") return value;
  return "athlete";
}

function readUserStatus(value: unknown): UserProfile["status"] {
  if (value === "active" || value === "pending" || value === "removed") return value;
  if (value === "emailVerified" || value === "pendingApproval") return "pending";
  return "active";
}

function readPaymentStatus(value: unknown): PaymentStatus {
  if (value === "paid" || value === "late") return value;
  return "unpaid";
}

function readAttendanceStatus(value: unknown): AttendanceStatus {
  if (value === "absent" || value === "late" || value === "excused") return value;
  return "present";
}

function readScheduleType(value: unknown): ScheduleEvent["type"] {
  if (value === "match" || value === "meeting") return value;
  return "practice";
}

function readReplayType(value: unknown): Replay["type"] {
  if (value === "practice" || value === "drill") return value;
  return "match";
}

function readJoinRequestStatus(value: unknown): JoinRequest["status"] {
  if (value === "approved" || value === "rejected") return value;
  return "pending";
}

function readAnnouncementTarget(value: unknown): Announcement["targetType"] {
  return value === "team" ? "team" : "allClub";
}

function getData(snapshot: QueryDocumentSnapshot): FirestoreRow {
  return snapshot.data() as FirestoreRow;
}

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
  return {
    id: snapshot.id,
    fullName: readString(data.fullName, "MaviTeam User"),
    email: readString(data.email),
    role: readRole(data.role),
    status: readUserStatus(data.status),
    clubId: readString(data.clubId),
    teamIds: readStringArray(data.teamIds),
    createdAt: readTimestampString(data.createdAt),
    updatedAt: readTimestampString(data.updatedAt),
  };
}

function mapAttendance(snapshot: QueryDocumentSnapshot): AttendanceRecord {
  const data = getData(snapshot);
  return {
    id: snapshot.id,
    clubId: readString(data.clubId),
    teamId: readString(data.teamId) || undefined,
    userId: readString(data.userId),
    status: readAttendanceStatus(data.status),
    sessionDate: readTimestampString(data.sessionDate),
    recordedByUserId: readString(data.recordedByUserId),
    recordedAt: readTimestampString(data.recordedAt),
    updatedAt: readOptionalTimestamp(data.updatedAt),
  };
}

function mapChatGroup(snapshot: QueryDocumentSnapshot): ChatGroup {
  const data = getData(snapshot);
  return {
    id: snapshot.id,
    clubId: readString(data.clubId),
    teamId: readString(data.teamId) || undefined,
    name: readString(data.name, "Konuşma"),
    visibleUserIds: readStringArray(data.visibleUserIds),
    createdAt: readTimestampString(data.createdAt),
    updatedAt: readTimestampString(data.updatedAt),
  };
}

function mapChatMessage(snapshot: QueryDocumentSnapshot): ChatMessage {
  const data = getData(snapshot);
  const directUserIds = readStringArray(data.directUserIds);
  return {
    id: snapshot.id,
    clubId: readString(data.clubId),
    groupId: readString(data.groupId) || undefined,
    directUserIds: directUserIds.length > 0 ? directUserIds : undefined,
    senderUserId: readString(data.senderUserId),
    text: readString(data.text),
    createdAt: readTimestampString(data.createdAt),
  };
}

function mapPayment(snapshot: QueryDocumentSnapshot): Payment {
  const data = getData(snapshot);
  return {
    id: snapshot.id,
    clubId: readString(data.clubId),
    userId: readString(data.userId),
    title: readString(data.title, "Ödeme"),
    amountCents: typeof data.amountCents === "number" ? data.amountCents : 0,
    status: readPaymentStatus(data.status),
    dueAt: readTimestampString(data.dueAt),
    paidAt: readOptionalTimestamp(data.paidAt),
    updatedAt: readTimestampString(data.updatedAt),
  };
}

function mapReplay(snapshot: QueryDocumentSnapshot): Replay {
  const data = getData(snapshot);
  return {
    id: snapshot.id,
    clubId: readString(data.clubId),
    teamId: readString(data.teamId) || undefined,
    title: readString(data.title, "Replay"),
    description: readString(data.description),
    type: readReplayType(data.type),
    videoUrl: readString(data.videoUrl),
    visibleUserIds: readStringArray(data.visibleUserIds),
    createdByUserId: readString(data.createdByUserId),
    createdAt: readTimestampString(data.createdAt),
    updatedAt: readTimestampString(data.updatedAt),
  };
}

function mapJoinRequest(snapshot: QueryDocumentSnapshot): JoinRequest {
  const data = getData(snapshot);
  return {
    id: snapshot.id,
    clubId: readString(data.clubId),
    userId: readString(data.userId),
    requestedRole: readRole(data.requestedRole),
    status: readJoinRequestStatus(data.status),
    createdAt: readTimestampString(data.createdAt),
    reviewedByUserId: readString(data.reviewedByUserId) || undefined,
    reviewedAt: readOptionalTimestamp(data.reviewedAt),
  };
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
  return {
    club,
    currentUser,
    users: users.some((user) => user.id === currentUser.id) ? users : [currentUser, ...users],
    teams,
    announcements,
    scheduleEvents,
    attendanceRecords,
    chatGroups: chatGroups.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    chatMessages: chatMessages.sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    payments: payments.sort((a, b) => b.dueAt.localeCompare(a.dueAt)),
    replays: replays.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    joinRequests: joinRequests.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}

async function reloadCurrentAppData() {
  return buildAppData(await getWorkspaceOrThrow());
}

function canManage(role: UserRole) {
  return role === "superAdmin" || role === "clubAdmin";
}

function canManageSchedule(role: UserRole) {
  return canManage(role) || role === "coach";
}

export const teamSyncService = {
  async getAppData() {
    return reloadCurrentAppData();
  },

  async resetAppData() {
    return reloadCurrentAppData();
  },

  async getCurrentUser() {
    return (await getWorkspaceOrThrow()).currentUser;
  },

  async getCurrentClub() {
    return (await getWorkspaceOrThrow()).club;
  },

  async createClubWorkspace(input: CreateClubWorkspaceInput) {
    const firebaseUser = getVerifiedFirebaseUserOrThrow();
    const clubName = input.clubName.trim() || "MaviTeam Kulübü";
    const sport = input.sport.trim() || "Voleybol";
    const clubId = `club-${Date.now()}`;
    await firestoreTeamSyncService.createClubWorkspace({
      firebaseUser,
      clubId,
      clubName,
      sport,
      city: input.city.trim() || "Şehir yok",
      clubCode: generateClubCode(clubName),
    });
    await firestoreTeamSyncService.createTeam(firebaseUser, {
      name: `${sport} Takımı`,
      ageGroup: "Genel",
      memberIds: [firebaseUser.uid],
    });
    return reloadCurrentAppData();
  },

  async createJoinRequest(input: CreateJoinRequestInput) {
    await firestoreTeamSyncService.requestJoinClub({
      firebaseUser: getVerifiedFirebaseUserOrThrow(),
      inviteCode: input.inviteCode,
      requestedRole: input.requestedRole ?? "athlete",
    });
  },

  async approveJoinRequest(joinRequestId: string) {
    await firestoreTeamSyncService.approveJoinRequest(getVerifiedFirebaseUserOrThrow(), joinRequestId);
    return reloadCurrentAppData();
  },

  async rejectJoinRequest(joinRequestId: string) {
    await firestoreTeamSyncService.rejectJoinRequest(getVerifiedFirebaseUserOrThrow(), joinRequestId);
    return reloadCurrentAppData();
  },

  async updateCurrentUser(updates: Partial<Pick<UserProfile, "fullName" | "email" | "role" | "status" | "teamIds">>) {
    const firebaseUser = getVerifiedFirebaseUserOrThrow();
    const { db } = requireFirebaseServices();
    await setDoc(doc(db, "users", firebaseUser.uid), { ...updates, updatedAt: serverTimestamp() }, { merge: true });
    return reloadCurrentAppData();
  },

  async updateCurrentClub(updates: Partial<Pick<Club, "name" | "sport" | "city" | "code" | "logoUrl" | "primaryColor">>) {
    const firebaseUser = getVerifiedFirebaseUserOrThrow();
    const workspace = await getWorkspaceOrThrow();
    if (!canManage(workspace.currentUser.role)) throw new Error("CLUB_PERMISSION_DENIED");
    await firestoreTeamSyncService.updateCurrentWorkspace({
      firebaseUser,
      fullName: workspace.currentUser.fullName,
      clubName: updates.name ?? workspace.club.name,
      clubSport: updates.sport ?? workspace.club.sport,
      clubCity: updates.city ?? workspace.club.city,
      clubCode: updates.code ?? workspace.club.code,
    });
    return reloadCurrentAppData();
  },

  async listUsersByClub(clubId: string) {
    return listClubDocs("users", clubId, mapUser);
  },

  async listTeamsByClub(clubId: string) {
    return firestoreTeamSyncService.listTeamsForClub(clubId);
  },

  async listAnnouncementsByClub() {
    return firestoreTeamSyncService.listAnnouncementsForCurrentClub(getVerifiedFirebaseUserOrThrow());
  },

  async listScheduleEventsByClub(clubId: string) {
    return firestoreTeamSyncService.listScheduleEventsForClub(clubId);
  },

  async createTeam(input: Omit<Team, "id" | "createdAt" | "updatedAt">) {
    await firestoreTeamSyncService.createTeam(getVerifiedFirebaseUserOrThrow(), input);
    return reloadCurrentAppData();
  },

  async removeTeam(teamId: string) {
    await firestoreTeamSyncService.removeTeam(getVerifiedFirebaseUserOrThrow(), teamId);
    return reloadCurrentAppData();
  },

  async createAnnouncement(input: Omit<Announcement, "id" | "createdAt" | "updatedAt">) {
    await firestoreTeamSyncService.createAnnouncement(getVerifiedFirebaseUserOrThrow(), input);
    return reloadCurrentAppData();
  },

  async updateAnnouncement(announcementId: string, updates: Partial<Pick<Announcement, "title" | "message" | "targetType" | "targetTeamId">>) {
    const { db } = requireFirebaseServices();
    await setDoc(doc(db, "announcements", announcementId), { ...updates, updatedAt: serverTimestamp() }, { merge: true });
    return reloadCurrentAppData();
  },

  async removeAnnouncement(announcementId: string) {
    await firestoreTeamSyncService.removeAnnouncement(getVerifiedFirebaseUserOrThrow(), announcementId);
    return reloadCurrentAppData();
  },

  async createScheduleEvent(input: Omit<ScheduleEvent, "id" | "createdAt" | "updatedAt">) {
    await firestoreTeamSyncService.createScheduleEvent(getVerifiedFirebaseUserOrThrow(), input);
    return reloadCurrentAppData();
  },

  async updateScheduleEvent(eventId: string, updates: Partial<Pick<ScheduleEvent, "title" | "type" | "startsAt" | "endsAt" | "location" | "note" | "teamId">>) {
    await firestoreTeamSyncService.updateScheduleEvent(getVerifiedFirebaseUserOrThrow(), eventId, updates);
    return reloadCurrentAppData();
  },

  async createChatGroup(input: Omit<ChatGroup, "id" | "createdAt" | "updatedAt">) {
    const { db } = requireFirebaseServices();
    const groupId = `chat-${Date.now()}`;
    await setDoc(doc(db, "chatGroups", groupId), { ...input, id: groupId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return reloadCurrentAppData();
  },

  async createChatMessage(input: Omit<ChatMessage, "id" | "createdAt">) {
    const { db } = requireFirebaseServices();
    const messageId = `message-${Date.now()}`;
    await setDoc(doc(db, "chatMessages", messageId), { ...input, id: messageId, createdAt: serverTimestamp() });
    return reloadCurrentAppData();
  },

  async createPayment(input: Omit<Payment, "id" | "updatedAt">) {
    const workspace = await getWorkspaceOrThrow();
    if (!canManage(workspace.currentUser.role)) throw new Error("PAYMENT_PERMISSION_DENIED");
    const { db } = requireFirebaseServices();
    const paymentId = `payment-${Date.now()}`;
    await setDoc(doc(db, "payments", paymentId), { ...input, id: paymentId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return reloadCurrentAppData();
  },

  async updatePaymentStatus(paymentId: string, status: PaymentStatus) {
    const workspace = await getWorkspaceOrThrow();
    if (!canManage(workspace.currentUser.role)) throw new Error("PAYMENT_PERMISSION_DENIED");
    const { db } = requireFirebaseServices();
    await setDoc(doc(db, "payments", paymentId), { status, paidAt: status === "paid" ? serverTimestamp() : null, updatedAt: serverTimestamp() }, { merge: true });
    return reloadCurrentAppData();
  },

  async createReplay(input: Omit<Replay, "id" | "createdAt" | "updatedAt">) {
    const { db } = requireFirebaseServices();
    const replayId = `replay-${Date.now()}`;
    await setDoc(doc(db, "replays", replayId), { ...input, id: replayId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return reloadCurrentAppData();
  },

  async removeReplay(replayId: string) {
    const { db } = requireFirebaseServices();
    await setDoc(doc(db, "replays", replayId), { removedAt: serverTimestamp() }, { merge: true });
    return reloadCurrentAppData();
  },

  async saveAttendance(input: SaveAttendanceInput) {
    const workspace = await getWorkspaceOrThrow();
    if (!canManageSchedule(workspace.currentUser.role)) throw new Error("ATTENDANCE_PERMISSION_DENIED");
    const { db } = requireFirebaseServices();
    const batch = writeBatch(db);
    input.records.forEach((record) => {
      const recordId = `attendance-${input.teamId ?? "club"}-${record.userId}-${input.sessionDate}`;
      batch.set(doc(db, "attendanceRecords", recordId), {
        id: recordId,
        clubId: workspace.club.id,
        teamId: input.teamId ?? null,
        userId: record.userId,
        status: record.status,
        sessionDate: input.sessionDate,
        recordedByUserId: workspace.currentUser.id,
        recordedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    });
    await batch.commit();
    return reloadCurrentAppData();
  },

  async removeUserFromClub(userId: string) {
    const { db } = requireFirebaseServices();
    await setDoc(doc(db, "users", userId), { status: "removed", teamIds: [], updatedAt: serverTimestamp() }, { merge: true });
    return reloadCurrentAppData();
  },
};

export type TeamSyncService = typeof teamSyncService;
