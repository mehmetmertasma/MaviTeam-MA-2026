import AsyncStorage from "@react-native-async-storage/async-storage";

import { initialTeamSyncData } from "@/data/initialTeamSyncData";
import type {
  Announcement,
  AttendanceRecord,
  AttendanceStatus,
  ChatGroup,
  ChatMessage,
  Club,
  JoinRequest,
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
  records: {
    userId: string;
    status: AttendanceStatus;
  }[];
};

function nowIso() {
  return new Date().toISOString();
}

function normalizeClubCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9ÇĞİÖŞÜ]/g, "");
}

function generateClubCode(clubName: string) {
  const prefix = normalizeClubCode(clubName).slice(0, 3);

  return `${prefix || "TS"}${new Date().getFullYear()}`;
}

function ensureAppDataShape(data: TeamSyncAppData & { attendanceRecords?: AttendanceRecord[] }) {
  return {
    ...data,
    attendanceRecords: Array.isArray(data.attendanceRecords) ? data.attendanceRecords : [],
  } satisfies TeamSyncAppData;
}

async function loadAppData(): Promise<TeamSyncAppData> {
  const savedData = await AsyncStorage.getItem(TEAMSYNC_APP_DATA_KEY);

  if (savedData === null) {
    await AsyncStorage.setItem(TEAMSYNC_APP_DATA_KEY, JSON.stringify(initialTeamSyncData));
    return initialTeamSyncData;
  }

  const parsedData = JSON.parse(savedData) as TeamSyncAppData & {
    attendanceRecords?: AttendanceRecord[];
  };

  return ensureAppDataShape(parsedData);
}

