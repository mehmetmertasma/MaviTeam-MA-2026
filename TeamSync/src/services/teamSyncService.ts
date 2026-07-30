import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "firebase/auth";

import { initialTeamSyncData } from "@/data/initialTeamSyncData";
import { authService } from "@/services/authService";
import { firestoreMaviTeamDataService } from "@/services/firestoreMaviTeamDataService";
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

const MAVITEAM_APP_DATA_KEY = "maviteam_app_data_v1";
const LEGACY_TEAMSYNC_APP_DATA_KEY = "teamsync_app_data_v1";

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

type StoredAppData = TeamSyncAppData & {
  attendanceRecords?: AttendanceRecord[];
  replays?: Replay[];
};

type FirestoreWorkspace = NonNullable<Awaited<ReturnType<typeof firestoreTeamSyncService.getCurrentWorkspace>>>;

type FirestoreDataOverrides = {
  users?: UserProfile[];
  teams?: Team[];
  announcements?: Announcement[];
  scheduleEvents?: ScheduleEvent[];
  attendanceRecords?: AttendanceRecord[];
  chatGroups?: ChatGroup[];
  chatMessages?: ChatMessage[];
  payments?: Payment[];
  joinRequests?: JoinRequest[];
};

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

function getUserDisplayName(firebaseUser: User) {
  const displayName = firebaseUser.displayName?.trim();

  if (displayName) {
    return displayName;
  }

  return firebaseUser.email?.split("@")[0] ?? "MaviTeam User";
}

function createEmptyClub(): Club {
  const createdAt = nowIso();

  return {
    id: "",
    name: "MaviTeam",
    sport: "",
    city: "",
    code: "",
    ownerId: "",
    primaryColor: "#2563eb",
    logoUrl: "",
    createdAt,
    updatedAt: createdAt,
  };
}

function createUserProfileFromFirebase(firebaseUser: User): UserProfile {
  const createdAt = nowIso();

  return {
    id: firebaseUser.uid,
    fullName: getUserDisplayName(firebaseUser),
    email: firebaseUser.email ?? "",
    role: "athlete",
    status: "pending",
    clubId: "",
    teamIds: [],
    createdAt,
    updatedAt: createdAt,
  };
}

function createEmptyAppData(currentUser: UserProfile, club: Club | null = null): TeamSyncAppData {
  return {
    club: club ?? createEmptyClub(),
    currentUser,
    users: [currentUser],
    teams: [],
    announcements: [],
    scheduleEvents: [],
    attendanceRecords: [],
    chatGroups: [],
    chatMessages: [],
    payments: [],
    replays: [],
    joinRequests: [],
  };
}

function ensureAppDataShape(data: StoredAppData) {
  return {
    ...data,
    attendanceRecords: Array.isArray(data.attendanceRecords) ? data.attendanceRecords : [],
    replays: Array.isArray(data.replays) ? data.replays : [],
  } satisfies TeamSyncAppData;
}

function parseStoredAppData(value: string | null) {
  if (value === null) {
    return null;
  }

  try {
    return ensureAppDataShape(JSON.parse(value) as StoredAppData);
  } catch {
    return null;
  }
}

function includeCurrentUser(users: UserProfile[], currentUser: UserProfile) {
  const withoutCurrentUser = users.filter((user) => user.id !== currentUser.id);
  return [currentUser, ...withoutCurrentUser];
}

function filterByClubId<T extends { clubId: string }>(items: T[], clubId: string) {
  return items.filter((item) => item.clubId === clubId);
}

function userCanReadClubRoster(role: UserRole) {
  return role === "clubAdmin" || role === "coach";
}

function mergeFirestoreWorkspaceIntoAppData(
  localAppData: TeamSyncAppData,
  workspace: FirestoreWorkspace,
  overrides: FirestoreDataOverrides = {}
) {
  const currentUser = workspace.club === null
    ? workspace.currentUser
    : { ...workspace.currentUser, clubId: workspace.club.id };

  if (workspace.club === null) {
    return createEmptyAppData(currentUser);
  }

  const clubId = workspace.club.id;
  const firestoreUsers = overrides.users ?? [];
  const users = includeCurrentUser(firestoreUsers, currentUser);

  return {
    club: workspace.club,
    currentUser,
    users,
    teams: overrides.teams ?? [],
    announcements: overrides.announcements ?? [],
    scheduleEvents: overrides.scheduleEvents ?? [],
    attendanceRecords: overrides.attendanceRecords ?? filterByClubId(localAppData.attendanceRecords, clubId),
    chatGroups: overrides.chatGroups ?? filterByClubId(localAppData.chatGroups, clubId),
    chatMessages: overrides.chatMessages ?? filterByClubId(localAppData.chatMessages, clubId),
    payments: overrides.payments ?? filterByClubId(localAppData.payments, clubId),
    replays: filterByClubId(localAppData.replays, clubId),
    joinRequests: currentUser.role === "clubAdmin" ? overrides.joinRequests ?? [] : [],
  } satisfies TeamSyncAppData;
}

