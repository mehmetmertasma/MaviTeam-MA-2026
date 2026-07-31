import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { theme } from "@/constants/theme";
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

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Tarih yok";
  }

  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAnnouncementTargetLabel(announcement: Announcement, appData: TeamSyncAppData) {
  if (announcement.targetType === "allClub") {
    return "Tüm Kulüp";
  }

  return appData.teams.find((team) => team.id === announcement.targetTeamId)?.name ?? "Takım bulunamadı";
}

function canPublishAnnouncements(role: UserRole) {
  return role === "clubAdmin" || role === "coach";
}

export default function AnnouncementsScreen() {
  const { appData: contextAppData, setAppData: setContextAppData } = useAppDataContext();
  const [firestoreAnnouncements, setFirestoreAnnouncements] = useState<Announcement[] | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTargetId, setSelectedTargetId] = useState("all-club");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Duyurular merkezi TeamSync datasından yüklendi.");

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
          setStatusMessage("Duyuruları görmek için giriş yapmalısın.");
          return;
        }

        const fetchedAnnouncements = await firestoreMaviTeamDataService.listVisibleAnnouncementsForCurrentUser(firebaseUser);
        setFirestoreAnnouncements(fetchedAnnouncements);
        setStatusMessage("Duyurular Firestore kulüp datasından yüklendi.");
        return;
      }

      setStatusMessage("Duyurular local TeamSync datasından yüklendi.");
    } catch (loadError) {
      setStatusMessage(getAuthErrorMessage(loadError));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAnnouncementsData();
    }, [loadAnnouncementsData])
  );

  const targetOptions = useMemo<TargetOption[]>(() => {
    const allClubOption: TargetOption = {
      id: "all-club",
      label: "Tüm Kulüp",
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
  }, [appData]);

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
      setStatusMessage("Önce merkezi data yüklenmeli.");
      return;
    }

    if (!userCanPublish) {
      setStatusMessage("Bu hesap duyuru yayınlama yetkisine sahip değil.");
      return;
    }

    if (!canPublish) {
      setStatusMessage("Başlık ve mesaj alanı boş bırakılamaz.");
      return;
    }

    const selectedTarget =
      targetOptions.find((target) => target.id === selectedTargetId) ?? targetOptions[0];

    try {
      setIsSubmitting(true);

      if (authService.isConfigured()) {
        const firebaseUser = authService.getCurrentUser();

        if (firebaseUser === null) {
          setStatusMessage("Duyuru yayınlamak için giriş yapmalısın.");
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
        setStatusMessage("Duyuru Firestore kulüp datasına yayınlandı.");
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
      setStatusMessage("Duyuru local data service içine yayınlandı.");
    } catch (publishError) {
      setStatusMessage(getAuthErrorMessage(publishError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteAnnouncement(announcementId: string) {
    if (!userCanDelete) {
      setStatusMessage("Sadece kulüp yöneticisi duyuru silebilir.");
      return;
    }

    try {
      if (authService.isConfigured()) {
        const firebaseUser = authService.getCurrentUser();

        if (firebaseUser === null) {
          setStatusMessage("Duyuru silmek için giriş yapmalısın.");
          return;
        }

        await firestoreTeamSyncService.removeAnnouncement(firebaseUser, announcementId);
        await loadAnnouncementsData();
        setStatusMessage("Duyuru Firestore kulüp datasından silindi.");
        return;
      }

      const nextAppData = await teamSyncService.removeAnnouncement(announcementId);
      setContextAppData(nextAppData);
      setStatusMessage("Duyuru local datadan silindi.");
    } catch (deleteError) {
      setStatusMessage(getAuthErrorMessage(deleteError));
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.pageHeader}>
          <Text style={styles.logo}>TeamSync</Text>
          <Text style={styles.pageTitle}>Duyurular</Text>
          <Text style={styles.pageSubtitle}>Kulüp veya takım üyelerine merkezi data üzerinden duyuru yayınla.</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Kulüp iletişim merkezi</Text>
          <Text style={styles.heroTitle}>Duyuru yönetimi</Text>
          <Text style={styles.heroSubtitle}>
            Duyurular artık Firebase varsa Firestore kulüp datasından gelir. Her kullanıcı sadece kendi kulübünün duyurularını görür.
          </Text>
        </View>

        <View style={styles.actionRowTop}>
          <AppButton
            title={showCreateForm ? "Form açık" : "Yeni duyuru oluştur"}
            onPress={() => {
              if (!userCanPublish) {
                setStatusMessage("Bu hesap duyuru yayınlama yetkisine sahip değil.");
                return;
              }

              setShowCreateForm(true);
              setStatusMessage("Yeni duyuru bilgilerini doldurabilirsin.");
            }}
            disabled={showCreateForm || !userCanPublish}
            style={styles.actionButton}
          />

          <AppButton
            title="Merkezi datayı yenile"
            variant="ghost"
            onPress={loadAnnouncementsData}
            style={styles.actionButton}
          />
        </View>

        {showCreateForm ? (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Yeni duyuru oluştur</Text>
                <Text style={styles.sectionSubtitle}>Başlığı, mesajı ve hedef kitleyi seç.</Text>
              </View>
              <Text style={styles.statusPill}>Yeni</Text>
            </View>

            <Text style={styles.label}>Duyuru başlığı</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: Maç programı açıklandı"
              placeholderTextColor={theme.colors.text.muted}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Duyuru mesajı</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Duyuru detaylarını yaz..."
              placeholderTextColor={theme.colors.text.muted}
              value={message}
              onChangeText={setMessage}
              multiline
            />

            <Text style={styles.label}>Kimlere gönderilecek?</Text>
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
                title={isSubmitting ? "Yayınlanıyor..." : "Duyuruyu yayınla"}
                onPress={publishAnnouncement}
                disabled={!canPublish}
                style={styles.actionButton}
              />
              <AppButton
                title="Vazgeç"
                variant="ghost"
                onPress={() => {
                  clearForm();
                  setShowCreateForm(false);
                  setStatusMessage("Duyuru oluşturma iptal edildi.");
                }}
                style={styles.actionButton}
              />
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Yayınlanan duyurular</Text>
              <Text style={styles.sectionSubtitle}>Paylaşılan duyuruları burada takip edebilirsin.</Text>
            </View>
            <Text style={styles.statusPill}>{announcements.length} aktif</Text>
          </View>

          <View style={styles.announcementList}>
            {appData !== null && announcements.length > 0 ? (
              announcements.map((announcement) => (
                <View key={announcement.id} style={styles.announcementCard}>
                  <View style={styles.announcementHeaderRow}>
                    <View style={styles.announcementTextArea}>
                      <Text style={styles.announcementTarget}>
                        {getAnnouncementTargetLabel(announcement, appData)}
                      </Text>
                      <Text style={styles.announcementTitle}>{announcement.title}</Text>
                      <Text style={styles.announcementDate}>Paylaşıldı: {formatDate(announcement.createdAt)}</Text>
                    </View>

                    {userCanDelete ? (
                      <Pressable
                        onPress={() => deleteAnnouncement(announcement.id)}
                        style={({ pressed }) => [styles.deleteButton, pressed ? styles.pressed : null]}
                      >
                        <Text style={styles.deleteButtonText}>Sil</Text>
                      </Pressable>
                    ) : null}
                  </View>

                  <Text style={styles.announcementMessage}>{announcement.message}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Henüz duyuru yok</Text>
                <Text style={styles.emptyText}>Yeni duyuru oluştur butonuna basarak ilk duyurunu ekleyebilirsin.</Text>
              </View>
            )}
          </View>

          <Text style={styles.statusText}>{statusMessage}</Text>
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
  actionRowTop: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginBottom: theme.spacing["2xl"],
  },
  actionButton: { flexGrow: 1 },
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
  sectionHeaderText: { flex: 1 },
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.lg,
  },
  textArea: { minHeight: 120, textAlignVertical: "top" },
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
    fontWeight: theme.fontWeights.black,
  },
  targetButtonTextSelected: { color: theme.colors.text.inverse },
  publishRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md },
  announcementList: { gap: theme.spacing.md },
  announcementCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
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
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  announcementTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  announcementDate: {
    color: theme.colors.text.muted,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
  },
  announcementMessage: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.lg,
  },
  deleteButton: {
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background.surface,
  },
  deleteButtonText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  emptyCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  emptyTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.md,
  },
  statusText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.xl,
    lineHeight: theme.lineHeights.md,
  },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
});
