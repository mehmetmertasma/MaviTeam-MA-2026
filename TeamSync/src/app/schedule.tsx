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

type ScheduleType = "Antrenman" | "Maç" | "Toplantı";
type TeamOption = "Tüm Kulüp" | "A Takım" | "U16 Erkek" | "U14 Kız";

type ScheduleItem = {
  id: number;
  title: string;
  type: ScheduleType;
  team: TeamOption;
  dayNumber: number;
  dateLabel: string;
  time: string;
  location: string;
  note: string;
};

const scheduleTypes: ScheduleType[] = ["Antrenman", "Maç", "Toplantı"];
const teamOptions: TeamOption[] = ["Tüm Kulüp", "A Takım", "U16 Erkek", "U14 Kız"];
const weekDays = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const calendarDays = Array.from({ length: 35 }, (_, index) => index + 1);

const initialScheduleItems: ScheduleItem[] = [
  {
    id: 1,
    title: "A Takım antrenmanı",
    type: "Antrenman",
    team: "A Takım",
    dayNumber: 5,
    dateLabel: "5 Temmuz",
    time: "18:30",
    location: "Burhan Felek Spor Salonu",
    note: "Oyuncular 15 dakika erken gelmeli.",
  },
  {
    id: 2,
    title: "Hazırlık maçı",
    type: "Maç",
    team: "U16 Erkek",
    dayNumber: 8,
    dateLabel: "8 Temmuz",
    time: "20:00",
    location: "Kadıköy Spor Kompleksi",
    note: "Forma ve lisanslar unutulmamalı.",
  },
  {
    id: 3,
    title: "Veli bilgilendirme toplantısı",
    type: "Toplantı",
    team: "Tüm Kulüp",
    dayNumber: 12,
    dateLabel: "12 Temmuz",
    time: "19:00",
    location: "Kulüp Toplantı Salonu",
    note: "Sezon planı ve ödeme süreci konuşulacak.",
  },
];

