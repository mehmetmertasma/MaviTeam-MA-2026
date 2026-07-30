import { authService } from "@/services/authService";
import { firestoreTeamSyncService } from "@/services/firestoreTeamSyncService";
import { teamSyncService } from "@/services/teamSyncService";
import type { TeamSyncAppData } from "@/types/teamSync";

function mergeWorkspaceIntoAppData(appData: TeamSyncAppData, workspace: NonNullable<Awaited<ReturnType<typeof firestoreTeamSyncService.getCurrentWorkspace>>>) {
  if (workspace.club === null) {
    return {
      ...appData,
      currentUser: workspace.currentUser,
      users: [workspace.currentUser, ...appData.users.filter((user) => user.id !== workspace.currentUser.id)],
    } satisfies TeamSyncAppData;
  }

  const currentUser = {
    ...workspace.currentUser,
    clubId: workspace.club.id,
  };

  return {
    ...appData,
    club: workspace.club,
    currentUser,
    users: [currentUser, ...appData.users.filter((user) => user.id !== currentUser.id)],
    teams: appData.teams.map((team) => ({ ...team, clubId: workspace.club?.id ?? team.clubId })),
    announcements: appData.announcements.map((announcement) => ({ ...announcement, clubId: workspace.club?.id ?? announcement.clubId })),
    scheduleEvents: appData.scheduleEvents.map((event) => ({ ...event, clubId: workspace.club?.id ?? event.clubId })),
    attendanceRecords: appData.attendanceRecords.map((record) => ({ ...record, clubId: workspace.club?.id ?? record.clubId })),
    chatGroups: appData.chatGroups.map((group) => ({ ...group, clubId: workspace.club?.id ?? group.clubId })),
    chatMessages: appData.chatMessages.map((message) => ({ ...message, clubId: workspace.club?.id ?? message.clubId })),
    payments: appData.payments.map((payment) => ({ ...payment, clubId: workspace.club?.id ?? payment.clubId })),
    replays: appData.replays.map((replay) => ({ ...replay, clubId: workspace.club?.id ?? replay.clubId })),
    joinRequests: appData.joinRequests.map((request) => ({ ...request, clubId: workspace.club?.id ?? request.clubId })),
  } satisfies TeamSyncAppData;
}

export const workspaceDataService = {
  async getAppData() {
    const localAppData = await teamSyncService.getAppData();

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

    return mergeWorkspaceIntoAppData(localAppData, workspace);
  },

  async updateCurrentWorkspace(input: {
    fullName: string;
    clubName: string;
    clubSport: string;
    clubCity: string;
    clubCode: string;
  }) {
    const firebaseUser = authService.getCurrentUser();

    if (authService.isConfigured() && firebaseUser !== null && firebaseUser.emailVerified) {
      await firestoreTeamSyncService.updateCurrentUserProfile({
        firebaseUser,
        fullName: input.fullName,
      });

      const workspace = await firestoreTeamSyncService.getCurrentWorkspace(firebaseUser);

      if (workspace?.currentUser.role === "clubAdmin") {
        await firestoreTeamSyncService.updateCurrentClubSettings({
          firebaseUser,
          clubName: input.clubName,
          clubSport: input.clubSport,
          clubCity: input.clubCity,
          clubCode: input.clubCode,
        });
      }
    }

    await teamSyncService.updateCurrentUser({
      fullName: input.fullName,
      email: firebaseUser?.email ?? undefined,
    });

    return teamSyncService.updateCurrentClub({
      name: input.clubName,
      sport: input.clubSport,
      city: input.clubCity,
      code: input.clubCode,
    });
  },
};