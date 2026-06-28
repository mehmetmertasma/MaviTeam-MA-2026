import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
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
import { teamSyncService } from "@/services/teamSyncService";
import type { ScheduleEvent, ScheduleEventType, TeamSyncAppData } from "@/types/teamSync";

type ScheduleTypeOption = {
  label: string;
  value: ScheduleEventType;
};

type TeamOption = {
  id: string;
  label: string;
  teamId?: string;
};

const scheduleTypeOptions: ScheduleTypeOption[] = [
  { label: "Antrenman", value: "practice" },
  { label: "Maç", value: "match" },
  { label: "Toplantı", value: "meeting" },
];

const weekDays = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const calendarDays = Array.from({ length: 35 }, (_, index) => index + 1);

function getTypeLabel(type: ScheduleEventType) {
  return scheduleTypeOptions.find((option) => option.value === type)?.label ?? "Etkinlik";
}

function getTypeStyles(type: ScheduleEventType) {
  if (type === "match") {
    return {
      backgroundColor: "#fee2e2",
      borderColor: "#ef4444",
      textColor: "#991b1b",
    };
  }

  if (type === "meeting") {
    return {
      backgroundColor: "#fef3c7",
      borderColor: "#f59e0b",
      textColor: "#92400e",
    };
  }

  return {
    backgroundColor: "#dbeafe",
    borderColor: "#2563eb",
    textColor: "#1e40af",
  };
}

function getDateFromValue(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function getDayNumber(value: string) {
  return getDateFromValue(value)?.getDate() ?? 0;
}

function formatEventDate(value: string) {
  const date = getDateFromValue(value);

  if (date === null) {
    return "Tarih yok";
  }

  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
  });
}

