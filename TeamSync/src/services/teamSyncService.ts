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

function nowIso() {
  return new Date().toISOString();
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
