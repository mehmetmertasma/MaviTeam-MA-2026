import type { TeamSyncAppData } from "@/types/teamSync";

const createdAt = "2026-01-01T00:00:00.000Z";
const updatedAt = "2026-01-01T00:00:00.000Z";

const starterUser = {
  id: "user-unassigned",
  fullName: "MaviTeam User",
  email: "",
  role: "clubAdmin" as const,
  status: "pending" as const,
  clubId: "club-unassigned",
  teamIds: [],
  createdAt,
  updatedAt,
};

export const initialTeamSyncData: TeamSyncAppData = {
  club: {
    id: "club-unassigned",
    name: "MaviTeam Club",
    sport: "",
    city: "",
    code: "MAVITEAM",
    ownerId: starterUser.id,
    primaryColor: "#2563eb",
    createdAt,
    updatedAt,
  },
  currentUser: starterUser,
  users: [starterUser],
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
