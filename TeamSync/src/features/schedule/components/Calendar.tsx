import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/constants/theme";
import type { ScheduleEvent } from "@/types/teamSync";

import { getWeekDays, getScheduleTypeStyles } from "../constants/schedule.constants";
import { buildCalendarCells, formatEventTime } from "../utils/schedule-date.utils";
import { groupScheduleEventsByDate } from "../utils/schedule-selectors.utils";

type CalendarProps = {
  visibleMonth: Date;
  events: ScheduleEvent[];
  selectedDayNumber: string;
  onSelectDay: (dayNumber: number) => void;
  onSelectEvent: (event: ScheduleEvent) => void;
  language: "tr" | "en";
};

function getCopy(language: "tr" | "en") {
  const en = language === "en";
  return {
    today: en ? "Today" : "Bugün",
    more: (count: number) => (en ? `+${count} more` : `+${count} daha`),
  };
}

export function Calendar({
  visibleMonth,
  events,
  selectedDayNumber,
  onSelectDay,
  onSelectEvent,
  language,
}: CalendarProps) {
  const copy = useMemo(() => getCopy(language), [language]);
  const weekDays = useMemo(() => getWeekDays(language), [language]);
  const calendarCells = useMemo(() => buildCalendarCells(visibleMonth), [visibleMonth]);
  const eventsByDate = useMemo(() => groupScheduleEventsByDate(events), [events]);

  return (
    <View style={styles.calendarGrid}>
      {weekDays.map((day) => (
        <View key={day} style={styles.weekDayCell}>
          <Text style={styles.weekDayText}>{day}</Text>
        </View>
      ))}

      {calendarCells.map((calendarDay) => {
        if (calendarDay.dayNumber === null) {
          return <View key={calendarDay.key} style={[styles.dayCell, styles.emptyDayCell]} />;
        }

        const dayEvents = eventsByDate[calendarDay.dateKey ?? ""] ?? [];
        const isSelectedDay = selectedDayNumber === `${calendarDay.dayNumber}`;

        return (
          <Pressable
            key={calendarDay.key}
            onPress={() => onSelectDay(calendarDay.dayNumber ?? 1)}
            style={({ pressed }) => [
              styles.dayCell,
              calendarDay.isToday ? styles.todayDayCell : null,
              isSelectedDay ? styles.selectedDayCell : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <View style={styles.dayHeaderRow}>
              <Text style={[styles.dayNumber, isSelectedDay ? styles.selectedDayText : null]}>
                {calendarDay.dayNumber}
              </Text>
              {calendarDay.isToday ? <Text style={styles.todayBadge}>{copy.today}</Text> : null}
            </View>

            <View style={styles.dayEventList}>
              {dayEvents.slice(0, 2).map((event) => {
                const typeStyles = getScheduleTypeStyles(event.type);

                return (
                  <Pressable
                    key={event.id}
                    hitSlop={6}
                    onPress={(pressEvent) => {
                      // react-native-web's own PressResponder already stops
                      // propagation internally when a nested Pressable claims
                      // the tap, but calling it here too is a harmless no-op
                      // safety net -- without it (on some RN Web versions)
                      // the day cell's onSelectDay could also fire.
                      pressEvent.stopPropagation();
                      onSelectEvent(event);
                    }}
                    style={({ pressed }) => [
                      styles.calendarEventPill,
                      {
                        backgroundColor: typeStyles.backgroundColor,
                        borderColor: typeStyles.borderColor,
                      },
                      pressed ? styles.calendarEventPillPressed : null,
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[styles.calendarEventText, { color: typeStyles.textColor }]}
                    >
                      {formatEventTime(event.startsAt, language)} {event.title}
                    </Text>
                  </Pressable>
                );
              })}

              {dayEvents.length > 2 ? (
                <Text style={styles.moreEventsText}>{copy.more(dayEvents.length - 2)}</Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radius.xl,
    overflow: "hidden",
    backgroundColor: theme.colors.background.subtle,
  },
  weekDayCell: {
    width: `${100 / 7}%`,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border.default,
    backgroundColor: theme.colors.background.surface,
  },
  weekDayText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
  },
  dayCell: {
    width: `${100 / 7}%`,
    minHeight: 112,
    padding: theme.spacing.sm,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border.default,
    backgroundColor: theme.colors.background.surface,
  },
  emptyDayCell: {
    backgroundColor: theme.colors.background.subtle,
    opacity: 0.56,
  },
  todayDayCell: {
    backgroundColor: theme.colors.brand.primarySoft,
  },
  selectedDayCell: {
    borderColor: theme.colors.brand.primary,
    borderWidth: 2,
  },
  dayHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  dayNumber: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
  },
  selectedDayText: {
    color: theme.colors.text.brand,
  },
  todayBadge: {
    color: theme.colors.text.brand,
    fontSize: 10,
    fontWeight: theme.fontWeights.semibold,
  },
  dayEventList: { gap: 4 },
  calendarEventPill: {
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingVertical: 4,
    paddingHorizontal: 5,
  },
  calendarEventText: {
    fontSize: 11,
    fontWeight: theme.fontWeights.semibold,
  },
  calendarEventPillPressed: {
    opacity: 0.7,
  },
  moreEventsText: {
    color: theme.colors.text.secondary,
    fontSize: 11,
    fontWeight: theme.fontWeights.semibold,
  },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
});
