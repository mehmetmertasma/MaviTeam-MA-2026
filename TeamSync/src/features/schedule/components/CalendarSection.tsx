import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { StatusBadge } from "@/components/StatusBadge";
import { theme } from "@/constants/theme";
import type { ScheduleEvent } from "@/types/teamSync";

import { MONTH_PICKER_OPTIONS, SCHEDULE_TYPE_OPTIONS, getScheduleTypeStyles } from "../constants/schedule.constants";
import { formatMonthTitle } from "../utils/schedule-date.utils";
import { scheduleSharedStyles } from "../styles/schedule-shared.styles";
import { Calendar } from "./Calendar";

type CalendarSectionProps = {
  visibleMonth: Date;
  visibleMonthEvents: ScheduleEvent[];
  selectedDayNumber: string;
  showMonthPicker: boolean;
  showEventForm: boolean;
  statusMessage: string;
  onToggleMonthPicker: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onPrevYear: () => void;
  onNextYear: () => void;
  onSelectMonth: (monthIndex: number) => void;
  onGoToday: () => void;
  onSelectDay: (dayNumber: number) => void;
  onOpenEventForm: () => void;
  onRefresh: () => void;
};

export function CalendarSection({
  visibleMonth,
  visibleMonthEvents,
  selectedDayNumber,
  showMonthPicker,
  showEventForm,
  statusMessage,
  onToggleMonthPicker,
  onPrevMonth,
  onNextMonth,
  onPrevYear,
  onNextYear,
  onSelectMonth,
  onGoToday,
  onSelectDay,
  onOpenEventForm,
  onRefresh,
}: CalendarSectionProps) {
  return (
    <View style={scheduleSharedStyles.section}>
      <View style={scheduleSharedStyles.sectionHeaderRow}>
        <View style={scheduleSharedStyles.sectionHeaderText}>
          <Text style={scheduleSharedStyles.sectionTitle}>Takvim · {formatMonthTitle(visibleMonth)}</Text>
          <Text style={scheduleSharedStyles.sectionSubtitle}>
            Bir güne basınca etkinlik formu o tarih için açılır.
          </Text>
        </View>

        <StatusBadge label={`${visibleMonthEvents.length} etkinlik`} tone="info" />
      </View>

      <View style={styles.monthControlRow}>
        <Pressable
          onPress={onPrevMonth}
          style={({ pressed }) => [styles.monthNavButton, pressed ? scheduleSharedStyles.pressed : null]}
        >
          <Text style={styles.monthNavText}>‹ Önceki</Text>
        </Pressable>

        <Pressable
          onPress={onToggleMonthPicker}
          style={({ pressed }) => [styles.monthSelectButton, pressed ? scheduleSharedStyles.pressed : null]}
        >
          <Text style={styles.monthSelectText}>{formatMonthTitle(visibleMonth)}</Text>
          <Text style={styles.monthSelectHint}>Ay seç</Text>
        </Pressable>

        <Pressable
          onPress={onNextMonth}
          style={({ pressed }) => [styles.monthNavButton, pressed ? scheduleSharedStyles.pressed : null]}
        >
          <Text style={styles.monthNavText}>Sonraki ›</Text>
        </Pressable>
      </View>

      {showMonthPicker ? (
        <View style={styles.monthPickerCard}>
          <View style={styles.yearControlRow}>
            <Pressable
              onPress={onPrevYear}
              style={({ pressed }) => [styles.yearButton, pressed ? scheduleSharedStyles.pressed : null]}
            >
              <Text style={styles.yearButtonText}>‹ {visibleMonth.getFullYear() - 1}</Text>
            </Pressable>

            <Text style={styles.yearTitle}>{visibleMonth.getFullYear()}</Text>

            <Pressable
              onPress={onNextYear}
              style={({ pressed }) => [styles.yearButton, pressed ? scheduleSharedStyles.pressed : null]}
            >
              <Text style={styles.yearButtonText}>{visibleMonth.getFullYear() + 1} ›</Text>
            </Pressable>
          </View>

          <View style={styles.monthGrid}>
            {MONTH_PICKER_OPTIONS.map((month) => {
              const isSelectedMonth = visibleMonth.getMonth() === month.monthIndex;

              return (
                <Pressable
                  key={month.monthIndex}
                  onPress={() => onSelectMonth(month.monthIndex)}
                  style={({ pressed }) => [
                    styles.monthOption,
                    isSelectedMonth ? styles.monthOptionSelected : null,
                    pressed ? scheduleSharedStyles.pressed : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.monthOptionText,
                      isSelectedMonth ? styles.monthOptionTextSelected : null,
                    ]}
                  >
                    {month.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={styles.quickActionRow}>
        <Pressable
          onPress={onGoToday}
          style={({ pressed }) => [styles.todayButton, pressed ? scheduleSharedStyles.pressed : null]}
        >
          <Text style={styles.todayButtonText}>Bugüne dön</Text>
        </Pressable>
      </View>

      <View style={styles.legendRow}>
        {SCHEDULE_TYPE_OPTIONS.map((type) => {
          const typeStyles = getScheduleTypeStyles(type.value);

          return (
            <View key={type.value} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: typeStyles.borderColor }]} />
              <Text style={styles.legendText}>{type.label}</Text>
            </View>
          );
        })}
      </View>

      <Calendar
        visibleMonth={visibleMonth}
        events={visibleMonthEvents}
        selectedDayNumber={selectedDayNumber}
        onSelectDay={onSelectDay}
      />

      <View style={scheduleSharedStyles.actionRow}>
        <AppButton
          title={showEventForm ? "Form açık" : "Etkinlik ekle"}
          onPress={onOpenEventForm}
          disabled={showEventForm}
          style={scheduleSharedStyles.actionButton}
        />

        <AppButton
          title="Merkezi datayı yenile"
          variant="ghost"
          onPress={onRefresh}
          style={scheduleSharedStyles.actionButton}
        />
      </View>

      <Text style={styles.statusText}>{statusMessage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  monthControlRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "stretch",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  monthNavButton: {
    minHeight: 50,
    flexGrow: 1,
    minWidth: 130,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingHorizontal: theme.spacing.lg,
  },
  monthNavText: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
  },
  monthSelectButton: {
    minHeight: 50,
    flexGrow: 2,
    minWidth: 210,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.brand.primary,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  monthSelectText: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
    textTransform: "capitalize",
  },
  monthSelectHint: {
    color: theme.colors.text.inverse,
    opacity: 0.78,
    fontSize: theme.fontSizes.xs,
    fontWeight: theme.fontWeights.medium,
    marginTop: 2,
  },
  monthPickerCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  yearControlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  yearButton: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  yearButtonText: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
  },
  yearTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.semibold,
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  monthOption: {
    minWidth: 86,
    flexGrow: 1,
    alignItems: "center",
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  monthOptionSelected: {
    backgroundColor: theme.colors.brand.primary,
    borderColor: theme.colors.brand.primary,
  },
  monthOptionText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    textTransform: "capitalize",
  },
  monthOptionTextSelected: { color: theme.colors.text.inverse },
  quickActionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: theme.spacing.lg,
  },
  todayButton: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  todayButtonText: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: theme.radius.full,
  },
  legendText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
  },
  statusText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.regular,
    marginTop: theme.spacing.lg,
    lineHeight: theme.lineHeights.md,
  },
});
