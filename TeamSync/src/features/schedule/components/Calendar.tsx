import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/constants/theme";
import type { ScheduleEvent, ScheduleEventType } from "@/types/teamSync";

type CalendarCell = {
  key: string;
  dayNumber: number | null;
  dateKey?: string;
  isToday?: boolean;
};

type CalendarProps = {
  visibleMonth: Date;
  events: ScheduleEvent[];
  selectedDayNumber: string;
  onSelectDay: (dayNumber: number) =>