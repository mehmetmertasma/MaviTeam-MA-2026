import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { theme } from "@/constants/theme";
import { teamSyncService } from "@/services/teamSyncService";
import type { Replay, ReplayType, TeamSyncAppData, UserProfile } from "@/types/teamSync";

type ReplayFilter = "all" | ReplayType;
type ReplayView = "coachAdmin" | "athleteParent";

type TargetOption = {
  id: string;
  label: string;
  teamId?: string;
};

const EMPTY_REPLAYS: Replay[] = [];
const EMPTY_USERS: UserProfile[] = [];

const replayTypes: { label: string; type: ReplayType }[] = [
  { label: "Maç kaydı", type: "match" },
  { label: "Antrenman kaydı", type: "practice" },
  { label: "Drill", type: "drill" },
];

const filterOptions: { label: string; filter: ReplayFilter }[] = [
  { label: "Tümü", filter: "all" },
  { label: "Maç kaydı", filter: "match" },
  { label: "Antrenman kaydı", filter: "practice" },
  { label: "Drill", filter: "drill" },
];

function getReplayTypeLabel(type: ReplayType) {
  return replayTypes.find((option) => option.type === type)?.label ?? "Video";
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Tarih yok";
  }

  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getUserName(userId: string, users: UserProfile[]) {
  return users.find((user) => user.id === userId)?.fullName ?? "Kullanıcı bulunamadı";
}

function getReplayAudienceLabel(replay: Replay, appData: TeamSyncAppData) {
  if (replay.teamId === undefined) {
    return "Tüm Kulüp";
  }

  return appData.teams.find((team) => team.id === replay.teamId)?.name ?? "Takım bulunamadı";
}

