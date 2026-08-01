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
import type { User } from "firebase/auth";
import type { QueryDocumentSnapshot } from "firebase/firestore";

import { requireFirebaseServices } from "@/lib/firebase";
import { firestoreTeamSyncService } from "@/services/firestoreTeamSyncService";
import type {
  Announcement,
  AttendanceRecord,
  AttendanceStatus,
  ChatGroup,
  ChatMessage,
  JoinRequest,
  Payment,
  PaymentStatus,
  ScheduleEvent,
  ScheduleEventType,
  UserProfile,
  UserRole,
  UserStatus,
} from "@/types/teamSync";

function nowIso() {
  return new Date().toISOString();
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() !== "" ? value : fallback;
}

function readOptionalString(value: unknown) {
  const result = readString(value);
  return result === "" ? undefined : result;
}

function readNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readTimestampString(value: unknown, fallback = nowIso()) {
  if (typeof value === "string" && value.trim() !== "") {
    return value;
  }

  if (typeof value === "object" && value !== null && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  return fallback;
}

function readStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function readUserRole(value: unknown): UserRole {
  if (value === "superAdmin" || value === "clubAdmin" || value === "coach" || value === "parent" || value === "athlete") {
    return value;
  }

  return "athlete";
}

function readUserStatus(value: unknown): UserStatus {
  if (value === "active" || value === "pending" || value === "removed") {
    return value;
  }

  if (value === "pendingApproval" || value === "emailVerified") {
    return "pending";
  }

  return "active";
}

function readAnnouncementTarget(value: unknown): Announcement["targetType"] {
  return value === "team" ? "team" : "allClub";
}

function readScheduleEventType(value: unknown): ScheduleEventType {
  if (value === "match" || value === "meeting") {
    return value;
  }

  return "practice";
}

function readJoinRequestStatus(value: unknown): JoinRequest["status"] {
  if (value === "approved" || value === "rejected") {
    return value;
  }

  return "pending";
}

function readAttendanceStatus(value: unknown): AttendanceStatus {
  if (value === "absent" || value === "late" || value === "excused") {
    return value;
  }

  return "present";
}

function readPaymentStatus(value: unknown): PaymentStatus {
  if (value === "paid" || value === "late") {
    return value;
  }

  return "unpaid";
}

function getUserProfileFromFirestore(userId: string, data: Record<string, unknown>): UserProfile {
  return {
    id: userId,
    fullName: readString(data.fullName, "MaviTeam User"),
    email: readString(data.email),
    role: readUserRole(data.role),
    status: readUserStatus(data.status),
    clubId: readString(data.clubId),
    teamIds: readStringArray(data.teamIds),
    createdAt: readTimestampString(data.createdAt),
    updatedAt: readTimestampString(data.updatedAt),
  };
}

function getAnnouncementFromFirestore(snapshot: QueryDocumentSnapshot): Announcement {
  const data = snapshot.data();
  const targetType = readAnnouncementTarget(data.targetType);

  return {
    id: snapshot.id,
    clubId: readString(data.clubId),
    title: readString(data.title, "Duyuru"),
    message: readString(data.message),
    targetType,
    targetTeamId: targetType === "team" ? readOptionalString(data.targetTeamId) : undefined,
    createdByUserId: readString(data.createdByUserId),
    createdAt: readTimestampString(data.createdAt),
    updatedAt: readOptionalString(readTimestampString(data.updatedAt, "")),
  };
}

function getScheduleEventFromFirestore(snapshot: QueryDocumentSnapshot): ScheduleEvent {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    clubId: readString(data.clubId),
    teamId: readOptionalString(data.teamId),
    title: readString(data.title, "Etkinlik"),
    type: readScheduleEventType(data.type),
    startsAt: readTimestampString(data.startsAt),
    endsAt: readOptionalString(readTimestampString(data.endsAt, "")),
    location: readString(data.location, "Konum yok"),
    note: readOptionalString(data.note),
    createdByUserId: readString(data.createdByUserId),
    createdAt: readTimestampString(data.createdAt),
    updatedAt: readOptionalString(readTimestampString(data.updatedAt, "")),
  };
}

