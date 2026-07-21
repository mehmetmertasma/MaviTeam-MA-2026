import type { ScheduleTypeOption } from "../types/schedule.types";
import type { ScheduleEventType } from "@/types/teamSync";

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

export function getScheduleTypeLabel(type: ScheduleEventType) {
  return SCHEDULE_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? "Etkinlik";
}

export function getScheduleTypeStyles(type: ScheduleEventType) {
  if (type === "match") {
    return {
      backgroundColor: "#fee2e2",
      borderColor: "#ef4444",
      textColor: "#991b1b",
    };
  }

  if (type === "meeting") {
    return {
      backgroundColor: "#fef3c7",
      borderColor: "#f59e0b",
      textColor: "#92400e",
    };
  }

  return {
    backgroundColor: "#dbeafe",
    borderColor: "#2563eb",
    textColor: "#1e40af",
  };
}