export default function ReplaysScreen() {
  const [appData, setAppData] = useState<TeamSyncAppData | null>(null);
  const [activeView, setActiveView] = useState<ReplayView>("coachAdmin");
  const [activeFilter, setActiveFilter] = useState<ReplayFilter>("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [selectedType, setSelectedType] = useState<ReplayType>("match");
  const [selectedTargetId, setSelectedTargetId] = useState("all-club");
  const [statusMessage, setStatusMessage] = useState("Video kayıtları merkezi TeamSync datasından yüklenecek.");

  const loadReplayData = useCallback(async () => {
    try {
      const loadedAppData = await teamSyncService.getAppData();
      setAppData(loadedAppData);
      setStatusMessage("Video kayıtları merkezi TeamSync datasından yüklendi.");
    } catch {
      setStatusMessage("Video kayıtları yüklenirken bir sorun oluştu.");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReplayData();
    }, [loadReplayData])
  );

  const replays = appData?.replays ?? EMPTY_REPLAYS;
  const users = appData?.users ?? EMPTY_USERS;

  const targetOptions = useMemo<TargetOption[]>(() => {
    const allClubOption: TargetOption = { id: "all-club", label: "Tüm Kulüp" };

    if (appData === null) {
      return [allClubOption];
    }

    return [
      allClubOption,
      ...appData.teams.map((team) => ({ id: team.id, label: team.name, teamId: team.id })),
    ];
  }, [appData]);

  const visibleReplays = useMemo(() => {
    if (appData === null) {
      return EMPTY_REPLAYS;
    }

    const roleVisibleReplays = activeView === "coachAdmin"
      ? replays
      : replays.filter((replay) => replay.visibleUserIds.includes(appData.currentUser.id));

    return activeFilter === "all"
      ? roleVisibleReplays
      : roleVisibleReplays.filter((replay) => replay.type === activeFilter);
  }, [activeFilter, activeView, appData, replays]);

  const canAddReplay = title.trim().length > 0 && description.trim().length > 0 && videoUrl.trim().length > 0;

  function clearForm() {
    setTitle("");
    setDescription("");
    setVideoUrl("");
    setSelectedType("match");
    setSelectedTargetId("all-club");
  }

  async function handleAddReplay() {
    if (appData === null) {
      setStatusMessage("Önce merkezi data yüklenmeli.");
      return;
    }

    if (!canAddReplay) {
      setStatusMessage("Lütfen başlık, açıklama ve video linki alanlarını doldur.");
      return;
    }

    const selectedTarget = targetOptions.find((target) => target.id === selectedTargetId) ?? targetOptions[0];
    const activeUsers = appData.users.filter((user) => user.status !== "removed");
    const targetUsers = selectedTarget.teamId === undefined
      ? activeUsers
      : activeUsers.filter((user) => user.teamIds.includes(selectedTarget.teamId ?? ""));
    const visibleUserIds = Array.from(new Set([appData.currentUser.id, ...targetUsers.map((user) => user.id)]));

    try {
      const nextAppData = await teamSyncService.createReplay({
        clubId: appData.club.id,
        teamId: selectedTarget.teamId,
        title: title.trim(),
        description: description.trim(),
        type: selectedType,
        videoUrl: videoUrl.trim(),
        visibleUserIds,
        createdByUserId: appData.currentUser.id,
      });

      setAppData(nextAppData);
      clearForm();
      setShowCreateForm(false);
      setActiveFilter("all");
      setStatusMessage("Yeni video kaydı merkezi dataya eklendi.");
    } catch {
      setStatusMessage("Video kaydı eklenirken bir sorun oluştu.");
    }
  }

  async function handleRemoveReplay(replayId: string) {
    try {
      const nextAppData = await teamSyncService.removeReplay(replayId);
      setAppData(nextAppData);
      setStatusMessage("Video kaydı kaldırıldı.");
    } catch {
      setStatusMessage("Video kaydı kaldırılırken bir sorun oluştu.");
    }
  }

  async function handleOpenVideo(url: string) {
    const canOpen = await Linking.canOpenURL(url);

    if (canOpen) {
      await Linking.openURL(url);
      return;
    }

    setStatusMessage("Bu video linki açılamıyor.");
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
            Koç veya admin video linkini seçili takıma ekler. Sporcu ve veli sadece erişimi olan içerikleri görür.
          </Text>
        </View>

        <View style={styles.viewSwitcher}>
          <Pressable
            onPress={() => setActiveView("coachAdmin")}
            style={({ pressed }) => [styles.viewButton, activeView === "coachAdmin" ? styles.viewButtonActive : null, pressed ? styles.pressed : null]}
          >
            <Text style={[styles.viewButtonText, activeView === "coachAdmin" ? styles.viewButtonTextActive : null]}>Koç / Admin</Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveView("athleteParent")}
            style={({ pressed }) => [styles.viewButton, activeView === "athleteParent" ? styles.viewButtonActive : null, pressed ? styles.pressed : null]}
          >
            <Text style={[styles.viewButtonText, activeView === "athleteParent" ? styles.viewButtonTextActive : null]}>Sporcu / Veli</Text>
          </Pressable>
        </View>

        {activeView === "coachAdmin" ? (
          <View style={styles.topActions}>
            <AppButton
              title={showCreateForm ? "Form açık" : "Video ekle"}
              onPress={() => {
                setShowCreateForm(true);
                setStatusMessage("Yeni video kaydı bilgilerini doldurabilirsin.");
              }}
              disabled={showCreateForm}
              style={styles.actionButton}
            />
            <AppButton title="Merkezi datayı yenile" variant="ghost" onPress={loadReplayData} style={styles.actionButton} />
          </View>
        ) : null}

        {showCreateForm && activeView === "coachAdmin" ? (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Video ekle</Text>
                <Text style={styles.sectionSubtitle}>Video linkini, hedef takımı ve içerik tipini seç.</Text>
              </View>
              <Text style={styles.statusPill}>Yeni</Text>
            </View>

            <Text style={styles.label}>Başlık</Text>
            <TextInput value={title} onChangeText={setTitle} placeholder="Örn: Maç analizi" placeholderTextColor={theme.colors.text.muted} style={styles.input} />

            <Text style={styles.label}>Açıklama</Text>
            <TextInput value={description} onChangeText={setDescription} placeholder="Video hakkında kısa açıklama yaz..." placeholderTextColor={theme.colors.text.muted} multiline style={[styles.input, styles.textArea]} />

            <Text style={styles.label}>Video linki</Text>
            <TextInput value={videoUrl} onChangeText={setVideoUrl} placeholder="https://..." placeholderTextColor={theme.colors.text.muted} autoCapitalize="none" style={styles.input} />

            <Text style={styles.label}>İçerik tipi</Text>
            <View style={styles.optionGrid}>
              {replayTypes.map((option) => {
                const isSelected = selectedType === option.type;
                return (
                  <Pressable key={option.type} onPress={() => setSelectedType(option.type)} style={({ pressed }) => [styles.optionButton, isSelected ? styles.optionButtonSelected : null, pressed ? styles.pressed : null]}>
                    <Text style={[styles.optionButtonText, isSelected ? styles.optionButtonTextSelected : null]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Kim görecek?</Text>
            <View style={styles.optionGrid}>
              {targetOptions.map((target) => {
                const isSelected = selectedTargetId === target.id;
                return (
                  <Pressable key={target.id} onPress={() => setSelectedTargetId(target.id)} style={({ pressed }) => [styles.optionButton, isSelected ? styles.optionButtonSelected : null, pressed ? styles.pressed : null]}>
                    <Text style={[styles.optionButtonText, isSelected ? styles.optionButtonTextSelected : null]}>{target.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.actionRow}>
              <AppButton title="Video kaydet" onPress={handleAddReplay} disabled={!canAddReplay} style={styles.actionButton} />
              <AppButton title="Vazgeç" variant="ghost" onPress={() => { clearForm(); setShowCreateForm(false); setStatusMessage("Video ekleme iptal edildi."); }} style={styles.actionButton} />
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Video listesi</Text>
              <Text style={styles.sectionSubtitle}>{statusMessage}</Text>
            </View>
            <Text style={styles.statusPill}>{visibleReplays.length} görünür</Text>
          </View>

          <View style={styles.optionGrid}>
            {filterOptions.map((option) => {
              const isSelected = activeFilter === option.filter;
              return (
                <Pressable key={option.filter} onPress={() => setActiveFilter(option.filter)} style={({ pressed }) => [styles.optionButton, isSelected ? styles.optionButtonSelected : null, pressed ? styles.pressed : null]}>
                  <Text style={[styles.optionButtonText, isSelected ? styles.optionButtonTextSelected : null]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {appData !== null && visibleReplays.length > 0 ? (
            <View style={styles.replayList}>
              {visibleReplays.map((replay) => (
                <View key={replay.id} style={styles.replayCard}>
                  <View style={styles.replayTopRow}>
                    <View style={styles.replayInfo}>
                      <Text style={styles.replayType}>{getReplayTypeLabel(replay.type)}</Text>
                      <Text style={styles.replayTitle}>{replay.title}</Text>
                      <Text style={styles.replayMeta}>
                        {getReplayAudienceLabel(replay, appData)} · {getUserName(replay.createdByUserId, users)} · {formatDate(replay.createdAt)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.replayDescription}>{replay.description}</Text>

                  <View style={styles.cardActions}>
                    <Pressable onPress={() => handleOpenVideo(replay.videoUrl)} style={({ pressed }) => [styles.openButton, pressed ? styles.pressed : null]}>
                      <Text style={styles.openButtonText}>Videoyu aç</Text>
                    </Pressable>

                    {activeView === "coachAdmin" ? (
                      <Pressable onPress={() => handleRemoveReplay(replay.id)} style={({ pressed }) => [styles.deleteButton, pressed ? styles.pressed : null]}>
                        <Text style={styles.deleteButtonText}>Kaldır</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Henüz video kaydı yok</Text>
              <Text style={styles.emptyText}>Video ekle butonuyla ilk replay kaydını merkezi dataya ekleyebilirsin.</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: theme.colors.background.app },
  screen: { flexGrow: 1, backgroundColor: theme.colors.background.app, paddingHorizontal: theme.spacing["2xl"], paddingBottom: theme.spacing["2xl"] },
  container: { width: "100%", maxWidth: 980, alignSelf: "center" },
  pageHeader: { marginBottom: theme.spacing["2xl"] },
  logo: { color: theme.colors.brand.primary, fontSize: theme.fontSizes["2xl"], fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.md },
  pageTitle: { color: theme.colors.text.inverse, fontSize: theme.fontSizes["5xl"], fontWeight: theme.fontWeights.black, lineHeight: theme.lineHeights["5xl"], marginBottom: theme.spacing.sm },
  pageSubtitle: { color: theme.colors.text.inverse, opacity: 0.76, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.semibold, lineHeight: theme.lineHeights.xl },
  heroCard: { backgroundColor: theme.colors.background.surface, borderRadius: theme.radius["2xl"], padding: theme.spacing["3xl"], marginBottom: theme.spacing["2xl"], ...theme.shadows.md },
  heroLabel: { alignSelf: "flex-start", backgroundColor: theme.colors.brand.primarySoft, color: theme.colors.text.brand, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.extrabold, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.lg, borderRadius: theme.radius.full, marginBottom: theme.spacing.lg },
  heroTitle: { fontSize: theme.fontSizes["4xl"], fontWeight: theme.fontWeights.black, color: theme.colors.text.primary, lineHeight: theme.lineHeights["4xl"], marginBottom: theme.spacing.md },
  heroSubtitle: { fontSize: theme.fontSizes.lg, color: theme.colors.text.secondary, lineHeight: theme.lineHeights.xl },
  viewSwitcher: { flexDirection: "row", backgroundColor: theme.colors.background.surface, borderRadius: theme.radius.xl, padding: theme.spacing.sm, marginBottom: theme.spacing["2xl"], ...theme.shadows.sm },
  viewButton: { flex: 1, borderRadius: theme.radius.lg, paddingVertical: theme.spacing.md, alignItems: "center" },
  viewButtonActive: { backgroundColor: theme.colors.brand.primary },
  viewButtonText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.black },
  viewButtonTextActive: { color: theme.colors.text.inverse },
  topActions: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md, marginBottom: theme.spacing["2xl"] },
  actionButton: { flexGrow: 1, minWidth: 170 },
  section: { backgroundColor: theme.colors.background.surface, borderRadius: theme.radius["2xl"], padding: theme.spacing["2xl"], marginBottom: theme.spacing["2xl"], borderWidth: 1, borderColor: theme.colors.border.default, ...theme.shadows.sm },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: theme.spacing.lg, marginBottom: theme.spacing.xl },
  sectionHeaderText: { flex: 1 },
  sectionTitle: { fontSize: theme.fontSizes["2xl"], fontWeight: theme.fontWeights.black, color: theme.colors.text.primary, marginBottom: theme.spacing.xs },
  sectionSubtitle: { fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, color: theme.colors.text.secondary, lineHeight: theme.lineHeights.md },
  statusPill: { backgroundColor: theme.colors.brand.primarySoft, color: theme.colors.text.brand, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.black, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md, borderRadius: theme.radius.full },
  label: { color: theme.colors.text.primary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.sm },
  input: { minHeight: 52, backgroundColor: theme.colors.background.subtle, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border.default, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, color: theme.colors.text.primary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.lg },
  textArea: { minHeight: 110, textAlignVertical: "top" },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm, marginBottom: theme.spacing.xl },
  optionButton: { borderRadius: theme.radius.full, borderWidth: 1, borderColor: theme.colors.border.default, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.lg, backgroundColor: theme.colors.background.subtle },
  optionButtonSelected: { backgroundColor: theme.colors.brand.primary, borderColor: theme.colors.brand.primary },
  optionButtonText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.black },
  optionButtonTextSelected: { color: theme.colors.text.inverse },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md, marginTop: theme.spacing.sm },
  replayList: { gap: theme.spacing.lg },
  replayCard: { backgroundColor: theme.colors.background.subtle, borderRadius: theme.radius.xl, padding: theme.spacing.xl, borderWidth: 1, borderColor: theme.colors.border.default },
  replayTopRow: { flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.lg, marginBottom: theme.spacing.md },
  replayInfo: { flex: 1 },
  replayType: { alignSelf: "flex-start", backgroundColor: theme.colors.brand.primarySoft, color: theme.colors.text.brand, fontSize: theme.fontSizes.xs, fontWeight: theme.fontWeights.black, paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.sm, borderRadius: theme.radius.full, marginBottom: theme.spacing.sm },
  replayTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.xs },
  replayMeta: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold },
  replayDescription: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, lineHeight: theme.lineHeights.md, marginBottom: theme.spacing.lg },
  cardActions: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  openButton: { flexGrow: 1, minWidth: 140, backgroundColor: theme.colors.brand.primary, borderRadius: theme.radius.lg, paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.lg, alignItems: "center" },
  openButtonText: { color: theme.colors.text.inverse, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.black },
  deleteButton: { flexGrow: 1, minWidth: 120, backgroundColor: theme.colors.background.surface, borderRadius: theme.radius.lg, paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.lg, alignItems: "center", borderWidth: 1, borderColor: theme.colors.border.default },
  deleteButtonText: { color: theme.colors.text.brand, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.black },
  emptyCard: { backgroundColor: theme.colors.background.subtle, borderRadius: theme.radius.xl, padding: theme.spacing.xl, borderWidth: 1, borderColor: theme.colors.border.default },
  emptyTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.sm },
  emptyText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, lineHeight: theme.lineHeights.md },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
});
