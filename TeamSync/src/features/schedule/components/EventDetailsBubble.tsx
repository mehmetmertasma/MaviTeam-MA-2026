import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
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
  canManage: boolean;
  onEdit: (event: ScheduleEvent) => void;
  onDelete: (event: ScheduleEvent) => void;
  onClose: () => void;
  language: "tr" | "en";
};

function getCopy(language: "tr" | "en") {
  const en = language === "en";
  return {
    closeAccessibilityLabel: en ? "Close event details" : "Etkinlik detayını kapat",
    dateLabel: en ? "Date" : "Tarih",
    timeLabel: en ? "Time" : "Saat",
    teamLabel: en ? "Team" : "Takım",
    locationLabel: en ? "Location" : "Konum",
    noteLabel: en ? "Note" : "Not",
    noNote: en ? "No additional note." : "Ek not yok.",
    edit: en ? "Edit" : "Düzenle",
    delete: en ? "Delete" : "Sil",
    confirmDelete: en ? "Are you sure?" : "Emin misin?",
  };
}

// A real Modal (not an inline View) -- this popup is triggered from deep
// inside a scrollable screen (ScheduleScreen -> CalendarSection), so it
// needs to float over the whole page regardless of scroll position, and
// closing it must leave the page exactly where it was. Modal is the
// component built for that; a hand-positioned absolute View only escapes
// as far as its nearest scroll container, not the real viewport.
export function EventDetailsBubble({ event, scheduleData, canManage, onEdit, onDelete, onClose, language }: EventDetailsBubbleProps) {
  const [pendingDelete, setPendingDelete] = useState(false);
  const copy = useMemo(() => getCopy(language), [language]);

  function handleDeletePress() {
    if (!pendingDelete) {
      setPendingDelete(true);
      return;
    }

    onDelete(event);
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={copy.closeAccessibilityLabel}>
        {/* Swallows taps so pressing the card itself doesn't also close the modal via the backdrop underneath it. */}
        <Pressable style={styles.panel} onPress={(pressEvent) => pressEvent.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.titleArea}>
              <StatusBadge label={getScheduleTypeLabel(event.type, language)} tone={getScheduleTypeTone(event.type)} style={styles.typeBadge} />
              <Text style={styles.title}>{event.title}</Text>
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed ? styles.pressed : null]}
              accessibilityLabel={copy.closeAccessibilityLabel}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </Pressable>
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>{copy.dateLabel}</Text>
              <Text style={styles.metaValue}>{formatEventDate(event.startsAt, language)}</Text>
            </View>
            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>{copy.timeLabel}</Text>
              <Text style={styles.metaValue}>{formatEventTime(event.startsAt, language)}</Text>
            </View>
            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>{copy.teamLabel}</Text>
              <Text style={styles.metaValue}>{getScheduleTeamLabel(event, scheduleData)}</Text>
            </View>
            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>{copy.locationLabel}</Text>
              <Text style={styles.metaValue}>{event.location}</Text>
            </View>
          </View>

          <Text style={styles.noteLabel}>{copy.noteLabel}</Text>
          <Text style={styles.noteText}>{event.note || copy.noNote}</Text>

          {canManage ? (
            <View style={styles.manageRow}>
              <AppButton
                title={copy.edit}
                variant="secondary"
                onPress={() => onEdit(event)}
                style={styles.manageButton}
              />
              <AppButton
                title={pendingDelete ? copy.confirmDelete : copy.delete}
                variant="danger"
                onPress={handleDeletePress}
                style={styles.manageButton}
              />
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default EventDetailsBubble;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.overlay,
  },
  panel: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.brand.primarySoft,
    padding: theme.spacing.lg,
    ...theme.shadows.lg,
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
  manageRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  manageButton: { flexGrow: 1, minWidth: 120 },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
});
