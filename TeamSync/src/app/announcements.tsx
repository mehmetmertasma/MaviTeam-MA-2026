import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppScreenLayout } from "@/components/AppScreenLayout";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { TextField } from "@/components/TextField";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/localization";
import { useAppDataContext } from "@/providers/AppDataProvider";
import { authService, getAuthErrorMessage } from "@/services/authService";
import { firestoreMaviTeamDataService } from "@/services/firestoreMaviTeamDataService";
import { firestoreTeamSyncService } from "@/services/firestoreTeamSyncService";
import { teamSyncService } from "@/services/teamSyncService";
import type { Announcement, TeamSyncAppData, UserRole } from "@/types/teamSync";

type TargetOption = {
  id: string;
  label: string;
  targetType: "allClub" | "team";
  targetTeamId?: string;
};

function formatDate(value: string, locale: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return locale === "tr-TR" ? "Tarih yok" : "No date";
  }

  return date.toLocaleString(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAnnouncementTargetLabel(
  announcement: Announcement,
  appData: TeamSyncAppData,
  copy: ReturnType<typeof getCopy>
) {
  if (announcement.targetType === "allClub") {
    return copy.allClub;
  }

  return appData.teams.find((team) => team.id === announcement.targetTeamId)?.name ?? copy.teamNotFound;
}

function canPublishAnnouncements(role: UserRole) {
  return role === "clubAdmin" || role === "coach";
}

function getCopy(language: "tr" | "en") {
  const en = language === "en";

  return {
    pageTitle: en ? "Announcements" : "Duyurular",
    pageSubtitle: en
      ? "Publish updates for your whole club or a specific team."
      : "Kulüp veya takım üyelerine duyuru yayınla.",
    heroLabel: en ? "Club communication hub" : "Kulüp iletişim merkezi",
    heroTitle: en ? "Announcement management" : "Duyuru yönetimi",
    heroSubtitle: en
      ? "Share updates with your whole club or a specific team."
      : "Kulübünle veya belirli bir takımla duyuru paylaş.",
    createNew: en ? "Create announcement" : "Yeni duyuru oluştur",
    formOpen: en ? "Form is open" : "Form açık",
    refresh: en ? "Refresh" : "Yenile",
    newAnnouncementTitle: en ? "Create announcement" : "Yeni duyuru oluştur",
    newAnnouncementSubtitle: en
      ? "Choose a title, message, and audience."
      : "Başlığı, mesajı ve hedef kitleyi seç.",
    newBadge: en ? "New" : "Yeni",
    titleLabel: en ? "Announcement title" : "Duyuru başlığı",
    titlePlaceholder: en ? "e.g. Match schedule announced" : "Örn: Maç programı açıklandı",
    messageLabel: en ? "Announcement message" : "Duyuru mesajı",
    messagePlaceholder: en ? "Write the announcement details..." : "Duyuru detaylarını yaz...",
    audienceLabel: en ? "Who should receive this?" : "Kimlere gönderilecek?",
    publishing: en ? "Publishing..." : "Yayınlanıyor...",
    publish: en ? "Publish announcement" : "Duyuruyu yayınla",
    cancel: en ? "Cancel" : "Vazgeç",
    publishedSectionTitle: en ? "Published announcements" : "Yayınlanan duyurular",
    publishedSectionSubtitle: en
      ? "Keep track of everything you've shared here."
      : "Paylaşılan duyuruları burada takip edebilirsin.",
    activeCount: (count: number) => (en ? `${count} active` : `${count} aktif`),
    sharedOn: en ? "Shared" : "Paylaşıldı",
    deleteLabel: en ? "Delete" : "Sil",
    emptyTitle: en ? "No announcements yet" : "Henüz duyuru yok",
    emptyDescription: en
      ? "Tap Create announcement to add your first one."
      : "Yeni duyuru oluştur butonuna basarak ilk duyurunu ekleyebilirsin.",
    allClub: en ? "Entire Club" : "Tüm Kulüp",
    teamNotFound: en ? "Team not found" : "Takım bulunamadı",
    statusUpdated: en ? "Announcements updated." : "Duyurular güncellendi.",
    statusSignInToView: en ? "Sign in to view announcements." : "Duyuruları görmek için giriş yapmalısın.",
    statusNeedsData: en
      ? "Please wait for the page to finish loading."
      : "Sayfanın yüklenmesini bekle.",
    statusNoPublishPermission: en
      ? "This account doesn't have permission to publish announcements."
      : "Bu hesap duyuru yayınlama yetkisine sahip değil.",
    statusFieldsRequired: en
      ? "Title and message cannot be empty."
      : "Başlık ve mesaj alanı boş bırakılamaz.",
    statusSignInToPublish: en ? "Sign in to publish an announcement." : "Duyuru yayınlamak için giriş yapmalısın.",
    statusPublished: en ? "Announcement published." : "Duyuru yayınlandı.",
    statusFillForm: en
      ? "Fill in the new announcement details."
      : "Yeni duyuru bilgilerini doldurabilirsin.",
    statusCreateCancelled: en ? "Announcement creation cancelled." : "Duyuru oluşturma iptal edildi.",
    statusOnlyAdminDelete: en
      ? "Only a club admin can delete announcements."
      : "Sadece kulüp yöneticisi duyuru silebilir.",
    statusSignInToDelete: en ? "Sign in to delete an announcement." : "Duyuru silmek için giriş yapmalısın.",
    statusDeleted: en ? "Announcement deleted." : "Duyuru silindi.",
  };
}

export default function AnnouncementsScreen() {
  const { language } = useTranslation();
  const copy = useMemo(() => getCopy(language), [language]);
  const locale = language === "tr" ? "tr-TR" : "en-US";
  const { appData: contextAppData, setAppData: setContextAppData } = useAppDataContext();
  const [firestoreAnnouncements, setFirestoreAnnouncements] = useState<Announcement[] | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTargetId, setSelectedTargetId] = useState("all-club");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingAnnouncementId, setDeletingAnnouncementId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState(copy.statusUpdated);

  // Overlays a dedicated, targeted Firestore fetch on top of the shared
  // appData instead of pulling announcements from it directly, so this
  // screen can refresh just this one collection without re-triggering the
  // full app-data load.
  const appData = useMemo(() => {
    if (contextAppData === null) return null;
    if (firestoreAnnouncements === null) return contextAppData;
    return { ...contextAppData, announcements: firestoreAnnouncements };
  }, [contextAppData, firestoreAnnouncements]);

  const loadAnnouncementsData = useCallback(async () => {
    try {
      if (authService.isConfigured()) {
        const firebaseUser = authService.getCurrentUser();

        if (firebaseUser === null) {
          setStatusMessage(copy.statusSignInToView);
          return;
        }

        const fetchedAnnouncements = await firestoreMaviTeamDataService.listVisibleAnnouncementsForCurrentUser(firebaseUser);
        setFirestoreAnnouncements(fetchedAnnouncements);
        setStatusMessage(copy.statusUpdated);
        return;
      }

      setStatusMessage(copy.statusUpdated);
    } catch (loadError) {
      setStatusMessage(getAuthErrorMessage(loadError, language));
    }
  }, [copy, language]);

  useFocusEffect(
    useCallback(() => {
      loadAnnouncementsData();
    }, [loadAnnouncementsData])
  );

  const targetOptions = useMemo<TargetOption[]>(() => {
    const allClubOption: TargetOption = {
      id: "all-club",
      label: copy.allClub,
      targetType: "allClub",
    };

    if (appData === null) {
      return [allClubOption];
    }

    return [
      allClubOption,
      ...appData.teams.map((team) => ({
        id: team.id,
        label: team.name,
        targetType: "team" as const,
        targetTeamId: team.id,
      })),
    ];
  }, [appData, copy]);

  const announcements = appData?.announcements ?? [];
  const userCanPublish = appData !== null && canPublishAnnouncements(appData.currentUser.role);
  const userCanDelete = appData?.currentUser.role === "clubAdmin";
  const canPublish = title.trim().length > 0 && message.trim().length > 0 && userCanPublish && !isSubmitting;

  function clearForm() {
    setTitle("");
    setMessage("");
    setSelectedTargetId("all-club");
  }

  async function publishAnnouncement() {
    if (appData === null) {
      setStatusMessage(copy.statusNeedsData);
      return;
    }

    if (!userCanPublish) {
      setStatusMessage(copy.statusNoPublishPermission);
      return;
    }

    if (!canPublish) {
      setStatusMessage(copy.statusFieldsRequired);
      return;
    }

    const selectedTarget =
      targetOptions.find((target) => target.id === selectedTargetId) ?? targetOptions[0];

    try {
      setIsSubmitting(true);

      if (authService.isConfigured()) {
        const firebaseUser = authService.getCurrentUser();

        if (firebaseUser === null) {
          setStatusMessage(copy.statusSignInToPublish);
          return;
        }

        await firestoreTeamSyncService.createAnnouncement(firebaseUser, {
          title: title.trim(),
          message: message.trim(),
          targetType: selectedTarget.targetType,
          targetTeamId: selectedTarget.targetTeamId,
        });

        await loadAnnouncementsData();
        clearForm();
        setShowCreateForm(false);
        setStatusMessage(copy.statusPublished);
        return;
      }

      const nextAppData = await teamSyncService.createAnnouncement({
        clubId: appData.club.id,
        title: title.trim(),
        message: message.trim(),
        targetType: selectedTarget.targetType,
        targetTeamId: selectedTarget.targetTeamId,
        createdByUserId: appData.currentUser.id,
      });

      setContextAppData(nextAppData);
      clearForm();
      setShowCreateForm(false);
      setStatusMessage(copy.statusPublished);
    } catch (publishError) {
      setStatusMessage(getAuthErrorMessage(publishError, language));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteAnnouncement(announcementId: string) {
    if (!userCanDelete) {
      setStatusMessage(copy.statusOnlyAdminDelete);
      return;
    }

    try {
      setDeletingAnnouncementId(announcementId);

      if (authService.isConfigured()) {
        const firebaseUser = authService.getCurrentUser();

        if (firebaseUser === null) {
          setStatusMessage(copy.statusSignInToDelete);
          return;
        }

        await firestoreTeamSyncService.removeAnnouncement(firebaseUser, announcementId);
        await loadAnnouncementsData();
        setStatusMessage(copy.statusDeleted);
        return;
      }

      const nextAppData = await teamSyncService.removeAnnouncement(announcementId);
      setContextAppData(nextAppData);
      setStatusMessage(copy.statusDeleted);
    } catch (deleteError) {
      setStatusMessage(getAuthErrorMessage(deleteError, language));
    } finally {
      setDeletingAnnouncementId(null);
    }
  }

  return (
    <AppScreenLayout>
      <PageHeader title={copy.pageTitle} subtitle={copy.pageSubtitle} />

      <Card variant="elevated" style={styles.heroCard}>
        <StatusBadge label={copy.heroLabel} tone="info" style={styles.heroLabel} />
        <Text style={styles.heroTitle}>{copy.heroTitle}</Text>
        <Text style={styles.heroSubtitle}>{copy.heroSubtitle}</Text>
      </Card>

      <View style={styles.actionRowTop}>
        <AppButton
          title={showCreateForm ? copy.formOpen : copy.createNew}
          onPress={() => {
            if (!userCanPublish) {
              setStatusMessage(copy.statusNoPublishPermission);
              return;
            }

            setShowCreateForm(true);
            setStatusMessage(copy.statusFillForm);
          }}
          disabled={showCreateForm || !userCanPublish}
          style={styles.actionButton}
        />

        <AppButton
          title={copy.refresh}
          variant="ghost"
          onPress={loadAnnouncementsData}
          style={styles.actionButton}
        />
      </View>

      {showCreateForm ? (
        <Card style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>{copy.newAnnouncementTitle}</Text>
              <Text style={styles.sectionSubtitle}>{copy.newAnnouncementSubtitle}</Text>
            </View>
            <StatusBadge label={copy.newBadge} tone="info" />
          </View>

          <TextField
            label={copy.titleLabel}
            value={title}
            onChangeText={setTitle}
            placeholder={copy.titlePlaceholder}
            containerStyle={styles.field}
          />

          <TextField
            label={copy.messageLabel}
            value={message}
            onChangeText={setMessage}
            placeholder={copy.messagePlaceholder}
            multiline
            containerStyle={styles.field}
          />

          <Text style={styles.label}>{copy.audienceLabel}</Text>
          <View style={styles.targetGrid}>
            {targetOptions.map((target) => {
              const isSelected = selectedTargetId === target.id;

              return (
                <Pressable
                  key={target.id}
                  onPress={() => setSelectedTargetId(target.id)}
                  style={({ pressed }) => [
                    styles.targetButton,
                    isSelected ? styles.targetButtonSelected : null,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <Text style={[styles.targetButtonText, isSelected ? styles.targetButtonTextSelected : null]}>
                    {target.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.publishRow}>
            <AppButton
              title={isSubmitting ? copy.publishing : copy.publish}
              onPress={publishAnnouncement}
              loading={isSubmitting}
              disabled={!canPublish || isSubmitting}
              style={styles.actionButton}
            />
            <AppButton
              title={copy.cancel}
              variant="ghost"
              disabled={isSubmitting}
              onPress={() => {
                clearForm();
                setShowCreateForm(false);
                setStatusMessage(copy.statusCreateCancelled);
              }}
              style={styles.actionButton}
            />
          </View>
        </Card>
      ) : null}

      <Card style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>{copy.publishedSectionTitle}</Text>
            <Text style={styles.sectionSubtitle}>{copy.publishedSectionSubtitle}</Text>
          </View>
          <StatusBadge label={copy.activeCount(announcements.length)} tone="info" />
        </View>

        <View style={styles.announcementList}>
          {appData !== null && announcements.length > 0 ? (
            announcements.map((announcement) => (
              <Card key={announcement.id} variant="subtle" style={styles.announcementCard}>
                <View style={styles.announcementHeaderRow}>
                  <View style={styles.announcementTextArea}>
                    <Text style={styles.announcementTarget}>
                      {getAnnouncementTargetLabel(announcement, appData, copy)}
                    </Text>
                    <Text style={styles.announcementTitle}>{announcement.title}</Text>
                    <Text style={styles.announcementDate}>
                      {copy.sharedOn}: {formatDate(announcement.createdAt, locale)}
                    </Text>
                  </View>

                  {userCanDelete ? (
                    <AppButton
                      title={copy.deleteLabel}
                      variant="ghost"
                      loading={deletingAnnouncementId === announcement.id}
                      disabled={deletingAnnouncementId !== null}
                      onPress={() => deleteAnnouncement(announcement.id)}
                      style={styles.deleteButton}
                    />
                  ) : null}
                </View>

                <Text style={styles.announcementMessage}>{announcement.message}</Text>
              </Card>
            ))
          ) : (
            <EmptyState title={copy.emptyTitle} description={copy.emptyDescription} />
          )}
        </View>

        <Text style={styles.statusText}>{statusMessage}</Text>
      </Card>
    </AppScreenLayout>
  );
}

const styles = StyleSheet.create({
  heroCard: { marginBottom: theme.spacing["2xl"] },
  heroLabel: { marginBottom: theme.spacing.lg },
  heroTitle: {
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.primary,
    lineHeight: theme.lineHeights["2xl"],
    marginBottom: theme.spacing.sm,
  },
  heroSubtitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.regular,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.xl,
  },
  actionRowTop: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginBottom: theme.spacing["2xl"],
  },
  actionButton: { flexGrow: 1 },
  section: { marginBottom: theme.spacing["2xl"] },
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
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  sectionSubtitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.regular,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.md,
  },
  label: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.sm,
  },
  field: { marginBottom: theme.spacing.lg },
  targetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  targetButton: {
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.background.subtle,
  },
  targetButtonSelected: {
    backgroundColor: theme.colors.brand.primary,
    borderColor: theme.colors.brand.primary,
  },
  targetButtonText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
  },
  targetButtonTextSelected: { color: theme.colors.text.inverse },
  publishRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md },
  announcementList: { gap: theme.spacing.md },
  announcementCard: { padding: theme.spacing.lg },
  announcementHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.lg,
    alignItems: "flex-start",
    marginBottom: theme.spacing.md,
  },
  announcementTextArea: { flex: 1 },
  announcementTarget: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.xs,
  },
  announcementTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.xs,
  },
  announcementDate: {
    color: theme.colors.text.muted,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.medium,
  },
  announcementMessage: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.regular,
    lineHeight: theme.lineHeights.lg,
  },
  deleteButton: { alignSelf: "flex-start" },
  statusText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.regular,
    marginTop: theme.spacing.xl,
    lineHeight: theme.lineHeights.md,
  },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
});
