import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { StatusBadge } from "@/components/StatusBadge";
import { theme } from "@/constants/theme";
import type { ScheduleEventType } from "@/types/teamSync";

import { SCHEDULE_TYPE_OPTIONS, getScheduleTypeStyles } from "../constants/schedule.constants";
import { scheduleSharedStyles } from "../styles/schedule-shared.styles";
import type { TeamOption } from "../types/schedule.types";

type EventFormProps = {
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
  onSave: () => void;
  onCancel: () => void;
};

export function EventForm({
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
  onSave,
  onCancel,
}: EventFormProps) {
  return (
    <View style={scheduleSharedStyles.section}>
      <View style={scheduleSharedStyles.sectionHeaderRow}>
        <View style={scheduleSharedStyles.sectionHeaderText}>
          <Text style={scheduleSharedStyles.sectionTitle}>Etkinlik ekle</Text>
          <Text style={scheduleSharedStyles.sectionSubtitle}>
            Seçili tarih: {selectedDateLabel}. Değiştirmek için takvimden başka bir gün seç.
          </Text>
        </View>

        <StatusBadge label="Yeni" tone="info" />
      </View>

      <View style={styles.selectedDateCard}>
        <Text style={styles.selectedDateLabel}>Tarih</Text>
        <Text style={styles.selectedDateText}>{selectedDateLabel}</Text>
      </View>

      <Text style={styles.label}>Başlık</Text>
      <TextInput
        style={styles.input}
        placeholder="Örn: U16 Erkek antrenmanı"
        placeholderTextColor={theme.colors.text.muted}
        value={title}
        onChangeText={onChangeTitle}
      />

      <Text style={styles.label}>Etkinlik türü</Text>
      <View style={styles.optionGrid}>
        {SCHEDULE_TYPE_OPTIONS.map((type) => {
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

      <Text style={styles.label}>Takım</Text>
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

      <Text style={styles.label}>Saat</Text>
      <TextInput
        style={styles.input}
        placeholder="Örn: 18:30"
        placeholderTextColor={theme.colors.text.muted}
        value={time}
        onChangeText={onChangeTime}
      />

      <Text style={styles.label}>Konum</Text>
      <TextInput
        style={styles.input}
        placeholder="Örn: Ana Spor Salonu"
        placeholderTextColor={theme.colors.text.muted}
        value={location}
        onChangeText={onChangeLocation}
      />

      <Text style={styles.label}>Not</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Ek not yaz..."
        placeholderTextColor={theme.colors.text.muted}
        value={note}
        onChangeText={onChangeNote}
        multiline
      />

      <View style={scheduleSharedStyles.actionRow}>
        <AppButton
          title="Etkinliği kaydet"
          onPress={onSave}
          disabled={!canCreate}
          style={scheduleSharedStyles.actionButton}
        />
        <AppButton
          title="Vazgeç"
          variant="ghost"
          onPress={onCancel}
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
    borderRadius: theme.radius.full,
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
