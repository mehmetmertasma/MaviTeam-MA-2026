import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";

import { requireFirebaseServices } from "@/lib/firebase";
import type { UserRole } from "@/types/teamSync";

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

function getDisplayName(user: User) {
  const displayName = user.displayName?.trim();

  if (displayName) {
    return displayName;
  }

  return user.email?.split("@")[0] ?? "TeamSync User";
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
};