async function loadLocalAppData(): Promise<TeamSyncAppData> {
  const savedData = parseStoredAppData(await AsyncStorage.getItem(MAVITEAM_APP_DATA_KEY));

  if (savedData !== null) {
    return savedData;
  }

  const legacyData = parseStoredAppData(await AsyncStorage.getItem(LEGACY_TEAMSYNC_APP_DATA_KEY));

  if (legacyData !== null) {
    await AsyncStorage.setItem(MAVITEAM_APP_DATA_KEY, JSON.stringify(legacyData));
    return legacyData;
  }

  await AsyncStorage.setItem(MAVITEAM_APP_DATA_KEY, JSON.stringify(initialTeamSyncData));
  return initialTeamSyncData;
}

function tagError<T>(label: string, promise: Promise<T>): Promise<T> {
  return promise.catch((error) => {
    console.error(`[loadAppData] ${label} failed:`, error);
    throw error;
  });
}

async function loadAppData(): Promise<TeamSyncAppData> {
  const localAppData = await loadLocalAppData();

  if (!authService.isConfigured()) {
    return localAppData;
  }

  const firebaseUser = authService.getCurrentUser();

  if (firebaseUser === null) {
    return localAppData;
  }

  const workspace = await tagError("getCurrentWorkspace", firestoreTeamSyncService.getCurrentWorkspace(firebaseUser));

  if (workspace === null) {
    return createEmptyAppData(createUserProfileFromFirebase(firebaseUser));
  }

  if (workspace.club === null) {
    return mergeFirestoreWorkspaceIntoAppData(localAppData, workspace);
  }

  const usersPromise = userCanReadClubRoster(workspace.currentUser.role)
    ? firestoreMaviTeamDataService.listUsersForClub(workspace.club.id)
    : Promise.resolve([workspace.currentUser]);

  const joinRequestsPromise = workspace.currentUser.role === "clubAdmin"
    ? firestoreMaviTeamDataService.listJoinRequestsForClub(workspace.club.id)
    : Promise.resolve([]);

  const [users, teams, scheduleEvents, announcements, joinRequests, payments, attendanceRecords, chatGroups] = await Promise.all([
    tagError("users", usersPromise),
    tagError("teams", firestoreTeamSyncService.listTeamsForClub(workspace.club.id)),
    tagError("scheduleEvents", firestoreMaviTeamDataService.listVisibleScheduleEventsForCurrentUser(firebaseUser)),
    tagError("announcements", firestoreMaviTeamDataService.listVisibleAnnouncementsForCurrentUser(firebaseUser)),
    tagError("joinRequests", joinRequestsPromise),
    tagError("payments", firestoreMaviTeamDataService.listVisiblePaymentsForCurrentUser(firebaseUser)),
    tagError("attendanceRecords", firestoreMaviTeamDataService.listVisibleAttendanceRecordsForCurrentUser(firebaseUser)),
    tagError("chatGroups", firestoreMaviTeamDataService.listVisibleChatGroupsForCurrentUser(firebaseUser)),
  ]);
  // Chat messages are not required for the rest of the app to function, and a
  // single denied read here (a known firestore.rules bug on group messages,
  // see canReadChatMessage) must never block loading the user's own
  // profile/club data, so this failure is swallowed rather than propagated
  // like the reads above.
  const chatMessages = await firestoreMaviTeamDataService
    .listVisibleChatMessagesForCurrentUser(firebaseUser, chatGroups.map((group) => group.id))
    .catch((error) => {
      console.warn("[loadAppData] chatMessages unavailable:", error.message ?? error);
      return [];
    });

  return mergeFirestoreWorkspaceIntoAppData(localAppData, workspace, {
    users,
    teams,
    scheduleEvents,
    announcements,
    attendanceRecords,
    chatGroups,
    chatMessages,
    payments,
    joinRequests,
  });
}

