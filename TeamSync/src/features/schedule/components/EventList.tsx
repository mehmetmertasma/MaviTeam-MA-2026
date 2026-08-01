import { StyleSheet, Text, View } from "react-native";

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
};

export function EventList({ visibleMonth, visibleMonthEvents, scheduleData }: EventListProps) {
  return (
    <View style={scheduleSharedStyles.section}>
      <View style={scheduleSharedStyles.sectionHeaderRow}>
        <View style={scheduleSharedStyles.sectionHeaderText}>
          <Text style={scheduleSharedStyles.sectionTitle}>{formatMonthTitle(visibleMonth)} etkinlikleri</Text>
          <Text style={scheduleSharedStyles.sectionSubtitle}>Seçili aydaki kayıtlar merkezi data’dan listeleniyor.</Text>
        </View>
        <StatusBadge label={`${visibleMonthEvents.length} kayıt`} tone="info" />
      </View>

      <View style={styles.eventList}>
        {scheduleData !== null && visibleMonthEvents.length > 0 ? (
          visibleMonthEvents.map((event) => {
            return (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventContent}>
                  <View style={styles.eventHeaderRow}>
                    <StatusBadge label={getScheduleTypeLabel(event.type)} tone={getScheduleTypeTone(event.type)} />
                    <Text style={styles.eventTeam}>{getScheduleTeamLabel(event, scheduleData)}</Text>
                  </View>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventMeta}>
                    {formatEventDate(event.startsAt)} · {formatEventTime(event.startsAt)} · {event.location}
                  </Text>
                  <Text style={styles.eventNote}>{event.note ?? "Ek not yok."}</Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Bu ayda etkinlik yok</Text>
            <Text style={styles.emptyText}>Takvimden gün seçip bu aya yeni program kaydı oluşturabilirsin.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  eventList: { gap: theme.spacing.md },
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
    padding: theme.spacing.lg,
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
