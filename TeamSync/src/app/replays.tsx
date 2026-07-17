import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { theme } from "@/constants/theme";
import { authService } from "@/services/authService";
import { firestoreReplayLinkService } from "@/services/firestoreReplayLinkService";
import { teamSyncService } from "@/services/teamSyncService";
import type { Replay, ReplayType, TeamSyncAppData, UserProfile } from "@/types/teamSync";

type ReplayFilter = "all" | ReplayType;

type TargetOption = {
  id: string;
  label: string;
  teamId?: string;
};

const EMPTY_REPLAYS: Replay[] = [];
const EMPTY_USERS: UserProfile[] = [];

const replayTypes: { label: string; type: ReplayType }[] = [
  { label: "Maç linki", type: "match" },
  { label: "Antrenman linki", type: "practice" },
  { label: "Drill linki", type: "drill" },
];

const filterOptions: { label: string; filter: ReplayFilter }[] = [
  { label: "Tümü", filter: "all" },
  { label: "Maç", filter: "match" },
  { label: "Antrenman", filter: "practice" },
  { label: "Drill", filter: "drill" },
];

function canManageReplayLinks(appData: TeamSyncAppData | null) {
  return appData?.currentUser.role === "superAdmin" || appData?.currentUser.role === "clubAdmin" || appData?.currentUser.role === "coach";
}

function canDeleteReplayLinks(appData: TeamSyncAppData | null) {
  return appData?.currentUser.role === "clubAdmin";
}

function getReplayTypeLabel(type: ReplayType) {
  return replayTypes.find((option) => option.type === type)?.label ?? "Replay linki";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Tarih yok";
  return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
}

function getUserName(userId: string, users: UserProfile[]) {
  return users.find((user) => user.id === userId)?.fullName ?? "Kullanıcı bulunamadı";
}

function getReplayAudienceLabel(replay: Replay, appData: TeamSyncAppData) {
  if (replay.teamId === undefined) return "Tüm Kulüp";
  return appData.teams.find((team) => team.id === replay.teamId)?.name ?? "Takım bulunamadı";
}

function isValidExternalUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function getAllowedTargetOptions(appData: TeamSyncAppData | null): TargetOption[] {
  const allClubOption: TargetOption = { id: "all-club", label: "Tüm Kulüp" };

  if (appData === null) {
    return [allClubOption];
  }

  const teamOptions = appData.teams
    .filter((team) => appData.currentUser.role !== "coach" || appData.currentUser.teamIds.includes(team.id))
    .map((team) => ({ id: team.id, label: team.name, teamId: team.id }));

  if (appData.currentUser.role === "coach") {
    return teamOptions;
  }

  return [allClubOption, ...teamOptions];
}

