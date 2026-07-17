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
import type { Announcement, JoinRequest, UserProfile, UserRole, UserStatus } from "@/types/teamSync";

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

  async listAnnouncementsForClub(clubId: string, maxResults = 50): Promise<Announcement[]> {
    const { db } = requireFirebaseServices();

    if (clubId.trim() === "") {
      return [];
    }

    const announcementsQuery = query(
      collection(db, "announcements"),
      where("clubId", "==", clubId),
      firestoreLimit(maxResults)
    );
    const announcementSnapshots = await getDocs(announcementsQuery);

    return announcementSnapshots.docs
      .map(getAnnouncementFromFirestore)
      .sort((firstAnnouncement, secondAnnouncement) => secondAnnouncement.createdAt.localeCompare(firstAnnouncement.createdAt));
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
