import {
  arrayRemove,
  arrayUnion,
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
import type { Announcement, Club, JoinRequest, Team, UserProfile, UserRole, UserStatus } from "@/types/teamSync";

type FirestoreUserStatus = "emailVerified" | "active" | "pending" | "pendingApproval" | "removed";

type EnsureUserProfileInput = {
  user: User;
  role?: UserRole;
  status?: FirestoreUserStatus;
};

type CreateClubWorkspaceInput = {
  firebaseUser: User;
  clubId: string;
  clubName: string;
  sport: string;
  city: string;
  clubCode: string;
};

type UpdateCurrentWorkspaceInput = {
  firebaseUser: User;
  fullName: string;
  clubName: string;
  clubSport: string;
  clubCity: string;
  clubCode: string;
};

type RequestJoinClubInput = {
  firebaseUser: User;
  inviteCode: string;
  requestedRole: UserRole;
};

type CreateAnnouncementInput = {
  title: string;
  message: string;
  targetType: Announcement["targetType"];
  targetTeamId?: string;
};

type CreateTeamInput = {
  name: string;
  ageGroup: string;
  coachIds?: string[];
  memberIds?: string[];
};

type FirestoreWorkspace = {
  currentUser: UserProfile;
  club: Club | null;
};

type FirestoreJoinRequestRow = {
  request: JoinRequest;
  user: UserProfile;
};

function nowIso() {
  return new Date().toISOString();
}

function normalizeClubCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9ÇĞİÖŞÜ]/g, "");
}

function getDisplayName(user: User) {
  const displayName = user.displayName?.trim();

  if (displayName) {
    return displayName;
  }

  return user.email?.split("@")[0] ?? "TeamSync User";
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
    fullName: readString(data.fullName, "TeamSync User"),
    email: readString(data.email),
    role: readUserRole(data.role),
    status: readUserStatus(data.status),
    clubId: readString(data.clubId),
    teamIds: readStringArray(data.teamIds),
    createdAt: readTimestampString(data.createdAt),
    updatedAt: readTimestampString(data.updatedAt),
  };
}

function getClubFromFirestore(clubId: string, data: Record<string, unknown>): Club {
  return {
    id: clubId,
    name: readString(data.name, "TeamSync Kulübü"),
    sport: readString(data.sport, "Voleybol"),
    city: readString(data.city, "Şehir yok"),
    code: readString(data.code, "TEAMSYNC"),
    ownerId: readString(data.ownerId),
    logoUrl: readString(data.logoUrl),
    primaryColor: readString(data.primaryColor, "#2563eb"),
    createdAt: readTimestampString(data.createdAt),
    updatedAt: readTimestampString(data.updatedAt),
  };
}

function getAnnouncementFromFirestore(snapshot: QueryDocumentSnapshot): Announcement {
  const data = snapshot.data();
  const targetType = readAnnouncementTarget(data.targetType);
  const targetTeamId = targetType === "team" ? readOptionalString(data.targetTeamId) : undefined;

  return {
    id: snapshot.id,
    clubId: readString(data.clubId),
    title: readString(data.title, "Duyuru"),
    message: readString(data.message),
    targetType,
    targetTeamId,
    createdByUserId: readString(data.createdByUserId),
    createdAt: readTimestampString(data.createdAt),
    updatedAt: readOptionalString(readTimestampString(data.updatedAt, "")),
  };
}

