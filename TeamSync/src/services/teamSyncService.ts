import AsyncStorage from "@react-native-async-storage/async-storage";

import { demoTeamSyncData } from "@/data/demoTeamSyncData";
import type {
  Announcement,
  Club,
  ScheduleEvent,
  Team,
  TeamSyncAppData,
  UserProfile,
} from "@/types/teamSync";

const TEAMSYNC_APP_DATA_KEY = "teamsync_app_data_v1";

type CreateClubWorkspaceInput = {
  ownerFullName: string;
  ownerEmail: string;
  clubName: string;
  sport: string;
  city: string;
};

function nowIso() {
  return new Date().toISOString();
}

function generateClubCode(clubName: string) {
  const prefix = clubName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9ÇĞİÖŞÜ]/g, "")
    .slice(0, 3);

  return `${prefix || "TS"}${new Date().getFullYear()}`;
}

async function loadAppData(): Promise<TeamSyncAppData> {
  const savedData = await AsyncStorage.getItem(TEAMSYNC_APP_DATA_KEY);

  if (savedData === null) {
    await AsyncStorage.setItem(TEAMSYNC_APP_DATA_KEY, JSON.stringify(demoTeamSyncData));
    return demoTeamSyncData;
  }

  return JSON.parse(savedData) as TeamSyncAppData;
}

async function saveAppData(data: TeamSyncAppData) {
  await AsyncStorage.setItem(TEAMSYNC_APP_DATA_KEY, JSON.stringify(data));
  return data;
}

export const teamSyncService = {
  async getAppData() {
    return loadAppData();
  },

  async resetDemoData() {
    await AsyncStorage.setItem(TEAMSYNC_APP_DATA_KEY, JSON.stringify(demoTeamSyncData));
    return demoTeamSyncData;
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
      email: input.ownerEmail.trim().toLowerCase() || "demo@teamsync.app",
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
      chatGroups: [],
      chatMessages: [],
      payments: [],
      joinRequests: [],
    };

    return saveAppData(nextAppData);
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
