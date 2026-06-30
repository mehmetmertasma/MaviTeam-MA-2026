import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import type { QueryDocumentSnapshot } from "firebase/firestore";

import { requireFirebaseServices } from "@/lib/firebase";
import type { Club, JoinRequest, UserProfile, UserRole, UserStatus } from "@/types/teamSync";

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
    createdAt: nowIso(),
    updatedAt: nowIso(),
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
    createdAt: nowIso(),
    updatedAt: nowIso(),
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
    createdAt: nowIso(),
    reviewedByUserId: readString(data.reviewedByUserId, undefined as unknown as string),
    reviewedAt: readString(data.reviewedAt, undefined as unknown as string),
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

    if (currentUser.clubId === "") {
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
