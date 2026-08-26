import { Pressable, StyleSheet, Text, View } from "react-native";

import { StatusBadge } from "@/components/StatusBadge";
import { theme } from "@/constants/theme";
import type { ScheduleEvent } from "@/types/teamSync";

import { getScheduleTypeLabel, getScheduleTypeTone } from "../constants/schedule.constants";
import type { ScheduleWorkspaceData } from "../types/schedule.types";
import { formatEventDate, formatEventTime } from "../utils/schedule-date.utils";
import { getScheduleTeamLabel } from "../utils/schedule-selectors.utils";

type EventDetailsBubbleProps = {
  event: ScheduleEvent;
  scheduleData: ScheduleWorkspaceData;
  onClose: () => void;
};

export function EventDetailsBubble({ event, scheduleData, onClose }: EventDetailsBubbleProps) {
  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <View style={styles.titleArea}>
          <StatusBadge label={getScheduleTypeLabel(event.type)} tone={getScheduleTypeTone(event.type)} style={styles.typeBadge} />
          <Text style={styles.title}>{event.title}</Text>
        </View>

        <Pressable
          onPress={onClose}
          style={({ pressed }) => [styles.closeButton, pressed ? styles.pressed : null]}
          accessibilityLabel="Etkinlik detayını kapat"
        >
          <Text style={styles.closeButtonText}>×</Text>
        </Pressable>
      </View>

      <View style={styles.metaGrid}>
        <View style={styles.metaBox}>
          <Text style={styles.metaLabel}>Tarih</Text>
          <Text style={styles.metaValue}>{formatEventDate(event.startsAt)}</Text>
        </View>
        <View style={styles.metaBox}>
          <Text style={styles.metaLabel}>Saat</Text>
          <Text style={styles.metaValue}>{formatEventTime(event.startsAt)}</Text>
        </View>
        <View style={styles.metaBox}>
          <Text style={styles.metaLabel}>Takım</Text>
          <Text style={styles.metaValue}>{getScheduleTeamLabel(event, scheduleData)}</Text>
        </View>
        <View style={styles.metaBox}>
          <Text style={styles.metaLabel}>Konum</Text>
          <Text style={styles.metaValue}>{event.location}</Text>
        </View>
      </View>

      <Text style={styles.noteLabel}>Not</Text>
      <Text style={styles.noteText}>{event.note ?? "Ek not yok."}</Text>
    </View>
  );
}

export default EventDetailsBubble;

const styles = StyleSheet.create({
  panel: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.brand.primarySoft,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
    ...theme.shadows.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  titleArea: { flex: 1 },
  typeBadge: { marginBottom: theme.spacing.sm },
  title: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.semibold,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.subtle,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.semibold,
    marginTop: -2,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  metaBox: {
    flexGrow: 1,
    flexBasis: 130,
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.sm,
  },
  metaLabel: {
    color: theme.colors.text.muted,
    fontSize: theme.fontSizes.xs,
    fontWeight: theme.fontWeights.medium,
    textTransform: "uppercase",
    marginBottom: theme.spacing.xs,
  },
  metaValue: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
  },
  noteLabel: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.xs,
  },
  noteText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.regular,
    lineHeight: theme.lineHeights.md,
  },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
});
