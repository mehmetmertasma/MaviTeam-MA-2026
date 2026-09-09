import { useMemo } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { StatusBadge } from "@/components/StatusBadge";
import { theme } from "@/constants/theme";
import type { ScheduleEventType } from "@/types/teamSync";

import { getScheduleTypeOptions, getScheduleTypeStyles } from "../constants/schedule.constants";
import { scheduleSharedStyles } from "../styles/schedule-shared.styles";
import type { TeamOption } from "../types/schedule.types";

type EventFormProps = {
  isEditing: boolean;
  selectedDateLabel: string;
  title: string;
  onChangeTitle: (value: string) => void;
  selectedType: ScheduleEventType;
  onSelectType: (value: ScheduleEventType) => void;
  teamOptions: TeamOption[];
  selectedTeamId: string;
  onSelectTeam: (teamId: string) => void;
  time: string;
  onChangeTime: (value: string) => void;
  location: string;
  onChangeLocation: (value: string) => void;
  note: string;
  onChangeNote: (value: string) => void;
  canCreate: boolean;
  isSaving?: boolean;
  onSave: () => void;
  onCancel: () => void;
  language: "tr" | "en";
};

function getCopy(language: "tr" | "en") {
  const en = language === "en";
  return {
    editTitle: en ? "Edit event" : "Etkinliği düzenle",
    addTitle: en ? "Add event" : "Etkinlik ekle",
    selectedDatePrefix: en ? "Selected date:" : "Seçili tarih:",
    selectedDateHint: en
      ? "Choose a different day on the calendar to change it."
      : "Değiştirmek için takvimden başka bir gün seç.",
    editBadge: en ? "Edit" : "Düzenle",
    newBadge: en ? "New" : "Yeni",
    dateLabel: en ? "Date" : "Tarih",
    titleLabel: en ? "Title" : "Başlık",
    titlePlaceholder: en ? "E.g. U16 Boys practice" : "Örn: U16 Erkek antrenmanı",
    typeLabel: en ? "Event type" : "Etkinlik türü",
    teamLabel: en ? "Team" : "Takım",
    timeLabel: en ? "Time" : "Saat",
    timePlaceholder: en ? "E.g. 18:30" : "Örn: 18:30",
    locationLabel: en ? "Location" : "Konum",
    locationPlaceholder: en ? "E.g. Main Sports Hall" : "Örn: Ana Spor Salonu",
    noteLabel: en ? "Note" : "Not",
    notePlaceholder: en ? "Write an additional note..." : "Ek not yaz...",
    saveEdit: en ? "Save changes" : "Değişiklikleri kaydet",
    saveNew: en ? "Save event" : "Etkinliği kaydet",
    cancel: en ? "Cancel" : "Vazgeç",
  };
}