function getJoinRequestFromFirestore(snapshot: QueryDocumentSnapshot): JoinRequest {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    clubId: readString(data.clubId),
    userId: readString(data.userId),
    requestedRole: readUserRole(data.requestedRole),
    status: readJoinRequestStatus(data.status),
    createdAt: readTimestampString(data.createdAt),
    reviewedByUserId: readOptionalString(data.reviewedByUserId),
    reviewedAt: readOptionalString(readTimestampString(data.reviewedAt, "")),
  };
}

function getPaymentFromFirestore(snapshot: QueryDocumentSnapshot): Payment {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    clubId: readString(data.clubId),
    userId: readString(data.userId),
    title: readString(data.title, "Ödeme"),
    amountCents: readNumber(data.amountCents),
    status: readPaymentStatus(data.status),
    dueAt: readTimestampString(data.dueAt),
    paidAt: readOptionalString(readTimestampString(data.paidAt, "")),
    updatedAt: readTimestampString(data.updatedAt),
  };
}

function getAttendanceRecordFromFirestore(snapshot: QueryDocumentSnapshot): AttendanceRecord {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    clubId: readString(data.clubId),
    teamId: readOptionalString(data.teamId),
    userId: readString(data.userId),
    status: readAttendanceStatus(data.status),
    sessionDate: readTimestampString(data.sessionDate),
    recordedByUserId: readString(data.recordedByUserId),
    recordedAt: readTimestampString(data.recordedAt),
    updatedAt: readOptionalString(readTimestampString(data.updatedAt, "")),
  };
}

function getChatGroupFromFirestore(snapshot: QueryDocumentSnapshot): ChatGroup {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    clubId: readString(data.clubId),
    teamId: readOptionalString(data.teamId),
    name: readString(data.name, "Sohbet"),
    visibleUserIds: readStringArray(data.visibleUserIds),
    createdAt: readTimestampString(data.createdAt),
    updatedAt: readTimestampString(data.updatedAt),
  };
}

function getChatMessageFromFirestore(snapshot: QueryDocumentSnapshot): ChatMessage {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    clubId: readString(data.clubId),
    groupId: readOptionalString(data.groupId),
    directUserIds: readStringArray(data.directUserIds),
    visibleUserIds: readStringArray(data.visibleUserIds),
    senderUserId: readString(data.senderUserId),
    text: readString(data.text),
    createdAt: readTimestampString(data.createdAt),
  };
}

function canManageAnnouncement(role: UserRole) {
  return role === "clubAdmin" || role === "coach";
}

function canManagePayments(role: UserRole) {
  return role === "clubAdmin" || role === "superAdmin";
}

function canManageAttendance(role: UserRole) {
  return role === "clubAdmin" || role === "coach";
}

function uniqueById<T extends { id: string }>(items: T[]) {
  const seenIds = new Set<string>();

  return items.filter((item) => {
    if (seenIds.has(item.id)) {
      return false;
    }

    seenIds.add(item.id);
    return true;
  });
}

function sortAnnouncements(announcements: Announcement[]) {
  return uniqueById(announcements).sort((first, second) => second.createdAt.localeCompare(first.createdAt));
}

function sortScheduleEvents(events: ScheduleEvent[]) {
  return uniqueById(events).sort((first, second) => new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime());
}

function sortNewestFirst<T extends { createdAt?: string; recordedAt?: string; updatedAt?: string }>(items: T[]) {
  return uniqueById(items as (T & { id: string })[]).sort((first, second) => {
    const firstValue = first.createdAt ?? first.recordedAt ?? first.updatedAt ?? "";
    const secondValue = second.createdAt ?? second.recordedAt ?? second.updatedAt ?? "";
    return secondValue.localeCompare(firstValue);
  });
}

function createSafeDocumentId(parts: string[]) {
  return parts.map((part) => encodeURIComponent(part.trim() || "empty")).join("_");
}

