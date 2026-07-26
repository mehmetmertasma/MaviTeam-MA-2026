import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppButton } from "@/components/AppButton";
import { theme } from "@/constants/theme";
import {
  ALL_CLUB_TEAM_OPTION_ID,
  MONTH_PICKER_OPTIONS,
  SCHEDULE_TYPE_OPTIONS,
  getScheduleTypeLabel,
  getScheduleTypeStyles,
} from "./constants/schedule.constants";
import { Calendar } from "./components/Calendar";
import { useScheduleData } from "./hooks/useScheduleData";
import {
  addMonths,
  buildStartsAt,
  formatEventDate,
  formatEventTime,
  formatMonthTitle,
  getDaysInMonth,
  getMonthStart,
} from "./utils/schedule-date.utils";
import {
  getEventsForMonth,
  getScheduleTeamLabel,
} from "./utils/schedule-selectors.utils";
import { scheduleRepository } from "./services/schedule.repository";
import type { ScheduleEventType } from "@/types/teamSync";
import type { TeamOption } from "./types/schedule.types";

export default function ScheduleScreen() {
  const { scheduleData, loadScheduleData, setScheduleData, setStatusMessage, statusMessage } =
    useScheduleData();
  const [visibleMonth, setVisibleMonth] = useState(() => getMonthStart(new Date()));
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedType, setSelectedType] = useState<ScheduleEventType>("practice");
  const [selectedTeamId, setSelectedTeamId] = useState(ALL_CLUB_TEAM_OPTION_ID);
  const [selectedDayNumber, setSelectedDayNumber] = useState(() => `${new Date().getDate()}`);
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");

  const teamOptions = useMemo<TeamOption[]>(() => {
    const allClubOption: TeamOption = {
      id: ALL_CLUB_TEAM_OPTION_ID,
      label: "Tüm Kulüp",
    };

    if (scheduleData === null) {
      return [allClubOption];
    }

    return [
      allClubOption,
      ...scheduleData.teams.map((team) => ({
        id: team.id,
        label: team.name,
        teamId: team.id,
      })),
    ];
  }, [scheduleData]);

  const scheduleEvents = useMemo(() => scheduleData?.scheduleEvents ?? [], [scheduleData]);

  const visibleMonthEvents = useMemo(() => {
    return getEventsForMonth(scheduleEvents, visibleMonth);
  }, [scheduleEvents, visibleMonth]);

  const canCreate =
    title.trim().length > 0 &&
    selectedDayNumber.trim().length > 0 &&
    time.trim().length > 0 &&
    location.trim().length > 0;

  const selectedDay = Number(selectedDayNumber);
  const selectedDateLabel = Number.isInteger(selectedDay)
    ? new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), selectedDay).toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Tarih seçilmedi";

  function setMonthAndKeepValidDay(nextMonth: Date) {
    const nextMonthStart = getMonthStart(nextMonth);
    const maxDay = getDaysInMonth(nextMonthStart.getFullYear(), nextMonthStart.getMonth());

    setVisibleMonth(nextMonthStart);
    setSelectedDayNumber((currentDay) => {
      const parsedDay = Number(currentDay);

      if (!Number.isInteger(parsedDay) || parsedDay < 1) {
        return "";
      }

      return `${Math.min(parsedDay, maxDay)}`;
    });
  }

  function clearForm() {
    setTitle("");
    setSelectedType("practice");
    setSelectedTeamId(ALL_CLUB_TEAM_OPTION_ID);
    setTime("");
    setLocation("");
    setNote("");
  }

  function selectCalendarDay(dayNumber: number) {
    setSelectedDayNumber(`${dayNumber}`);

    if (!showEventForm) {
      setShowEventForm(true);
    }

    setStatusMessage(`${dayNumber} ${formatMonthTitle(visibleMonth)} için etkinlik ekleyebilirsin.`);
  }

  async function handleCreateScheduleItem() {
    if (scheduleData === null) {
      setStatusMessage("Önce merkezi data yüklenmeli.");
      return;
    }

    const parsedDayNumber = Number(selectedDayNumber.trim());
    const maxDay = getDaysInMonth(visibleMonth.getFullYear(), visibleMonth.getMonth());

    if (!canCreate) {
      setStatusMessage("Başlık, tarih, saat ve konum boş bırakılamaz.");
      return;
    }

    if (!Number.isInteger(parsedDayNumber) || parsedDayNumber < 1 || parsedDayNumber > maxDay) {
      setStatusMessage("Lütfen takvimden geçerli bir gün seçiniz.");
      return;
    }

    const startsAt = buildStartsAt(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth(),
      parsedDayNumber,
      time
    );

    if (startsAt === null) {
      setStatusMessage("Saat formatı HH:mm şeklinde olmalı. Örn. 18:30");
      return;
    }

    const selectedTeam = teamOptions.find((team) => team.id === selectedTeamId) ?? teamOptions[0];

    try {
      const nextScheduleData = await scheduleRepository.createScheduleEvent({
        clubId: scheduleData.club.id,
        teamId: selectedTeam.teamId,
        title: title.trim(),
        type: selectedType,
        startsAt,
        location: location.trim(),
        note: note.trim() || "Ek not yok.",
        createdByUserId: scheduleData.currentUser.id,
      });

      setScheduleData(nextScheduleData);
      clearForm();
      setShowEventForm(false);
      setStatusMessage("Yeni etkinlik seçili ayın takvimine eklendi.");
    } catch {
      setStatusMessage("Etkinlik oluşturulurken bir sorun oluştu.");
    }
  }

  function openEventForm() {
    setShowEventForm(true);
    setStatusMessage("Takvimden gün seçip etkinlik bilgilerini doldurabilirsin.");
  }

  function closeEventForm() {
    clearForm();
    setShowEventForm(false);
    setStatusMessage("Etkinlik ekleme iptal edildi.");
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.pageHeader}>
          <Text style={styles.logo}>MaviTeam</Text>
          <Text style={styles.pageTitle}>Program</Text>
          <Text style={styles.pageSubtitle}>
            Antrenman, maç ve toplantıları merkezi data üzerinden yönet.
          </Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Takvim yönetimi</Text>
          <Text style={styles.heroTitle}>Aylık program görünümü</Text>
          <Text style={styles.heroSubtitle}>
            Aylar arasında geçiş yap, istediğin ayı seç ve etkinliği doğrudan seçili tarihe kaydet.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Takvim · {formatMonthTitle(visibleMonth)}</Text>
              <Text style={styles.sectionSubtitle}>
                Bir güne basınca etkinlik formu o tarih için açılır.
              </Text>
            </View>

            <Text style={styles.statusPill}>{visibleMonthEvents.length} etkinlik</Text>
          </View>

          <View style={styles.monthControlRow}>
            <Pressable
              onPress={() => setMonthAndKeepValidDay(addMonths(visibleMonth, -1))}
              style={({ pressed }) => [styles.monthNavButton, pressed ? styles.pressed : null]}
            >
              <Text style={styles.monthNavText}>‹ Önceki</Text>
            </Pressable>

            <Pressable
              onPress={() => setShowMonthPicker((currentValue) => !currentValue)}
              style={({ pressed }) => [styles.monthSelectButton, pressed ? styles.pressed : null]}
            >
              <Text style={styles.monthSelectText}>{formatMonthTitle(visibleMonth)}</Text>
              <Text style={styles.monthSelectHint}>Ay seç</Text>
            </Pressable>

            <Pressable
              onPress={() => setMonthAndKeepValidDay(addMonths(visibleMonth, 1))}
              style={({ pressed }) => [styles.monthNavButton, pressed ? styles.pressed : null]}
            >
              <Text style={styles.monthNavText}>Sonraki ›</Text>
            </Pressable>
          </View>

          {showMonthPicker ? (
            <View style={styles.monthPickerCard}>
              <View style={styles.yearControlRow}>
                <Pressable
                  onPress={() => setMonthAndKeepValidDay(addMonths(visibleMonth, -12))}
                  style={({ pressed }) => [styles.yearButton, pressed ? styles.pressed : null]}
                >
                  <Text style={styles.yearButtonText}>‹ {visibleMonth.getFullYear() - 1}</Text>
                </Pressable>

                <Text style={styles.yearTitle}>{visibleMonth.getFullYear()}</Text>

                <Pressable
                  onPress={() => setMonthAndKeepValidDay(addMonths(visibleMonth, 12))}
                  style={({ pressed }) => [styles.yearButton, pressed ? styles.pressed : null]}
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
                      onPress={() => {
                        setMonthAndKeepValidDay(
                          new Date(visibleMonth.getFullYear(), month.monthIndex, 1)
                        );
                        setShowMonthPicker(false);
                      }}
                      style={({ pressed }) => [
                        styles.monthOption,
                        isSelectedMonth ? styles.monthOptionSelected : null,
                        pressed ? styles.pressed : null,
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
              onPress={() => {
                const today = new Date();
                setVisibleMonth(getMonthStart(today));
                setSelectedDayNumber(`${today.getDate()}`);
                setStatusMessage("Bugünün olduğu aya dönüldü.");
              }}
              style={({ pressed }) => [styles.todayButton, pressed ? styles.pressed : null]}
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
            onSelectDay={selectCalendarDay}
          />

          <View style={styles.actionRow}>
            <AppButton
              title={showEventForm ? "Form açık" : "Etkinlik ekle"}
              onPress={openEventForm}
              disabled={showEventForm}
              style={styles.actionButton}
            />

            <AppButton
              title="Merkezi datayı yenile"
              variant="ghost"
              onPress={loadScheduleData}
              style={styles.actionButton}
            />
          </View>

          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>

        {showEventForm ? (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Etkinlik ekle</Text>
                <Text style={styles.sectionSubtitle}>
                  Seçili tarih: {selectedDateLabel}. Değiştirmek için takvimden başka bir gün seç.
                </Text>
              </View>

              <Text style={styles.statusPill}>Yeni</Text>
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
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Etkinlik türü</Text>
            <View style={styles.optionGrid}>
              {SCHEDULE_TYPE_OPTIONS.map((type) => {
                const isSelected = selectedType === type.value;
                const typeStyles = getScheduleTypeStyles(type.value);

                return (
                  <Pressable
                    key={type.value}
                    onPress={() => setSelectedType(type.value)}
                    style={({ pressed }) => [
                      styles.optionButton,
                      isSelected
                        ? {
                            backgroundColor: typeStyles.backgroundColor,
                            borderColor: typeStyles.borderColor,
                          }
                        : null,
                      pressed ? styles.pressed : null,
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
                    onPress={() => setSelectedTeamId(team.id)}
                    style={({ pressed }) => [
                      styles.optionButton,
                      isSelected ? styles.optionButtonSelected : null,
                      pressed ? styles.pressed : null,
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
              onChangeText={setTime}
            />

            <Text style={styles.label}>Konum</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: Ana Spor Salonu"
              placeholderTextColor={theme.colors.text.muted}
              value={location}
              onChangeText={setLocation}
            />

            <Text style={styles.label}>Not</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ek not yaz..."
              placeholderTextColor={theme.colors.text.muted}
              value={note}
              onChangeText={setNote}
              multiline
            />

            <View style={styles.actionRow}>
              <AppButton
                title="Etkinliği kaydet"
                onPress={handleCreateScheduleItem}
                disabled={!canCreate}
                style={styles.actionButton}
              />
              <AppButton
                title="Vazgeç"
                variant="ghost"
                onPress={closeEventForm}
                style={styles.actionButton}
              />
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>{formatMonthTitle(visibleMonth)} etkinlikleri</Text>
              <Text style={styles.sectionSubtitle}>Seçili aydaki kayıtlar merkezi data’dan listeleniyor.</Text>
            </View>
            <Text style={styles.statusPill}>{visibleMonthEvents.length} kayıt</Text>
          </View>

          <View style={styles.eventList}>
            {scheduleData !== null && visibleMonthEvents.length > 0 ? (
              visibleMonthEvents.map((event) => {
                const typeStyles = getScheduleTypeStyles(event.type);

                return (
                  <View key={event.id} style={styles.eventCard}>
                    <View style={[styles.eventTypeBar, { backgroundColor: typeStyles.borderColor }]} />

                    <View style={styles.eventContent}>
                      <Text style={styles.eventType}>
                        {getScheduleTypeLabel(event.type)} · {getScheduleTeamLabel(event, scheduleData)}
                      </Text>
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: theme.colors.background.app },
  screen: {
    flexGrow: 1,
    backgroundColor: theme.colors.background.app,
    paddingHorizontal: theme.spacing["2xl"],
    paddingBottom: theme.spacing["2xl"],
  },
  container: { width: "100%", maxWidth: 1100, alignSelf: "center" },
  pageHeader: { marginBottom: theme.spacing["2xl"] },
  logo: {
    color: theme.colors.brand.primary,
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.md,
  },
  pageTitle: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSizes["5xl"],
    fontWeight: theme.fontWeights.black,
    lineHeight: theme.lineHeights["5xl"],
    marginBottom: theme.spacing.sm,
  },
  pageSubtitle: {
    color: theme.colors.text.inverse,
    opacity: 0.76,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.xl,
  },
  heroCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    padding: theme.spacing["3xl"],
    marginBottom: theme.spacing["2xl"],
    ...theme.shadows.md,
  },
  heroLabel: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.brand.primarySoft,
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.extrabold,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.full,
    marginBottom: theme.spacing.lg,
  },
  heroTitle: {
    fontSize: theme.fontSizes["4xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    lineHeight: theme.lineHeights["4xl"],
    marginBottom: theme.spacing.md,
  },
  heroSubtitle: {
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.xl,
  },
  section: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    padding: theme.spacing["2xl"],
    marginBottom: theme.spacing["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    ...theme.shadows.sm,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionHeaderText: { flex: 1 },
  sectionTitle: {
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  sectionSubtitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.md,
  },
  statusPill: {
    backgroundColor: theme.colors.brand.primarySoft,
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.full,
  },
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
    fontWeight: theme.fontWeights.black,
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
    fontWeight: theme.fontWeights.black,
    textTransform: "capitalize",
  },
  monthSelectHint: {
    color: theme.colors.text.inverse,
    opacity: 0.78,
    fontSize: theme.fontSizes.xs,
    fontWeight: theme.fontWeights.black,
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
    fontWeight: theme.fontWeights.black,
  },
  yearTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
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
    fontWeight: theme.fontWeights.black,
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
    fontWeight: theme.fontWeights.black,
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
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginTop: theme.spacing["2xl"],
  },
  actionButton: { flexGrow: 1, minWidth: 170 },
  statusText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.lg,
    lineHeight: theme.lineHeights.md,
  },
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
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  selectedDateText: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
  },
  label: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
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
    fontWeight: theme.fontWeights.semibold,
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
    fontWeight: theme.fontWeights.black,
  },
  optionButtonTextSelected: { color: theme.colors.text.inverse },
  eventList: { gap: theme.spacing.md },
  eventCard: {
    flexDirection: "row",
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    overflow: "hidden",
  },
  eventTypeBar: { width: 8 },
  eventContent: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  eventType: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  eventTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  eventMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.sm,
  },
  eventNote: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
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
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.md,
  },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
});
