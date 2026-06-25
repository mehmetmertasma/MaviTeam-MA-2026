import { Link } from "expo-router";
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
  const [scheduleItems, setScheduleItems] =
    useState<ScheduleItem[]>(initialScheduleItems);

  const [title, setTitle] = useState("");
  const [selectedType, setSelectedType] = useState<ScheduleType>("Antrenman");
  const [selectedTeam, setSelectedTeam] = useState<TeamOption>("Tüm Kulüp");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");

  const canCreate =
    title.trim().length > 0 &&
    date.trim().length > 0 &&
    time.trim().length > 0 &&
    location.trim().length > 0;

  function handleCreateScheduleItem() {
    if (!canCreate) {
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

    setScheduleItems([newScheduleItem, ...scheduleItems]);

    setTitle("");
    setSelectedType("Antrenman");
    setSelectedTeam("Tüm Kulüp");
    setDate("");
    setTime("");
    setLocation("");
    setNote("");
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>TeamSync</Text>

          <View>
            <Text style={styles.pageTitle}>Program</Text>
            <Text style={styles.pageSubtitle}>
              Antrenman, maç ve toplantı programlarını tek yerden yönet.
            </Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Takvim yönetimi</Text>

          <Text style={styles.heroTitle}>Yeni program oluştur</Text>

          <Text style={styles.heroSubtitle}>
            Admin veya koç olarak takıma özel etkinlik oluşturabilir, veli ve
            sporcuların programı görmesini sağlayabilirsin.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Program bilgileri</Text>

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
                    isSelected && styles.optionButtonSelected,
                    pressed && styles.optionButtonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      isSelected && styles.optionButtonTextSelected,
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
                    isSelected && styles.optionButtonSelected,
                    pressed && styles.optionButtonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      isSelected && styles.optionButtonTextSelected,
                    ]}
                  >
                    {team}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Tarih</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: Bugün, Yarın, 12 Temmuz"
            placeholderTextColor={theme.colors.text.muted}
            value={date}
            onChangeText={setDate}
          />

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

          <Pressable
            disabled={!canCreate}
            onPress={handleCreateScheduleItem}
            style={({ pressed }) => [
              styles.createButton,
              pressed && styles.createButtonPressed,
              !canCreate && styles.createButtonDisabled,
            ]}
          >
            <Text style={styles.createButtonText}>Programı oluştur</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Yaklaşan program</Text>
            <Text style={styles.countText}>{scheduleItems.length} etkinlik</Text>
          </View>

          <View style={styles.scheduleList}>
            {scheduleItems.map((item) => (
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
              </View>
            ))}
          </View>
        </View>

        <Link href="/dashboard" asChild>
          <AppButton
            title="Dashboard'a dön"
            variant="ghost"
            accessibilityLabel="Dashboard sayfasına dön"
            style={styles.backButton}
          />
        </Link>
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
    padding: theme.spacing["2xl"],
  },
  container: {
    width: "100%",
    maxWidth: 980,
    alignSelf: "center",
  },
  header: {
    marginTop: theme.spacing["2xl"],
    marginBottom: theme.spacing["2xl"],
    gap: theme.spacing.lg,
  },
  logo: {
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.brand.primary,
  },
  pageTitle: {
    fontSize: theme.fontSizes["5xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.inverse,
    lineHeight: theme.lineHeights["5xl"],
    marginBottom: theme.spacing.sm,
  },
  pageSubtitle: {
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text.inverse,
    opacity: 0.76,
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
  sectionTitle: {
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  input: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.primary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
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
  optionButtonPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  optionButtonText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.secondary,
  },
  optionButtonTextSelected: {
    color: theme.colors.text.inverse,
  },
  createButton: {
    backgroundColor: theme.colors.brand.primary,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
    marginTop: theme.spacing.sm,
  },
  createButtonPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  createButtonDisabled: {
    opacity: 0.48,
  },
  createButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  countText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
  },
  scheduleList: {
    gap: theme.spacing.md,
  },
  scheduleCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  scheduleType: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  scheduleTeam: {
    color: theme.colors.text.muted,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.extrabold,
  },
  scheduleTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
  },
  detailLabel: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.secondary,
  },
  detailValue: {
    flex: 1,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    textAlign: "right",
  },
  noteText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.md,
  },
  backButton: {
    marginBottom: theme.spacing["2xl"],
  },
});