export const firestoreMaviTeamDataService = {
  async listUsersForClub(clubId: string, maxResults = 200): Promise<UserProfile[]> {
    const { db } = requireFirebaseServices();

    if (clubId.trim() === "") {
      return [];
    }

    const usersQuery = query(collection(db, "users"), where("clubId", "==", clubId), firestoreLimit(maxResults));
    const userSnapshots = await getDocs(usersQuery);

    return userSnapshots.docs
      .map((snapshot) => getUserProfileFromFirestore(snapshot.id, snapshot.data()))
      .filter((user) => user.status !== "removed")
      .sort((firstUser, secondUser) => firstUser.fullName.localeCompare(secondUser.fullName));
  },

  async listVisibleAnnouncementsForCurrentUser(firebaseUser: User, maxResults = 50): Promise<Announcement[]> {
    const { db } = requireFirebaseServices();
    const workspace = await firestoreTeamSyncService.getCurrentWorkspace(firebaseUser);

    if (workspace === null || workspace.club === null) {
      return [];
    }

    if (workspace.currentUser.role === "clubAdmin") {
      const adminQuery = query(collection(db, "announcements"), where("clubId", "==", workspace.club.id), firestoreLimit(maxResults));
      const adminSnapshots = await getDocs(adminQuery);
      return sortAnnouncements(adminSnapshots.docs.map(getAnnouncementFromFirestore));
    }

    const allClubQuery = query(collection(db, "announcements"), where("clubId", "==", workspace.club.id), where("targetType", "==", "allClub"), firestoreLimit(maxResults));
    const allClubSnapshots = await getDocs(allClubQuery);
    const announcements = allClubSnapshots.docs.map(getAnnouncementFromFirestore);
    const teamIds = workspace.currentUser.teamIds.slice(0, 10);

    if (teamIds.length > 0) {
      const teamQuery = query(collection(db, "announcements"), where("clubId", "==", workspace.club.id), where("targetType", "==", "team"), where("targetTeamId", "in", teamIds), firestoreLimit(maxResults));
      const teamSnapshots = await getDocs(teamQuery);
      announcements.push(...teamSnapshots.docs.map(getAnnouncementFromFirestore));
    }

    return sortAnnouncements(announcements);
  },

  async listVisibleScheduleEventsForCurrentUser(firebaseUser: User, maxResults = 150): Promise<ScheduleEvent[]> {
    const { db } = requireFirebaseServices();
    const workspace = await firestoreTeamSyncService.getCurrentWorkspace(firebaseUser);

    if (workspace === null || workspace.club === null) {
      return [];
    }

    if (workspace.currentUser.role === "clubAdmin") {
      const adminQuery = query(collection(db, "scheduleEvents"), where("clubId", "==", workspace.club.id), firestoreLimit(maxResults));
      const adminSnapshots = await getDocs(adminQuery);
      return sortScheduleEvents(adminSnapshots.docs.map(getScheduleEventFromFirestore));
    }

    const clubWideQuery = query(collection(db, "scheduleEvents"), where("clubId", "==", workspace.club.id), where("teamId", "==", null), firestoreLimit(maxResults));
    const clubWideSnapshots = await getDocs(clubWideQuery);
    const events = clubWideSnapshots.docs.map(getScheduleEventFromFirestore);
    const teamIds = workspace.currentUser.teamIds.slice(0, 10);

    if (teamIds.length > 0) {
      const teamQuery = query(collection(db, "scheduleEvents"), where("clubId", "==", workspace.club.id), where("teamId", "in", teamIds), firestoreLimit(maxResults));
      const teamSnapshots = await getDocs(teamQuery);
      events.push(...teamSnapshots.docs.map(getScheduleEventFromFirestore));
    }

    return sortScheduleEvents(events);
  },

  async listJoinRequestsForClub(clubId: string, maxResults = 100): Promise<JoinRequest[]> {
    const { db } = requireFirebaseServices();

    if (clubId.trim() === "") {
      return [];
    }

    const joinRequestsQuery = query(collection(db, "joinRequests"), where("clubId", "==", clubId), firestoreLimit(maxResults));
    const joinRequestSnapshots = await getDocs(joinRequestsQuery);

    return joinRequestSnapshots.docs
      .map(getJoinRequestFromFirestore)
      .sort((firstRequest, secondRequest) => secondRequest.createdAt.localeCompare(firstRequest.createdAt));
  },

  async listVisiblePaymentsForCurrentUser(firebaseUser: User, maxResults = 150): Promise<Payment[]> {
    const { db } = requireFirebaseServices();
    const workspace = await firestoreTeamSyncService.getCurrentWorkspace(firebaseUser);

    if (workspace === null || workspace.club === null) {
      return [];
    }

    const paymentsQuery = canManagePayments(workspace.currentUser.role)
      ? query(collection(db, "payments"), where("clubId", "==", workspace.club.id), firestoreLimit(maxResults))
      : query(collection(db, "payments"), where("clubId", "==", workspace.club.id), where("userId", "==", firebaseUser.uid), firestoreLimit(maxResults));
    const paymentSnapshots = await getDocs(paymentsQuery);

    return sortNewestFirst(paymentSnapshots.docs.map(getPaymentFromFirestore));
  },

  async createPayment(firebaseUser: User, input: Omit<Payment, "id" | "updatedAt">) {
    const { db } = requireFirebaseServices();
    const workspace = await firestoreTeamSyncService.getCurrentWorkspace(firebaseUser);

    if (workspace === null || workspace.club === null || !canManagePayments(workspace.currentUser.role)) {
      throw new Error("PAYMENT_PERMISSION_DENIED");
    }

    const updatedAt = nowIso();
    const paymentId = `payment-${Date.now()}`;
    const paymentRef = doc(db, "payments", paymentId);
    const payment: Payment = {
      ...input,
      id: paymentId,
      clubId: workspace.club.id,
      updatedAt,
    };

    await setDoc(paymentRef, {
      ...payment,
      paidAt: payment.paidAt ?? null,
      updatedAt: serverTimestamp(),
    });

    return payment;
  },

  async updatePaymentStatus(firebaseUser: User, paymentId: string, status: PaymentStatus) {
    const { db } = requireFirebaseServices();
    const workspace = await firestoreTeamSyncService.getCurrentWorkspace(firebaseUser);

    if (workspace === null || workspace.club === null || !canManagePayments(workspace.currentUser.role)) {
      throw new Error("PAYMENT_PERMISSION_DENIED");
    }

    const paymentRef = doc(db, "payments", paymentId);
    const paymentSnapshot = await getDoc(paymentRef);

    if (!paymentSnapshot.exists() || readString(paymentSnapshot.data().clubId) !== workspace.club.id) {
      throw new Error("PAYMENT_MISSING");
    }

    await setDoc(
      paymentRef,
      {
        status,
        paidAt: status === "paid" ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  },

  async listVisibleAttendanceRecordsForCurrentUser(firebaseUser: User, maxResults = 300): Promise<AttendanceRecord[]> {
    const { db } = requireFirebaseServices();
    const workspace = await firestoreTeamSyncService.getCurrentWorkspace(firebaseUser);

    if (workspace === null || workspace.club === null) {
      return [];
    }

    if (workspace.currentUser.role === "clubAdmin") {
      const adminQuery = query(collection(db, "attendanceRecords"), where("clubId", "==", workspace.club.id), firestoreLimit(maxResults));
      const adminSnapshots = await getDocs(adminQuery);
      return sortNewestFirst(adminSnapshots.docs.map(getAttendanceRecordFromFirestore));
    }

    if (workspace.currentUser.teamIds.length > 0) {
      const teamQuery = query(collection(db, "attendanceRecords"), where("clubId", "==", workspace.club.id), where("teamId", "in", workspace.currentUser.teamIds.slice(0, 10)), firestoreLimit(maxResults));
      const teamSnapshots = await getDocs(teamQuery);
      return sortNewestFirst(teamSnapshots.docs.map(getAttendanceRecordFromFirestore));
    }

    const selfQuery = query(collection(db, "attendanceRecords"), where("clubId", "==", workspace.club.id), where("userId", "==", firebaseUser.uid), firestoreLimit(maxResults));
    const selfSnapshots = await getDocs(selfQuery);
    return sortNewestFirst(selfSnapshots.docs.map(getAttendanceRecordFromFirestore));
  },

  async saveAttendance(firebaseUser: User, input: { teamId?: string; sessionDate: string; records: { userId: string; status: AttendanceStatus }[] }) {
    const { db } = requireFirebaseServices();
    const workspace = await firestoreTeamSyncService.getCurrentWorkspace(firebaseUser);

    if (workspace === null || workspace.club === null || !canManageAttendance(workspace.currentUser.role)) {
      throw new Error("ATTENDANCE_PERMISSION_DENIED");
    }

    if (workspace.currentUser.role === "coach" && (input.teamId === undefined || !workspace.currentUser.teamIds.includes(input.teamId))) {
      throw new Error("ATTENDANCE_PERMISSION_DENIED");
    }

    const clubId = workspace.club.id;
    const recordedAt = nowIso();
    const batch = writeBatch(db);
    const savedRecords = input.records.map((record) => {
      const recordId = `attendance-${createSafeDocumentId([input.teamId ?? "club", record.userId, input.sessionDate])}`;
      const attendanceRecord: AttendanceRecord = {
        id: recordId,
        clubId,
        teamId: input.teamId,
        userId: record.userId,
        status: record.status,
        sessionDate: input.sessionDate,
        recordedByUserId: firebaseUser.uid,
        recordedAt,
        updatedAt: recordedAt,
      };
      const recordRef = doc(db, "attendanceRecords", recordId);

      batch.set(
        recordRef,
        {
          ...attendanceRecord,
          teamId: attendanceRecord.teamId ?? null,
          recordedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      return attendanceRecord;
    });

    await batch.commit();
    return savedRecords;
  },

  async listVisibleChatGroupsForCurrentUser(firebaseUser: User, maxResults = 100): Promise<ChatGroup[]> {
    const { db } = requireFirebaseServices();
    const workspace = await firestoreTeamSyncService.getCurrentWorkspace(firebaseUser);

    if (workspace === null || workspace.club === null) {
      return [];
    }

    if (workspace.currentUser.role === "clubAdmin") {
      const adminQuery = query(collection(db, "chatGroups"), where("clubId", "==", workspace.club.id), firestoreLimit(maxResults));
      const adminSnapshots = await getDocs(adminQuery);
      return sortNewestFirst(adminSnapshots.docs.map(getChatGroupFromFirestore));
    }

    const visibleQuery = query(collection(db, "chatGroups"), where("clubId", "==", workspace.club.id), where("visibleUserIds", "array-contains", firebaseUser.uid), firestoreLimit(maxResults));
    const visibleSnapshots = await getDocs(visibleQuery);
    const groups = visibleSnapshots.docs.map(getChatGroupFromFirestore);
    const teamIds = workspace.currentUser.teamIds.slice(0, 10);

    if (teamIds.length > 0) {
      const teamQuery = query(collection(db, "chatGroups"), where("clubId", "==", workspace.club.id), where("teamId", "in", teamIds), firestoreLimit(maxResults));
      const teamSnapshots = await getDocs(teamQuery);
      groups.push(...teamSnapshots.docs.map(getChatGroupFromFirestore));
    }

    return sortNewestFirst(groups);
  },

  async listVisibleChatMessagesForCurrentUser(firebaseUser: User, groupIds: string[] = [], maxResults = 250): Promise<ChatMessage[]> {
    const { db } = requireFirebaseServices();
    const workspace = await firestoreTeamSyncService.getCurrentWorkspace(firebaseUser);

    if (workspace === null || workspace.club === null) {
      return [];
    }

    const messages: ChatMessage[] = [];
    const directQuery = query(collection(db, "chatMessages"), where("clubId", "==", workspace.club.id), where("directUserIds", "array-contains", firebaseUser.uid), firestoreLimit(maxResults));
    const directSnapshots = await getDocs(directQuery);
    messages.push(...directSnapshots.docs.map(getChatMessageFromFirestore));

    const limitedGroupIds = groupIds.filter(Boolean).slice(0, 10);

    if (limitedGroupIds.length > 0) {
      const groupQuery = query(collection(db, "chatMessages"), where("clubId", "==", workspace.club.id), where("groupId", "in", limitedGroupIds), firestoreLimit(maxResults));
      const groupSnapshots = await getDocs(groupQuery);
      messages.push(...groupSnapshots.docs.map(getChatMessageFromFirestore));
    }

    return uniqueById(messages).sort((first, second) => first.createdAt.localeCompare(second.createdAt));
  },

  async createChatGroup(firebaseUser: User, input: Omit<ChatGroup, "id" | "createdAt" | "updatedAt">) {
    const { db } = requireFirebaseServices();
    const workspace = await firestoreTeamSyncService.getCurrentWorkspace(firebaseUser);

    if (workspace === null || workspace.club === null) {
      throw new Error("CHAT_PERMISSION_DENIED");
    }

    if (workspace.currentUser.role !== "clubAdmin" && (input.teamId === undefined || !workspace.currentUser.teamIds.includes(input.teamId))) {
      throw new Error("CHAT_PERMISSION_DENIED");
    }

    const createdAt = nowIso();
    const chatGroupId = `chat-${Date.now()}`;
    const visibleUserIds = Array.from(new Set([firebaseUser.uid, ...input.visibleUserIds]));
    const chatGroup: ChatGroup = {
      ...input,
      id: chatGroupId,
      clubId: workspace.club.id,
      visibleUserIds,
      createdAt,
      updatedAt: createdAt,
    };

    await setDoc(doc(db, "chatGroups", chatGroupId), {
      ...chatGroup,
      teamId: chatGroup.teamId ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return chatGroup;
  },

  async createChatMessage(firebaseUser: User, input: Omit<ChatMessage, "id" | "createdAt">) {
    const { db } = requireFirebaseServices();
    const workspace = await firestoreTeamSyncService.getCurrentWorkspace(firebaseUser);

    if (workspace === null || workspace.club === null || input.senderUserId !== firebaseUser.uid || input.text.trim() === "") {
      throw new Error("CHAT_PERMISSION_DENIED");
    }

    // Denormalize the target group's visibleUserIds onto the message itself so
    // firestore.rules can authorize reads without a per-document lookup (see
    // canReadChatMessage) — a list query can't safely use a get() keyed off a
    // field on the very documents it's evaluating.
    let visibleUserIds: string[] | undefined;

    if (input.groupId !== undefined) {
      const groupSnapshot = await getDoc(doc(db, "chatGroups", input.groupId));

      if (!groupSnapshot.exists()) {
        throw new Error("CHAT_PERMISSION_DENIED");
      }

      visibleUserIds = readStringArray(groupSnapshot.data().visibleUserIds);
    }

    const createdAt = nowIso();
    const messageId = `message-${Date.now()}`;
    const directUserIds = input.directUserIds === undefined ? undefined : Array.from(new Set([firebaseUser.uid, ...input.directUserIds]));
    const message: ChatMessage = {
      ...input,
      id: messageId,
      clubId: workspace.club.id,
      directUserIds,
      visibleUserIds,
      text: input.text.trim(),
      createdAt,
    };

    await setDoc(doc(db, "chatMessages", messageId), {
      id: message.id,
      clubId: message.clubId,
      groupId: message.groupId ?? null,
      directUserIds: message.directUserIds ?? null,
      visibleUserIds: message.visibleUserIds ?? null,
      senderUserId: message.senderUserId,
      text: message.text,
      createdAt: serverTimestamp(),
    });

    return message;
  },

  async updateAnnouncement(firebaseUser: User, announcementId: string, updates: Partial<Pick<Announcement, "title" | "message" | "targetType" | "targetTeamId">>) {
    const { db } = requireFirebaseServices();
    const workspace = await firestoreTeamSyncService.getCurrentWorkspace(firebaseUser);

    if (workspace === null || workspace.club === null || !canManageAnnouncement(workspace.currentUser.role)) {
      throw new Error("ANNOUNCEMENT_PERMISSION_DENIED");
    }

    const announcementRef = doc(db, "announcements", announcementId);
    const announcementSnapshot = await getDoc(announcementRef);

    if (!announcementSnapshot.exists() || readString(announcementSnapshot.data().clubId) !== workspace.club.id) {
      throw new Error("ANNOUNCEMENT_MISSING");
    }

    const updateData: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (updates.title !== undefined) updateData.title = updates.title.trim();
    if (updates.message !== undefined) updateData.message = updates.message.trim();
    if (updates.targetType !== undefined) updateData.targetType = updates.targetType;
    if (updates.targetTeamId !== undefined) updateData.targetTeamId = updates.targetTeamId;
    if (updates.targetType === "allClub") updateData.targetTeamId = null;

    await setDoc(announcementRef, updateData, { merge: true });
  },

  async removeAnnouncement(firebaseUser: User, announcementId: string) {
    const { db } = requireFirebaseServices();
    const workspace = await firestoreTeamSyncService.getCurrentWorkspace(firebaseUser);

    if (workspace === null || workspace.club === null || workspace.currentUser.role !== "clubAdmin") {
      throw new Error("ANNOUNCEMENT_PERMISSION_DENIED");
    }

    const announcementRef = doc(db, "announcements", announcementId);
    const announcementSnapshot = await getDoc(announcementRef);

    if (!announcementSnapshot.exists() || readString(announcementSnapshot.data().clubId) !== workspace.club.id) {
      throw new Error("ANNOUNCEMENT_MISSING");
    }

    await deleteDoc(announcementRef);
  },
};

export type FirestoreMaviTeamDataService = typeof firestoreMaviTeamDataService;
