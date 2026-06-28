import { useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppButton } from "@/components/AppButton";
import { theme } from "@/constants/theme";

type ReplayType = "Maç kaydı" | "Antrenman kaydı" | "Drill";
type ReplayFilter = "Tümü" | ReplayType;
type ReplayView = "coachAdmin" | "athleteParent";
type TeamAudience = "Tüm Kulüp" | "A Takım" | "U17 Erkek" | "U16 Erkek" | "U14 Kız";

type ReplayItem = {
  id: number;
  title: string;
  description: string;
  type: ReplayType;
  audience: TeamAudience;
  videoUrl: string;
  addedBy: string;
  createdAt: string;
};

const replayTypes: ReplayType[] = ["Maç kaydı", "Antrenman kaydı", "Drill"];
const filterOptions: ReplayFilter[] = ["Tümü", "Maç kaydı", "Antrenman kaydı", "Drill"];
const teamAudienceOptions: TeamAudience[] = ["Tüm Kulüp", "A Takım", "U17 Erkek", "U16 Erkek", "U14 Kız"];
const viewerTeamOptions: TeamAudience[] = ["A Takım", "U17 Erkek", "U16 Erkek", "U14 Kız"];

const initialReplays: ReplayItem[] = [
  {
    id: 1,
    title: "U17 servis karşılama analizi",
    description: "U17 takımı için maçtan alınan servis karşılama pozisyonları.",
    type: "Maç kaydı",
    audience: "U17 Erkek",
    videoUrl: "https://example.com/u17-match-replay",
    addedBy: "Koç Mehmet",
    createdAt: "Bugün",
  },
  {
    id: 2,
    title: "U17 hücum geçiş drill",
    description: "Savunmadan hücuma geçiş çalışması ve takım koordinasyonu.",
    type: "Drill",
    audience: "U17 Erkek",
    videoUrl: "https://example.com/u17-transition-drill",
    addedBy: "Koç Mehmet",
    createdAt: "Dün",
  },
  {
    id: 3,
    title: "Kulüp geneli servis tekniği",
    description: "Tüm sporcular için temel servis mekaniği ve tekrar çalışması.",
    type: "Antrenman kaydı",
    audience: "Tüm Kulüp",
    videoUrl: "https://example.com/club-serve-practice",
    addedBy: "Admin",
    createdAt: "Bu hafta",
  },
];

