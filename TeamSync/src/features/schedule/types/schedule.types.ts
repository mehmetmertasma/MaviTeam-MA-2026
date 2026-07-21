import type {
  Club,
  ScheduleEvent,
  ScheduleEventType,
  Team,
  UserProfile,
} from "@/types/teamSync";

export type ScheduleTypeOption = {
  label: string;
  value: ScheduleEventType;
};

export type TeamOption = {
  id: string;
  label: string;
  teamId?: string;
};

export type CalendarCell = {
  key: string;
  dayNumber: number | null;
  dateKey?: string;
  isToday?: boolean;
};

export type ScheduleFormState = {
  title: string;
  selectedType: ScheduleEventType;
  selectedTeamId: string;
  selectedDayNumber: string;
  time: string;
  location: string;
  note: string;
};

export type ScheduleWorkspaceData = {
  club: Club;
  currentUser: UserProfile;
  teams: Team[];
  scheduleEvents: ScheduleEvent[];
};

export type CreateScheduleEventInput = Omit<ScheduleEvent, "id" | "createdAt" | "updatedAt">;

export type UpdateScheduleEventInput = Partial<
  Pick<ScheduleEvent, "title" | "type" | "startsAt" | "endsAt" | "location" | "note" | "teamId">
>;

export type ScheduleTypeColors = {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
};
