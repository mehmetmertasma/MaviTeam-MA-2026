import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppScreenLayout } from "@/components/AppScreenLayout";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { TextField } from "@/components/TextField";
import { theme } from "@/constants/theme";
import { useAppDataContext } from "@/providers/AppDataProvider";
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
  const { appData: contextAppData, setAppData: setContextAppData } = useAppDataContext();
  const [replaysOverride, setReplaysOverride] = useState<Replay[] | null>(null);
  const [activeFilter, setActiveFilter] = useState<ReplayFilter>("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [replayUrl, setReplayUrl] = useState("");
  const [selectedType, setSelectedType] = useState<ReplayType>("match");
  const [selectedTargetId, setSelectedTargetId] = useState("all-club");
  const [statusMessage, setStatusMessage] = useState("Replay linkleri MaviTeam datasından yüklendi.");

  // Firestore-backed replay visibility (visibleUserIds) is more precise than
  // the shared appData's copy, so this overlays a dedicated fetch on top of
  // the shared appData instead of reading replays from it directly.
  const appData = useMemo(() => {
    if (contextAppData === null) return null;
    if (replaysOverride === null) return contextAppData;
    return { ...contextAppData, replays: replaysOverride };
  }, [contextAppData, replaysOverride]);

  const loadReplayData = useCallback(async () => {
    try {
      const firebaseUser = authService.getCurrentUser();

      if (authService.isConfigured() && firebaseUser !== null) {
        const firestoreReplays = await firestoreReplayLinkService.listVisibleReplaysForCurrentUser(firebaseUser);
        setReplaysOverride(firestoreReplays);
      }

      setStatusMessage("Replay linkleri MaviTeam datasından yüklendi.");
    } catch {
      setStatusMessage("Replay linkleri yüklenirken bir sorun oluştu.");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReplayData();
    }, [loadReplayData])
  );

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
        setContextAppData(nextAppData);
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
        setContextAppData(nextAppData);
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
    <AppScreenLayout variant="standard">
      <PageHeader
        eyebrow="Düşük maliyetli video sistemi"
        title="Replay Linkleri"
        subtitle="Koçlar video dosyası yüklemez; sadece YouTube, Drive, Hudl veya benzeri link ekler."
      />

      <Card style={styles.heroCard}>
        <Text style={styles.heroTitle}>Video bizde değil, link bizde</Text>
        <Text style={styles.heroSubtitle}>MaviTeam sadece başlık, açıklama, hedef takım ve URL metadata’sını saklar. Kullanıcı butona basınca dış link açılır.</Text>
      </Card>

      {userCanManageReplayLinks ? (
        <View style={styles.topActions}>
          <AppButton title={showCreateForm ? "Form açık" : "Replay linki ekle"} onPress={() => { setShowCreateForm(true); setStatusMessage("Replay linki bilgilerini doldurabilirsin."); }} disabled={showCreateForm} style={styles.actionButton} />
          <AppButton title="Datayı yenile" variant="ghost" onPress={loadReplayData} style={styles.actionButton} />
        </View>
      ) : null}

      {showCreateForm && userCanManageReplayLinks ? (
        <Card style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Replay linki ekle</Text>
              <Text style={styles.sectionSubtitle}>Video dosyası yüklenmez. Sadece dış video linki kaydedilir.</Text>
            </View>
            <Text style={styles.statusPill}>Link</Text>
          </View>

          <TextField label="Başlık" value={title} onChangeText={setTitle} placeholder="Örn: Maç analizi" containerStyle={styles.field} />

          <TextField
            label="Açıklama"
            value={description}
            onChangeText={setDescription}
            placeholder="Link hakkında kısa açıklama yaz..."
            multiline
            containerStyle={styles.field}
          />

          <TextField
            label="Replay URL"
            value={replayUrl}
            onChangeText={setReplayUrl}
            placeholder="https://youtube.com/... veya https://drive.google.com/..."
            autoCapitalize="none"
            autoCorrect={false}
            containerStyle={styles.field}
          />

          <Text style={styles.label}>İçerik tipi</Text>
          <View style={styles.optionGrid}>{replayTypes.map((option) => { const isSelected = selectedType === option.type; return (<Pressable key={option.type} onPress={() => setSelectedType(option.type)} style={({ pressed }) => [styles.optionButton, isSelected ? styles.optionButtonSelected : null, pressed ? styles.pressed : null]}><Text style={[styles.optionButtonText, isSelected ? styles.optionButtonTextSelected : null]}>{option.label}</Text></Pressable>); })}</View>

          <Text style={styles.label}>Kim görecek?</Text>
          <View style={styles.optionGrid}>{targetOptions.map((target) => { const isSelected = selectedTargetId === target.id; return (<Pressable key={target.id} onPress={() => setSelectedTargetId(target.id)} style={({ pressed }) => [styles.optionButton, isSelected ? styles.optionButtonSelected : null, pressed ? styles.pressed : null]}><Text style={[styles.optionButtonText, isSelected ? styles.optionButtonTextSelected : null]}>{target.label}</Text></Pressable>); })}</View>

          <View style={styles.actionRow}>
            <AppButton title="Linki kaydet" onPress={handleAddReplay} disabled={!canAddReplay} style={styles.actionButton} />
            <AppButton title="Vazgeç" variant="ghost" onPress={() => { clearForm(); setShowCreateForm(false); setStatusMessage("Replay linki ekleme iptal edildi."); }} style={styles.actionButton} />
          </View>
        </Card>
      ) : null}

      <Card style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>Replay listesi</Text>
            <Text style={styles.sectionSubtitle}>{statusMessage}</Text>
          </View>
          <Text style={styles.statusPill}>{visibleReplays.length} görünür</Text>
        </View>

        <View style={styles.optionGrid}>{filterOptions.map((option) => { const isSelected = activeFilter === option.filter; return (<Pressable key={option.filter} onPress={() => setActiveFilter(option.filter)} style={({ pressed }) => [styles.optionButton, isSelected ? styles.optionButtonSelected : null, pressed ? styles.pressed : null]}><Text style={[styles.optionButtonText, isSelected ? styles.optionButtonTextSelected : null]}>{option.label}</Text></Pressable>); })}</View>

        {appData !== null && visibleReplays.length > 0 ? (
          <View style={styles.replayList}>
            {visibleReplays.map((replay) => (
              <View key={replay.id} style={styles.replayCard}>
                <View style={styles.replayTopRow}>
                  <View style={styles.replayInfo}>
                    <Text style={styles.replayType}>{getReplayTypeLabel(replay.type)}</Text>
                    <Text style={styles.replayTitle}>{replay.title}</Text>
                    <Text style={styles.replayMeta}>{getReplayAudienceLabel(replay, appData)} · {getUserName(replay.createdByUserId, users)} · {formatDate(replay.createdAt)}</Text>
                  </View>
                </View>
                <Text style={styles.replayDescription}>{replay.description}</Text>
                <Text style={styles.linkPreview} numberOfLines={1}>{replay.videoUrl}</Text>
                <View style={styles.cardActions}>
                  <Pressable onPress={() => handleOpenReplayLink(replay.videoUrl)} style={({ pressed }) => [styles.openButton, pressed ? styles.pressed : null]}>
                    <Text style={styles.openButtonText}>Linki aç</Text>
                  </Pressable>
                  {userCanDeleteReplayLinks ? (
                    <Pressable onPress={() => handleRemoveReplay(replay.id)} style={({ pressed }) => [styles.deleteButton, pressed ? styles.pressed : null]}>
                      <Text style={styles.deleteButtonText}>Kaldır</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState
            title="Henüz replay linki yok"
            description="Replay linki ekle butonuyla ilk dış video linkini kaydedebilirsin. Video dosyası MaviTeam’e yüklenmez."
          />
        )}
      </Card>
    </AppScreenLayout>
  );
}

const styles = StyleSheet.create({
  heroCard: { gap: theme.spacing.sm, marginBottom: theme.spacing["2xl"] },
  heroTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes["3xl"], fontWeight: theme.fontWeights.semibold },
  heroSubtitle: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, lineHeight: theme.lineHeights.lg },
  topActions: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md, marginBottom: theme.spacing["2xl"] },
  actionButton: { minWidth: 180 },
  section: { marginBottom: theme.spacing["2xl"] },
  sectionHeaderRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: theme.spacing.lg, marginBottom: theme.spacing.lg },
  sectionHeaderText: { flex: 1 },
  sectionTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes["2xl"], fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.xs },
  sectionSubtitle: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, lineHeight: theme.lineHeights.lg },
  statusPill: { color: theme.colors.text.brand, backgroundColor: theme.colors.brand.primarySoft, borderRadius: theme.radius.full, paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.md, fontWeight: theme.fontWeights.semibold, overflow: "hidden" },
  label: { color: theme.colors.text.primary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.sm, marginTop: theme.spacing.md },
  field: { marginBottom: theme.spacing.sm },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  optionButton: { borderWidth: 1, borderColor: theme.colors.border.default, borderRadius: theme.radius.full, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md, backgroundColor: theme.colors.background.subtle },
  optionButtonSelected: { backgroundColor: theme.colors.brand.primary, borderColor: theme.colors.brand.primary },
  optionButtonText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold },
  optionButtonTextSelected: { color: theme.colors.text.inverse },
  pressed: { opacity: 0.72 },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md, marginTop: theme.spacing.lg },
  replayList: { gap: theme.spacing.lg },
  replayCard: { backgroundColor: theme.colors.background.subtle, borderRadius: theme.radius.xl, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border.default },
  replayTopRow: { flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.md, marginBottom: theme.spacing.md },
  replayInfo: { flex: 1 },
  replayType: { color: theme.colors.text.brand, fontSize: theme.fontSizes.xs, fontWeight: theme.fontWeights.semibold, textTransform: "uppercase", marginBottom: theme.spacing.xs },
  replayTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.xs },
  replayMeta: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.regular },
  replayDescription: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, lineHeight: theme.lineHeights.lg, marginBottom: theme.spacing.md },
  linkPreview: { color: theme.colors.text.brand, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.regular, marginBottom: theme.spacing.md },
  cardActions: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  openButton: { backgroundColor: theme.colors.brand.primary, borderRadius: theme.radius.full, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.lg },
  openButtonText: { color: theme.colors.text.inverse, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold },
  deleteButton: { backgroundColor: theme.colors.danger.soft, borderRadius: theme.radius.full, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.lg },
  deleteButtonText: { color: theme.colors.danger.text, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold },
});
