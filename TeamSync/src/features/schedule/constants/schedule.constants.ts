import type { StatusBadgeTone } from "@/components/StatusBadge";
import { theme } from "@/constants/theme";
import type { ScheduleTypeOption } from "../types/schedule.types";
import type { ScheduleEventType } from "@/types/teamSync";

export function getScheduleTypeOptions(language: "tr" | "en"): ScheduleTypeOption[] {
  const en = language === "en";
  return [
    { label: en ? "Practice" : "Antrenman", value: "practice" },
    { label: en ? "Match" : "Maç", value: "match" },
    { label: en ? "Meeting" : "Toplantı", value: "meeting" },
  ];
}

export function getWeekDays(language: "tr" | "en") {
  return language === "en"
    ? (["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const)
    : (["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const);
}

export function getMonthPickerOptions(language: "tr" | "en") {
  const locale = language === "tr" ? "tr-TR" : "en-US";
  return Array.from({ length: 12 }, (_, monthIndex) => ({
    monthIndex,
    label: new Date(2026, monthIndex, 1).toLocaleDateString(locale, { month: "short" }),
  }));
}

export const ALL_CLUB_TEAM_OPTION_ID = "all-club";

export function getScheduleTypeLabel(type: ScheduleEventType, language: "tr" | "en") {
  const en = language === "en";
  return getScheduleTypeOptions(language).find((option) => option.value === type)?.label ?? (en ? "Event" : "Etkinlik");
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