function getTeamFromFirestore(snapshot: QueryDocumentSnapshot): Team {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    clubId: readString(data.clubId),
    name: readString(data.name, "Takım"),
    ageGroup: readString(data.ageGroup, "Genel"),
    coachIds: readStringArray(data.coachIds),
    memberIds: readStringArray(data.memberIds),
    createdAt: readTimestampString(data.createdAt),
    updatedAt: readTimestampString(data.updatedAt),
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

function getUserProfileFromJoinRequest(request: JoinRequest, data: Record<string, unknown>): UserProfile {
  return {
    id: request.userId,
    fullName: readString(data.fullName, "Yeni Kullanıcı"),
    email: readString(data.email),
    role: request.requestedRole,
    status: request.status === "approved" ? "active" : request.status === "rejected" ? "removed" : "pending",
    clubId: request.clubId,
    teamIds: [],
    createdAt: request.createdAt,
    updatedAt: nowIso(),
  };
}

function userCanPublishAnnouncements(role: UserRole) {
  return role === "clubAdmin" || role === "coach";
}

function userCanManageTeams(role: UserRole) {
  return role === "clubAdmin";
}

async function getClubLookupByCode(inviteCode: string) {
  const { db } = requireFirebaseServices();
  const normalizedCode = normalizeClubCode(inviteCode);

  if (normalizedCode === "") {
    throw new Error("INVALID_CLUB_CODE");
  }

  const lookupRef = doc(db, "clubCodes", normalizedCode);
  const lookupSnapshot = await getDoc(lookupRef);

  if (!lookupSnapshot.exists()) {
    throw new Error("INVALID_CLUB_CODE");
  }

  const lookupData = lookupSnapshot.data();
  const clubId = readString(lookupData.clubId);

  if (clubId === "") {
    throw new Error("INVALID_CLUB_CODE");
  }

  return {
    code: normalizedCode,
    clubId,
    clubName: readString(lookupData.clubName, "TeamSync Kulübü"),
  };
}

export const firestoreTeamSyncService = {
  async ensureUserProfile(input: EnsureUserProfileInput) {
    const { db } = requireFirebaseServices();
    const userRef = doc(db, "users", input.user.uid);
    const userSnapshot = await getDoc(userRef);
    const now = serverTimestamp();

    if (!userSnapshot.exists()) {
      await setDoc(userRef, {
        uid: input.user.uid,
        fullName: getDisplayName(input.user),
        email: input.user.email ?? "",
        emailVerified: input.user.emailVerified,
        role: input.role ?? "clubAdmin",
        status: input.status ?? "emailVerified",
        clubId: null,
        teamIds: [],
        createdAt: now,
        updatedAt: now,
      });

      return;
    }

    await setDoc(
      userRef,
      {
        fullName: getDisplayName(input.user),
        email: input.user.email ?? "",
        emailVerified: input.user.emailVerified,
        updatedAt: now,
      },
      { merge: true }
    );
  },

  async getCurrentWorkspace(firebaseUser: User): Promise<FirestoreWorkspace | null> {
    const { db } = requireFirebaseServices();
    const userRef = doc(db, "users", firebaseUser.uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      return null;
    }

    const currentUser = getUserProfileFromFirestore(firebaseUser.uid, userSnapshot.data());

    if (currentUser.clubId === "" || currentUser.status !== "active") {
      return { currentUser, club: null };
    }

    const clubRef = doc(db, "clubs", currentUser.clubId);
    const clubSnapshot = await getDoc(clubRef);

    if (!clubSnapshot.exists()) {
      return { currentUser, club: null };
    }

    return {
      currentUser,
      club: getClubFromFirestore(clubSnapshot.id, clubSnapshot.data()),
    };
  },

  async createClubWorkspace(input: CreateClubWorkspaceInput) {
    const { db } = requireFirebaseServices();
    const now = serverTimestamp();
    const normalizedClubCode = normalizeClubCode(input.clubCode);
    const clubRef = doc(db, "clubs", input.clubId);
    const clubCodeRef = doc(db, "clubCodes", normalizedClubCode);
    const userRef = doc(db, "users", input.firebaseUser.uid);

    const batch = writeBatch(db);

    batch.set(clubRef, {
      id: input.clubId,
      name: input.clubName,
      sport: input.sport,
      city: input.city,
      code: normalizedClubCode,
      ownerId: input.firebaseUser.uid,
      primaryColor: "#2563eb",
      logoUrl: "",
      createdAt: now,
      updatedAt: now,
    });

    batch.set(clubCodeRef, {
      code: normalizedClubCode,
      clubId: input.clubId,
      clubName: input.clubName,
      ownerId: input.firebaseUser.uid,
      createdAt: now,
      updatedAt: now,
    });

    batch.set(
      userRef,
      {
        uid: input.firebaseUser.uid,
        fullName: getDisplayName(input.firebaseUser),
        email: input.firebaseUser.email ?? "",
        emailVerified: input.firebaseUser.emailVerified,
        role: "clubAdmin",
        status: "active",
        clubId: input.clubId,
        teamIds: [],
        updatedAt: now,
      },
      { merge: true }
    );

    await batch.commit();
  },

  async requestJoinClub(input: RequestJoinClubInput) {
    const { db } = requireFirebaseServices();
    const lookup = await getClubLookupByCode(input.inviteCode);
    const now = serverTimestamp();
    const requestId = `${lookup.clubId}_${input.firebaseUser.uid}`;
    const requestRef = doc(db, "joinRequests", requestId);
    const userRef = doc(db, "users", input.firebaseUser.uid);

    const batch = writeBatch(db);

    batch.set(
      userRef,
      {
        uid: input.firebaseUser.uid,
        fullName: getDisplayName(input.firebaseUser),
        email: input.firebaseUser.email ?? "",
        emailVerified: input.firebaseUser.emailVerified,
        role: input.requestedRole,
        status: "pending",
        clubId: lookup.clubId,
        teamIds: [],
        updatedAt: now,
      },
      { merge: true }
    );

    batch.set(
      requestRef,
      {
        id: requestId,
        clubId: lookup.clubId,
        clubCode: lookup.code,
        clubName: lookup.clubName,
        userId: input.firebaseUser.uid,
        fullName: getDisplayName(input.firebaseUser),
        email: input.firebaseUser.email ?? "",
        requestedRole: input.requestedRole,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    await batch.commit();
  },

  async listJoinRequestRowsForCurrentClub(firebaseUser: User): Promise<FirestoreJoinRequestRow[]> {
    const { db } = requireFirebaseServices();
    const workspace = await this.getCurrentWorkspace(firebaseUser);

    if (workspace === null || workspace.club === null || workspace.currentUser.role !== "clubAdmin") {
      return [];
    }

    const requestsQuery = query(collection(db, "joinRequests"), where("clubId", "==", workspace.club.id));
    const requestSnapshots = await getDocs(requestsQuery);

    return requestSnapshots.docs
      .map((snapshot) => {
        const request = getJoinRequestFromFirestore(snapshot);
        const user = getUserProfileFromJoinRequest(request, snapshot.data());

        return { request, user };
      })
      .sort((firstRow, secondRow) => secondRow.request.createdAt.localeCompare(firstRow.request.createdAt));
  },

  async approveJoinRequest(firebaseUser: User, joinRequestId: string) {
    const { db } = requireFirebaseServices();
    const requestRef = doc(db, "joinRequests", joinRequestId);
    const requestSnapshot = await getDoc(requestRef);

    if (!requestSnapshot.exists()) {
      throw new Error("JOIN_REQUEST_MISSING");
    }

    const data = requestSnapshot.data();
    const userId = readString(data.userId);
    const clubId = readString(data.clubId);
    const requestedRole = readUserRole(data.requestedRole);
    const userRef = doc(db, "users", userId);
    const now = serverTimestamp();
    const batch = writeBatch(db);

    batch.set(
      requestRef,
      {
        status: "approved",
        reviewedByUserId: firebaseUser.uid,
        reviewedAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    batch.set(
      userRef,
      {
        role: requestedRole,
        status: "active",
        clubId,
        updatedAt: now,
      },
      { merge: true }
    );

    await batch.commit();
  },

  async rejectJoinRequest(firebaseUser: User, joinRequestId: string) {
    const { db } = requireFirebaseServices();
    const requestRef = doc(db, "joinRequests", joinRequestId);
    const requestSnapshot = await getDoc(requestRef);

    if (!requestSnapshot.exists()) {
      throw new Error("JOIN_REQUEST_MISSING");
    }

    const data = requestSnapshot.data();
    const userId = readString(data.userId);
    const userRef = doc(db, "users", userId);
    const now = serverTimestamp();
    const batch = writeBatch(db);

    batch.set(
      requestRef,
      {
        status: "rejected",
        reviewedByUserId: firebaseUser.uid,
        reviewedAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    batch.set(
      userRef,
      {
        status: "removed",
        updatedAt: now,
      },
      { merge: true }
    );

    await batch.commit();
  },

  async listTeamsForClub(clubId: string, maxResults = 100): Promise<Team[]> {
    const { db } = requireFirebaseServices();

    if (clubId.trim() === "") {
      return [];
    }

    const teamsQuery = query(
      collection(db, "teams"),
      where("clubId", "==", clubId),
      firestoreLimit(maxResults)
    );
    const teamSnapshots = await getDocs(teamsQuery);

    return teamSnapshots.docs
      .map(getTeamFromFirestore)
      .sort((firstTeam, secondTeam) => secondTeam.createdAt.localeCompare(firstTeam.createdAt));
  },

  async createTeam(firebaseUser: User, input: CreateTeamInput) {
    const { db } = requireFirebaseServices();
    const workspace = await this.getCurrentWorkspace(firebaseUser);

    if (workspace === null || workspace.club === null) {
      throw new Error("FIRESTORE_WORKSPACE_MISSING");
    }

    if (!userCanManageTeams(workspace.currentUser.role)) {
      throw new Error("TEAM_PERMISSION_DENIED");
    }

    const cleanName = input.name.trim();
    const cleanAgeGroup = input.ageGroup.trim();

    if (cleanName === "" || cleanAgeGroup === "") {
      throw new Error("TEAM_REQUIRED_FIELDS_MISSING");
    }

    const createdAt = nowIso();
    const now = serverTimestamp();
    const teamId = `team-${Date.now()}`;
    const coachIds = input.coachIds ?? [];
    const memberIds = input.memberIds ?? [];
    const relatedUserIds = [...new Set([...coachIds, ...memberIds])];
    const teamRef = doc(db, "teams", teamId);
    const batch = writeBatch(db);

    batch.set(teamRef, {
      id: teamId,
      clubId: workspace.club.id,
      name: cleanName,
      ageGroup: cleanAgeGroup,
      coachIds,
      memberIds,
      createdByUserId: firebaseUser.uid,
      createdAt: now,
      updatedAt: now,
    });

    relatedUserIds.forEach((userId) => {
      const userRef = doc(db, "users", userId);
      batch.set(
        userRef,
        {
          teamIds: arrayUnion(teamId),
          updatedAt: now,
        },
        { merge: true }
      );
    });

    await batch.commit();

    return {
      id: teamId,
      clubId: workspace.club.id,
      name: cleanName,
      ageGroup: cleanAgeGroup,
      coachIds,
      memberIds,
      createdAt,
      updatedAt: createdAt,
    } satisfies Team;
  },

  async removeTeam(firebaseUser: User, teamId: string) {
    const { db } = requireFirebaseServices();
    const workspace = await this.getCurrentWorkspace(firebaseUser);

    if (workspace === null || workspace.club === null) {
      throw new Error("FIRESTORE_WORKSPACE_MISSING");
    }

    if (!userCanManageTeams(workspace.currentUser.role)) {
      throw new Error("TEAM_PERMISSION_DENIED");
    }

    const teamRef = doc(db, "teams", teamId);
    const teamSnapshot = await getDoc(teamRef);

    if (teamSnapshot.exists() && readString(teamSnapshot.data().clubId) !== workspace.club.id) {
      throw new Error("TEAM_PERMISSION_DENIED");
    }

    const usersWithTeamQuery = query(collection(db, "users"), where("teamIds", "array-contains", teamId));
    const usersWithTeamSnapshots = await getDocs(usersWithTeamQuery);
    const now = serverTimestamp();
    const batch = writeBatch(db);

    batch.delete(teamRef);

    usersWithTeamSnapshots.docs.forEach((userSnapshot) => {
      batch.set(
        doc(db, "users", userSnapshot.id),
        {
          teamIds: arrayRemove(teamId),
          updatedAt: now,
        },
        { merge: true }
      );
    });

    await batch.commit();
  },

  async listAnnouncementsForCurrentClub(firebaseUser: User, maxResults = 30): Promise<Announcement[]> {
    const { db } = requireFirebaseServices();
    const workspace = await this.getCurrentWorkspace(firebaseUser);

    if (workspace === null || workspace.club === null) {
      return [];
    }

    const announcementsQuery = query(
      collection(db, "announcements"),
      where("clubId", "==", workspace.club.id),
      firestoreLimit(maxResults)
    );
    const announcementSnapshots = await getDocs(announcementsQuery);

    return announcementSnapshots.docs
      .map(getAnnouncementFromFirestore)
      .sort((firstAnnouncement, secondAnnouncement) => secondAnnouncement.createdAt.localeCompare(firstAnnouncement.createdAt));
  },

  async createAnnouncement(firebaseUser: User, input: CreateAnnouncementInput) {
    const { db } = requireFirebaseServices();
    const workspace = await this.getCurrentWorkspace(firebaseUser);

    if (workspace === null || workspace.club === null) {
      throw new Error("FIRESTORE_WORKSPACE_MISSING");
    }

    if (!userCanPublishAnnouncements(workspace.currentUser.role)) {
      throw new Error("ANNOUNCEMENT_PERMISSION_DENIED");
    }

    const createdAt = nowIso();
    const announcementId = `announcement-${Date.now()}`;
    const announcementRef = doc(db, "announcements", announcementId);
    const announcementData = {
      id: announcementId,
      clubId: workspace.club.id,
      title: input.title.trim(),
      message: input.message.trim(),
      targetType: input.targetType,
      createdByUserId: firebaseUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...(input.targetType === "team" && input.targetTeamId ? { targetTeamId: input.targetTeamId } : {}),
    };

    await setDoc(announcementRef, announcementData);

    return {
      id: announcementId,
      clubId: workspace.club.id,
      title: input.title.trim(),
      message: input.message.trim(),
      targetType: input.targetType,
      targetTeamId: input.targetType === "team" ? input.targetTeamId : undefined,
      createdByUserId: firebaseUser.uid,
      createdAt,
      updatedAt: createdAt,
    } satisfies Announcement;
  },

  async removeAnnouncement(firebaseUser: User, announcementId: string) {
    const workspace = await this.getCurrentWorkspace(firebaseUser);

    if (workspace === null || workspace.club === null || workspace.currentUser.role !== "clubAdmin") {
      throw new Error("ANNOUNCEMENT_PERMISSION_DENIED");
    }

    const { db } = requireFirebaseServices();
    const announcementRef = doc(db, "announcements", announcementId);

    await deleteDoc(announcementRef);
  },

  async updateCurrentWorkspace(input: UpdateCurrentWorkspaceInput) {
    const { db } = requireFirebaseServices();
    const workspace = await this.getCurrentWorkspace(input.firebaseUser);

    if (workspace === null || workspace.club === null) {
      throw new Error("FIRESTORE_WORKSPACE_MISSING");
    }

    const now = serverTimestamp();
    const normalizedClubCode = normalizeClubCode(input.clubCode);
    const userRef = doc(db, "users", input.firebaseUser.uid);
    const clubRef = doc(db, "clubs", workspace.club.id);
    const clubCodeRef = doc(db, "clubCodes", normalizedClubCode);
    const batch = writeBatch(db);

    batch.set(
      userRef,
      {
        fullName: input.fullName.trim() || getDisplayName(input.firebaseUser),
        email: input.firebaseUser.email ?? workspace.currentUser.email,
        emailVerified: input.firebaseUser.emailVerified,
        updatedAt: now,
      },
      { merge: true }
    );

    batch.set(
      clubRef,
      {
        name: input.clubName.trim() || workspace.club.name,
        sport: input.clubSport.trim() || workspace.club.sport,
        city: input.clubCity.trim() || workspace.club.city,
        code: normalizedClubCode || workspace.club.code,
        updatedAt: now,
      },
      { merge: true }
    );

    if (normalizedClubCode !== "") {
      batch.set(
        clubCodeRef,
        {
          code: normalizedClubCode,
          clubId: workspace.club.id,
          clubName: input.clubName.trim() || workspace.club.name,
          ownerId: input.firebaseUser.uid,
          updatedAt: now,
        },
        { merge: true }
      );
    }

    await batch.commit();
  },
};
