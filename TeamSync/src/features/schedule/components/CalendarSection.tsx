import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { StatusBadge } from "@/components/StatusBadge";
import { theme } from "@/constants/theme";
import type { ScheduleEvent } from "@/types/teamSync";

import { getMonthPickerOptions, getScheduleTypeOptions, getScheduleTypeStyles } from "../constants/schedule.constants";
import type { ScheduleStatusTone } from "../hooks/useScheduleData";
import { formatMonthTitle } from "../utils/schedule-date.utils";
import { scheduleSharedStyles } from "../styles/schedule-shared.styles";
import { Calendar } from "./Calendar";

const statusToneStyles: Record<ScheduleStatusTone, { background: string; text: string; dot: string }> = {
  neutral: {
    background: theme.colors.background.subtle,
    text: theme.colors.text.secondary,
    dot: theme.colors.text.muted,
  },
  success: {
    background: theme.colors.state.successSoft,
    text: theme.colors.text.success,
    dot: theme.colors.state.success,
  },
  danger: {
    background: theme.colors.state.dangerSoft,
    text: theme.colors.text.danger,
    dot: theme.colors.state.danger,
  },
};

type CalendarSectionProps = {
  visibleMonth: Date;
  visibleMonthEvents: ScheduleEvent[];
  selectedDayNumber: string;
  showMonthPicker: boolean;
  showEventForm: boolean;
  statusMessage: string;
  statusTone: ScheduleStatusTone;
  onToggleMonthPicker: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onPrevYear: () => void;
  onNextYear: () => void;
  onSelectMonth: (monthIndex: number) => void;
  onGoToday: () => void;
  onSelectDay: (dayNumber: number) => void;
  onSelectEvent: (event: ScheduleEvent) => void;
  onOpenEventForm: () => void;
  onRefresh: () => void;
  canManageEvents: boolean;
  language: "tr" | "en";
};

function getCopy(language: "tr" | "en") {
  const en = language === "en";
  return {
    sectionTitlePrefix: en ? "Calendar" : "Takvim",
    subtitleManage: en
      ? "Tapping a day opens the event form for that date."
      : "Bir güne basınca etkinlik formu o tarih için açılır.",
    subtitleView: en
      ? "You can view practices and matches here."
      : "Antrenman ve maçları buradan görüntüleyebilirsin.",
    eventsCount: (count: number) => (en ? `${count} events` : `${count} etkinlik`),
    previous: en ? "‹ Previous" : "‹ Önceki",
    next: en ? "Next ›" : "Sonraki ›",
    selectMonth: en ? "Select month" : "Ay seç",
    goToToday: en ? "Go to today" : "Bugüne dön",
    formOpen: en ? "Form open" : "Form açık",
    addEvent: en ? "Add event" : "Etkinlik ekle",
    refreshData: en ? "Refresh central data" : "Merkezi datayı yenile",
  };
}

export function CalendarSection({
  visibleMonth,
  visibleMonthEvents,
  selectedDayNumber,
  showMonthPicker,
  showEventForm,
  statusMessage,
  statusTone,
  onToggleMonthPicker,
  onPrevMonth,
  onNextMonth,
  onPrevYear,
  onNextYear,
  onSelectMonth,
  onGoToday,
  onSelectDay,
  onSelectEvent,
  onOpenEventForm,
  onRefresh,
  canManageEvents,
  language,
}: CalendarSectionProps) {
  const copy = useMemo(() => getCopy(language), [language]);
  const monthPickerOptions = useMemo(() => getMonthPickerOptions(language), [language]);
  const scheduleTypeOptions = useMemo(() => getScheduleTypeOptions(language), [language]);

  return (
    <View style={scheduleSharedStyles.section}>
      <View style={scheduleSharedStyles.sectionHeaderRow}>
        <View style={scheduleSharedStyles.sectionHeaderText}>
          <Text style={scheduleSharedStyles.sectionTitle}>{copy.sectionTitlePrefix} · {formatMonthTitle(visibleMonth, language)}</Text>
          <Text style={scheduleSharedStyles.sectionSubtitle}>
            {canManageEvents ? copy.subtitleManage : copy.subtitleView}
          </Text>
        </View>

        <StatusBadge label={copy.eventsCount(visibleMonthEvents.length)} tone="info" />
      </View>

      <View style={styles.monthControlRow}>
        <Pressable
          onPress={onPrevMonth}
          style={({ pressed }) => [styles.monthNavButton, pressed ? scheduleSharedStyles.pressed : null]}
        >
          <Text style={styles.monthNavText}>{copy.previous}</Text>
        </Pressable>

        <Pressable
          onPress={onToggleMonthPicker}
          style={({ pressed }) => [styles.monthSelectButton, pressed ? scheduleSharedStyles.pressed : null]}
        >
          <Text style={styles.monthSelectText}>{formatMonthTitle(visibleMonth, language)}</Text>
          <Text style={styles.monthSelectHint}>{copy.selectMonth}</Text>
        </Pressable>

        <Pressable
          onPress={onNextMonth}
          style={({ pressed }) => [styles.monthNavButton, pressed ? scheduleSharedStyles.pressed : null]}
        >
          <Text style={styles.monthNavText}>{copy.next}</Text>
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
            {monthPickerOptions.map((month) => {
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
          <Text style={styles.todayButtonText}>{copy.goToToday}</Text>
        </Pressable>
      </View>

      <View style={styles.legendRow}>
        {scheduleTypeOptions.map((type) => {
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
        onSelectEvent={onSelectEvent}
        language={language}
      />

      <View style={scheduleSharedStyles.actionRow}>
        {canManageEvents ? (
          <AppButton
            title={showEventForm ? copy.formOpen : copy.addEvent}
            onPress={onOpenEventForm}
            disabled={showEventForm}
            style={scheduleSharedStyles.actionButton}
          />
        ) : null}

        <AppButton
          title={copy.refreshData}
          variant="ghost"
          onPress={onRefresh}
          style={scheduleSharedStyles.actionButton}
        />
      </View>

      <View style={[styles.statusBanner, { backgroundColor: statusToneStyles[statusTone].background }]}>
        <View style={[styles.statusDot, { backgroundColor: statusToneStyles[statusTone].dot }]} />
        <Text style={[styles.statusText, { color: statusToneStyles[statusTone].text }]}>{statusMessage}</Text>
      </View>
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
    borderRadius: theme.radius.md,
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
    borderRadius: theme.radius.md,
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
    borderRadius: theme.radius.md,
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
  statusBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: theme.radius.full,
    marginTop: 6,
  },
  statusText: {
    flex: 1,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium,
    lineHeight: theme.lineHeights.md,
  },
});
