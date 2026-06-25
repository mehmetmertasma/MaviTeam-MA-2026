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

type AnnouncementTarget = "Tüm Kulüp" | "A Takım" | "U16 Erkek" | "U14 Kız";

type Announcement = {
  id: number;
  title: string;
  message: string;
  target: AnnouncementTarget;
  createdAt: string;
};

const targetOptions: AnnouncementTarget[] = [
  "Tüm Kulüp",
  "A Takım",
  "U16 Erkek",
  "U14 Kız",
];

const initialAnnouncements: Announcement[] = [
  {
    id: 1,
    title: "Antrenman saati güncellendi",
    message:
      "U16 Erkek takımı için cuma antrenmanı saat 18:30 olarak güncellendi.",
    target: "U16 Erkek",
    createdAt: "Bugün",
  },
  {
    id: 2,
    title: "Aidat hatırlatması",
    message: "Bu ayın aidat ödemeleri için son tarih pazar günüdür.",
    target: "Tüm Kulüp",
    createdAt: "Dün",
  },
];

export default function AnnouncementsScreen() {
  const [announcements, setAnnouncements] =
    useState<Announcement[]>(initialAnnouncements);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTarget, setSelectedTarget] =
    useState<AnnouncementTarget>("Tüm Kulüp");

  const canPublish = title.trim().length > 0 && message.trim().length > 0;

  function handlePublishAnnouncement() {
    if (!canPublish) {
      return;
    }

    const newAnnouncement: Announcement = {
      id: Date.now(),
      title: title.trim(),
      message: message.trim(),
      target: selectedTarget,
      createdAt: "Şimdi",
    };

    setAnnouncements([newAnnouncement, ...announcements]);

    setTitle("");
    setMessage("");
    setSelectedTarget("Tüm Kulüp");
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>TeamSync</Text>

          <View>
            <Text style={styles.pageTitle}>Duyurular</Text>
            <Text style={styles.pageSubtitle}>
              Kulüp veya takım üyelerine duyuru yayınla.
            </Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Kulüp iletişim merkezi</Text>

          <Text style={styles.heroTitle}>Yeni duyuru oluştur</Text>

          <Text style={styles.heroSubtitle}>
            Admin olarak tüm kulübe veya seçili takıma önemli duyurular
            gönderebilirsin.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Duyuru bilgileri</Text>

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
              const isSelected = selectedTarget === target;

              return (
                <Pressable
                  key={target}
                  onPress={() => setSelectedTarget(target)}
                  style={({ pressed }) => [
                    styles.targetButton,
                    isSelected && styles.targetButtonSelected,
                    pressed && styles.targetButtonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.targetButtonText,
                      isSelected && styles.targetButtonTextSelected,
                    ]}
                  >
                    {target}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            disabled={!canPublish}
            onPress={handlePublishAnnouncement}
            style={({ pressed }) => [
              styles.publishButton,
              pressed && styles.publishButtonPressed,
              !canPublish && styles.publishButtonDisabled,
            ]}
          >
            <Text style={styles.publishButtonText}>Duyuruyu yayınla</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Yayınlanan duyurular</Text>
            <Text style={styles.countText}>{announcements.length} duyuru</Text>
          </View>

          <View style={styles.announcementList}>
            {announcements.map((announcement) => (
              <View key={announcement.id} style={styles.announcementCard}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.announcementTarget}>
                    {announcement.target}
                  </Text>

                  <Text style={styles.createdAt}>{announcement.createdAt}</Text>
                </View>

                <Text style={styles.announcementTitle}>
                  {announcement.title}
                </Text>

                <Text style={styles.announcementMessage}>
                  {announcement.message}
                </Text>
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
    minHeight: 120,
    textAlignVertical: "top",
  },
  targetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  targetButton: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  targetButtonSelected: {
    backgroundColor: theme.colors.brand.primary,
    borderColor: theme.colors.brand.primary,
  },
  targetButtonPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  targetButtonText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.secondary,
  },
  targetButtonTextSelected: {
    color: theme.colors.text.inverse,
  },
  publishButton: {
    backgroundColor: theme.colors.brand.primary,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
    marginTop: theme.spacing.sm,
  },
  publishButtonPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  publishButtonDisabled: {
    opacity: 0.48,
  },
  publishButtonText: {
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
  announcementList: {
    gap: theme.spacing.md,
  },
  announcementCard: {
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
  announcementTarget: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  createdAt: {
    color: theme.colors.text.muted,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.extrabold,
  },
  announcementTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  announcementMessage: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.md,
  },
  backButton: {
    marginBottom: theme.spacing["2xl"],
  },
});