async function saveAppData(data: TeamSyncAppData) {
  await AsyncStorage.setItem(TEAMSYNC_APP_DATA_KEY, JSON.stringify(data));
  return data;
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
      joinRequests: [],
    };

    return saveAppData(nextAppData);
  },

  async createJoinRequest(input: CreateJoinRequestInput) {
    const data = await loadAppData();
    const normalizedInputCode = normalizeClubCode(input.inviteCode);
    const normalizedClubCode = normalizeClubCode(data.club.code);

    if (normalizedInputCode !== normalizedClubCode) {
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
      joinRequests: [
        joinRequest,
        ...data.joinRequests.filter((request) => request.userId !== pendingUserId),
      ],
    });
  },

  async approveJoinRequest(joinRequestId: string) {
    const data = await loadAppData();
    const reviewedAt = nowIso();
    let approvedUserId = "";

    const joinRequests = data.joinRequests.map((request) => {
      if (request.id !== joinRequestId) {
        return request;
      }

      approvedUserId = request.userId;

      return {
        ...request,
        status: "approved" as const,
        reviewedByUserId: data.currentUser.id,
        reviewedAt,
      };
    });

    const users = data.users.map((user) => {
      if (user.id !== approvedUserId) {
        return user;
      }

      return {
        ...user,
        status: "active" as const,
        updatedAt: reviewedAt,
      };
    });

    const currentUser = data.currentUser.id === approvedUserId
      ? users.find((user) => user.id === approvedUserId) ?? data.currentUser
      : data.currentUser;

    return saveAppData({
      ...data,
      currentUser,
      users,
      joinRequests,
    });
  },

  async rejectJoinRequest(joinRequestId: string) {
    const data = await loadAppData();
    const reviewedAt = nowIso();
    let rejectedUserId = "";

    const joinRequests = data.joinRequests.map((request) => {
      if (request.id !== joinRequestId) {
        return request;
      }

      rejectedUserId = request.userId;

      return {
        ...request,
        status: "rejected" as const,
        reviewedByUserId: data.currentUser.id,
        reviewedAt,
      };
    });

    const users = data.users.map((user) => {
      if (user.id !== rejectedUserId) {
        return user;
      }

      return {
        ...user,
        status: "removed" as const,
        updatedAt: reviewedAt,
      };
    });

    const currentUser = data.currentUser.id === rejectedUserId
      ? users.find((user) => user.id === rejectedUserId) ?? data.currentUser
      : data.currentUser;

    return saveAppData({
      ...data,
      currentUser,
      users,
      joinRequests,
    });
  },

  async updateCurrentUser(updates: Partial<Pick<UserProfile, "fullName" | "email" | "role" | "status" | "teamIds">>) {
    const data = await loadAppData();
    const updatedAt = nowIso();
    const nextCurrentUser: UserProfile = {
      ...data.currentUser,
      ...updates,
      updatedAt,
    };

    return saveAppData({
      ...data,
      currentUser: nextCurrentUser,
      users: data.users.map((user) => {
        if (user.id !== nextCurrentUser.id) {
          return user;
        }

        return nextCurrentUser;
      }),
    });
  },

  async updateCurrentClub(updates: Partial<Pick<Club, "name" | "sport" | "city" | "code" | "logoUrl" | "primaryColor">>) {
    const data = await loadAppData();
    const nextClub: Club = {
      ...data.club,
      ...updates,
      updatedAt: nowIso(),
    };

    return saveAppData({
      ...data,
      club: nextClub,
    });
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
    const data = await loadAppData();
    const createdAt = nowIso();
    const newTeam: Team = {
      ...input,
      id: `team-${Date.now()}`,
      createdAt,
      updatedAt: createdAt,
    };

    return saveAppData({
      ...data,
      teams: [newTeam, ...data.teams],
    });
  },

  async createAnnouncement(input: Omit<Announcement, "id" | "createdAt" | "updatedAt">) {
    const data = await loadAppData();
    const newAnnouncement: Announcement = {
      ...input,
      id: `announcement-${Date.now()}`,
      createdAt: nowIso(),
    };

    return saveAppData({
      ...data,
      announcements: [newAnnouncement, ...data.announcements],
    });
  },

  async updateAnnouncement(announcementId: string, updates: Partial<Pick<Announcement, "title" | "message" | "targetType" | "targetTeamId">>) {
    const data = await loadAppData();

    return saveAppData({
      ...data,
      announcements: data.announcements.map((announcement) => {
        if (announcement.id !== announcementId) {
          return announcement;
        }

        return {
          ...announcement,
          ...updates,
          updatedAt: nowIso(),
        };
      }),
    });
  },

  async removeAnnouncement(announcementId: string) {
    const data = await loadAppData();

    return saveAppData({
      ...data,
      announcements: data.announcements.filter((announcement) => announcement.id !== announcementId),
    });
  },

  async createScheduleEvent(input: Omit<ScheduleEvent, "id" | "createdAt" | "updatedAt">) {
    const data = await loadAppData();
    const newEvent: ScheduleEvent = {
      ...input,
      id: `event-${Date.now()}`,
      createdAt: nowIso(),
    };

    return saveAppData({
      ...data,
      scheduleEvents: [newEvent, ...data.scheduleEvents],
    });
  },

  async updateScheduleEvent(eventId: string, updates: Partial<Pick<ScheduleEvent, "title" | "type" | "startsAt" | "endsAt" | "location" | "note" | "teamId">>) {
    const data = await loadAppData();

    return saveAppData({
      ...data,
      scheduleEvents: data.scheduleEvents.map((event) => {
        if (event.id !== eventId) {
          return event;
        }

        return {
          ...event,
          ...updates,
          updatedAt: nowIso(),
        };
      }),
    });
  },

  async createChatGroup(input: Omit<ChatGroup, "id" | "createdAt" | "updatedAt">) {
    const data = await loadAppData();
    const createdAt = nowIso();
    const newChatGroup: ChatGroup = {
      ...input,
      id: `chat-${Date.now()}`,
      createdAt,
      updatedAt: createdAt,
    };

    return saveAppData({
      ...data,
      chatGroups: [newChatGroup, ...data.chatGroups],
    });
  },

  async createChatMessage(input: Omit<ChatMessage, "id" | "createdAt">) {
    const data = await loadAppData();
    const newChatMessage: ChatMessage = {
      ...input,
      id: `message-${Date.now()}`,
      createdAt: nowIso(),
    };

    return saveAppData({
      ...data,
      chatMessages: [...data.chatMessages, newChatMessage],
    });
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
        ...data.attendanceRecords.filter((record) => {
          return !(record.teamId === input.teamId && record.sessionDate === input.sessionDate);
        }),
      ],
    });
  },

  async removeUserFromClub(userId: string) {
    const data = await loadAppData();
    const removedAt = nowIso();
    let removedUser: UserProfile | undefined;

    const users = data.users.map((user) => {
      if (user.id !== userId) {
        return user;
      }

      removedUser = {
        ...user,
        status: "removed",
        teamIds: [],
        updatedAt: removedAt,
      };

      return removedUser;
    });

    const teams = data.teams.map((team) => ({
      ...team,
      coachIds: team.coachIds.filter((coachId) => coachId !== userId),
      memberIds: team.memberIds.filter((memberId) => memberId !== userId),
      updatedAt: removedUser ? removedAt : team.updatedAt,
    }));

    return saveAppData({
      ...data,
      users,
      teams,
    });
  },
};

export type TeamSyncService = typeof teamSyncService;