async function saveAppData(data: TeamSyncAppData) {
  await AsyncStorage.setItem(MAVITEAM_APP_DATA_KEY, JSON.stringify(data));
  return data;
}

// Every club member may update their own name, regardless of role, so this
// sync is intentionally independent of the club-settings sync below. It
// must never be bundled into the same write as club data (see the comment
// on firestoreTeamSyncService.updateCurrentUserProfile for why).
async function syncCurrentUserToFirestore(data: TeamSyncAppData) {
  if (!authService.isConfigured()) {
    return;
  }

  const firebaseUser = authService.getCurrentUser();

  if (firebaseUser === null) {
    return;
  }

  await firestoreTeamSyncService.updateCurrentUserProfile({
    firebaseUser,
    fullName: data.currentUser.fullName,
  });
}

// Only a clubAdmin can write club-wide settings (enforced by
// firestore.rules). Non-admins skip this entirely rather than attempting a
// write that would fail.
async function syncCurrentClubToFirestore(data: TeamSyncAppData) {
  if (!authService.isConfigured()) {
    return;
  }

  const firebaseUser = authService.getCurrentUser();

  if (firebaseUser === null || data.club.id.trim() === "" || data.currentUser.role !== "clubAdmin") {
    return;
  }

  await firestoreTeamSyncService.updateCurrentClubSettings({
    firebaseUser,
    clubName: data.club.name,
    clubSport: data.club.sport,
    clubCity: data.club.city,
    clubCode: data.club.code,
  });
}

function getFirebaseUserOrThrow() {
  const firebaseUser = authService.getCurrentUser();

  if (firebaseUser === null) {
    throw new Error("AUTH_USER_MISSING");
  }

  return firebaseUser;
}

