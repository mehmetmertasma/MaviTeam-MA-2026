import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

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

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "TS";
}

export default function ProfileScreen() {
  const [profileData, setProfileData] = useState<ProfileData>(startingProfileData);
  const [draftProfileData, setDraftProfileData] = useState<ProfileData>(startingProfileData);
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
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(draftProfileData));
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

  const displayData = isEditing ? draftProfileData : profileData;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.pageHeader}>
          <Text style={styles.logo}>TeamSync</Text>
          <Text style={styles.pageTitle}>Profil</Text>
          <Text style={styles.pageSubtitle}>
            Hesap bilgilerini, kulüp rolünü ve bildirim tercihlerini yönet.
          </Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.profileHeroRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(displayData.name)}</Text>
            </View>

            <View style={styles.profileHeroText}>
              <Text style={styles.heroLabel}>Hesap merkezi</Text>
              <Text style={styles.heroTitle}>{displayData.name}</Text>
              <Text style={styles.heroSubtitle}>
                {displayData.email} · {displayData.club}
              </Text>
            </View>
          </View>

          {!isEditing ? (
            <AppButton
              title="Profili düzenle"
              variant="secondary"
              accessibilityLabel="Profil bilgilerini düzenle"
              style={styles.heroButton}
              onPress={startEditing}
            />
          ) : (
            <View style={styles.actionRow}>
              <AppButton
                title="Kaydet"
                variant="secondary"
                accessibilityLabel="Profil bilgilerini kaydet"
                style={styles.actionButton}
                onPress={saveProfile}
              />

              <AppButton
                title="Vazgeç"
                variant="secondary"
                accessibilityLabel="Profil düzenlemeyi iptal et"
                style={styles.actionButton}
                onPress={cancelEditing}
              />
            </View>
          )}
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>1</Text>
            <Text style={styles.statLabel}>Kulüp</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>1</Text>
            <Text style={styles.statLabel}>Takım</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Rol sistemi</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>
                {isEditing ? "Profil bilgilerini düzenle" : "Kulüp özeti"}
              </Text>
              <Text style={styles.sectionSubtitle}>{statusMessage}</Text>
            </View>

            <Text style={styles.statusPill}>{displayData.role}</Text>
          </View>

          {isEditing ? (
            <View style={styles.form}>
              <View style={styles.formGrid}>
                <View style={styles.formField}>
                  <Text style={styles.inputLabel}>Ad Soyad</Text>
                  <TextInput
                    value={draftProfileData.name}
                    onChangeText={(value) => updateDraftProfile("name", value)}
                    placeholder="Ad Soyad"
                    placeholderTextColor={theme.colors.text.muted}
                    style={styles.input}
                  />
                </View>

                <View style={styles.formField}>
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
              </View>

              <View style={styles.formGrid}>
                <View style={styles.formField}>
                  <Text style={styles.inputLabel}>Kulüp</Text>
                  <TextInput
                    value={draftProfileData.club}
                    onChangeText={(value) => updateDraftProfile("club", value)}
                    placeholder="Kulüp adı"
                    placeholderTextColor={theme.colors.text.muted}
                    style={styles.input}
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.inputLabel}>Takım</Text>
                  <TextInput
                    value={draftProfileData.team}
                    onChangeText={(value) => updateDraftProfile("team", value)}
                    placeholder="Takım adı"
                    placeholderTextColor={theme.colors.text.muted}
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.formGrid}>
                <View style={styles.formField}>
                  <Text style={styles.inputLabel}>Rol</Text>
                  <TextInput
                    value={draftProfileData.role}
                    onChangeText={(value) => updateDraftProfile("role", value)}
                    placeholder="Rol"
                    placeholderTextColor={theme.colors.text.muted}
                    style={styles.input}
                  />
                </View>

                <View style={styles.formField}>
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

              <Text style={styles.inputLabel}>Üyelik modeli</Text>
              <TextInput
                value={draftProfileData.membership}
                onChangeText={(value) => updateDraftProfile("membership", value)}
                placeholder="Üyelik modeli"
                placeholderTextColor={theme.colors.text.muted}
                style={styles.input}
              />
            </View>
          ) : (
            <View style={styles.infoList}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Kulüp</Text>
                <Text style={styles.infoValue}>{profileData.club}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Takım</Text>
                <Text style={styles.infoValue}>{profileData.team}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Rol</Text>
                <Text style={styles.infoValue}>{profileData.role}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Aktif sezon</Text>
                <Text style={styles.infoValue}>{profileData.season}</Text>
              </View>

              <View style={styles.infoRowLast}>
                <Text style={styles.infoLabel}>Üyelik</Text>
                <Text style={styles.infoValue}>{profileData.membership}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bildirimler</Text>
          <Text style={styles.sectionSubtitle}>
            Gerçek push notification sistemi Firebase/Expo notifications ile bağlanacak.
          </Text>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceTextArea}>
              <Text style={styles.preferenceTitle}>Push bildirimleri</Text>
              <Text style={styles.preferenceSubtitle}>Duyuru, program ve mesaj bildirimleri.</Text>
            </View>
            <Switch value={pushNotifications} onValueChange={setPushNotifications} />
          </View>

          <View style={styles.preferenceRowLast}>
            <View style={styles.preferenceTextArea}>
              <Text style={styles.preferenceTitle}>E-posta bildirimleri</Text>
              <Text style={styles.preferenceSubtitle}>Önemli kulüp güncellemeleri için e-posta.</Text>
            </View>
            <Switch value={emailNotifications} onValueChange={setEmailNotifications} />
          </View>
        </View>

        <View style={styles.actionRowBottom}>
          {!isEditing ? (
            <AppButton
              title="Profili düzenle"
              onPress={startEditing}
              style={styles.actionButton}
            />
          ) : null}

          <AppButton
            title="Demo profili sıfırla"
            variant="secondary"
            accessibilityLabel="Profil bilgilerini sıfırla"
            style={styles.actionButton}
            onPress={resetProfile}
          />
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
    lineHeight: theme.lineHeights.xl,
  },
  heroCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    padding: theme.spacing["3xl"],
    marginBottom: theme.spacing["2xl"],
    ...theme.shadows.md,
  },
  profileHeroRow: {
    flexDirection: "row",
    gap: theme.spacing.lg,
    alignItems: "center",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
  },
  profileHeroText: { flex: 1 },
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
  heroButton: { marginTop: theme.spacing["2xl"], alignSelf: "flex-start" },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing["2xl"],
  },
  statCard: {
    flexGrow: 1,
    flexBasis: 145,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    ...theme.shadows.sm,
  },
  statValue: {
    color: theme.colors.brand.primary,
    fontSize: theme.fontSizes["4xl"],
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
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
  sectionHeaderText: { flex: 1 },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
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
  form: { gap: theme.spacing.md },
  formGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.lg },
  formField: { flexGrow: 1, flexBasis: 220 },
  inputLabel: {
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
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.lg,
  },
  infoList: { gap: 0 },
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
    paddingTop: theme.spacing.lg,
  },
  infoLabel: {
    flex: 1,
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
  },
  infoValue: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
    textAlign: "right",
  },
  preferenceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.default,
  },
  preferenceRowLast: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  preferenceTextArea: { flex: 1 },
  preferenceTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  preferenceSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginTop: theme.spacing["2xl"],
  },
  actionRowBottom: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginBottom: theme.spacing["2xl"],
  },
  actionButton: { flexGrow: 1 },
});