export function EventForm({
  isEditing,
  selectedDateLabel,
  title,
  onChangeTitle,
  selectedType,
  onSelectType,
  teamOptions,
  selectedTeamId,
  onSelectTeam,
  time,
  onChangeTime,
  location,
  onChangeLocation,
  note,
  onChangeNote,
  canCreate,
  isSaving = false,
  onSave,
  onCancel,
  language,
}: EventFormProps) {
  const copy = useMemo(() => getCopy(language), [language]);
  const scheduleTypeOptions = useMemo(() => getScheduleTypeOptions(language), [language]);

  return (
    <View style={scheduleSharedStyles.section}>
      <View style={scheduleSharedStyles.sectionHeaderRow}>
        <View style={scheduleSharedStyles.sectionHeaderText}>
          <Text style={scheduleSharedStyles.sectionTitle}>{isEditing ? copy.editTitle : copy.addTitle}</Text>
          <Text style={scheduleSharedStyles.sectionSubtitle}>
            {copy.selectedDatePrefix} {selectedDateLabel}. {copy.selectedDateHint}
          </Text>
        </View>

        <StatusBadge label={isEditing ? copy.editBadge : copy.newBadge} tone={isEditing ? "warning" : "info"} />
      </View>

      <View style={styles.selectedDateCard}>
        <Text style={styles.selectedDateLabel}>{copy.dateLabel}</Text>
        <Text style={styles.selectedDateText}>{selectedDateLabel}</Text>
      </View>

      <Text style={styles.label}>{copy.titleLabel}</Text>
      <TextInput
        style={styles.input}
        placeholder={copy.titlePlaceholder}
        placeholderTextColor={theme.colors.text.muted}
        value={title}
        onChangeText={onChangeTitle}
      />

      <Text style={styles.label}>{copy.typeLabel}</Text>
      <View style={styles.optionGrid}>
        {scheduleTypeOptions.map((type) => {
          const isSelected = selectedType === type.value;
          const typeStyles = getScheduleTypeStyles(type.value);

          return (
            <Pressable
              key={type.value}
              onPress={() => onSelectType(type.value)}
              style={({ pressed }) => [
                styles.optionButton,
                isSelected
                  ? {
                      backgroundColor: typeStyles.backgroundColor,
                      borderColor: typeStyles.borderColor,
                    }
                  : null,
                pressed ? scheduleSharedStyles.pressed : null,
              ]}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  isSelected ? { color: typeStyles.textColor } : null,
                ]}
              >
                {type.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>{copy.teamLabel}</Text>
      <View style={styles.optionGrid}>
        {teamOptions.map((team) => {
          const isSelected = selectedTeamId === team.id;

          return (
            <Pressable
              key={team.id}
              onPress={() => onSelectTeam(team.id)}
              style={({ pressed }) => [
                styles.optionButton,
                isSelected ? styles.optionButtonSelected : null,
                pressed ? scheduleSharedStyles.pressed : null,
              ]}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  isSelected ? styles.optionButtonTextSelected : null,
                ]}
              >
                {team.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>{copy.timeLabel}</Text>
      <TextInput
        style={styles.input}
        placeholder={copy.timePlaceholder}
        placeholderTextColor={theme.colors.text.muted}
        value={time}
        onChangeText={onChangeTime}
      />

      <Text style={styles.label}>{copy.locationLabel}</Text>
      <TextInput
        style={styles.input}
        placeholder={copy.locationPlaceholder}
        placeholderTextColor={theme.colors.text.muted}
        value={location}
        onChangeText={onChangeLocation}
      />

      <Text style={styles.label}>{copy.noteLabel}</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder={copy.notePlaceholder}
        placeholderTextColor={theme.colors.text.muted}
        value={note}
        onChangeText={onChangeNote}
        multiline
      />

      <View style={scheduleSharedStyles.actionRow}>
        <AppButton
          title={isEditing ? copy.saveEdit : copy.saveNew}
          onPress={onSave}
          loading={isSaving}
          disabled={!canCreate || isSaving}
          style={scheduleSharedStyles.actionButton}
        />
        <AppButton
          title={copy.cancel}
          variant="ghost"
          onPress={onCancel}
          disabled={isSaving}
          style={scheduleSharedStyles.actionButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  selectedDateCard: {
    backgroundColor: theme.colors.brand.primarySoft,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.brand.primary,
  },
  selectedDateLabel: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.medium,
    marginBottom: theme.spacing.xs,
  },
  selectedDateText: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.semibold,
  },
  label: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.sm,
  },
  input: {
    minHeight: 52,
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.regular,
    marginBottom: theme.spacing.lg,
  },
  textArea: { minHeight: 110, textAlignVertical: "top" },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  optionButton: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.background.subtle,
  },
  optionButtonSelected: {
    backgroundColor: theme.colors.brand.primary,
    borderColor: theme.colors.brand.primary,
  },
  optionButtonText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
  },
  optionButtonTextSelected: { color: theme.colors.text.inverse },
});