function getTypeStyles(type: ScheduleType) {
  if (type === "Maç") {
    return {
      backgroundColor: "#fee2e2",
      borderColor: "#ef4444",
      textColor: "#991b1b",
    };
  }

  if (type === "Toplantı") {
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

function getDateLabel(dayNumber: number) {
  return `${dayNumber} Temmuz`;
}

export default function ScheduleScreen() {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>(initialScheduleItems);
  const [showEventForm, setShowEventForm] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedType, setSelectedType] = useState<ScheduleType>("Antrenman");
  const [selectedTeam, setSelectedTeam] = useState<TeamOption>("Tüm Kulüp");
  const [dayNumber, setDayNumber] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [statusMessage, setStatusMessage] = useState(
    "Takvimde etkinlikleri renklerine göre takip edebilirsin."
  );

  const canCreate =
    title.trim().length > 0 &&
    dayNumber.trim().length > 0 &&
    time.trim().length > 0 &&
    location.trim().length > 0;

  const eventsByDay = useMemo(() => {
    return scheduleItems.reduce<Record<number, ScheduleItem[]>>((groups, item) => {
      const currentEvents = groups[item.dayNumber] ?? [];
      return {
        ...groups,
        [item.dayNumber]: [...currentEvents, item],
      };
    }, {});
  }, [scheduleItems]);

  function clearForm() {
    setTitle("");
    setSelectedType("Antrenman");
    setSelectedTeam("Tüm Kulüp");
    setDayNumber("");
    setTime("");
    setLocation("");
    setNote("");
  }

  function handleCreateScheduleItem() {
    const parsedDayNumber = Number(dayNumber.trim());

    if (!canCreate) {
      setStatusMessage("Başlık, gün, saat ve konum boş bırakılamaz.");
      return;
    }

    if (!Number.isInteger(parsedDayNumber) || parsedDayNumber < 1 || parsedDayNumber > 31) {
      setStatusMessage("Lütfen 1 ile 31 arasında geçerli bir gün giriniz.");
      return;
    }

    const newScheduleItem: ScheduleItem = {
      id: Date.now(),
      title: title.trim(),
      type: selectedType,
      team: selectedTeam,
      dayNumber: parsedDayNumber,
      dateLabel: getDateLabel(parsedDayNumber),
      time: time.trim(),
      location: location.trim(),
      note: note.trim() || "Ek not yok.",
    };

    setScheduleItems((currentItems) => [newScheduleItem, ...currentItems]);
    clearForm();
    setShowEventForm(false);
    setStatusMessage("Yeni etkinlik takvime eklendi.");
  }

  function deleteScheduleItem(itemId: number) {
    setScheduleItems((currentItems) =>
      currentItems.filter((item) => item.id !== itemId)
    );
    setStatusMessage("Etkinlik silindi.");
  }

  function resetScheduleItems() {
    setScheduleItems(initialScheduleItems);
    clearForm();
    setShowEventForm(false);
    setStatusMessage("Program demo haline sıfırlandı.");
  }

  function openEventForm() {
    setShowEventForm(true);
    setStatusMessage("Etkinlik bilgilerini doldurup takvime ekleyebilirsin.");
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
            Antrenman, maç ve toplantıları takvim görünümünde yönet.
          </Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Takvim yönetimi</Text>
          <Text style={styles.heroTitle}>Haftalık / aylık program görünümü</Text>
          <Text style={styles.heroSubtitle}>
            Etkinlikler takvimde türüne göre farklı renklerle görünür. Form sadece “Etkinlik ekle” butonuna basınca açılır.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Takvim</Text>
              <Text style={styles.sectionSubtitle}>
                Maç, antrenman ve toplantıları Canvas tarzı renkli kartlar gibi takip et.
              </Text>
            </View>

            <Text style={styles.statusPill}>{scheduleItems.length} etkinlik</Text>
          </View>

          <View style={styles.legendRow}>
            {scheduleTypes.map((type) => {
              const typeStyles = getTypeStyles(type);

              return (
                <View key={type} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: typeStyles.borderColor },
                    ]}
                  />
                  <Text style={styles.legendText}>{type}</Text>
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
                            {event.time} {event.title}
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
              title="Programı sıfırla"
              variant="ghost"
              onPress={resetScheduleItems}
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
                  Etkinlik bilgilerini doldurunca takvimde renkli şekilde görünecek.
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
              {scheduleTypes.map((type) => {
                const isSelected = selectedType === type;
                const typeStyles = getTypeStyles(type);

                return (
                  <Pressable
                    key={type}
                    onPress={() => setSelectedType(type)}
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
                      {type}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Takım</Text>
            <View style={styles.optionGrid}>
              {teamOptions.map((team) => {
                const isSelected = selectedTeam === team;

                return (
                  <Pressable
                    key={team}
                    onPress={() => setSelectedTeam(team)}
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
                      {team}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.formGrid}>
              <View style={styles.formField}>
                <Text style={styles.label}>Takvim günü</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Örn: 12"
                  placeholderTextColor={theme.colors.text.muted}
                  value={dayNumber}
                  onChangeText={setDayNumber}
                  keyboardType="number-pad"
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
              placeholder="Örn: Kulüp spor salonu"
              placeholderTextColor={theme.colors.text.muted}
              value={location}
              onChangeText={setLocation}
            />

            <Text style={styles.label}>Not</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ek bilgi yaz..."
              placeholderTextColor={theme.colors.text.muted}
              value={note}
              onChangeText={setNote}
              multiline
            />

            <View style={styles.actionRow}>
              <AppButton
                title="Etkinliği takvime ekle"
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
          <Text style={styles.sectionTitle}>Yaklaşan etkinlikler</Text>
          <Text style={styles.sectionSubtitle}>
            Takvimde görünen etkinliklerin detay listesi.
          </Text>

          <View style={styles.scheduleList}>
            {scheduleItems.length > 0 ? (
              scheduleItems.map((item) => {
                const typeStyles = getTypeStyles(item.type);

                return (
                  <View key={item.id} style={styles.scheduleCard}>
                    <View style={styles.cardTopRow}>
                      <Text
                        style={[
                          styles.scheduleType,
                          {
                            backgroundColor: typeStyles.backgroundColor,
                            color: typeStyles.textColor,
                            borderColor: typeStyles.borderColor,
                          },
                        ]}
                      >
                        {item.type}
                      </Text>
                      <Text style={styles.scheduleTeam}>{item.team}</Text>
                    </View>

                    <Text style={styles.scheduleTitle}>{item.title}</Text>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Tarih</Text>
                      <Text style={styles.detailValue}>{item.dateLabel}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Saat</Text>
                      <Text style={styles.detailValue}>{item.time}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Konum</Text>
                      <Text style={styles.detailValue}>{item.location}</Text>
                    </View>

                    <Text style={styles.noteText}>{item.note}</Text>

                    <Pressable
                      onPress={() => deleteScheduleItem(item.id)}
                      style={({ pressed }) => [styles.deleteButton, pressed ? styles.pressed : null]}
                    >
                      <Text style={styles.deleteButtonText}>Sil</Text>
                    </Pressable>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Henüz etkinlik yok</Text>
                <Text style={styles.emptyText}>
                  Etkinlik ekle butonuna basarak ilk programı oluşturabilirsin.
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: theme.colors.background.app,
  },
  screen: {
    flexGrow: 1,
    backgroundColor: theme.colors.background.app,
    paddingHorizontal: theme.spacing["2xl"],
    paddingBottom: theme.spacing["2xl"],
  },
  container: {
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
  },
  pageHeader: {
    marginBottom: theme.spacing["2xl"],
  },
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
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.md,
  },
  sectionSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
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
    marginBottom: theme.spacing.lg,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },
  legendText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
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
    width: "14.2857%",
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background.surface,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border.default,
  },
  weekDayText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  dayCell: {
    width: "14.2857%",
    minHeight: 118,
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
    marginBottom: theme.spacing.sm,
  },
  dayEventList: {
    gap: theme.spacing.xs,
  },
  calendarEventPill: {
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingVertical: 3,
    paddingHorizontal: theme.spacing.xs,
  },
  calendarEventText: {
    fontSize: 10,
    fontWeight: theme.fontWeights.black,
  },
  moreEventsText: {
    color: theme.colors.text.muted,
    fontSize: 10,
    fontWeight: theme.fontWeights.black,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  actionButton: {
    flexGrow: 1,
  },
  statusText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.lg,
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
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.lg,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  optionButton: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
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
  optionButtonTextSelected: {
    color: theme.colors.text.inverse,
  },
  formGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.lg,
  },
  formField: {
    flexGrow: 1,
    flexBasis: 220,
  },
  scheduleList: {
    gap: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  scheduleCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.xl,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  scheduleType: {
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: theme.radius.full,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  scheduleTeam: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  scheduleTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.lg,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.default,
  },
  detailLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  detailValue: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    textAlign: "right",
    flex: 1,
  },
  noteText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.md,
    marginTop: theme.spacing.lg,
  },
  deleteButton: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  deleteButtonText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  emptyCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
});