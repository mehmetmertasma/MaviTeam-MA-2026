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
} from "firebase/firestore";
import type { User } from "firebase/auth";
import type { QueryDocumentSnapshot } from "firebase/firestore";

import { requireFirebaseServices } from "@/lib/firebase";
import { firestoreTeamSyncService } from "@/services/firestoreTeamSyncService";
import type {
  Announcement,
  JoinRequest,
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
  if (value === "team") {
    return "team";
  }

  return "allClub";
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

function canManageAnnouncement(role: UserRole) {
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
      const adminQuery = query(
        collection(db, "announcements"),
        where("clubId", "==", workspace.club.id),
        firestoreLimit(maxResults)
      );
      const adminSnapshots = await getDocs(adminQuery);
      return sortAnnouncements(adminSnapshots.docs.map(getAnnouncementFromFirestore));
    }

    const allClubQuery = query(
      collection(db, "announcements"),
      where("clubId", "==", workspace.club.id),
      where("targetType", "==", "allClub"),
      firestoreLimit(maxResults)
    );
    const allClubSnapshots = await getDocs(allClubQuery);
    const announcements = allClubSnapshots.docs.map(getAnnouncementFromFirestore);
    const teamIds = workspace.currentUser.teamIds.slice(0, 10);

    if (teamIds.length > 0) {
      const teamQuery = query(
        collection(db, "announcements"),
        where("clubId", "==", workspace.club.id),
        where("targetType", "==", "team"),
        where("targetTeamId", "in", teamIds),
        firestoreLimit(maxResults)
      );
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
      const adminQuery = query(
        collection(db, "scheduleEvents"),
        where("clubId", "==", workspace.club.id),
        firestoreLimit(maxResults)
      );
      const adminSnapshots = await getDocs(adminQuery);
      return sortScheduleEvents(adminSnapshots.docs.map(getScheduleEventFromFirestore));
    }

    const clubWideQuery = query(
      collection(db, "scheduleEvents"),
      where("clubId", "==", workspace.club.id),
      where("teamId", "==", null),
      firestoreLimit(maxResults)
    );
    const clubWideSnapshots = await getDocs(clubWideQuery);
    const events = clubWideSnapshots.docs.map(getScheduleEventFromFirestore);
    const teamIds = workspace.currentUser.teamIds.slice(0, 10);

    if (teamIds.length > 0) {
      const teamQuery = query(
        collection(db, "scheduleEvents"),
        where("clubId", "==", workspace.club.id),
        where("teamId", "in", teamIds),
        firestoreLimit(maxResults)
      );
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

    const joinRequestsQuery = query(
      collection(db, "joinRequests"),
      where("clubId", "==", clubId),
      firestoreLimit(maxResults)
    );
    const joinRequestSnapshots = await getDocs(joinRequestsQuery);

    return joinRequestSnapshots.docs
      .map(getJoinRequestFromFirestore)
      .sort((firstRequest, secondRequest) => secondRequest.createdAt.localeCompare(firstRequest.createdAt));
  },

  async updateAnnouncement(
    firebaseUser: User,
    announcementId: string,
    updates: Partial<Pick<Announcement, "title" | "message" | "targetType" | "targetTeamId">>
  ) {
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

    const updateData: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

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