export default function ReplaysScreen() {
  const [replays, setReplays] = useState<ReplayItem[]>(initialReplays);
  const [activeView, setActiveView] = useState<ReplayView>("coachAdmin");
  const [activeFilter, setActiveFilter] = useState<ReplayFilter>("Tümü");
  const [viewerTeam, setViewerTeam] = useState<TeamAudience>("U17 Erkek");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [selectedType, setSelectedType] = useState<ReplayType>("Maç kaydı");
  const [selectedAudience, setSelectedAudience] = useState<TeamAudience>("U17 Erkek");
  const [statusMessage, setStatusMessage] = useState(
    "Replay ve drill kayıtları şimdilik bu oturum içinde tutuluyor."
  );

  const roleVisibleReplays =
    activeView === "coachAdmin"
      ? replays
      : replays.filter(
          (replay) => replay.audience === "Tüm Kulüp" || replay.audience === viewerTeam
        );

  const visibleReplays =
    activeFilter === "Tümü"
      ? roleVisibleReplays
      : roleVisibleReplays.filter((replay) => replay.type === activeFilter);

  const canAddReplay =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    videoUrl.trim().length > 0;

  function handleAddReplay() {
    if (!canAddReplay) {
      setStatusMessage("Lütfen başlık, açıklama ve video linki alanlarını doldur.");
      return;
    }

    const newReplay: ReplayItem = {
      id: Date.now(),
      title: title.trim(),
      description: description.trim(),
      type: selectedType,
      audience: selectedAudience,
      videoUrl: videoUrl.trim(),
      addedBy: "Koç / Admin",
      createdAt: "Şimdi",
    };

    setReplays((currentReplays) => [newReplay, ...currentReplays]);
    setTitle("");
    setDescription("");
    setVideoUrl("");
    setSelectedType("Maç kaydı");
    setSelectedAudience("U17 Erkek");
    setActiveFilter("Tümü");
    setStatusMessage("Yeni video kaydı eklendi.");
  }

  async function handleOpenVideo(url: string) {
    const canOpen = await Linking.canOpenURL(url);

    if (canOpen) {
      await Linking.openURL(url);
      return;
    }

    setStatusMessage("Bu video linki açılamıyor.");
  }

  function resetReplays() {
    setReplays(initialReplays);
    setTitle("");
    setDescription("");
    setVideoUrl("");
    setSelectedType("Maç kaydı");
    setSelectedAudience("U17 Erkek");
    setActiveFilter("Tümü");
    setStatusMessage("Replay kütüphanesi demo haline sıfırlandı.");
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.pageHeader}>
          <Text style={styles.logo}>TeamSync</Text>
          <Text style={styles.pageTitle}>Replays</Text>
          <Text style={styles.pageSubtitle}>
            Maç kayıtları, antrenman videoları ve drill içeriklerini takım bazlı yönet.
          </Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Video kütüphanesi</Text>
          <Text style={styles.heroTitle}>Takım bazlı replay sistemi</Text>
          <Text style={styles.heroSubtitle}>
            Koç videoyu seçili takıma ekler. Sporcu ve veli sadece kendi takımına açık içerikleri görür.
          </Text>
        </View>

        <View style={styles.viewSwitcher}>
          <Pressable
            onPress={() => setActiveView("coachAdmin")}
            style={({ pressed }) => [
              styles.viewButton,
              activeView === "coachAdmin" ? styles.viewButtonActive : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={[styles.viewButtonText, activeView === "coachAdmin" ? styles.viewButtonTextActive : null]}>
              Koç / Admin
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveView("athleteParent")}
            style={({ pressed }) => [
              styles.viewButton,
              activeView === "athleteParent" ? styles.viewButtonActive : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={[styles.viewButtonText, activeView === "athleteParent" ? styles.viewButtonTextActive : null]}>
              Sporcu / Veli
            </Text>
          </Pressable>
        </View>

        {activeView === "coachAdmin" ? (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Video ekle</Text>
                <Text style={styles.sectionSubtitle}>
                  Video linkini, hedef takımı ve içerik tipini seç.
                </Text>
              </View>
              <Text style={styles.statusPill}>{replays.length} video</Text>
            </View>

            <Text style={styles.label}>Başlık</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Örn: U17 maç analizi"
              placeholderTextColor={theme.colors.text.muted}
              style={styles.input}
            />

            <Text style={styles.label}>Açıklama</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Video hakkında kısa açıklama yaz..."
              placeholderTextColor={theme.colors.text.muted}
              multiline
              style={[styles.input, styles.textArea]}
            />

            <Text style={styles.label}>Video linki</Text>
            <TextInput
              value={videoUrl}
              onChangeText={setVideoUrl}
              placeholder="https://..."
              placeholderTextColor={theme.colors.text.muted}
              autoCapitalize="none"
              style={styles.input}
            />

            <Text style={styles.label}>İçerik tipi</Text>
            <View style={styles.optionGrid}>
              {replayTypes.map((type) => {
                const isSelected = selectedType === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => setSelectedType(type)}
                    style={({ pressed }) => [styles.optionButton, isSelected ? styles.optionButtonSelected : null, pressed ? styles.pressed : null]}
                  >
                    <Text style={[styles.optionButtonText, isSelected ? styles.optionButtonTextSelected : null]}>{type}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Kim görecek?</Text>
            <View style={styles.optionGrid}>
              {teamAudienceOptions.map((audience) => {
                const isSelected = selectedAudience === audience;
                return (
                  <Pressable
                    key={audience}
                    onPress={() => setSelectedAudience(audience)}
                    style={({ pressed }) => [styles.optionButton, isSelected ? styles.optionButtonSelected : null, pressed ? styles.pressed : null]}
                  >
                    <Text style={[styles.optionButtonText, isSelected ? styles.optionButtonTextSelected : null]}>{audience}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.actionRow}>
              <AppButton title="Video ekle" onPress={handleAddReplay} disabled={!canAddReplay} style={styles.actionButton} />
              <AppButton title="Sıfırla" variant="ghost" onPress={resetReplays} style={styles.actionButton} />
            </View>

            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>İzleyici takımı</Text>
            <Text style={styles.sectionSubtitle}>
              Demo için kullanıcının takımını buradan değiştiriyoruz.
            </Text>
            <View style={styles.optionGrid}>
              {viewerTeamOptions.map((team) => {
                const isSelected = viewerTeam === team;
                return (
                  <Pressable
                    key={team}
                    onPress={() => setViewerTeam(team)}
                    style={({ pressed }) => [styles.optionButton, isSelected ? styles.optionButtonSelected : null, pressed ? styles.pressed : null]}
                  >
                    <Text style={[styles.optionButtonText, isSelected ? styles.optionButtonTextSelected : null]}>{team}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Video listesi</Text>
              <Text style={styles.sectionSubtitle}>
                Filtre seçerek maç, antrenman veya drill içeriklerini ayır.
              </Text>
            </View>
            <Text style={styles.statusPill}>{visibleReplays.length} görünür</Text>
          </View>

          <View style={styles.optionGrid}>
            {filterOptions.map((filter) => {
              const isSelected = activeFilter === filter;
              return (
                <Pressable
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  style={({ pressed }) => [styles.optionButton, isSelected ? styles.optionButtonSelected : null, pressed ? styles.pressed : null]}
                >
                  <Text style={[styles.optionButtonText, isSelected ? styles.optionButtonTextSelected : null]}>{filter}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.replayList}>
            {visibleReplays.map((replay) => (
              <View key={replay.id} style={styles.replayCard}>
                <View style={styles.replayTopRow}>
                  <View style={styles.replayInfo}>
                    <Text style={styles.replayType}>{replay.type}</Text>
                    <Text style={styles.replayTitle}>{replay.title}</Text>
                    <Text style={styles.replayMeta}>
                      {replay.audience} · {replay.addedBy} · {replay.createdAt}
                    </Text>
                  </View>
                </View>

                <Text style={styles.replayDescription}>{replay.description}</Text>

                <AppButton
                  title="Videoyu aç"
                  variant="secondary"
                  onPress={() => handleOpenVideo(replay.videoUrl)}
                  style={styles.videoButton}
                />
              </View>
            ))}
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
  container: { width: "100%", maxWidth: 980, alignSelf: "center" },
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
  heroSubtitle: { fontSize: theme.fontSizes.lg, color: theme.colors.text.secondary, lineHeight: theme.lineHeights.xl },
  viewSwitcher: { flexDirection: "row", gap: theme.spacing.md, marginBottom: theme.spacing["2xl"] },
  viewButton: {
    flex: 1,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  viewButtonActive: { backgroundColor: theme.colors.brand.primary, borderColor: theme.colors.brand.primary },
  viewButtonText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.black },
  viewButtonTextActive: { color: theme.colors.text.inverse },
  section: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    padding: theme.spacing["2xl"],
    marginBottom: theme.spacing["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    ...theme.shadows.sm,
  },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: theme.spacing.lg, marginBottom: theme.spacing.xl },
  sectionHeaderText: { flex: 1 },
  sectionTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes["2xl"], fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.xs },
  sectionSubtitle: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, lineHeight: theme.lineHeights.md },
  statusPill: {
    backgroundColor: theme.colors.brand.primarySoft,
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.full,
  },
  label: { color: theme.colors.text.primary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.sm },
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
  textArea: { minHeight: 110, textAlignVertical: "top" },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm, marginBottom: theme.spacing.lg },
  optionButton: { backgroundColor: theme.colors.background.subtle, borderRadius: theme.radius.full, borderWidth: 1, borderColor: theme.colors.border.default, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.lg },
  optionButtonSelected: { backgroundColor: theme.colors.brand.primary, borderColor: theme.colors.brand.primary },
  optionButtonText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.black },
  optionButtonTextSelected: { color: theme.colors.text.inverse },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md, marginTop: theme.spacing.md },
  actionButton: { flexGrow: 1 },
  statusText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold, marginTop: theme.spacing.lg },
  replayList: { gap: theme.spacing.md },
  replayCard: { backgroundColor: theme.colors.background.subtle, borderRadius: theme.radius.xl, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border.default },
  replayTopRow: { flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.lg, marginBottom: theme.spacing.md },
  replayInfo: { flex: 1 },
  replayType: { color: theme.colors.text.brand, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.xs },
  replayTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.xs },
  replayMeta: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold },
  replayDescription: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, lineHeight: theme.lineHeights.md, marginBottom: theme.spacing.lg },
  videoButton: { alignSelf: "flex-start" },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
});
