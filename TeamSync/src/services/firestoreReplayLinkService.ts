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
import type { Replay, ReplayType, UserRole } from "@/types/teamSync";

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

function readStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
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

function readReplayType(value: unknown): ReplayType {
  if (value === "practice" || value === "drill") {
    return value;
  }

  return "match";
}

function getReplayFromFirestore(snapshot: QueryDocumentSnapshot): Replay {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    clubId: readString(data.clubId),
    teamId: readOptionalString(data.teamId),
    title: readString(data.title, "Replay linki"),
    description: readString(data.description),
    type: readReplayType(data.type),
    videoUrl: readString(data.videoUrl),
    visibleUserIds: readStringArray(data.visibleUserIds),
    createdByUserId: readString(data.createdByUserId),
    createdAt: readTimestampString(data.createdAt),
    updatedAt: readTimestampString(data.updatedAt),
  };
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

function sortNewestFirst<T extends { createdAt?: string; updatedAt?: string }>(items: T[]) {
  return uniqueById(items as (T & { id: string })[]).sort((first, second) => {
    const firstValue = first.createdAt ?? first.updatedAt ?? "";
    const secondValue = second.createdAt ?? second.updatedAt ?? "";
    return secondValue.localeCompare(firstValue);
  });
}

function isValidExternalUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function canCreateReplay(role: UserRole) {
  return role === "clubAdmin" || role === "coach";
}

function canDeleteReplay(role: UserRole) {
  return role === "clubAdmin";
}

type CreateReplayLinkInput = Omit<Replay, "id" | "createdAt" | "updatedAt">;

export const firestoreReplayLinkService = {
  async listVisibleReplaysForCurrentUser(firebaseUser: User, maxResults = 120): Promise<Replay[]> {
    const { db } = requireFirebaseServices();
    const workspace = await firestoreTeamSyncService.getCurrentWorkspace(firebaseUser);

    if (workspace === null || workspace.club === null) {
      return [];
    }

    if (workspace.currentUser.role === "clubAdmin") {
      const adminQuery = query(
        collection(db, "replays"),
        where("clubId", "==", workspace.club.id),
        firestoreLimit(maxResults)
      );
      const adminSnapshots = await getDocs(adminQuery);
      return sortNewestFirst(adminSnapshots.docs.map(getReplayFromFirestore));
    }

    const replays: Replay[] = [];
    const visibleUserQuery = query(
      collection(db, "replays"),
      where("clubId", "==", workspace.club.id),
      where("visibleUserIds", "array-contains", firebaseUser.uid),
      firestoreLimit(maxResults)
    );
    const visibleUserSnapshots = await getDocs(visibleUserQuery);
    replays.push(...visibleUserSnapshots.docs.map(getReplayFromFirestore));

    if (workspace.currentUser.teamIds.length > 0) {
      const teamQuery = query(
        collection(db, "replays"),
        where("clubId", "==", workspace.club.id),
        where("teamId", "in", workspace.currentUser.teamIds.slice(0, 10)),
        firestoreLimit(maxResults)
      );
      const teamSnapshots = await getDocs(teamQuery);
      replays.push(...teamSnapshots.docs.map(getReplayFromFirestore));
    }

    const ownQuery = query(
      collection(db, "replays"),
      where("clubId", "==", workspace.club.id),
      where("createdByUserId", "==", firebaseUser.uid),
      firestoreLimit(maxResults)
    );
    const ownSnapshots = await getDocs(ownQuery);
    replays.push(...ownSnapshots.docs.map(getReplayFromFirestore));

    return sortNewestFirst(replays);
  },

  async createReplayLink(firebaseUser: User, input: CreateReplayLinkInput) {
    const { db } = requireFirebaseServices();
    const workspace = await firestoreTeamSyncService.getCurrentWorkspace(firebaseUser);

    if (workspace === null || workspace.club === null || !canCreateReplay(workspace.currentUser.role)) {
      throw new Error("REPLAY_PERMISSION_DENIED");
    }

    if (workspace.currentUser.role === "coach" && (input.teamId === undefined || !workspace.currentUser.teamIds.includes(input.teamId))) {
      throw new Error("REPLAY_PERMISSION_DENIED");
    }

    const cleanTitle = input.title.trim();
    const cleanDescription = input.description.trim();
    const cleanUrl = input.videoUrl.trim();

    if (cleanTitle === "" || cleanDescription === "" || !isValidExternalUrl(cleanUrl)) {
      throw new Error("REPLAY_REQUIRED_FIELDS_MISSING");
    }

    const createdAt = nowIso();
    const replayId = `replay-${Date.now()}`;
    const visibleUserIds = Array.from(new Set([firebaseUser.uid, ...input.visibleUserIds]));
    const replay: Replay = {
      ...input,
      id: replayId,
      clubId: workspace.club.id,
      title: cleanTitle,
      description: cleanDescription,
      videoUrl: cleanUrl,
      visibleUserIds,
      createdByUserId: firebaseUser.uid,
      createdAt,
      updatedAt: createdAt,
    };

    await setDoc(doc(db, "replays", replayId), {
      ...replay,
      teamId: replay.teamId ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return replay;
  },

  async removeReplay(firebaseUser: User, replayId: string) {
    const { db } = requireFirebaseServices();
    const workspace = await firestoreTeamSyncService.getCurrentWorkspace(firebaseUser);

    if (workspace === null || workspace.club === null || !canDeleteReplay(workspace.currentUser.role)) {
      throw new Error("REPLAY_PERMISSION_DENIED");
    }

    const replayRef = doc(db, "replays", replayId);
    const replaySnapshot = await getDoc(replayRef);

    if (!replaySnapshot.exists() || readString(replaySnapshot.data().clubId) !== workspace.club.id) {
      throw new Error("REPLAY_MISSING");
    }

    await deleteDoc(replayRef);
  },
};

export type FirestoreReplayLinkService = typeof firestoreReplayLinkService;
