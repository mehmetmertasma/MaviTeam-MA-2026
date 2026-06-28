import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { theme } from "@/constants/theme";
import { teamSyncService } from "@/services/teamSyncService";
import type { Announcement, TeamSyncAppData } from "@/types/teamSync";

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

export default function AnnouncementsScreen() {
  const [appData, setAppData] = useState<TeamSyncAppData | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTargetId, setSelectedTargetId] = useState("all-club");
  const [statusMessage, setStatusMessage] = useState("Duyurular merkezi TeamSync datasından yüklenecek.");

  const loadAnnouncementsData = useCallback(async () => {
    try {
      const loadedAppData = await teamSyncService.getAppData();
      setAppData(loadedAppData);
      setStatusMessage("Duyurular merkezi TeamSync datasından yüklendi.");
    } catch {
      setStatusMessage("Duyurular yüklenirken bir sorun oluştu.");
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
  const canPublish = title.trim().length > 0 && message.trim().length > 0;

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

    if (!canPublish) {
      setStatusMessage("Başlık ve mesaj alanı boş bırakılamaz.");
      return;
    }

    const selectedTarget =
      targetOptions.find((target) => target.id === selectedTargetId) ?? targetOptions[0];

    try {
      const nextAppData = await teamSyncService.createAnnouncement({
        clubId: appData.club.id,
        title: title.trim(),
        message: message.trim(),
        targetType: selectedTarget.targetType,
        targetTeamId: selectedTarget.targetTeamId,
        createdByUserId: appData.currentUser.id,
      });

      setAppData(nextAppData);
      clearForm();
      setShowCreateForm(false);
      setStatusMessage("Duyuru merkezi data service içine yayınlandı.");
    } catch {
      setStatusMessage("Duyuru yayınlanırken bir sorun oluştu.");
    }
  }

  async function deleteAnnouncement(announcementId: string) {
    try {
      const nextAppData = await teamSyncService.removeAnnouncement(announcementId);
      setAppData(nextAppData);
      setStatusMessage("Duyuru merkezi datadan silindi.");
    } catch {
      setStatusMessage("Duyuru silinirken bir sorun oluştu.");
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
            Bu sayfa artık ayrı local storage kullanmıyor. Duyurular `appData.announcements` içinden gelir ve service layer üzerinden kaydedilir.
          </Text>
        </View>

        <View style={styles.actionRowTop}>
          <AppButton
            title={showCreateForm ? "Form açık" : "Yeni duyuru oluştur"}
            onPress={() => {
              setShowCreateForm(true);
              setStatusMessage("Yeni duyuru bilgilerini doldurabilirsin.");
            }}
            disabled={showCreateForm}
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
                title="Duyuruyu yayınla"
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

                    <Pressable
                      onPress={() => deleteAnnouncement(announcement.id)}
                      style={({ pressed }) => [styles.deleteButton, pressed ? styles.pressed : null]}
                    >
                      <Text style={styles.deleteButtonText}>Sil</Text>
                    </Pressable>
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