export const teamSyncService = {
  async getAppData() {
    return loadAppData();
  },

  async resetAppData() {
    await AsyncStorage.setItem(MAVITEAM_APP_DATA_KEY, JSON.stringify(initialTeamSyncData));
    return initialTeamSyncData;
  },

  async getCurrentUser() {
    const data = await loadAppData();
    return data.currentUser;
  },

  async getCurrentClub() {
    const data = await loadAppData();
    return data.club;
  },

  async createClubWorkspace(input: CreateClubWorkspaceInput) {
    const createdAt = nowIso();
    const ownerId = `user-owner-${Date.now()}`;
    const clubId = `club-${Date.now()}`;
    const teamId = `team-${Date.now()}`;
    const cleanSport = input.sport.trim() || "Voleybol";

    const nextClub: Club = {
      id: clubId,
      name: input.clubName.trim() || "MaviTeam Kulübü",
      sport: cleanSport,
      city: input.city.trim() || "Şehir yok",
      code: generateClubCode(input.clubName),
      ownerId,
      primaryColor: "#2563eb",
      createdAt,
      updatedAt: createdAt,
    };

    const nextCurrentUser: UserProfile = {
      id: ownerId,
      fullName: input.ownerFullName.trim() || "Kulüp Yöneticisi",
      email: input.ownerEmail.trim().toLowerCase() || "owner@maviteam.app",
      role: "clubAdmin",
      status: "active",
      clubId,
      teamIds: [teamId],
      createdAt,
      updatedAt: createdAt,
    };

    const firstTeam: Team = {
      id: teamId,
      clubId,
      name: `${cleanSport} Takımı`,
      ageGroup: "Genel",
      coachIds: [],
      memberIds: [ownerId],
      createdAt,
      updatedAt: createdAt,
    };

    const nextAppData: TeamSyncAppData = {
      club: nextClub,
      currentUser: nextCurrentUser,
      users: [nextCurrentUser],
      teams: [firstTeam],
      announcements: [],
      scheduleEvents: [],
      attendanceRecords: [],
      chatGroups: [],
      chatMessages: [],
      payments: [],
      replays: [],
      joinRequests: [],
    };

    return saveAppData(nextAppData);
  },

  async createJoinRequest(input: CreateJoinRequestInput) {
    const data = await loadAppData();

    if (normalizeClubCode(input.inviteCode) !== normalizeClubCode(data.club.code)) {
      throw new Error("INVALID_CLUB_CODE");
    }

    const createdAt = nowIso();
    const pendingUserId = `user-pending-${Date.now()}`;
    const requestedRole = input.requestedRole ?? "athlete";
    const normalizedEmail = input.email.trim().toLowerCase() || "pending@maviteam.app";

    const pendingUser: UserProfile = {
      id: pendingUserId,
      fullName: input.fullName.trim() || "Yeni Kullanıcı",
      email: normalizedEmail,
      role: requestedRole,
      status: "pending",
      clubId: data.club.id,
      teamIds: [],
      createdAt,
      updatedAt: createdAt,
    };

    const joinRequest: JoinRequest = {
      id: `join-request-${Date.now()}`,
      clubId: data.club.id,
      userId: pendingUserId,
      requestedRole,
      status: "pending",
      createdAt,
    };

    return saveAppData({
      ...data,
      currentUser: pendingUser,
      users: [pendingUser, ...data.users.filter((user) => user.email !== normalizedEmail)],
      joinRequests: [joinRequest, ...data.joinRequests],
    });
  },

  async approveJoinRequest(joinRequestId: string) {
    if (authService.isConfigured()) {
      const firebaseUser = getFirebaseUserOrThrow();
      await firestoreTeamSyncService.approveJoinRequest(firebaseUser, joinRequestId);
      return loadAppData();
    }

    const data = await loadAppData();
    const reviewedAt = nowIso();
    let approvedUserId = "";

    const joinRequests = data.joinRequests.map((request) => {
      if (request.id !== joinRequestId) return request;
      approvedUserId = request.userId;
      return { ...request, status: "approved" as const, reviewedByUserId: data.currentUser.id, reviewedAt };
    });

    const users = data.users.map((user) => {
      if (user.id !== approvedUserId) return user;
      return { ...user, status: "active" as const, updatedAt: reviewedAt };
    });

    return saveAppData({ ...data, users, joinRequests });
  },

  async rejectJoinRequest(joinRequestId: string) {
    if (authService.isConfigured()) {
      const firebaseUser = getFirebaseUserOrThrow();
      await firestoreTeamSyncService.rejectJoinRequest(firebaseUser, joinRequestId);
      return loadAppData();
    }

    const data = await loadAppData();
    const reviewedAt = nowIso();
    let rejectedUserId = "";

    const joinRequests = data.joinRequests.map((request) => {
      if (request.id !== joinRequestId) return request;
      rejectedUserId = request.userId;
      return { ...request, status: "rejected" as const, reviewedByUserId: data.currentUser.id, reviewedAt };
    });

    const users = data.users.map((user) => {
      if (user.id !== rejectedUserId) return user;
      return { ...user, status: "removed" as const, updatedAt: reviewedAt };
    });

    return saveAppData({ ...data, users, joinRequests });
  },

  async updateCurrentUser(updates: Partial<Pick<UserProfile, "fullName" | "email" | "role" | "status" | "teamIds">>) {
    const data = await loadAppData();
    const nextCurrentUser: UserProfile = { ...data.currentUser, ...updates, updatedAt: nowIso() };
    const nextAppData = await saveAppData({
      ...data,
      currentUser: nextCurrentUser,
      users: data.users.map((user) => (user.id === nextCurrentUser.id ? nextCurrentUser : user)),
    });

    await syncCurrentUserToFirestore(nextAppData);

    return nextAppData;
  },

  async updateCurrentClub(updates: Partial<Pick<Club, "name" | "sport" | "city" | "code" | "logoUrl" | "primaryColor">>) {
    const data = await loadAppData();
    const nextAppData = await saveAppData({ ...data, club: { ...data.club, ...updates, updatedAt: nowIso() } });

    await syncCurrentClubToFirestore(nextAppData);

    return nextAppData;
  },

  async listUsersByClub(clubId: string) {
    const data = await loadAppData();
    return data.users.filter((user) => user.clubId === clubId && user.status !== "removed");
  },

  async listTeamsByClub(clubId: string) {
    const data = await loadAppData();
    return data.teams.filter((team) => team.clubId === clubId);
  },

  async listAnnouncementsByClub(clubId: string) {
    const data = await loadAppData();
    return data.announcements.filter((announcement) => announcement.clubId === clubId);
  },

  async listScheduleEventsByClub(clubId: string) {
    const data = await loadAppData();
    return data.scheduleEvents.filter((event) => event.clubId === clubId);
  },

  async createTeam(input: Omit<Team, "id" | "createdAt" | "updatedAt">) {
    if (authService.isConfigured()) {
      const firebaseUser = getFirebaseUserOrThrow();
      await firestoreTeamSyncService.createTeam(firebaseUser, {
        name: input.name,
        ageGroup: input.ageGroup,
        coachIds: input.coachIds,
        memberIds: input.memberIds,
      });

      return loadAppData();
    }

    const data = await loadAppData();
    const createdAt = nowIso();
    const newTeam: Team = { ...input, id: `team-${Date.now()}`, createdAt, updatedAt: createdAt };
    return saveAppData({ ...data, teams: [newTeam, ...data.teams] });
  },

  async removeTeam(teamId: string) {
    if (authService.isConfigured()) {
      const firebaseUser = getFirebaseUserOrThrow();
      await firestoreTeamSyncService.removeTeam(firebaseUser, teamId);

      return loadAppData();
    }

    const data = await loadAppData();
    const removedAt = nowIso();

    const teams = data.teams.filter((team) => team.id !== teamId);
    const users = data.users.map((user) => ({
      ...user,
      teamIds: user.teamIds.filter((userTeamId) => userTeamId !== teamId),
      updatedAt: user.teamIds.includes(teamId) ? removedAt : user.updatedAt,
    }));

    return saveAppData({
      ...data,
      teams,
      users,
      currentUser: {
        ...data.currentUser,
        teamIds: data.currentUser.teamIds.filter((userTeamId) => userTeamId !== teamId),
        updatedAt: data.currentUser.teamIds.includes(teamId) ? removedAt : data.currentUser.updatedAt,
      },
    });
  },

  async createAnnouncement(input: Omit<Announcement, "id" | "createdAt" | "updatedAt">) {
    if (authService.isConfigured()) {
      const firebaseUser = getFirebaseUserOrThrow();
      await firestoreTeamSyncService.createAnnouncement(firebaseUser, {
        title: input.title,
        message: input.message,
        targetType: input.targetType,
        targetTeamId: input.targetTeamId,
      });

      return loadAppData();
    }

    const data = await loadAppData();
    const newAnnouncement: Announcement = { ...input, id: `announcement-${Date.now()}`, createdAt: nowIso() };
    return saveAppData({ ...data, announcements: [newAnnouncement, ...data.announcements] });
  },

  async updateAnnouncement(announcementId: string, updates: Partial<Pick<Announcement, "title" | "message" | "targetType" | "targetTeamId">>) {
    if (authService.isConfigured()) {
      const firebaseUser = getFirebaseUserOrThrow();
      await firestoreMaviTeamDataService.updateAnnouncement(firebaseUser, announcementId, updates);

      return loadAppData();
    }

    const data = await loadAppData();
    return saveAppData({
      ...data,
      announcements: data.announcements.map((announcement) => (
        announcement.id === announcementId ? { ...announcement, ...updates, updatedAt: nowIso() } : announcement
      )),
    });
  },

  async removeAnnouncement(announcementId: string) {
    if (authService.isConfigured()) {
      const firebaseUser = getFirebaseUserOrThrow();
      await firestoreMaviTeamDataService.removeAnnouncement(firebaseUser, announcementId);

      return loadAppData();
    }

    const data = await loadAppData();
    return saveAppData({ ...data, announcements: data.announcements.filter((announcement) => announcement.id !== announcementId) });
  },

  async createScheduleEvent(input: Omit<ScheduleEvent, "id" | "createdAt" | "updatedAt">) {
    if (authService.isConfigured()) {
      const firebaseUser = getFirebaseUserOrThrow();
      await firestoreTeamSyncService.createScheduleEvent(firebaseUser, {
        teamId: input.teamId,
        title: input.title,
        type: input.type,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        location: input.location,
        note: input.note,
      });

      return loadAppData();
    }

    const data = await loadAppData();
    const newEvent: ScheduleEvent = { ...input, id: `event-${Date.now()}`, createdAt: nowIso() };
    return saveAppData({ ...data, scheduleEvents: [newEvent, ...data.scheduleEvents] });
  },

  async updateScheduleEvent(eventId: string, updates: Partial<Pick<ScheduleEvent, "title" | "type" | "startsAt" | "endsAt" | "location" | "note" | "teamId">>) {
    if (authService.isConfigured()) {
      const firebaseUser = getFirebaseUserOrThrow();
      await firestoreTeamSyncService.updateScheduleEvent(firebaseUser, eventId, updates);

      return loadAppData();
    }

    const data = await loadAppData();
    return saveAppData({
      ...data,
      scheduleEvents: data.scheduleEvents.map((event) => (
        event.id === eventId ? { ...event, ...updates, updatedAt: nowIso() } : event
      )),
    });
  },

  async createChatGroup(input: Omit<ChatGroup, "id" | "createdAt" | "updatedAt">) {
    if (authService.isConfigured()) {
      const firebaseUser = getFirebaseUserOrThrow();
      await firestoreMaviTeamDataService.createChatGroup(firebaseUser, input);
      return loadAppData();
    }

    const data = await loadAppData();
    const createdAt = nowIso();
    const newChatGroup: ChatGroup = { ...input, id: `chat-${Date.now()}`, createdAt, updatedAt: createdAt };
    return saveAppData({ ...data, chatGroups: [newChatGroup, ...data.chatGroups] });
  },

  async createChatMessage(input: Omit<ChatMessage, "id" | "createdAt">) {
    if (authService.isConfigured()) {
      const firebaseUser = getFirebaseUserOrThrow();
      await firestoreMaviTeamDataService.createChatMessage(firebaseUser, input);
      return loadAppData();
    }

    const data = await loadAppData();
    const newChatMessage: ChatMessage = { ...input, id: `message-${Date.now()}`, createdAt: nowIso() };
    return saveAppData({ ...data, chatMessages: [...data.chatMessages, newChatMessage] });
  },

  async createPayment(input: Omit<Payment, "id" | "updatedAt">) {
    if (authService.isConfigured()) {
      const firebaseUser = getFirebaseUserOrThrow();
      await firestoreMaviTeamDataService.createPayment(firebaseUser, input);
      return loadAppData();
    }

    const data = await loadAppData();
    const newPayment: Payment = { ...input, id: `payment-${Date.now()}`, updatedAt: nowIso() };
    return saveAppData({ ...data, payments: [newPayment, ...data.payments] });
  },

  async updatePaymentStatus(paymentId: string, status: PaymentStatus) {
    if (authService.isConfigured()) {
      const firebaseUser = getFirebaseUserOrThrow();
      await firestoreMaviTeamDataService.updatePaymentStatus(firebaseUser, paymentId, status);
      return loadAppData();
    }

    const data = await loadAppData();
    const updatedAt = nowIso();

    return saveAppData({
      ...data,
      payments: data.payments.map((payment) => (
        payment.id === paymentId
          ? { ...payment, status, paidAt: status === "paid" ? updatedAt : undefined, updatedAt }
          : payment
      )),
    });
  },

  async createReplay(input: Omit<Replay, "id" | "createdAt" | "updatedAt">) {
    const data = await loadAppData();
    const createdAt = nowIso();
    const newReplay: Replay = { ...input, id: `replay-${Date.now()}`, createdAt, updatedAt: createdAt };
    return saveAppData({ ...data, replays: [newReplay, ...data.replays] });
  },

  async removeReplay(replayId: string) {
    const data = await loadAppData();
    return saveAppData({ ...data, replays: data.replays.filter((replay) => replay.id !== replayId) });
  },

  async saveAttendance(input: SaveAttendanceInput) {
    if (authService.isConfigured()) {
      const firebaseUser = getFirebaseUserOrThrow();
      await firestoreMaviTeamDataService.saveAttendance(firebaseUser, input);
      return loadAppData();
    }

    const data = await loadAppData();
    const recordedAt = nowIso();
    const nextRecords: AttendanceRecord[] = input.records.map((record) => ({
      id: `attendance-${input.teamId ?? "club"}-${record.userId}-${input.sessionDate}`,
      clubId: data.club.id,
      teamId: input.teamId,
      userId: record.userId,
      status: record.status,
      sessionDate: input.sessionDate,
      recordedByUserId: data.currentUser.id,
      recordedAt,
      updatedAt: recordedAt,
    }));

    return saveAppData({
      ...data,
      attendanceRecords: [
        ...nextRecords,
        ...data.attendanceRecords.filter((record) => !(record.teamId === input.teamId && record.sessionDate === input.sessionDate)),
      ],
    });
  },

  async removeUserFromClub(userId: string) {
    const data = await loadAppData();
    const removedAt = nowIso();

    const users = data.users.map((user) => (
      user.id === userId ? { ...user, status: "removed" as const, teamIds: [], updatedAt: removedAt } : user
    ));

    const teams = data.teams.map((team) => ({
      ...team,
      coachIds: team.coachIds.filter((coachId) => coachId !== userId),
      memberIds: team.memberIds.filter((memberId) => memberId !== userId),
    }));

    return saveAppData({ ...data, users, teams });
  },
};

export type TeamSyncService = typeof teamSyncService;
