import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";

import { requireFirebaseServices } from "@/lib/firebase";
import type { Club, UserProfile, UserRole, UserStatus } from "@/types/teamSync";

type FirestoreUserStatus = "emailVerified" | "active" | "pendingApproval" | "removed";

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

type FirestoreWorkspace = {
  currentUser: UserProfile;
  club: Club | null;
};

function nowIso() {
  return new Date().toISOString();
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

  if (value === "pendingApproval") {
    return "pending";
  }

  return "active";
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
        status: input.status ?? "emailVerified",
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
    const clubRef = doc(db, "clubs", input.clubId);
    const userRef = doc(db, "users", input.firebaseUser.uid);

    await setDoc(clubRef, {
      id: input.clubId,
      name: input.clubName,
      sport: input.sport,
      city: input.city,
      code: input.clubCode,
      ownerId: input.firebaseUser.uid,
      primaryColor: "#2563eb",
      logoUrl: "",
      createdAt: now,
      updatedAt: now,
    });

    await setDoc(
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
  },

  async updateCurrentWorkspace(input: UpdateCurrentWorkspaceInput) {
    const { db } = requireFirebaseServices();
    const workspace = await this.getCurrentWorkspace(input.firebaseUser);

    if (workspace === null || workspace.club === null) {
      throw new Error("FIRESTORE_WORKSPACE_MISSING");
    }

    const now = serverTimestamp();
    const userRef = doc(db, "users", input.firebaseUser.uid);
    const clubRef = doc(db, "clubs", workspace.club.id);

    await setDoc(
      userRef,
      {
        fullName: input.fullName.trim() || getDisplayName(input.firebaseUser),
        email: input.firebaseUser.email ?? workspace.currentUser.email,
        emailVerified: input.firebaseUser.emailVerified,
        updatedAt: now,
      },
      { merge: true }
    );

    await setDoc(
      clubRef,
      {
        name: input.clubName.trim() || workspace.club.name,
        sport: input.clubSport.trim() || workspace.club.sport,
        city: input.clubCity.trim() || workspace.club.city,
        code: input.clubCode.trim().toUpperCase() || workspace.club.code,
        updatedAt: now,
      },
      { merge: true }
    );
  },
};
