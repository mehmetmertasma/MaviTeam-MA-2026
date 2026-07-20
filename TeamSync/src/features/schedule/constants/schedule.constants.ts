import type { ScheduleTypeOption } from "../types/schedule.types";

export const SCHEDULE_TYPE_OPTIONS: ScheduleTypeOption[] = [
  { label: "Antrenman", value: "practice" },
  { label: "Maç", value: "match" },
  { label: "Toplantı", value: "meeting" },
];

export const WEEK_DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;

export const MONTH_PICKER_OPTIONS = Array.from({ length: 12 }, (_, monthIndex) => ({
  monthIndex,
  label: new Date(2026, monthIndex, 1).toLocaleDateString("tr-TR", { month: "short" }),
}));

export const ALL_CLUB_TEAM_OPTION_ID = "all-club";
