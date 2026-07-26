import {
  arrayRemove,
  arrayUnion,
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
import { firestoreTeamSyncService } from "@/services/firestoreTeamSyncService";
import type { Team, UserProfile, UserRole, UserStatus } from "@/types/teamSync";

type UpdateClubMemberInput = {
  targetUserId: string;
  role: Exclude<UserRole, "superAdmin">;
  status: UserStatus;
  teamIds: string[];
};

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

  return "active";
}

function readTimestampString(value: unknown, fallback = new Date().toISOString()) {
  if (typeof value === "string" && value.trim() !== "") {
    return value;
  }

  if (typeof value === "object" && value !== null && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  return fallback;
}

function getUserProfileFromSnapshot(snapshot: QueryDocumentSnapshot): UserProfile {
  const data = snapshot.data();

  return {
    id: snapshot.id,
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

function getTeamFromSnapshot(snapshot: QueryDocumentSnapshot): Team {
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

function uniqueStringValues(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function canAdminEditTarget(workspaceOwnerId: string, firebaseUserId: string, targetUser: UserProfile) {
  if (targetUser.id === firebaseUserId) {
    throw new Error("MEMBER_SELF_EDIT_DENIED");
  }

  if (targetUser.id === workspaceOwnerId) {
    throw new Error("MEMBER_OWNER_EDIT_DENIED");
  }
}

export const firestoreMemberManagementService = {
  async updateClubMember(firebaseUser: User, input: UpdateClubMemberInput) {
    const { db } = requireFirebaseServices();
    const workspace = await firestoreTeamSyncService.getCurrentWorkspace(firebaseUser);

    if (workspace === null || workspace.club === null || workspace.currentUser.role !== "clubAdmin") {
      throw new Error("MEMBER_PERMISSION_DENIED");
    }

    const targetUserRef = doc(db, "users", input.targetUserId);
    const targetUserSnapshot = await getDoc(targetUserRef);

    if (!targetUserSnapshot.exists()) {
      throw new Error("MEMBER_MISSING");
    }

    const targetUser = getUserProfileFromSnapshot(targetUserSnapshot);

    if (targetUser.clubId !== workspace.club.id) {
      throw new Error("MEMBER_PERMISSION_DENIED");
    }

    canAdminEditTarget(workspace.club.ownerId, firebaseUser.uid, targetUser);

    const teamsQuery = query(collection(db, "teams"), where("clubId", "==", workspace.club.id));
    const teamSnapshots = await getDocs(teamsQuery);
    const teams = teamSnapshots.docs.map(getTeamFromSnapshot);
    const validTeamIds = new Set(teams.map((team) => team.id));
    const requestedTeamIds = input.status === "removed" ? [] : uniqueStringValues(input.teamIds);
    const hasInvalidTeam = requestedTeamIds.some((teamId) => !validTeamIds.has(teamId));

    if (hasInvalidTeam) {
      throw new Error("MEMBER_TEAM_MISSING");
    }

    const batch = writeBatch(db);
    const now = serverTimestamp();

    batch.set(
      targetUserRef,
      {
        role: input.role,
        status: input.status,
        teamIds: requestedTeamIds,
        updatedAt: now,
      },
      { merge: true }
    );

    teams.forEach((team) => {
      const teamRef = doc(db, "teams", team.id);
      const shouldBelongToTeam = requestedTeamIds.includes(team.id);
      const shouldBeCoachForTeam = shouldBelongToTeam && input.role === "coach";

      batch.set(
        teamRef,
        {
          memberIds: shouldBelongToTeam ? arrayUnion(targetUser.id) : arrayRemove(targetUser.id),
          coachIds: shouldBeCoachForTeam ? arrayUnion(targetUser.id) : arrayRemove(targetUser.id),
          updatedAt: now,
        },
        { merge: true }
      );
    });

    await batch.commit();
  },
};

export type FirestoreMemberManagementService = typeof firestoreMemberManagementService;
