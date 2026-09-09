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
import { useTranslation } from "@/localization";
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

function getReplayTypes(copy: ReturnType<typeof getCopy>): { label: string; type: ReplayType }[] {
  return [
    { label: copy.typeMatch, type: "match" },
    { label: copy.typePractice, type: "practice" },
    { label: copy.typeDrill, type: "drill" },
  ];
}

function getFilterOptions(copy: ReturnType<typeof getCopy>): { label: string; filter: ReplayFilter }[] {
  return [
    { label: copy.filterAll, filter: "all" },
    { label: copy.typeMatch, filter: "match" },
    { label: copy.typePractice, filter: "practice" },
    { label: copy.typeDrill, filter: "drill" },
  ];
}

function canManageReplayLinks(appData: TeamSyncAppData | null) {
  return appData?.currentUser.role === "superAdmin" || appData?.currentUser.role === "clubAdmin" || appData?.currentUser.role === "coach";
}

function canDeleteReplayLinks(appData: TeamSyncAppData | null) {
  return appData?.currentUser.role === "clubAdmin";
}

function getReplayTypeLabel(type: ReplayType, copy: ReturnType<typeof getCopy>) {
  return getReplayTypes(copy).find((option) => option.type === type)?.label ?? copy.replayLinkFallback;
}

function formatDate(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return locale === "tr-TR" ? "Tarih yok" : "No date";
  return date.toLocaleDateString(locale, { day: "2-digit", month: "long", year: "numeric" });
}

function getUserName(userId: string, users: UserProfile[], copy: ReturnType<typeof getCopy>) {
  return users.find((user) => user.id === userId)?.fullName ?? copy.userNotFound;
}

function getReplayAudienceLabel(replay: Replay, appData: TeamSyncAppData, copy: ReturnType<typeof getCopy>) {
  if (replay.teamId === undefined) return copy.allClub;
  return appData.teams.find((team) => team.id === replay.teamId)?.name ?? copy.teamNotFound;
}

function isValidExternalUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function getAllowedTargetOptions(appData: TeamSyncAppData | null, copy: ReturnType<typeof getCopy>): TargetOption[] {
  const allClubOption: TargetOption = { id: "all-club", label: copy.allClub };

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

function getCopy(language: "tr" | "en") {
  const en = language === "en";

  return {
    eyebrow: en ? "Match & Practice Videos" : "Maç ve Antrenman Videoları",
    pageTitle: en ? "Replay Links" : "Replay Linkleri",
    pageSubtitle: en
      ? "Coaches don't upload video files; they just add a link from YouTube, Drive, Hudl, or similar."
      : "Koçlar video dosyası yüklemez; sadece YouTube, Drive, Hudl veya benzeri link ekler.",
    heroTitle: en ? "We keep the link, not the video" : "Video bizde değil, link bizde",
    heroSubtitle: en
      ? "MaviTeam only stores the title, description, target team, and URL. Tapping the button opens the external link."
      : "MaviTeam sadece başlık, açıklama, hedef takım ve URL metadata’sını saklar. Kullanıcı butona basınca dış link açılır.",
    addReplay: en ? "Add replay link" : "Replay linki ekle",
    formOpen: en ? "Form is open" : "Form açık",
    refresh: en ? "Refresh" : "Yenile",
    addReplaySubtitle: en
      ? "No video files are uploaded. Only the external video link is saved."
      : "Video dosyası yüklenmez. Sadece dış video linki kaydedilir.",
    linkPill: en ? "Link" : "Link",
    titleLabel: en ? "Title" : "Başlık",
    titlePlaceholder: en ? "e.g. Match analysis" : "Örn: Maç analizi",
    descriptionLabel: en ? "Description" : "Açıklama",
    descriptionPlaceholder: en ? "Write a short description of the link..." : "Link hakkında kısa açıklama yaz...",
    urlLabel: en ? "Replay URL" : "Replay URL",
    urlPlaceholder: en ? "https://youtube.com/... or https://drive.google.com/..." : "https://youtube.com/... veya https://drive.google.com/...",
    contentTypeLabel: en ? "Content type" : "İçerik tipi",
    audienceLabel: en ? "Who can see this?" : "Kim görecek?",
    saveLink: en ? "Save link" : "Linki kaydet",
    cancel: en ? "Cancel" : "Vazgeç",
    replayListTitle: en ? "Replay list" : "Replay listesi",
    visibleCount: (count: number) => (en ? `${count} visible` : `${count} görünür`),
    openLink: en ? "Open link" : "Linki aç",
    remove: en ? "Remove" : "Kaldır",
    emptyTitle: en ? "No replay links yet" : "Henüz replay linki yok",
    emptyDescription: en
      ? "Use Add replay link to save your first external video link. Video files aren't uploaded to MaviTeam."
      : "Replay linki ekle butonuyla ilk dış video linkini kaydedebilirsin. Video dosyası MaviTeam’e yüklenmez.",
    typeMatch: en ? "Match link" : "Maç linki",
    typePractice: en ? "Practice link" : "Antrenman linki",
    typeDrill: en ? "Drill link" : "Drill linki",
    filterAll: en ? "All" : "Tümü",
    replayLinkFallback: en ? "Replay link" : "Replay linki",
    allClub: en ? "Entire Club" : "Tüm Kulüp",
    teamNotFound: en ? "Team not found" : "Takım bulunamadı",
    userNotFound: en ? "User not found" : "Kullanıcı bulunamadı",
    statusUpdated: en ? "Replays updated." : "Replayler güncellendi.",
    statusLoadError: en ? "There was a problem loading replays." : "Replay linkleri yüklenirken bir sorun oluştu.",
    statusNeedsData: en
      ? "Please wait for the page to finish loading."
      : "Sayfanın yüklenmesini bekle.",
    statusFillForm: en ? "Fill in the replay link details." : "Replay linki bilgilerini doldurabilirsin.",
    statusFieldsRequired: en
      ? "Title, description, and a valid http/https replay link are required."
      : "Başlık, açıklama ve geçerli http/https replay linki gerekli.",
    statusNoTeamAvailable: en
      ? "No team is available to add a replay to for this role."
      : "Bu rol için replay eklenebilecek takım bulunamadı.",
    statusSaved: en ? "Replay link saved. The video file itself isn't stored." : "Replay linki kaydedildi. Video dosyası MaviTeam içinde tutulmadı.",
    statusAddError: en ? "There was a problem adding the replay link." : "Replay linki eklenirken bir sorun oluştu.",
    statusCreateCancelled: en ? "Adding the replay link was cancelled." : "Replay linki ekleme iptal edildi.",
    statusRemoved: en ? "Replay link removed." : "Replay linki kaldırıldı.",
    statusRemoveError: en ? "There was a problem removing the replay link." : "Replay linki kaldırılırken bir sorun oluştu.",
    statusInvalidLink: en ? "This replay link isn't valid." : "Bu replay linki geçerli değil.",
    statusCannotOpen: en ? "This replay link can't be opened." : "Bu replay linki açılamıyor.",
  };
}

export default function ReplaysScreen() {
  const { language } = useTranslation();
  const copy = useMemo(() => getCopy(language), [language]);
  const locale = language === "tr" ? "tr-TR" : "en-US";
  const replayTypes = useMemo(() => getReplayTypes(copy), [copy]);
  const filterOptions = useMemo(() => getFilterOptions(copy), [copy]);
  const { appData: contextAppData, setAppData: setContextAppData } = useAppDataContext();
  const [replaysOverride, setReplaysOverride] = useState<Replay[] | null>(null);
  const [activeFilter, setActiveFilter] = useState<ReplayFilter>("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [replayUrl, setReplayUrl] = useState("");
  const [selectedType, setSelectedType] = useState<ReplayType>("match");
  const [selectedTargetId, setSelectedTargetId] = useState("all-club");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingReplayId, setDeletingReplayId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState(copy.statusUpdated);

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

      setStatusMessage(copy.statusUpdated);
    } catch {
      setStatusMessage(copy.statusLoadError);
    }
  }, [copy]);

  useFocusEffect(
    useCallback(() => {
      loadReplayData();
    }, [loadReplayData])
  );

  const replays = appData?.replays ?? EMPTY_REPLAYS;
  const users = appData?.users ?? EMPTY_USERS;
  const userCanManageReplayLinks = canManageReplayLinks(appData);
  const userCanDeleteReplayLinks = canDeleteReplayLinks(appData);
  const targetOptions = useMemo(() => getAllowedTargetOptions(appData, copy), [appData, copy]);

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
      setStatusMessage(copy.statusNeedsData);
      return;
    }

    if (!canAddReplay) {
      setStatusMessage(copy.statusFieldsRequired);
      return;
    }

    const selectedTarget = targetOptions.find((target) => target.id === selectedTargetId) ?? targetOptions[0];

    if (selectedTarget === undefined) {
      setStatusMessage(copy.statusNoTeamAvailable);
      return;
    }

    const activeUsers = appData.users.filter((user) => user.status !== "removed");
    const targetUsers = selectedTarget.teamId === undefined
      ? activeUsers
      : activeUsers.filter((user) => user.teamIds.includes(selectedTarget.teamId ?? ""));
    const visibleUserIds = Array.from(new Set([appData.currentUser.id, ...targetUsers.map((user) => user.id)]));

    try {
      setIsSubmitting(true);

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
      setStatusMessage(copy.statusSaved);
    } catch {
      setStatusMessage(copy.statusAddError);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemoveReplay(replayId: string) {
    if (deletingReplayId !== null) {
      return;
    }

    try {
      setDeletingReplayId(replayId);

      const firebaseUser = authService.getCurrentUser();

      if (authService.isConfigured() && firebaseUser !== null) {
        await firestoreReplayLinkService.removeReplay(firebaseUser, replayId);
        await loadReplayData();
      } else {
        const nextAppData = await teamSyncService.removeReplay(replayId);
        setContextAppData(nextAppData);
      }

      setStatusMessage(copy.statusRemoved);
    } catch {
      setStatusMessage(copy.statusRemoveError);
    } finally {
      setDeletingReplayId(null);
    }
  }

  async function handleOpenReplayLink(url: string) {
    if (!isValidExternalUrl(url)) {
      setStatusMessage(copy.statusInvalidLink);
      return;
    }

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return;
    }

    setStatusMessage(copy.statusCannotOpen);
  }

  return (
    <AppScreenLayout variant="standard">
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.pageTitle}
        subtitle={copy.pageSubtitle}
      />

      <Card style={styles.heroCard}>
        <Text style={styles.heroTitle}>{copy.heroTitle}</Text>
        <Text style={styles.heroSubtitle}>{copy.heroSubtitle}</Text>
      </Card>

      {userCanManageReplayLinks ? (
        <View style={styles.topActions}>
          <AppButton title={showCreateForm ? copy.formOpen : copy.addReplay} onPress={() => { setShowCreateForm(true); setStatusMessage(copy.statusFillForm); }} disabled={showCreateForm} style={styles.actionButton} />
          <AppButton title={copy.refresh} variant="ghost" onPress={loadReplayData} style={styles.actionButton} />
        </View>
      ) : null}

      {showCreateForm && userCanManageReplayLinks ? (
        <Card style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>{copy.addReplay}</Text>
              <Text style={styles.sectionSubtitle}>{copy.addReplaySubtitle}</Text>
            </View>
            <Text style={styles.statusPill}>{copy.linkPill}</Text>
          </View>

          <TextField label={copy.titleLabel} value={title} onChangeText={setTitle} placeholder={copy.titlePlaceholder} containerStyle={styles.field} />

          <TextField
            label={copy.descriptionLabel}
            value={description}
            onChangeText={setDescription}
            placeholder={copy.descriptionPlaceholder}
            multiline
            containerStyle={styles.field}
          />

          <TextField
            label={copy.urlLabel}
            value={replayUrl}
            onChangeText={setReplayUrl}
            placeholder={copy.urlPlaceholder}
            autoCapitalize="none"
            autoCorrect={false}
            containerStyle={styles.field}
          />

          <Text style={styles.label}>{copy.contentTypeLabel}</Text>
          <View style={styles.optionGrid}>{replayTypes.map((option) => { const isSelected = selectedType === option.type; return (<Pressable key={option.type} onPress={() => setSelectedType(option.type)} style={({ pressed }) => [styles.optionButton, isSelected ? styles.optionButtonSelected : null, pressed ? styles.pressed : null]}><Text style={[styles.optionButtonText, isSelected ? styles.optionButtonTextSelected : null]}>{option.label}</Text></Pressable>); })}</View>

          <Text style={styles.label}>{copy.audienceLabel}</Text>
          <View style={styles.optionGrid}>{targetOptions.map((target) => { const isSelected = selectedTargetId === target.id; return (<Pressable key={target.id} onPress={() => setSelectedTargetId(target.id)} style={({ pressed }) => [styles.optionButton, isSelected ? styles.optionButtonSelected : null, pressed ? styles.pressed : null]}><Text style={[styles.optionButtonText, isSelected ? styles.optionButtonTextSelected : null]}>{target.label}</Text></Pressable>); })}</View>

          <View style={styles.actionRow}>
            <AppButton
              title={copy.saveLink}
              onPress={handleAddReplay}
              loading={isSubmitting}
              disabled={!canAddReplay || isSubmitting}
              style={styles.actionButton}
            />
            <AppButton
              title={copy.cancel}
              variant="ghost"
              disabled={isSubmitting}
              onPress={() => { clearForm(); setShowCreateForm(false); setStatusMessage(copy.statusCreateCancelled); }}
              style={styles.actionButton}
            />
          </View>
        </Card>
      ) : null}

      <Card style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>{copy.replayListTitle}</Text>
            <Text style={styles.sectionSubtitle}>{statusMessage}</Text>
          </View>
          <Text style={styles.statusPill}>{copy.visibleCount(visibleReplays.length)}</Text>
        </View>

        <View style={styles.optionGrid}>{filterOptions.map((option) => { const isSelected = activeFilter === option.filter; return (<Pressable key={option.filter} onPress={() => setActiveFilter(option.filter)} style={({ pressed }) => [styles.optionButton, isSelected ? styles.optionButtonSelected : null, pressed ? styles.pressed : null]}><Text style={[styles.optionButtonText, isSelected ? styles.optionButtonTextSelected : null]}>{option.label}</Text></Pressable>); })}</View>

        {appData !== null && visibleReplays.length > 0 ? (
          <View style={styles.replayList}>
            {visibleReplays.map((replay) => (
              <View key={replay.id} style={styles.replayCard}>
                <View style={styles.replayTopRow}>
                  <View style={styles.replayInfo}>
                    <Text style={styles.replayType}>{getReplayTypeLabel(replay.type, copy)}</Text>
                    <Text style={styles.replayTitle}>{replay.title}</Text>
                    <Text style={styles.replayMeta}>{getReplayAudienceLabel(replay, appData, copy)} · {getUserName(replay.createdByUserId, users, copy)} · {formatDate(replay.createdAt, locale)}</Text>
                  </View>
                </View>
                <Text style={styles.replayDescription}>{replay.description}</Text>
                <Text style={styles.linkPreview} numberOfLines={1}>{replay.videoUrl}</Text>
                <View style={styles.cardActions}>
                  <Pressable
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => handleOpenReplayLink(replay.videoUrl)}
                    style={({ pressed }) => [styles.openButton, pressed ? styles.pressed : null]}
                  >
                    <Text style={styles.openButtonText}>{copy.openLink}</Text>
                  </Pressable>
                  {userCanDeleteReplayLinks ? (
                    <Pressable
                      disabled={deletingReplayId !== null}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      onPress={() => handleRemoveReplay(replay.id)}
                      style={({ pressed }) => [
                        styles.deleteButton,
                        deletingReplayId === replay.id ? { opacity: 0.5 } : null,
                        pressed ? styles.pressed : null,
                      ]}
                    >
                      <Text style={styles.deleteButtonText}>
                        {deletingReplayId === replay.id ? "..." : copy.remove}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState
            title={copy.emptyTitle}
            description={copy.emptyDescription}
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
