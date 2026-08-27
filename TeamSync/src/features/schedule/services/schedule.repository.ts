import { teamSyncService } from "@/services/teamSyncService";
import type { TeamSyncAppData } from "@/types/teamSync";

import type {
  CreateScheduleEventInput,
  ScheduleWorkspaceData,
  UpdateScheduleEventInput,
} from "../types/schedule.types";

export type ScheduleRepository = {
  getScheduleData: () => Promise<ScheduleWorkspaceData>;
  createScheduleEvent: (input: CreateScheduleEventInput) => Promise<ScheduleWorkspaceData>;
  updateScheduleEvent: (
    eventId: string,
    updates: UpdateScheduleEventInput
  ) => Promise<ScheduleWorkspaceData>;
  removeScheduleEvent: (eventId: string) => Promise<ScheduleWorkspaceData>;
};

function toScheduleWorkspaceData(appData: TeamSyncAppData): ScheduleWorkspaceData {
  return {
    club: appData.club,
    currentUser: appData.currentUser,
    teams: appData.teams,
    scheduleEvents: appData.scheduleEvents,
  };
}

const legacyTeamSyncScheduleRepository: ScheduleRepository = {
  async getScheduleData() {
    return toScheduleWorkspaceData(await teamSyncService.getAppData());
  },

  async createScheduleEvent(input) {
    return toScheduleWorkspaceData(await teamSyncService.createScheduleEvent(input));
  },

  async updateScheduleEvent(eventId, updates) {
    return toScheduleWorkspaceData(await teamSyncService.updateScheduleEvent(eventId, updates));
  },

  async removeScheduleEvent(eventId) {
    return toScheduleWorkspaceData(await teamSyncService.removeScheduleEvent(eventId));
  },
};

export const scheduleRepository = legacyTeamSyncScheduleRepository;
