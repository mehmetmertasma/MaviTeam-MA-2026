import AsyncStorage from "@react-native-async-storage/async-storage";

import { initialTeamSyncData } from "@/data/initialTeamSyncData";
import { authService } from "@/services/authService";
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

const TEAMSYNC_APP_DATA_KEY = "teamsync_app_data_v1";

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
  teams?: Team[];
};

function nowIso() {
  return new Date().toISOString();
}

function normalizeClubCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9ÇĞİÖŞÜ]/g, "");
}

function generateClubCode(clubName: string) {
  const prefix = normalizeClubCode(clubName).slice(0, 3);
  return `${prefix || "TS"}${new Date().getFullYear()}`;
}

function ensureAppDataShape(data: StoredAppData) {
  return {
    ...data,
    attendanceRecords: Array.isArray(data.attendanceRecords) ? data.attendanceRecords : [],
    replays: Array.isArray(data.replays) ? data.replays : [],
  } satisfies TeamSyncAppData;
}

function mergeFirestoreWorkspaceIntoAppData(
  appData: TeamSyncAppData,
  workspace: FirestoreWorkspace,
  overrides: FirestoreDataOverrides = {}
) {
  if (workspace.club === null) {
    return {
      ...appData,
      currentUser: workspace.currentUser,
      users: [workspace.currentUser, ...appData.users.filter((user) => user.id !== workspace.currentUser.id)],
    } satisfies TeamSyncAppData;
  }

  const workspaceClub = workspace.club;
  const currentUser: UserProfile = {
    ...workspace.currentUser,
    clubId: workspaceClub.id,
  };
  const teams = overrides.teams ?? appData.teams.map((team) => ({ ...team, clubId: workspaceClub.id }));

  return {
    ...appData,
    club: workspaceClub,
    currentUser,
    users: [currentUser, ...appData.users.filter((user) => user.id !== currentUser.id)],
    teams,
    announcements: appData.announcements.map((announcement) => ({ ...announcement, clubId: workspaceClub.id })),
    scheduleEvents: appData.scheduleEvents.map((event) => ({ ...event, clubId: workspaceClub.id })),
    attendanceRecords: appData.attendanceRecords.map((record) => ({ ...record, clubId: workspaceClub.id })),
    chatGroups: appData.chatGroups.map((group) => ({ ...group, clubId: workspaceClub.id })),
    chatMessages: appData.chatMessages.map((message) => ({ ...message, clubId: workspaceClub.id })),
    payments: appData.payments.map((payment) => ({ ...payment, clubId: workspaceClub.id })),
    replays: appData.replays.map((replay) => ({ ...replay, clubId: workspaceClub.id })),
    joinRequests: appData.joinRequests.map((request) => ({ ...request, clubId: workspaceClub.id })),
  } satisfies TeamSyncAppData;
}

async function loadLocalAppData(): Promise<TeamSyncAppData> {
  const savedData = await AsyncStorage.getItem(TEAMSYNC_APP_DATA_KEY);

  if (savedData === null) {
    await AsyncStorage.setItem(TEAMSYNC_APP_DATA_KEY, JSON.stringify(initialTeamSyncData));
    return initialTeamSyncData;
  }

  return ensureAppDataShape(JSON.parse(savedData) as StoredAppData);
}

async function loadAppData(): Promise<TeamSyncAppData> {
  const localAppData = await loadLocalAppData();

  if (!authService.isConfigured()) {
    return localAppData;
  }

  const firebaseUser = authService.getCurrentUser();

  if (firebaseUser === null || !firebaseUser.emailVerified) {
    return localAppData;
  }

  const workspace = await firestoreTeamSyncService.getCurrentWorkspace(firebaseUser);

  if (workspace === null) {
    return localAppData;
  }

  const firestoreTeams = workspace.club === null
    ? []
    : await firestoreTeamSyncService.listTeamsForClub(workspace.club.id);

  return mergeFirestoreWorkspaceIntoAppData(localAppData, workspace, {
    teams: firestoreTeams,
  });
}

async function saveAppData(data: TeamSyncAppData) {
  await AsyncStorage.setItem(TEAMSYNC_APP_DATA_KEY, JSON.stringify(data));
  return data;
}

async function syncCurrentWorkspaceToFirestore(data: TeamSyncAppData) {
  if (!authService.isConfigured()) {
    return;
  }

  const firebaseUser = authService.getCurrentUser();

  if (firebaseUser === null || !firebaseUser.emailVerified) {
    return;
  }

  await firestoreTeamSyncService.updateCurrentWorkspace({
    firebaseUser,
    fullName: data.currentUser.fullName,
    clubName: data.club.name,
    clubSport: data.club.sport,
    clubCity: data.club.city,
    clubCode: data.club.code,
  });
}

