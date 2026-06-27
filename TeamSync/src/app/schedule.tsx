import { useState } from "react";
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
  date: string;
  time: string;
  location: string;
  note: string;
};

const scheduleTypes: ScheduleType[] = ["Antrenman", "Maç", "Toplantı"];
const teamOptions: TeamOption[] = ["Tüm Kulüp", "A Takım", "U16 Erkek", "U14 Kız"];

const initialScheduleItems: ScheduleItem[] = [
  {
    id: 1,
    title: "A Takım antrenmanı",
    type: "Antrenman",
    team: "A Takım",
    date: "Bugün",
    time: "18:30",
    location: "Burhan Felek Spor Salonu",
    note: "Oyuncular 15 dakika erken gelmeli.",
  },
  {
    id: 2,
    title: "Hazırlık maçı",
    type: "Maç",
    team: "U16 Erkek",
    date: "Yarın",
    time: "20:00",
    location: "Kadıköy Spor Kompleksi",
    note: "Forma ve lisanslar unutulmamalı.",
  },
  {
    id: 3,
    title: "Veli bilgilendirme toplantısı",
    type: "Toplantı",
    team: "Tüm Kulüp",
    date: "Cuma",
    time: "19:00",
    location: "Kulüp Toplantı Salonu",
    note: "Sezon planı ve ödeme süreci konuşulacak.",
  },
];

export default function ScheduleScreen() {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>(initialScheduleItems);
  const [title, setTitle] = useState("");
  const [selectedType, setSelectedType] = useState<ScheduleType>("Antrenman");
  const [selectedTeam, setSelectedTeam] = useState<TeamOption>("Tüm Kulüp");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [statusMessage, setStatusMessage] = useState(
    "Programlar şimdilik bu oturum içinde tutuluyor."
  );

  const canCreate =
    title.trim().length > 0 &&
    date.trim().length > 0 &&
    time.trim().length > 0 &&
    location.trim().length > 0;

  function handleCreateScheduleItem() {
    if (!canCreate) {
      setStatusMessage("Başlık, tarih, saat ve konum boş bırakılamaz.");
      return;
    }

    const newScheduleItem: ScheduleItem = {
      id: Date.now(),
      title: title.trim(),
      type: selectedType,
      team: selectedTeam,
      date: date.trim(),
      time: time.trim(),
      location: location.trim(),
      note: note.trim() || "Ek not yok.",
    };

    setScheduleItems((currentItems) => [newScheduleItem, ...currentItems]);
    setTitle("");
    setSelectedType("Antrenman");
    setSelectedTeam("Tüm Kulüp");
    setDate("");
    setTime("");
    setLocation("");
    setNote("");
    setStatusMessage("Yeni program oluşturuldu.");
  }

  function deleteScheduleItem(itemId: number) {
    setScheduleItems((currentItems) =>
      currentItems.filter((item) => item.id !== itemId)
    );
    setStatusMessage("Program silindi.");
  }

  function resetScheduleItems() {
    setScheduleItems(initialScheduleItems);
    setTitle("");
    setSelectedType("Antrenman");
    setSelectedTeam("Tüm Kulüp");
    setDate("");
    setTime("");
    setLocation("");
    setNote("");
    setStatusMessage("Program demo haline sıfırlandı.");
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.pageHeader}>
          <Text style={styles.logo}>TeamSync</Text>
          <Text style={styles.pageTitle}>Program</Text>
          <Text style={styles.pageSubtitle}>
            Antrenman, maç ve toplantı programlarını tek yerden yönet.
          </Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Takvim yönetimi</Text>
          <Text style={styles.heroTitle}>Yeni program oluştur</Text>
          <Text style={styles.heroSubtitle}>
            Admin veya koç olarak takıma özel etkinlik oluşturabilir, veli ve sporcuların programı görmesini sağlayabilirsin.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Program bilgileri</Text>
              <Text style={styles.sectionSubtitle}>
                Etkinlik türünü, takımı, zamanı ve konumu gir.
              </Text>
            </View>

            <Text style={styles.statusPill}>{scheduleItems.length} etkinlik</Text>
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

              return (
                <Pressable
                  key={type}
                  onPress={() => setSelectedType(type)}
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
              <Text style={styles.label}>Tarih</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: Bugün, Yarın, 12 Temmuz"
                placeholderTextColor={theme.colors.text.muted}
                value={date}
                onChangeText={setDate}
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
              title="Programı oluştur"
              onPress={handleCreateScheduleItem}
              disabled={!canCreate}
              style={styles.actionButton}
            />

            <AppButton
              title="Sıfırla"
              variant="ghost"
              onPress={resetScheduleItems}
              style={styles.actionButton}
            />
          </View>

          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yaklaşan program</Text>

          <View style={styles.scheduleList}>
            {scheduleItems.length > 0 ? (
              scheduleItems.map((item) => (
                <View key={item.id} style={styles.scheduleCard}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.scheduleType}>{item.type}</Text>
                    <Text style={styles.scheduleTeam}>{item.team}</Text>
                  </View>

                  <Text style={styles.scheduleTitle}>{item.title}</Text>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Tarih</Text>
                    <Text style={styles.detailValue}>{item.date}</Text>
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
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Henüz program yok</Text>
                <Text style={styles.emptyText}>
                  İlk etkinliği yukarıdaki formdan oluşturabilirsin.
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
    maxWidth: 980,
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
  label: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
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
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  textArea: {
    minHeight: 112,
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
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
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
  scheduleList: {
    gap: theme.spacing.lg,
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
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  scheduleType: {
    backgroundColor: theme.colors.brand.primarySoft,
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.full,
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
    flex: 1,
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
  },
  detailValue: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    textAlign: "right",
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
    paddingHorizontal: theme.spacing.lg,
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
