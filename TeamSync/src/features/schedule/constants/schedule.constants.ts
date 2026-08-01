import type { StatusBadgeTone } from "@/components/StatusBadge";
import { theme } from "@/constants/theme";
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

export function getScheduleTypeTone(type: ScheduleEventType): StatusBadgeTone {
  if (type === "match") {
    return "danger";
  }

  if (type === "meeting") {
    return "warning";
  }

  return "info";
}

export function getScheduleTypeStyles(type: ScheduleEventType) {
  if (type === "match") {
    return {
      backgroundColor: theme.colors.state.dangerSoft,
      borderColor: theme.colors.state.danger,
      textColor: theme.colors.text.danger,
    };
  }

  if (type === "meeting") {
    return {
      backgroundColor: theme.colors.state.warningSoft,
      borderColor: theme.colors.state.warning,
      textColor: theme.colors.text.warning,
    };
  }

  return {
    backgroundColor: theme.colors.state.infoSoft,
    borderColor: theme.colors.state.info,
    textColor: theme.colors.text.brand,
  };
}
