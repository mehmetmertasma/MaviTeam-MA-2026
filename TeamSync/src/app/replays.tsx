import { Link } from "expo-router";
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

type TeamAudience =
  | "Tüm Kulüp"
  | "A Takım"
  | "U17 Erkek"
  | "U16 Erkek"
  | "U14 Kız";

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

const filterOptions: ReplayFilter[] = [
  "Tümü",
  "Maç kaydı",
  "Antrenman kaydı",
  "Drill",
];

const teamAudienceOptions: TeamAudience[] = [
  "Tüm Kulüp",
  "A Takım",
  "U17 Erkek",
  "U16 Erkek",
  "U14 Kız",
];

const viewerTeamOptions: TeamAudience[] = [
  "A Takım",
  "U17 Erkek",
  "U16 Erkek",
  "U14 Kız",
];

const initialReplays: ReplayItem[] = [
  {
    id: 1,
    title: "U17 servis karşılama analizi",
    description:
      "U17 takımı için maçtan alınan servis karşılama pozisyonları. Sporcular özellikle ilk temas ve diz pozisyonuna dikkat etmeli.",
    type: "Maç kaydı",
    audience: "U17 Erkek",
    videoUrl: "https://example.com/u17-match-replay",
    addedBy: "Koç Mehmet",
    createdAt: "Bugün",
  },
  {
    id: 2,
    title: "U17 hücum geçiş drill",
    description:
      "U17 oyuncuları için savunmadan hücuma geçiş çalışması. Pasör, smaçör ve libero koordinasyonu gösteriliyor.",
    type: "Drill",
    audience: "U17 Erkek",
    videoUrl: "https://example.com/u17-transition-drill",
    addedBy: "Koç Mehmet",
    createdAt: "Dün",
  },
  {
    id: 3,
    title: "A Takım blok zamanlama çalışması",
    description:
      "Orta oyuncular için blok zamanlaması ve ayak çalışması drill videosu.",
    type: "Drill",
    audience: "A Takım",
    videoUrl: "https://example.com/block-drill",
    addedBy: "Koç Can",
    createdAt: "Bu hafta",
  },
  {
    id: 4,
    title: "Kulüp geneli servis tekniği",
    description:
      "Tüm sporcular için temel servis mekaniği ve tekrar çalışması. Bu video bütün kulüp üyelerine görünür.",
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
  const [selectedAudience, setSelectedAudience] =
    useState<TeamAudience>("U17 Erkek");
  const [error, setError] = useState("");

  const roleVisibleReplays =
    activeView === "coachAdmin"
      ? replays
      : replays.filter(
          (replay) =>
            replay.audience === "Tüm Kulüp" || replay.audience === viewerTeam,
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
      setError("Lütfen başlık, açıklama ve video linki alanlarını doldur.");
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

    setReplays([newReplay, ...replays]);

    setTitle("");
    setDescription("");
    setVideoUrl("");
    setSelectedType("Maç kaydı");
    setSelectedAudience("U17 Erkek");
    setActiveFilter("Tümü");
    setError("");
  }

  async function handleOpenVideo(url: string) {
    const canOpen = await Linking.canOpenURL(url);

    if (canOpen) {
      await Linking.openURL(url);
      return;
    }

    setError("Bu video linki açılamıyor.");
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>TeamSync</Text>

          <View>
            <Text style={styles.pageTitle}>Replay & Drill Kütüphanesi</Text>

            <Text style={styles.pageSubtitle}>
              Koçlar ve adminler takım bazlı video ekleyebilir. Sporcular ve
              veliler sadece kendi takımlarına ait videoları izler.
            </Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Takım bazlı video sistemi</Text>

          <Text style={styles.heroTitle}>Maç, antrenman ve drill videoları</Text>

          <Text style={styles.heroSubtitle}>
            Örneğin koç videoyu U17 için eklerse, U17 sporcuları ve U17 velileri
            o videoyu görür. Başka takım oyuncuları görmez.
          </Text>
        </View>

        <View style={styles.viewSwitcher}>
          <Pressable
            onPress={() => setActiveView("coachAdmin")}
            style={[
              styles.viewButton,
              activeView === "coachAdmin" && styles.viewButtonActive,
            ]}
          >
            <Text
              style={[
                styles.viewButtonText,
                activeView === "coachAdmin" && styles.viewButtonTextActive,
              ]}
            >
              Koç / Admin
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveView("athleteParent")}
            style={[
              styles.viewButton,
              activeView === "athleteParent" && styles.viewButtonActive,
            ]}
          >
            <Text
              style={[
                styles.viewButtonText,
                activeView === "athleteParent" && styles.viewButtonTextActive,
              ]}
            >
              Sporcu / Veli
            </Text>
          </Pressable>
        </View>

        {activeView === "athleteParent" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>İzleyici takımı</Text>

            <Text style={styles.sectionSubtitle}>
              Demo için kullanıcının takımını buradan değiştiriyoruz. Gerçek
              giriş sistemi gelince bu bilgi kullanıcının profilinden gelecek.
            </Text>

            <View style={styles.optionGrid}>
              {viewerTeamOptions.map((team) => {
                const isSelected = viewerTeam === team;

                return (
                  <Pressable
                    key={team}
                    onPress={() => setViewerTeam(team)}
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
          </View>
        )}

        {activeView === "coachAdmin" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Yeni video / drill ekle</Text>

            <Text style={styles.sectionSubtitle}>
              Koç veya admin video eklerken hangi takımın göreceğini seçer.
              Mesela U17 seçilirse sadece U17 sporcuları ve velileri görür.
            </Text>

            <Text style={styles.label}>Başlık</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: U17 maç analizi"
              placeholderTextColor={theme.colors.text.muted}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Açıklama</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Videoda neye dikkat edilmeli?"
              placeholderTextColor={theme.colors.text.muted}
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <Text style={styles.label}>Video linki</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: https://..."
              placeholderTextColor={theme.colors.text.muted}
              value={videoUrl}
              onChangeText={setVideoUrl}
              autoCapitalize="none"
            />

            <Text style={styles.label}>Video türü</Text>
            <View style={styles.optionGrid}>
              {replayTypes.map((type) => {
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

            <Text style={styles.label}>Hangi takım görebilecek?</Text>
            <View style={styles.optionGrid}>
              {teamAudienceOptions.map((audience) => {
                const isSelected = selectedAudience === audience;

                return (
                  <Pressable
                    key={audience}
                    onPress={() => setSelectedAudience(audience)}
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
                      {audience}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {error !== "" && <Text style={styles.errorText}>{error}</Text>}

            <Pressable
              disabled={!canAddReplay}
              onPress={handleAddReplay}
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.addButtonPressed,
                !canAddReplay && styles.addButtonDisabled,
              ]}
            >
              <Text style={styles.addButtonText}>Videoyu ekle</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.listHeader}>
            <View style={styles.listHeaderText}>
              <Text style={styles.sectionTitle}>Video kütüphanesi</Text>

              <Text style={styles.sectionSubtitle}>
                {activeView === "coachAdmin"
                  ? "Koç ve admin tüm video listesini görür."
                  : `${viewerTeam} kullanıcısı sadece kendi takımına ve tüm kulübe açık videoları görür.`}
              </Text>
            </View>

            <Text style={styles.countText}>{visibleReplays.length} video</Text>
          </View>

          <View style={styles.filterGrid}>
            {filterOptions.map((filter) => {
              const isSelected = activeFilter === filter;

              return (
                <Pressable
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  style={({ pressed }) => [
                    styles.filterButton,
                    isSelected && styles.filterButtonSelected,
                    pressed && styles.filterButtonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      isSelected && styles.filterButtonTextSelected,
                    ]}
                  >
                    {filter}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.replayList}>
            {visibleReplays.map((replay) => (
              <View key={replay.id} style={styles.replayCard}>
                <View style={styles.cardTopRow}>
                  <View style={styles.cardTitleGroup}>
                    <Text style={styles.replayTitle}>{replay.title}</Text>

                    <Text style={styles.replayMeta}>
                      {replay.type} · {replay.audience}
                    </Text>
                  </View>

                  <Text style={styles.createdAt}>{replay.createdAt}</Text>
                </View>

                <Text style={styles.replayDescription}>
                  {replay.description}
                </Text>

                <View style={styles.infoRow}>
                  <Text style={styles.addedBy}>Ekleyen: {replay.addedBy}</Text>
                  <Text style={styles.targetText}>{replay.audience}</Text>
                </View>

                <Pressable
                  onPress={() => handleOpenVideo(replay.videoUrl)}
                  style={({ pressed }) => [
                    styles.watchButton,
                    pressed && styles.watchButtonPressed,
                  ]}
                >
                  <Text style={styles.watchButtonText}>Videoyu izle</Text>
                </Pressable>
              </View>
            ))}
          </View>

          {visibleReplays.length === 0 && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>Bu takım için video yok</Text>
              <Text style={styles.emptyText}>
                Koç veya admin bu takıma video eklediğinde burada görünecek.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Gerçek sistemde nasıl olacak?</Text>

          <Text style={styles.noteText}>
            Firebase eklendiğinde her video kaydında clubId, teamId, videoUrl ve
            uploadedBy bilgisi olacak. Kullanıcı giriş yapınca kendi teamId
            bilgisine göre sadece izinli videoları görecek.
          </Text>
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
  viewSwitcher: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginBottom: theme.spacing["2xl"],
  },
  viewButton: {
    flex: 1,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
  },
  viewButtonActive: {
    backgroundColor: theme.colors.brand.primary,
    borderColor: theme.colors.brand.primary,
  },
  viewButtonText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.secondary,
  },
  viewButtonTextActive: {
    color: theme.colors.text.inverse,
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
    marginBottom: theme.spacing.sm,
  },
  sectionSubtitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.md,
    marginBottom: theme.spacing.lg,
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
    minHeight: 110,
    textAlignVertical: "top",
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
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
  errorText: {
    color: theme.colors.text.danger,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.md,
    lineHeight: theme.lineHeights.md,
  },
  addButton: {
    backgroundColor: theme.colors.brand.primary,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
    marginTop: theme.spacing.lg,
  },
  addButtonPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  addButtonDisabled: {
    opacity: 0.48,
  },
  addButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  listHeaderText: {
    flex: 1,
  },
  countText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
  },
  filterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  filterButton: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  filterButtonSelected: {
    backgroundColor: theme.colors.brand.primary,
    borderColor: theme.colors.brand.primary,
  },
  filterButtonPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  filterButtonText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.secondary,
  },
  filterButtonTextSelected: {
    color: theme.colors.text.inverse,
  },
  replayList: {
    gap: theme.spacing.md,
  },
  replayCard: {
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
    marginBottom: theme.spacing.md,
  },
  cardTitleGroup: {
    flex: 1,
  },
  replayTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  replayMeta: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.brand,
  },
  createdAt: {
    color: theme.colors.text.muted,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.extrabold,
  },
  replayDescription: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.md,
    marginBottom: theme.spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  addedBy: {
    flex: 1,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.secondary,
  },
  targetText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.brand,
  },
  watchButton: {
    backgroundColor: theme.colors.brand.primarySoft,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  watchButtonPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  watchButtonText: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
  },
  emptyBox: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  emptyTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.md,
  },
  noteCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    padding: theme.spacing["2xl"],
    marginBottom: theme.spacing["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  noteTitle: {
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  noteText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.md,
  },
  backButton: {
    marginBottom: theme.spacing["2xl"],
  },
});