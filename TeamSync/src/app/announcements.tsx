import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  Image,
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

type AnnouncementAttachmentType = "image" | "video" | "file";

type AnnouncementAttachment = {
  id: number;
  type: AnnouncementAttachmentType;
  name: string;
  uri: string;
  mimeType?: string;
  size?: number;
};

type Announcement = {
  id: number;
  title: string;
  message: string;
  target: AnnouncementTarget;
  createdAt: string;
  attachments: AnnouncementAttachment[];
};

const ANNOUNCEMENTS_STORAGE_KEY = "teamsync_announcements_data";

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
    message: "U16 Erkek takımı için cuma antrenmanı saat 18:30 olarak güncellendi.",
    target: "U16 Erkek",
    createdAt: "Bugün",
    attachments: [],
  },
  {
    id: 2,
    title: "Aidat hatırlatması",
    message: "Bu ayın aidat ödemeleri için son tarih pazar günüdür.",
    target: "Tüm Kulüp",
    createdAt: "Dün",
    attachments: [],
  },
];

function getCreatedAtLabel() {
  const now = new Date();

  const time = now.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `Şimdi · ${time}`;
}

function getAttachmentTypeLabel(type: AnnouncementAttachmentType) {
  if (type === "image") {
    return "Fotoğraf";
  }

  if (type === "video") {
    return "Video";
  }

  return "Dosya";
}

