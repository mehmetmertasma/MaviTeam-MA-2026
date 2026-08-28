import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { StatusBadge } from "@/components/StatusBadge";
import { theme } from "@/constants/theme";
import type { ScheduleEvent } from "@/types/teamSync";

import { getScheduleTypeLabel, getScheduleTypeTone } from "../constants/schedule.constants";
import { formatEventDate, formatEventTime, formatMonthTitle } from "../utils/schedule-date.utils";
import { getScheduleTeamLabel } from "../utils/schedule-selectors.utils";
import { scheduleSharedStyles } from "../styles/schedule-shared.styles";
import type { ScheduleWorkspaceData } from "../types/schedule.types";

type EventListProps = {
  visibleMonth: Date;
  visibleMonthEvents: ScheduleEvent[];
  scheduleData: ScheduleWorkspaceData | null;
  onSelectEvent: (event: ScheduleEvent) => void;
  language: "tr" | "en";
};

function getCopy(language: "tr" | "en") {
  const en = language === "en";
  return {
    titleSuffix: en ? "events" : "etkinlikleri",
    subtitle: en
      ? "Records for the selected month are listed from the central data."
      : "Seçili aydaki kayıtlar merkezi data’dan listeleniyor.",
    recordsCount: (count: number) => (en ? `${count} records` : `${count} kayıt`),
    noNote: en ? "No additional note." : "Ek not yok.",
    emptyTitle: en ? "No events this month" : "Bu ayda etkinlik yok",
    emptyText: en
      ? "Pick a day on the calendar to create a new schedule entry for this month."
      : "Takvimden gün seçip bu aya yeni program kaydı oluşturabilirsin.",
  };
}

export function EventList({ visibleMonth, visibleMonthEvents, scheduleData, onSelectEvent, language }: EventListProps) {
  const copy = useMemo(() => getCopy(language), [language]);

  return (
    <View style={scheduleSharedStyles.section}>
      <View style={scheduleSharedStyles.sectionHeaderRow}>
        <View style={scheduleSharedStyles.sectionHeaderText}>
          <Text style={scheduleSharedStyles.sectionTitle}>{formatMonthTitle(visibleMonth, language)} {copy.titleSuffix}</Text>
          <Text style={scheduleSharedStyles.sectionSubtitle}>{copy.subtitle}</Text>
        </View>
        <StatusBadge label={copy.recordsCount(visibleMonthEvents.length)} tone="info" />
      </View>

      <View style={styles.eventList}>
        {scheduleData !== null && visibleMonthEvents.length > 0 ? (
          visibleMonthEvents.map((event) => {
            return (
              <Pressable
                key={event.id}
                onPress={() => onSelectEvent(event)}
                style={({ pressed }) => [styles.eventCard, pressed ? scheduleSharedStyles.pressed : null]}
              >
                <View style={styles.eventContent}>
                  <View style={styles.eventHeaderRow}>
                    <StatusBadge label={getScheduleTypeLabel(event.type, language)} tone={getScheduleTypeTone(event.type)} />
                    <Text style={styles.eventTeam}>{getScheduleTeamLabel(event, scheduleData)}</Text>
                  </View>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventMeta}>
                    {formatEventDate(event.startsAt, language)} · {formatEventTime(event.startsAt, language)} · {event.location}
                  </Text>
                  <Text style={styles.eventNote}>{event.note || copy.noNote}</Text>
                </View>
              </Pressable>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{copy.emptyTitle}</Text>
            <Text style={styles.emptyText}>{copy.emptyText}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  eventList: { gap: theme.spacing.sm },
  eventCard: {
    flexDirection: "row",
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    overflow: "hidden",
  },
  eventContent: {
    flex: 1,
    padding: theme.spacing.md,
  },
  eventHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  eventTeam: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.medium,
  },
  eventTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.xs,
  },
  eventMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium,
    marginBottom: theme.spacing.sm,
  },
  eventNote: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.regular,
    lineHeight: theme.lineHeights.md,
  },
  emptyCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  emptyTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.regular,
    lineHeight: theme.lineHeights.md,
  },
});