export default function ReplaysScreen() {
  const [appData, setAppData] = useState<TeamSyncAppData | null>(null);
  const [activeFilter, setActiveFilter] = useState<ReplayFilter>("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [replayUrl, setReplayUrl] = useState("");
  const [selectedType, setSelectedType] = useState<ReplayType>("match");
  const [selectedTargetId, setSelectedTargetId] = useState("all-club");
  const [statusMessage, setStatusMessage] = useState("Replay linkleri MaviTeam datasından yüklenecek.");

  const loadReplayData = useCallback(async () => {
    try {
      const loadedAppData = await teamSyncService.getAppData();
      const firebaseUser = authService.getCurrentUser();

      if (authService.isConfigured() && firebaseUser !== null) {
        const firestoreReplays = await firestoreReplayLinkService.listVisibleReplaysForCurrentUser(firebaseUser);
        setAppData({ ...loadedAppData, replays: firestoreReplays });
      } else {
        setAppData(loadedAppData);
      }

      setStatusMessage("Replay linkleri MaviTeam datasından yüklendi.");
    } catch {
      setStatusMessage("Replay linkleri yüklenirken bir sorun oluştu.");
    }
  }, []);

  useFocusEffect(useCallback(() => { loadReplayData(); }, [loadReplayData]));

  const replays = appData?.replays ?? EMPTY_REPLAYS;
  const users = appData?.users ?? EMPTY_USERS;
  const userCanManageReplayLinks = canManageReplayLinks(appData);
  const userCanDeleteReplayLinks = canDeleteReplayLinks(appData);
  const targetOptions = useMemo(() => getAllowedTargetOptions(appData), [appData]);

  const visibleReplays = useMemo(() => {
    if (appData === null) return EMPTY_REPLAYS;

    const roleVisibleReplays = userCanManageReplayLinks
      ? replays
      : replays.filter((replay) => replay.visibleUserIds.includes(appData.currentUser.id));

    return activeFilter === "all" ? roleVisibleReplays : roleVisibleReplays.filter((replay) => replay.type === activeFilter);
  }, [activeFilter, appData, replays, userCanManageReplayLinks]);

  const canAddReplay = title.trim().length > 0
    && description.trim().length > 0
    && isValidExternalUrl(replayUrl)
    && targetOptions.length > 0;

  function clearForm() {
    setTitle("");
    setDescription("");
    setReplayUrl("");
    setSelectedType("match");
    setSelectedTargetId(targetOptions[0]?.id ?? "all-club");
  }

  async function handleAddReplay() {
    if (appData === null) {
      setStatusMessage("Önce merkezi data yüklenmeli.");
      return;
    }

    if (!canAddReplay) {
      setStatusMessage("Başlık, açıklama ve geçerli http/https replay linki gerekli.");
      return;
    }

    const selectedTarget = targetOptions.find((target) => target.id === selectedTargetId) ?? targetOptions[0];

    if (selectedTarget === undefined) {
      setStatusMessage("Bu rol için replay eklenebilecek takım bulunamadı.");
      return;
    }

    const activeUsers = appData.users.filter((user) => user.status !== "removed");
    const targetUsers = selectedTarget.teamId === undefined
      ? activeUsers
      : activeUsers.filter((user) => user.teamIds.includes(selectedTarget.teamId ?? ""));
    const visibleUserIds = Array.from(new Set([appData.currentUser.id, ...targetUsers.map((user) => user.id)]));

    try {
      const firebaseUser = authService.getCurrentUser();

      if (authService.isConfigured() && firebaseUser !== null) {
        await firestoreReplayLinkService.createReplayLink(firebaseUser, {
          clubId: appData.club.id,
          teamId: selectedTarget.teamId,
          title: title.trim(),
          description: description.trim(),
          type: selectedType,
          videoUrl: replayUrl.trim(),
          visibleUserIds,
          createdByUserId: appData.currentUser.id,
        });
        await loadReplayData();
      } else {
        const nextAppData = await teamSyncService.createReplay({
          clubId: appData.club.id,
          teamId: selectedTarget.teamId,
          title: title.trim(),
          description: description.trim(),
          type: selectedType,
          videoUrl: replayUrl.trim(),
          visibleUserIds,
          createdByUserId: appData.currentUser.id,
        });
        setAppData(nextAppData);
      }

      clearForm();
      setShowCreateForm(false);
      setActiveFilter("all");
      setStatusMessage("Replay linki kaydedildi. Video dosyası MaviTeam içinde tutulmadı.");
    } catch {
      setStatusMessage("Replay linki eklenirken bir sorun oluştu.");
    }
  }

  async function handleRemoveReplay(replayId: string) {
    try {
      const firebaseUser = authService.getCurrentUser();

      if (authService.isConfigured() && firebaseUser !== null) {
        await firestoreReplayLinkService.removeReplay(firebaseUser, replayId);
        await loadReplayData();
      } else {
        const nextAppData = await teamSyncService.removeReplay(replayId);
        setAppData(nextAppData);
      }

      setStatusMessage("Replay linki kaldırıldı.");
    } catch {
      setStatusMessage("Replay linki kaldırılırken bir sorun oluştu.");
    }
  }

  async function handleOpenReplayLink(url: string) {
    if (!isValidExternalUrl(url)) {
      setStatusMessage("Bu replay linki geçerli değil.");
      return;
    }

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return;
    }

    setStatusMessage("Bu replay linki açılamıyor.");
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.pageHeader}>
          <Text style={styles.logo}>MaviTeam</Text>
          <Text style={styles.pageTitle}>Replay Linkleri</Text>
          <Text style={styles.pageSubtitle}>Koçlar video dosyası yüklemez; sadece YouTube, Drive, Hudl veya benzeri link ekler.</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Düşük maliyetli video sistemi</Text>
          <Text style={styles.heroTitle}>Video bizde değil, link bizde</Text>
          <Text style={styles.heroSubtitle}>MaviTeam sadece başlık, açıklama, hedef takım ve URL metadata’sını saklar. Kullanıcı butona basınca dış link açılır.</Text>
        </View>

        {userCanManageReplayLinks ? (
          <View style={styles.topActions}>
            <AppButton title={showCreateForm ? "Form açık" : "Replay linki ekle"} onPress={() => { setShowCreateForm(true); setStatusMessage("Replay linki bilgilerini doldurabilirsin."); }} disabled={showCreateForm} style={styles.actionButton} />
            <AppButton title="Datayı yenile" variant="ghost" onPress={loadReplayData} style={styles.actionButton} />
          </View>
        ) : null}

        {showCreateForm && userCanManageReplayLinks ? (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Replay linki ekle</Text>
                <Text style={styles.sectionSubtitle}>Video dosyası yüklenmez. Sadece dış video linki kaydedilir.</Text>
              </View>
              <Text style={styles.statusPill}>Link</Text>
            </View>

            <Text style={styles.label}>Başlık</Text>
            <TextInput value={title} onChangeText={setTitle} placeholder="Örn: Maç analizi" placeholderTextColor={theme.colors.text.muted} style={styles.input} />

            <Text style={styles.label}>Açıklama</Text>
            <TextInput value={description} onChangeText={setDescription} placeholder="Link hakkında kısa açıklama yaz..." placeholderTextColor={theme.colors.text.muted} multiline style={[styles.input, styles.textArea]} />

            <Text style={styles.label}>Replay URL</Text>
            <TextInput value={replayUrl} onChangeText={setReplayUrl} placeholder="https://youtube.com/... veya https://drive.google.com/..." placeholderTextColor={theme.colors.text.muted} autoCapitalize="none" autoCorrect={false} style={styles.input} />

            <Text style={styles.label}>İçerik tipi</Text>
            <View style={styles.optionGrid}>{replayTypes.map((option) => { const isSelected = selectedType === option.type; return (<Pressable key={option.type} onPress={() => setSelectedType(option.type)} style={({ pressed }) => [styles.optionButton, isSelected ? styles.optionButtonSelected : null, pressed ? styles.pressed : null]}><Text style={[styles.optionButtonText, isSelected ? styles.optionButtonTextSelected : null]}>{option.label}</Text></Pressable>); })}</View>

            <Text style={styles.label}>Kim görecek?</Text>
            <View style={styles.optionGrid}>{targetOptions.map((target) => { const isSelected = selectedTargetId === target.id; return (<Pressable key={target.id} onPress={() => setSelectedTargetId(target.id)} style={({ pressed }) => [styles.optionButton, isSelected ? styles.optionButtonSelected : null, pressed ? styles.pressed : null]}><Text style={[styles.optionButtonText, isSelected ? styles.optionButtonTextSelected : null]}>{target.label}</Text></Pressable>); })}</View>

            <View style={styles.actionRow}>
              <AppButton title="Linki kaydet" onPress={handleAddReplay} disabled={!canAddReplay} style={styles.actionButton} />
              <AppButton title="Vazgeç" variant="ghost" onPress={() => { clearForm(); setShowCreateForm(false); setStatusMessage("Replay linki ekleme iptal edildi."); }} style={styles.actionButton} />
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Replay listesi</Text>
              <Text style={styles.sectionSubtitle}>{statusMessage}</Text>
            </View>
            <Text style={styles.statusPill}>{visibleReplays.length} görünür</Text>
          </View>

          <View style={styles.optionGrid}>{filterOptions.map((option) => { const isSelected = activeFilter === option.filter; return (<Pressable key={option.filter} onPress={() => setActiveFilter(option.filter)} style={({ pressed }) => [styles.optionButton, isSelected ? styles.optionButtonSelected : null, pressed ? styles.pressed : null]}><Text style={[styles.optionButtonText, isSelected ? styles.optionButtonTextSelected : null]}>{option.label}</Text></Pressable>); })}</View>

          {appData !== null && visibleReplays.length > 0 ? (
            <View style={styles.replayList}>{visibleReplays.map((replay) => (<View key={replay.id} style={styles.replayCard}><View style={styles.replayTopRow}><View style={styles.replayInfo}><Text style={styles.replayType}>{getReplayTypeLabel(replay.type)}</Text><Text style={styles.replayTitle}>{replay.title}</Text><Text style={styles.replayMeta}>{getReplayAudienceLabel(replay, appData)} · {getUserName(replay.createdByUserId, users)} · {formatDate(replay.createdAt)}</Text></View></View><Text style={styles.replayDescription}>{replay.description}</Text><Text style={styles.linkPreview} numberOfLines={1}>{replay.videoUrl}</Text><View style={styles.cardActions}><Pressable onPress={() => handleOpenReplayLink(replay.videoUrl)} style={({ pressed }) => [styles.openButton, pressed ? styles.pressed : null]}><Text style={styles.openButtonText}>Linki aç</Text></Pressable>{userCanDeleteReplayLinks ? (<Pressable onPress={() => handleRemoveReplay(replay.id)} style={({ pressed }) => [styles.deleteButton, pressed ? styles.pressed : null]}><Text style={styles.deleteButtonText}>Kaldır</Text></Pressable>) : null}</View></View>))}</View>
          ) : (
            <View style={styles.emptyCard}><Text style={styles.emptyTitle}>Henüz replay linki yok</Text><Text style={styles.emptyText}>Replay linki ekle butonuyla ilk dış video linkini kaydedebilirsin. Video dosyası MaviTeam’e yüklenmez.</Text></View>
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
  pageSubtitle: { color: theme.colors.text.inverse, opacity: 0.76, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.semibold, lineHeight: theme.lineHeights.xl, maxWidth: 720 },
  heroCard: { backgroundColor: theme.colors.background.surface, borderRadius: theme.radius["2xl"], padding: theme.spacing["2xl"], marginBottom: theme.spacing["2xl"], borderWidth: 1, borderColor: theme.colors.border.default },
  heroLabel: { color: theme.colors.text.brand, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.extrabold, marginBottom: theme.spacing.sm, textTransform: "uppercase" },
  heroTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes["3xl"], fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.sm },
  heroSubtitle: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, lineHeight: theme.lineHeights.lg },
  topActions: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md, marginBottom: theme.spacing["2xl"] },
  actionButton: { minWidth: 180 },
  section: { backgroundColor: theme.colors.background.surface, borderRadius: theme.radius["2xl"], padding: theme.spacing["2xl"], marginBottom: theme.spacing["2xl"], borderWidth: 1, borderColor: theme.colors.border.default },
  sectionHeaderRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: theme.spacing.lg, marginBottom: theme.spacing.lg },
  sectionHeaderText: { flex: 1 },
  sectionTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes["2xl"], fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.xs },
  sectionSubtitle: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, lineHeight: theme.lineHeights.lg },
  statusPill: { color: theme.colors.text.brand, backgroundColor: theme.colors.brand.primarySoft, borderRadius: theme.radius.full, paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.md, fontWeight: theme.fontWeights.extrabold, overflow: "hidden" },
  label: { color: theme.colors.text.primary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.extrabold, marginBottom: theme.spacing.sm, marginTop: theme.spacing.md },
  input: { width: "100%", borderWidth: 1, borderColor: theme.colors.border.default, borderRadius: theme.radius.lg, padding: theme.spacing.md, color: theme.colors.text.primary, backgroundColor: theme.colors.background.subtle, fontSize: theme.fontSizes.md, marginBottom: theme.spacing.sm },
  textArea: { minHeight: 96, textAlignVertical: "top" },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  optionButton: { borderWidth: 1, borderColor: theme.colors.border.default, borderRadius: theme.radius.full, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md, backgroundColor: theme.colors.background.subtle },
  optionButtonSelected: { backgroundColor: theme.colors.brand.primary, borderColor: theme.colors.brand.primary },
  optionButtonText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.extrabold },
  optionButtonTextSelected: { color: theme.colors.text.inverse },
  pressed: { opacity: 0.72 },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md, marginTop: theme.spacing.lg },
  replayList: { gap: theme.spacing.lg },
  replayCard: { backgroundColor: theme.colors.background.subtle, borderRadius: theme.radius.xl, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border.default },
  replayTopRow: { flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.md, marginBottom: theme.spacing.md },
  replayInfo: { flex: 1 },
  replayType: { color: theme.colors.text.brand, fontSize: theme.fontSizes.xs, fontWeight: theme.fontWeights.extrabold, textTransform: "uppercase", marginBottom: theme.spacing.xs },
  replayTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.xs },
  replayMeta: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold },
  replayDescription: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, lineHeight: theme.lineHeights.lg, marginBottom: theme.spacing.md },
  linkPreview: { color: theme.colors.text.brand, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.md },
  cardActions: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  openButton: { backgroundColor: theme.colors.brand.primary, borderRadius: theme.radius.full, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.lg },
  openButtonText: { color: theme.colors.text.inverse, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.extrabold },
  deleteButton: { backgroundColor: theme.colors.danger.soft, borderRadius: theme.radius.full, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.lg },
  deleteButtonText: { color: theme.colors.danger.text, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.extrabold },
  emptyCard: { backgroundColor: theme.colors.background.subtle, borderRadius: theme.radius.xl, padding: theme.spacing["2xl"], borderWidth: 1, borderColor: theme.colors.border.default, alignItems: "center" },
  emptyTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.sm },
  emptyText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, textAlign: "center", lineHeight: theme.lineHeights.lg },
});