function formatFileSize(size?: number) {
  if (!size) {
    return "Boyut bilinmiyor";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getMediaAttachmentName(asset: ImagePicker.ImagePickerAsset) {
  if (asset.fileName) {
    return asset.fileName;
  }

  if (asset.type === "video") {
    return "Video eki";
  }

  return "Fotoğraf eki";
}

export default function AnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTarget, setSelectedTarget] =
    useState<AnnouncementTarget>("Tüm Kulüp");
  const [draftAttachments, setDraftAttachments] = useState<AnnouncementAttachment[]>([]);
  const [statusMessage, setStatusMessage] = useState(
    "Duyurular local storage ile kaydedilecek."
  );

  const canPublish = title.trim().length > 0 && message.trim().length > 0;

  useEffect(() => {
    async function loadSavedAnnouncements() {
      try {
        const savedAnnouncements = await AsyncStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY);

        if (savedAnnouncements === null) {
          return;
        }

        const parsedAnnouncements = JSON.parse(savedAnnouncements) as Announcement[];
        setAnnouncements(parsedAnnouncements);
        setStatusMessage("Kaydedilmiş duyurular yüklendi.");
      } catch {
        setStatusMessage("Duyurular yüklenirken bir sorun oluştu.");
      }
    }

    loadSavedAnnouncements();
  }, []);

  async function saveAnnouncements(updatedAnnouncements: Announcement[]) {
    try {
      await AsyncStorage.setItem(
        ANNOUNCEMENTS_STORAGE_KEY,
        JSON.stringify(updatedAnnouncements)
      );

      setAnnouncements(updatedAnnouncements);
      setStatusMessage("Duyurular kaydedildi.");
    } catch {
      setStatusMessage("Duyurular kaydedilirken bir sorun oluştu.");
    }
  }

  async function pickMediaAttachment() {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        setStatusMessage("Fotoğraf/video seçmek için izin gerekli.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];

      const newAttachment: AnnouncementAttachment = {
        id: Date.now(),
        type: asset.type === "video" ? "video" : "image",
        name: getMediaAttachmentName(asset),
        uri: asset.uri,
        mimeType: asset.mimeType,
        size: asset.fileSize,
      };

      setDraftAttachments((currentAttachments) => [
        ...currentAttachments,
        newAttachment,
      ]);
      setStatusMessage("Fotoğraf/video duyuruya eklendi.");
    } catch {
      setStatusMessage("Fotoğraf/video eklenirken bir sorun oluştu.");
    }
  }

  async function pickFileAttachment() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: false,
        base64: false,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];

      const attachmentType: AnnouncementAttachmentType = asset.mimeType?.startsWith("image/")
        ? "image"
        : asset.mimeType?.startsWith("video/")
          ? "video"
          : "file";

      const newAttachment: AnnouncementAttachment = {
        id: Date.now(),
        type: attachmentType,
        name: asset.name,
        uri: asset.uri,
        mimeType: asset.mimeType,
        size: asset.size,
      };

      setDraftAttachments((currentAttachments) => [
        ...currentAttachments,
        newAttachment,
      ]);
      setStatusMessage("Dosya duyuruya eklendi.");
    } catch {
      setStatusMessage("Dosya eklenirken bir sorun oluştu.");
    }
  }

  function removeDraftAttachment(attachmentId: number) {
    setDraftAttachments((currentAttachments) =>
      currentAttachments.filter((attachment) => attachment.id !== attachmentId)
    );
    setStatusMessage("Ek kaldırıldı.");
  }

  async function handlePublishAnnouncement() {
    if (!canPublish) {
      setStatusMessage("Başlık ve mesaj alanı boş bırakılamaz.");
      return;
    }

    const newAnnouncement: Announcement = {
      id: Date.now(),
      title: title.trim(),
      message: message.trim(),
      target: selectedTarget,
      createdAt: getCreatedAtLabel(),
      attachments: draftAttachments,
    };

    const updatedAnnouncements = [newAnnouncement, ...announcements];

    setTitle("");
    setMessage("");
    setSelectedTarget("Tüm Kulüp");
    setDraftAttachments([]);

    await saveAnnouncements(updatedAnnouncements);
  }

  async function deleteAnnouncement(announcementId: number) {
    const updatedAnnouncements = announcements.filter(
      (announcement) => announcement.id !== announcementId
    );

    await saveAnnouncements(updatedAnnouncements);
    setStatusMessage("Duyuru silindi.");
  }

  async function resetAnnouncements() {
    try {
      await AsyncStorage.removeItem(ANNOUNCEMENTS_STORAGE_KEY);

      setAnnouncements(initialAnnouncements);
      setTitle("");
      setMessage("");
      setSelectedTarget("Tüm Kulüp");
      setDraftAttachments([]);
      setStatusMessage("Duyurular demo haline sıfırlandı.");
    } catch {
      setStatusMessage("Duyurular sıfırlanırken bir sorun oluştu.");
    }
  }

  function renderAttachment(attachment: AnnouncementAttachment) {
    const isImage = attachment.type === "image";

    return (
      <View key={attachment.id} style={styles.attachmentCard}>
        {isImage ? (
          <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
        ) : null}

        <View style={styles.attachmentInfo}>
          <Text style={styles.attachmentType}>
            {getAttachmentTypeLabel(attachment.type)}
          </Text>
          <Text style={styles.attachmentName} numberOfLines={1}>
            {attachment.name}
          </Text>
          <Text style={styles.attachmentMeta}>{formatFileSize(attachment.size)}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.pageHeader}>
          <Text style={styles.logo}>TeamSync</Text>
          <Text style={styles.pageTitle}>Duyurular</Text>
          <Text style={styles.pageSubtitle}>
            Kulüp veya takım üyelerine duyuru yayınla.
          </Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Kulüp iletişim merkezi</Text>
          <Text style={styles.heroTitle}>Yeni duyuru oluştur</Text>
          <Text style={styles.heroSubtitle}>
            Admin olarak tüm kulübe veya seçili takıma önemli duyurular gönderebilirsin.
            Fotoğraf, video veya dosya eki ekleyebilirsin.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Duyuru bilgileri</Text>
              <Text style={styles.sectionSubtitle}>
                Başlığı, mesajı ve hedef kitleyi seç.
              </Text>
            </View>

            <Text style={styles.statusPill}>{announcements.length} aktif</Text>
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
              const isSelected = selectedTarget === target;

              return (
                <Pressable
                  key={target}
                  onPress={() => setSelectedTarget(target)}
                  style={({ pressed }) => [
                    styles.targetButton,
                    isSelected ? styles.targetButtonSelected : null,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.targetButtonText,
                      isSelected ? styles.targetButtonTextSelected : null,
                    ]}
                  >
                    {target}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Ekler</Text>
          <View style={styles.attachmentButtonRow}>
            <Pressable
              onPress={pickMediaAttachment}
              style={({ pressed }) => [styles.attachmentButton, pressed ? styles.pressed : null]}
            >
              <Text style={styles.attachmentButtonText}>Fotoğraf / Video ekle</Text>
            </Pressable>

            <Pressable
              onPress={pickFileAttachment}
              style={({ pressed }) => [styles.attachmentButton, pressed ? styles.pressed : null]}
            >
              <Text style={styles.attachmentButtonText}>Dosya ekle</Text>
            </Pressable>
          </View>

          {draftAttachments.length > 0 ? (
            <View style={styles.draftAttachmentList}>
              {draftAttachments.map((attachment) => (
                <View key={attachment.id} style={styles.draftAttachmentCard}>
                  <View style={styles.attachmentInfo}>
                    <Text style={styles.attachmentType}>
                      {getAttachmentTypeLabel(attachment.type)}
                    </Text>
                    <Text style={styles.attachmentName} numberOfLines={1}>
                      {attachment.name}
                    </Text>
                    <Text style={styles.attachmentMeta}>{formatFileSize(attachment.size)}</Text>
                  </View>

                  <Pressable
                    onPress={() => removeDraftAttachment(attachment.id)}
                    style={({ pressed }) => [styles.removeButton, pressed ? styles.pressed : null]}
                  >
                    <Text style={styles.removeButtonText}>Kaldır</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.publishRow}>
            <AppButton
              title="Duyuruyu yayınla"
              onPress={handlePublishAnnouncement}
              disabled={!canPublish}
              style={styles.publishButton}
            />

            <AppButton
              title="Sıfırla"
              variant="ghost"
              onPress={resetAnnouncements}
              style={styles.resetButton}
            />
          </View>

          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yayınlanan duyurular</Text>

          <View style={styles.announcementList}>
            {announcements.length > 0 ? (
              announcements.map((announcement) => (
                <View key={announcement.id} style={styles.announcementCard}>
                  <View style={styles.announcementHeaderRow}>
                    <View style={styles.announcementTextArea}>
                      <Text style={styles.announcementTarget}>{announcement.target}</Text>
                      <Text style={styles.announcementTitle}>{announcement.title}</Text>
                      <Text style={styles.announcementDate}>{announcement.createdAt}</Text>
                    </View>

                    <Pressable
                      onPress={() => deleteAnnouncement(announcement.id)}
                      style={({ pressed }) => [styles.deleteButton, pressed ? styles.pressed : null]}
                    >
                      <Text style={styles.deleteButtonText}>Sil</Text>
                    </Pressable>
                  </View>

                  <Text style={styles.announcementMessage}>{announcement.message}</Text>

                  {announcement.attachments.length > 0 ? (
                    <View style={styles.attachmentList}>
                      {announcement.attachments.map(renderAttachment)}
                    </View>
                  ) : null}
                </View>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Henüz duyuru yok</Text>
                <Text style={styles.emptyText}>
                  İlk duyurunu yukarıdaki formdan oluşturabilirsin.
                </Text>
              </View>
            )}
          </View>
        </View>
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
    paddingHorizontal: theme.spacing["2xl"],
    paddingBottom: theme.spacing["2xl"],
  },
  container: {
    width: "100%",
    maxWidth: 980,
    alignSelf: "center",
  },
  pageHeader: {
    marginBottom: theme.spacing["2xl"],
  },
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
  sectionHeaderText: {
    flex: 1,
  },
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
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  targetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
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
  targetButtonText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  targetButtonTextSelected: {
    color: theme.colors.text.inverse,
  },
  attachmentButtonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  attachmentButton: {
    backgroundColor: theme.colors.brand.primarySoft,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.brand.primarySoft,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  attachmentButtonText: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  draftAttachmentList: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  draftAttachmentCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentType: {
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  attachmentName: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
  },
  attachmentMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.xs,
  },
  attachmentImage: {
    width: 54,
    height: 54,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background.subtle,
  },
  removeButton: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  removeButtonText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  publishRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  publishButton: {
    flexGrow: 1,
  },
  resetButton: {
    flexGrow: 1,
  },
  statusText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.lg,
  },
  announcementList: {
    gap: theme.spacing.lg,
  },
  announcementCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.xl,
  },
  announcementHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  announcementTextArea: {
    flex: 1,
  },
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
    lineHeight: theme.lineHeights.md,
  },
  deleteButton: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  deleteButtonText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  attachmentList: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  attachmentCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  emptyCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
});