function getVerifiedFirebaseUserOrThrow() {
  const firebaseUser = authService.getCurrentUser();

  if (firebaseUser === null || !firebaseUser.emailVerified) {
    throw new Error("AUTH_USER_MISSING");
  }

  return firebaseUser;
}

export const teamSyncService = {
  async getAppData() {
    return loadAppData();
  },

  async resetAppData() {
    await AsyncStorage.setItem(TEAMSYNC_APP_DATA_KEY, JSON.stringify(initialTeamSyncData));
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
      name: input.clubName.trim() || "TeamSync Kulübü",
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
      email: input.ownerEmail.trim().toLowerCase() || "owner@teamsync.app",
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
    const normalizedEmail = input.email.trim().toLowerCase() || "pending@teamsync.app";

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

    await syncCurrentWorkspaceToFirestore(nextAppData);

    return nextAppData;
  },

  async updateCurrentClub(updates: Partial<Pick<Club, "name" | "sport" | "city" | "code" | "logoUrl" | "primaryColor">>) {
    const data = await loadAppData();
    const nextAppData = await saveAppData({ ...data, club: { ...data.club, ...updates, updatedAt: nowIso() } });

    await syncCurrentWorkspaceToFirestore(nextAppData);

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
      const firebaseUser = getVerifiedFirebaseUserOrThrow();
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
      const firebaseUser = getVerifiedFirebaseUserOrThrow();
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
    const data = await loadAppData();
    const newAnnouncement: Announcement = { ...input, id: `announcement-${Date.now()}`, createdAt: nowIso() };
    return saveAppData({ ...data, announcements: [newAnnouncement, ...data.announcements] });
  },

  async updateAnnouncement(announcementId: string, updates: Partial<Pick<Announcement, "title" | "message" | "targetType" | "targetTeamId">>) {
    const data = await loadAppData();
    return saveAppData({
      ...data,
      announcements: data.announcements.map((announcement) => (
        announcement.id === announcementId ? { ...announcement, ...updates, updatedAt: nowIso() } : announcement
      )),
    });
  },

  async removeAnnouncement(announcementId: string) {
    const data = await loadAppData();
    return saveAppData({ ...data, announcements: data.announcements.filter((announcement) => announcement.id !== announcementId) });
  },

  async createScheduleEvent(input: Omit<ScheduleEvent, "id" | "createdAt" | "updatedAt">) {
    const data = await loadAppData();
    const newEvent: ScheduleEvent = { ...input, id: `event-${Date.now()}`, createdAt: nowIso() };
    return saveAppData({ ...data, scheduleEvents: [newEvent, ...data.scheduleEvents] });
  },

  async updateScheduleEvent(eventId: string, updates: Partial<Pick<ScheduleEvent, "title" | "type" | "startsAt" | "endsAt" | "location" | "note" | "teamId">>) {
    const data = await loadAppData();
    return saveAppData({
      ...data,
      scheduleEvents: data.scheduleEvents.map((event) => (
        event.id === eventId ? { ...event, ...updates, updatedAt: nowIso() } : event
      )),
    });
  },

  async createChatGroup(input: Omit<ChatGroup, "id" | "createdAt" | "updatedAt">) {
    const data = await loadAppData();
    const createdAt = nowIso();
    const newChatGroup: ChatGroup = { ...input, id: `chat-${Date.now()}`, createdAt, updatedAt: createdAt };
    return saveAppData({ ...data, chatGroups: [newChatGroup, ...data.chatGroups] });
  },

  async createChatMessage(input: Omit<ChatMessage, "id" | "createdAt">) {
    const data = await loadAppData();
    const newChatMessage: ChatMessage = { ...input, id: `message-${Date.now()}`, createdAt: nowIso() };
    return saveAppData({ ...data, chatMessages: [...data.chatMessages, newChatMessage] });
  },

  async createPayment(input: Omit<Payment, "id" | "updatedAt">) {
    const data = await loadAppData();
    const newPayment: Payment = { ...input, id: `payment-${Date.now()}`, updatedAt: nowIso() };
    return saveAppData({ ...data, payments: [newPayment, ...data.payments] });
  },

  async updatePaymentStatus(paymentId: string, status: PaymentStatus) {
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