function formatEventTime(value: string) {
  const date = getDateFromValue(value);

  if (date === null) {
    return "Saat yok";
  }

  return date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCurrentMonthName() {
  return new Date().toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
}

function buildStartsAt(dayNumber: number, timeValue: string) {
  const [hourText, minuteText] = timeValue.trim().split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  const now = new Date();
  const startsAt = new Date(now.getFullYear(), now.getMonth(), dayNumber, hour, minute, 0);

  return startsAt.toISOString();
}

function getTeamLabel(event: ScheduleEvent, appData: TeamSyncAppData) {
  if (event.teamId === undefined) {
    return "Tüm Kulüp";
  }

  return appData.teams.find((team) => team.id === event.teamId)?.name ?? "Takım bulunamadı";
}

export default function ScheduleScreen() {
  const [appData, setAppData] = useState<TeamSyncAppData | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedType, setSelectedType] = useState<ScheduleEventType>("practice");
  const [selectedTeamId, setSelectedTeamId] = useState("all-club");
  const [dayNumber, setDayNumber] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [statusMessage, setStatusMessage] = useState(
    "Program merkezi TeamSync datasından yüklenecek."
  );

  const loadScheduleData = useCallback(async () => {
    try {
      const loadedAppData = await teamSyncService.getAppData();
      setAppData(loadedAppData);
      setStatusMessage("Program merkezi TeamSync datasından yüklendi.");
    } catch {
      setStatusMessage("Program yüklenirken bir sorun oluştu.");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadScheduleData();
    }, [loadScheduleData])
  );

  const teamOptions = useMemo<TeamOption[]>(() => {
    const allClubOption: TeamOption = {
      id: "all-club",
      label: "Tüm Kulüp",
    };

    if (appData === null) {
      return [allClubOption];
    }

    return [
      allClubOption,
      ...appData.teams.map((team) => ({
        id: team.id,
        label: team.name,
        teamId: team.id,
      })),
    ];
  }, [appData]);

  const scheduleEvents = useMemo(() => {
    return [...(appData?.scheduleEvents ?? [])].sort((firstEvent, secondEvent) => {
      return new Date(firstEvent.startsAt).getTime() - new Date(secondEvent.startsAt).getTime();
    });
  }, [appData]);

  const canCreate =
    title.trim().length > 0 &&
    dayNumber.trim().length > 0 &&
    time.trim().length > 0 &&
    location.trim().length > 0;

  const eventsByDay = useMemo(() => {
    return scheduleEvents.reduce<Record<number, ScheduleEvent[]>>((groups, item) => {
      const itemDayNumber = getDayNumber(item.startsAt);
      const currentEvents = groups[itemDayNumber] ?? [];

      return {
        ...groups,
        [itemDayNumber]: [...currentEvents, item],
      };
    }, {});
  }, [scheduleEvents]);

  function clearForm() {
    setTitle("");
    setSelectedType("practice");
    setSelectedTeamId("all-club");
    setDayNumber("");
    setTime("");
    setLocation("");
    setNote("");
  }

  async function handleCreateScheduleItem() {
    if (appData === null) {
      setStatusMessage("Önce merkezi data yüklenmeli.");
      return;
    }

    const parsedDayNumber = Number(dayNumber.trim());

    if (!canCreate) {
      setStatusMessage("Başlık, gün, saat ve konum boş bırakılamaz.");
      return;
    }

    if (!Number.isInteger(parsedDayNumber) || parsedDayNumber < 1 || parsedDayNumber > 31) {
      setStatusMessage("Lütfen 1 ile 31 arasında geçerli bir gün giriniz.");
      return;
    }

    const startsAt = buildStartsAt(parsedDayNumber, time);

    if (startsAt === null) {
      setStatusMessage("Saat formatı HH:mm şeklinde olmalı. Örn. 18:30");
      return;
    }

    const selectedTeam = teamOptions.find((team) => team.id === selectedTeamId) ?? teamOptions[0];

    try {
      const nextAppData = await teamSyncService.createScheduleEvent({
        clubId: appData.club.id,
        teamId: selectedTeam.teamId,
        title: title.trim(),
        type: selectedType,
        startsAt,
        location: location.trim(),
        note: note.trim() || "Ek not yok.",
        createdByUserId: appData.currentUser.id,
      });

      setAppData(nextAppData);
      clearForm();
      setShowEventForm(false);
      setStatusMessage("Yeni etkinlik merkezi program datasına eklendi.");
    } catch {
      setStatusMessage("Etkinlik oluşturulurken bir sorun oluştu.");
    }
  }

  function openEventForm() {
    setShowEventForm(true);
    setStatusMessage("Etkinlik bilgilerini doldurup merkezi takvime ekleyebilirsin.");
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
          <Text style={styles.logo}>TeamSync</Text>
          <Text style={styles.pageTitle}>Program</Text>
          <Text style={styles.pageSubtitle}>
            Antrenman, maç ve toplantıları merkezi data üzerinden yönet.
          </Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Takvim yönetimi</Text>
          <Text style={styles.heroTitle}>Haftalık / aylık program görünümü</Text>
          <Text style={styles.heroSubtitle}>
            Bu sayfa artık demo array kullanmıyor. Etkinlikler TeamSync service layer içindeki appData.scheduleEvents üzerinden geliyor.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Takvim · {getCurrentMonthName()}</Text>
              <Text style={styles.sectionSubtitle}>
                Maç, antrenman ve toplantıları Canvas tarzı renkli kartlar gibi takip et.
              </Text>
            </View>

            <Text style={styles.statusPill}>{scheduleEvents.length} etkinlik</Text>
          </View>

          <View style={styles.legendRow}>
            {scheduleTypeOptions.map((type) => {
              const typeStyles = getTypeStyles(type.value);

              return (
                <View key={type.value} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: typeStyles.borderColor },
                    ]}
                  />
                  <Text style={styles.legendText}>{type.label}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.calendarGrid}>
            {weekDays.map((day) => (
              <View key={day} style={styles.weekDayCell}>
                <Text style={styles.weekDayText}>{day}</Text>
              </View>
            ))}

            {calendarDays.map((calendarDay) => {
              const dayEvents = eventsByDay[calendarDay] ?? [];

              return (
                <View key={calendarDay} style={styles.dayCell}>
                  <Text style={styles.dayNumber}>{calendarDay}</Text>

                  <View style={styles.dayEventList}>
                    {dayEvents.slice(0, 2).map((event) => {
                      const typeStyles = getTypeStyles(event.type);

                      return (
                        <View
                          key={event.id}
                          style={[
                            styles.calendarEventPill,
                            {
                              backgroundColor: typeStyles.backgroundColor,
                              borderColor: typeStyles.borderColor,
                            },
                          ]}
                        >
                          <Text
                            numberOfLines={1}
                            style={[styles.calendarEventText, { color: typeStyles.textColor }]}
                          >
                            {formatEventTime(event.startsAt)} {event.title}
                          </Text>
                        </View>
                      );
                    })}

                    {dayEvents.length > 2 ? (
                      <Text style={styles.moreEventsText}>+{dayEvents.length - 2} daha</Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>

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
                  Etkinlik bilgilerini doldurunca merkezi program datasına kaydedilecek.
                </Text>
              </View>

              <Text style={styles.statusPill}>Yeni</Text>
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
              {scheduleTypeOptions.map((type) => {
                const isSelected = selectedType === type.value;
                const typeStyles = getTypeStyles(type.value);

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

            <View style={styles.formGrid}>
              <View style={styles.formField}>
                <Text style={styles.label}>Gün</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Örn: 12"
                  placeholderTextColor={theme.colors.text.muted}
                  keyboardType="number-pad"
                  value={dayNumber}
                  onChangeText={setDayNumber}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Saat</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Örn: 18:30"
                  placeholderTextColor={theme.colors.text.muted}
                  value={time}
                  onChangeText={setTime}
                />
              </View>
            </View>

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
              <Text style={styles.sectionTitle}>Yaklaşan etkinlikler</Text>
              <Text style={styles.sectionSubtitle}>Programdaki kayıtlar merkezi data’dan listeleniyor.</Text>
            </View>
            <Text style={styles.statusPill}>{scheduleEvents.length} kayıt</Text>
          </View>

          <View style={styles.eventList}>
            {appData !== null && scheduleEvents.length > 0 ? (
              scheduleEvents.map((event) => {
                const typeStyles = getTypeStyles(event.type);

                return (
                  <View key={event.id} style={styles.eventCard}>
                    <View style={[styles.eventTypeBar, { backgroundColor: typeStyles.borderColor }]} />

                    <View style={styles.eventContent}>
                      <Text style={styles.eventType}>{getTypeLabel(event.type)} · {getTeamLabel(event, appData)}</Text>
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
                <Text style={styles.emptyTitle}>Henüz etkinlik yok</Text>
                <Text style={styles.emptyText}>Etkinlik ekle butonu ile ilk program kaydını oluşturabilirsin.</Text>
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
    fontWeight: theme.fontWeights.black,
  },
  dayCell: {
    width: `${100 / 7}%`,
    minHeight: 104,
    padding: theme.spacing.sm,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border.default,
    backgroundColor: theme.colors.background.surface,
  },
  dayNumber: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  dayEventList: { gap: 4 },
  calendarEventPill: {
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  calendarEventText: {
    fontSize: 11,
    fontWeight: theme.fontWeights.black,
  },
  moreEventsText: {
    color: theme.colors.text.secondary,
    fontSize: 11,
    fontWeight: theme.fontWeights.black,
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
  formGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.lg,
  },
  formField: { flex: 1, minWidth: 180 },
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
