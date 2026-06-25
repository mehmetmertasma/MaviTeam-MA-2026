import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppButton } from "@/components/AppButton";
import { theme } from "@/constants/theme";

type ProfileData = {
  name: string;
  email: string;
  club: string;
  team: string;
  role: string;
  season: string;
  membership: string;
};

const PROFILE_STORAGE_KEY = "teamsync_profile_data";

const startingProfileData: ProfileData = {
  name: "Mert Asma",
  email: "mertasma7580@gmail.com",
  club: "İstanbul Voleybol Kulübü",
  team: "U16 Erkek",
  role: "Kulüp yöneticisi",
  season: "2026 Bahar",
  membership: "Kulüp öder, veli/sporcu ücretsiz",
};

export default function ProfileScreen() {
  const [profileData, setProfileData] =
    useState<ProfileData>(startingProfileData);

  const [draftProfileData, setDraftProfileData] =
    useState<ProfileData>(startingProfileData);

  const [isEditing, setIsEditing] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    "Profil bilgileri local storage ile kaydedilecek."
  );

  useEffect(() => {
    async function loadSavedProfile() {
      try {
        const savedProfile = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);

        if (savedProfile === null) {
          return;
        }

        const parsedProfile = JSON.parse(savedProfile) as ProfileData;

        setProfileData(parsedProfile);
        setDraftProfileData(parsedProfile);
        setStatusMessage("Kaydedilmiş profil bilgileri yüklendi.");
      } catch {
        setStatusMessage("Profil bilgileri yüklenirken bir sorun oluştu.");
      }
    }

    loadSavedProfile();
  }, []);

  function startEditing() {
    setDraftProfileData(profileData);
    setIsEditing(true);
    setStatusMessage("Düzenleme modu açık.");
  }

  function cancelEditing() {
    setDraftProfileData(profileData);
    setIsEditing(false);
    setStatusMessage("Değişiklikler iptal edildi.");
  }

  async function saveProfile() {
    try {
      await AsyncStorage.setItem(
        PROFILE_STORAGE_KEY,
        JSON.stringify(draftProfileData)
      );

      setProfileData(draftProfileData);
      setIsEditing(false);
      setStatusMessage("Profil bilgileri kaydedildi.");
    } catch {
      setStatusMessage("Profil kaydedilirken bir sorun oluştu.");
    }
  }

  async function resetProfile() {
    try {
      await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);

      setProfileData(startingProfileData);
      setDraftProfileData(startingProfileData);
      setIsEditing(false);
      setStatusMessage("Profil demo bilgilere sıfırlandı.");
    } catch {
      setStatusMessage("Profil sıfırlanırken bir sorun oluştu.");
    }
  }

  function updateDraftProfile(field: keyof ProfileData, value: string) {
    setDraftProfileData((currentData) => ({
      ...currentData,
      [field]: value,
    }));
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>TeamSync</Text>

          <View>
            <Text style={styles.welcome}>Profil ayarları</Text>
            <Text style={styles.subtitle}>
              Hesap bilgilerini, kulüp rolünü ve bildirim tercihlerini yönet.
            </Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Hesap merkezi</Text>

          <Text style={styles.heroTitle}>{profileData.name}</Text>

          <Text style={styles.heroSubtitle}>
            {profileData.email} · {profileData.club}
          </Text>

          {!isEditing ? (
            <AppButton
              title="Profili düzenle"
              variant="secondary"
              accessibilityLabel="Profil bilgilerini düzenle"
              style={styles.heroButton}
              onPress={startEditing}
            />
          ) : (
            <View style={styles.editButtonRow}>
              <AppButton
                title="Kaydet"
                variant="secondary"
                accessibilityLabel="Profil bilgilerini kaydet"
                style={styles.editButton}
                onPress={saveProfile}
              />

              <AppButton
                title="Vazgeç"
                variant="ghost"
                accessibilityLabel="Profil düzenlemeyi iptal et"
                style={styles.editButton}
                onPress={cancelEditing}
              />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kullanıcı bilgileri</Text>

          <View style={styles.profileTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>MA</Text>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profileData.name}</Text>
              <Text style={styles.profileRole}>{profileData.role}</Text>
              <Text style={styles.profileMeta}>{profileData.team}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isEditing ? "Profil bilgilerini düzenle" : "Kulüp özeti"}
          </Text>

          {isEditing ? (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ad Soyad</Text>
                <TextInput
                  value={draftProfileData.name}
                  onChangeText={(value) => updateDraftProfile("name", value)}
                  placeholder="Ad Soyad"
                  placeholderTextColor={theme.colors.text.muted}
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>E-posta</Text>
                <TextInput
                  value={draftProfileData.email}
                  onChangeText={(value) => updateDraftProfile("email", value)}
                  placeholder="E-posta"
                  placeholderTextColor={theme.colors.text.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Kulüp</Text>
                <TextInput
                  value={draftProfileData.club}
                  onChangeText={(value) => updateDraftProfile("club", value)}
                  placeholder="Kulüp adı"
                  placeholderTextColor={theme.colors.text.muted}
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Takım</Text>
                <TextInput
                  value={draftProfileData.team}
                  onChangeText={(value) => updateDraftProfile("team", value)}
                  placeholder="Takım adı"
                  placeholderTextColor={theme.colors.text.muted}
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Aktif sezon</Text>
                <TextInput
                  value={draftProfileData.season}
                  onChangeText={(value) => updateDraftProfile("season", value)}
                  placeholder="Aktif sezon"
                  placeholderTextColor={theme.colors.text.muted}
                  style={styles.input}
                />
              </View>
            </View>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Kulüp</Text>
                <Text style={styles.infoValue}>{profileData.club}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Takım</Text>
                <Text style={styles.infoValue}>{profileData.team}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Rolün</Text>
                <Text style={styles.infoValue}>{profileData.role}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Aktif sezon</Text>
                <Text style={styles.infoValue}>{profileData.season}</Text>
              </View>

              <View style={styles.infoRowLast}>
                <Text style={styles.infoLabel}>Üyelik modeli</Text>
                <Text style={styles.infoValue}>{profileData.membership}</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bildirim ayarları</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Push bildirimleri</Text>
              <Text style={styles.settingSubtitle}>
                Antrenman, maç ve duyuru bildirimleri.
              </Text>
            </View>

            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{
                false: theme.colors.border.default,
                true: theme.colors.brand.primarySoft,
              }}
              thumbColor={
                pushNotifications
                  ? theme.colors.brand.primary
                  : theme.colors.text.muted
              }
            />
          </View>

          <View style={styles.settingDivider} />

          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>E-posta bildirimleri</Text>
              <Text style={styles.settingSubtitle}>
                Ödeme ve kulüp güncellemeleri için e-posta.
              </Text>
            </View>

            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{
                false: theme.colors.border.default,
                true: theme.colors.brand.primarySoft,
              }}
              thumbColor={
                emailNotifications
                  ? theme.colors.brand.primary
                  : theme.colors.text.muted
              }
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kaydetme durumu</Text>

          <Text style={styles.sectionSubtitle}>{statusMessage}</Text>

          <View style={styles.resetButtonWrapper}>
            <AppButton
              title="Demo profile sıfırla"
              variant="ghost"
              accessibilityLabel="Demo profil bilgilerini sıfırla"
              onPress={resetProfile}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gelecek hesap özellikleri</Text>

          <View style={styles.actionGrid}>
            <View style={styles.actionCard}>
              <Text style={styles.actionText}>Şifre değiştir</Text>
              <Text style={styles.actionMeta}>
                Firebase Auth eklenince aktif olacak
              </Text>
            </View>

            <View style={styles.actionCard}>
              <Text style={styles.actionText}>Profil fotoğrafı</Text>
              <Text style={styles.actionMeta}>
                Firebase Storage eklenince gerçek fotoğraf yüklenecek
              </Text>
            </View>

            <View style={styles.actionCard}>
              <Text style={styles.actionText}>Çıkış yap</Text>
              <Text style={styles.actionMeta}>
                Login sistemi bağlanınca gerçek çıkış yapılacak
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Demo notu</Text>

          <Text style={styles.sectionSubtitle}>
            Bu artık sadece ekranda değişmiyor. Profil bilgileri local storage
            içine kaydediliyor. Ama bu hâlâ Firebase değildir. Yani başka
            cihazda veya başka kullanıcıda görünmez.
          </Text>
        </View>

        <Link href="/dashboard" asChild>
          <AppButton
            title="Dashboard'a dön"
            variant="secondary"
            accessibilityLabel="Dashboard ekranına dön"
            style={styles.backButton}
          />
        </Link>

        <Link href="/" asChild>
          <AppButton
            title="Ana sayfaya dön"
            variant="ghost"
            accessibilityLabel="Ana sayfaya dön"
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
  welcome: {
    fontSize: theme.fontSizes["5xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.inverse,
    lineHeight: theme.lineHeights["5xl"],
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text.inverse,
    opacity: 0.76,
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
  heroButton: {
    marginTop: theme.spacing["2xl"],
    alignSelf: "flex-start",
  },
  editButtonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginTop: theme.spacing["2xl"],
  },
  editButton: {
    minWidth: 140,
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
  sectionSubtitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.md,
  },
  profileTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.brand.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  avatarText: {
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.brand,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  profileRole: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.brand,
    marginBottom: theme.spacing.xs,
  },
  profileMeta: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
  },
  form: {
    gap: theme.spacing.lg,
  },
  inputGroup: {
    gap: theme.spacing.sm,
  },
  inputLabel: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.secondary,
  },
  input: {
    backgroundColor: theme.colors.background.subtle,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.primary,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.default,
  },
  infoRowLast: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  infoLabel: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.secondary,
  },
  infoValue: {
    flex: 1,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    textAlign: "right",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.lg,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  settingSubtitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.md,
  },
  settingDivider: {
    height: 1,
    backgroundColor: theme.colors.border.default,
    marginVertical: theme.spacing.lg,
  },
  resetButtonWrapper: {
    marginTop: theme.spacing.lg,
    alignSelf: "flex-start",
  },
  actionGrid: {
    gap: theme.spacing.md,
  },
  actionCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    opacity: 0.72,
  },
  actionText: {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.brand,
    marginBottom: theme.spacing.xs,
  },
  actionMeta: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
  },
  backButton: {
    width: "100%",
    marginBottom: theme.spacing.md,
  },
});