import type { ScheduleEventType } from "@/types/teamSync";

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

export type ScheduleTypeColors = {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
};
