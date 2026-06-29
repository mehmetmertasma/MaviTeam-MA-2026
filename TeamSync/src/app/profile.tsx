import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { theme } from "@/constants/theme";
import { teamSyncService } from "@/services/teamSyncService";
import type { TeamSyncAppData } from "@/types/teamSync";

type ProfileFormData = {
  fullName: string;
  email: string;
  clubName: string;
  clubSport: string;
  clubCity: string;
  clubCode: string;
};

const emptyFormData: ProfileFormData = {
  fullName: "",
  email: "",
  clubName: "",
  clubSport: "",
  clubCity: "",
  clubCode: "",
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

function getFormDataFromAppData(appData: TeamSyncAppData): ProfileFormData {
  return {
    fullName: appData.currentUser.fullName,
    email: appData.currentUser.email,
    clubName: appData.club.name,
    clubSport: appData.club.sport,
    clubCity: appData.club.city,
    clubCode: appData.club.code,
  };
}

export default function ProfileScreen() {
  const [appData, setAppData] = useState<TeamSyncAppData | null>(null);
  const [draftProfileData, setDraftProfileData] = useState<ProfileFormData>(emptyFormData);
  const [isEditing, setIsEditing] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Profil merkezi TeamSync datasından yüklenecek.");

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadProfileData() {
        try {
          const loadedAppData = await teamSyncService.getAppData();

          if (isActive) {
            setAppData(loadedAppData);
            setDraftProfileData(getFormDataFromAppData(loadedAppData));
            setStatusMessage("Profil merkezi TeamSync datasından yüklendi.");
          }
        } catch {
          if (isActive) {
            setStatusMessage("Profil bilgileri yüklenirken bir sorun oluştu.");
          }
        }
      }

      loadProfileData();

      return () => {
        isActive = false;
      };
    }, [])
  );

  function startEditing() {
    if (appData !== null) {
      setDraftProfileData(getFormDataFromAppData(appData));
    }

    setIsEditing(true);
    setStatusMessage("Düzenleme modu açık.");
  }

  function cancelEditing() {
    if (appData !== null) {
      setDraftProfileData(getFormDataFromAppData(appData));
    }

    setIsEditing(false);
    setStatusMessage("Değişiklikler iptal edildi.");
  }

  async function saveProfile() {
    try {
      await teamSyncService.updateCurrentUser({
        fullName: draftProfileData.fullName.trim() || "TeamSync Kullanıcı",
        email: draftProfileData.email.trim().toLowerCase() || "owner@teamsync.app",
      });

      const nextAppData = await teamSyncService.updateCurrentClub({
        name: draftProfileData.clubName.trim() || "TeamSync Kulübü",
        sport: draftProfileData.clubSport.trim() || "Voleybol",
        city: draftProfileData.clubCity.trim() || "Şehir yok",
        code: draftProfileData.clubCode.trim().toUpperCase() || "TEAMSYNC",
      });

      setAppData(nextAppData);
      setDraftProfileData(getFormDataFromAppData(nextAppData));
      setIsEditing(false);
      setStatusMessage("Profil ve kulüp bilgileri merkezi data service içine kaydedildi.");
    } catch {
      setStatusMessage("Profil kaydedilirken bir sorun oluştu.");
    }
  }

  async function resetProfile() {
    try {
      const resetData = await teamSyncService.resetAppData();

      setAppData(resetData);
      setDraftProfileData(getFormDataFromAppData(resetData));
      setIsEditing(false);
      setStatusMessage("Merkezi başlangıç datasına dönüldü.");
    } catch {
      setStatusMessage("Profil sıfırlanırken bir sorun oluştu.");
    }
  }

  function updateDraftProfile(field: keyof ProfileFormData, value: string) {
    setDraftProfileData((currentData) => ({
      ...currentData,
      [field]: value,
    }));
  }

  if (appData === null) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
        <View style={styles.container}>
          <View style={styles.pageHeader}>
            <Text style={styles.logo}>TeamSync</Text>
            <Text style={styles.pageTitle}>Profil</Text>
            <Text style={styles.pageSubtitle}>{statusMessage}</Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  const currentUser = appData.currentUser;
  const currentClub = appData.club;
  const primaryTeam = appData.teams.find((team) => currentUser.teamIds.includes(team.id));
  const displayData = isEditing ? draftProfileData : getFormDataFromAppData(appData);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.pageHeader}>
          <Text style={styles.logo}>TeamSync</Text>
          <Text style={styles.pageTitle}>Profil</Text>
          <Text style={styles.pageSubtitle}>
            Hesap ve kulüp bilgilerini merkezi data service üzerinden yönet.
          </Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.profileHeroRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(displayData.fullName)}</Text>
            </View>

            <View style={styles.profileHeroText}>
              <Text style={styles.heroLabel}>Hesap merkezi</Text>
              <Text style={styles.heroTitle}>{displayData.fullName}</Text>
              <Text style={styles.heroSubtitle}>
                {displayData.email || "E-posta yok"} · {displayData.clubName}
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
            <Text style={styles.statValue}>{currentUser.teamIds.length}</Text>
            <Text style={styles.statLabel}>Takım erişimi</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{appData.users.filter((user) => user.status === "active").length}</Text>
            <Text style={styles.statLabel}>Aktif üye</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>
                {isEditing ? "Profil ve kulüp bilgilerini düzenle" : "Merkezi profil özeti"}
              </Text>
              <Text style={styles.sectionSubtitle}>{statusMessage}</Text>
            </View>
          </View>

          {isEditing ? (
            <View style={styles.form}>
              <View style={styles.formGrid}>
                <View style={styles.formField}>
                  <Text style={styles.inputLabel}>Ad Soyad</Text>
                  <TextInput value={draftProfileData.fullName} onChangeText={(value) => updateDraftProfile("fullName", value)} placeholder="Ad Soyad" placeholderTextColor={theme.colors.text.muted} style={styles.input} />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.inputLabel}>E-posta</Text>
                  <TextInput value={draftProfileData.email} onChangeText={(value) => updateDraftProfile("email", value)} placeholder="E-posta" placeholderTextColor={theme.colors.text.muted} keyboardType="email-address" autoCapitalize="none" style={styles.input} />
                </View>
              </View>

              <View style={styles.formGrid}>
                <View style={styles.formField}>
                  <Text style={styles.inputLabel}>Kulüp adı</Text>
                  <TextInput value={draftProfileData.clubName} onChangeText={(value) => updateDraftProfile("clubName", value)} placeholder="Kulüp adı" placeholderTextColor={theme.colors.text.muted} style={styles.input} />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.inputLabel}>Branş</Text>
                  <TextInput value={draftProfileData.clubSport} onChangeText={(value) => updateDraftProfile("clubSport", value)} placeholder="Branş" placeholderTextColor={theme.colors.text.muted} style={styles.input} />
                </View>
              </View>

              <View style={styles.formGrid}>
                <View style={styles.formField}>
                  <Text style={styles.inputLabel}>Şehir</Text>
                  <TextInput value={draftProfileData.clubCity} onChangeText={(value) => updateDraftProfile("clubCity", value)} placeholder="Şehir" placeholderTextColor={theme.colors.text.muted} style={styles.input} />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.inputLabel}>Kulüp kodu</Text>
                  <TextInput value={draftProfileData.clubCode} onChangeText={(value) => updateDraftProfile("clubCode", value.toUpperCase())} placeholder="Kulüp kodu" placeholderTextColor={theme.colors.text.muted} autoCapitalize="characters" style={styles.input} />
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.infoList}>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Kullanıcı</Text><Text style={styles.infoValue}>{currentUser.fullName}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>E-posta</Text><Text style={styles.infoValue}>{currentUser.email || "E-posta yok"}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Kulüp</Text><Text style={styles.infoValue}>{currentClub.name}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Takım</Text><Text style={styles.infoValue}>{primaryTeam?.name ?? "Takım seçilmedi"}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Kulüp kodu</Text><Text style={styles.infoValue}>{currentClub.code}</Text></View>
              <View style={styles.infoRowLast}><Text style={styles.infoLabel}>Data modu</Text><Text style={styles.infoValue}>TeamSync service layer</Text></View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bildirimler</Text>
          <Text style={styles.sectionSubtitle}>
            Şimdilik local state. Gerçek push notification sistemi Firebase/Expo notifications ile bağlanacak.
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
          {!isEditing ? <AppButton title="Profili düzenle" onPress={startEditing} style={styles.actionButton} /> : null}
          <AppButton title="Başlangıç datasına dön" variant="secondary" accessibilityLabel="Başlangıç datasına dön" style={styles.actionButton} onPress={resetProfile} />
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
  pageSubtitle: { color: theme.colors.text.inverse, opacity: 0.76, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.semibold, lineHeight: theme.lineHeights.xl },
  heroCard: { backgroundColor: theme.colors.background.surface, borderRadius: theme.radius["2xl"], padding: theme.spacing["3xl"], marginBottom: theme.spacing["2xl"], ...theme.shadows.md },
  profileHeroRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing.lg },
  avatar: { width: 74, height: 74, borderRadius: theme.radius.full, backgroundColor: theme.colors.brand.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: theme.colors.text.inverse, fontSize: theme.fontSizes["2xl"], fontWeight: theme.fontWeights.black },
  profileHeroText: { flex: 1 },
  heroLabel: { alignSelf: "flex-start", backgroundColor: theme.colors.brand.primarySoft, color: theme.colors.text.brand, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.extrabold, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.lg, borderRadius: theme.radius.full, marginBottom: theme.spacing.md },
  heroTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes["4xl"], fontWeight: theme.fontWeights.black, lineHeight: theme.lineHeights["4xl"], marginBottom: theme.spacing.sm },
  heroSubtitle: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.semibold, lineHeight: theme.lineHeights.xl },
  heroButton: { marginTop: theme.spacing["2xl"], alignSelf: "flex-start" },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md, marginTop: theme.spacing["2xl"] },
  actionButton: { minWidth: 160 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.lg, marginBottom: theme.spacing["2xl"] },
  statCard: { flexGrow: 1, flexBasis: 160, backgroundColor: theme.colors.background.surface, borderRadius: theme.radius.xl, padding: theme.spacing.xl, borderWidth: 1, borderColor: theme.colors.border.default, ...theme.shadows.sm },
  statValue: { color: theme.colors.brand.primary, fontSize: theme.fontSizes["4xl"], fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.xs },
  statLabel: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.extrabold },
  section: { backgroundColor: theme.colors.background.surface, borderRadius: theme.radius["2xl"], padding: theme.spacing["2xl"], marginBottom: theme.spacing["2xl"], borderWidth: 1, borderColor: theme.colors.border.default, ...theme.shadows.sm },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: theme.spacing.lg, marginBottom: theme.spacing.xl },
  sectionHeaderText: { flex: 1 },
  sectionTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes["2xl"], fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.md },
  sectionSubtitle: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, lineHeight: theme.lineHeights.md },
  statusPill: { backgroundColor: theme.colors.brand.primarySoft, color: theme.colors.text.brand, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.black, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.lg, borderRadius: theme.radius.full },
  form: { gap: theme.spacing.lg },
  formGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.lg },
  formField: { flex: 1, minWidth: 240 },
  inputLabel: { color: theme.colors.text.primary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.extrabold, marginBottom: theme.spacing.sm },
  input: { minHeight: 52, borderWidth: 1, borderColor: theme.colors.border.default, borderRadius: theme.radius.lg, backgroundColor: theme.colors.background.surface, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, color: theme.colors.text.primary, fontSize: theme.fontSizes.lg },
  infoList: { width: "100%" },
  infoRow: { borderBottomWidth: 1, borderBottomColor: theme.colors.border.default, paddingVertical: theme.spacing.lg, gap: theme.spacing.sm },
  infoRowLast: { paddingTop: theme.spacing.lg, gap: theme.spacing.sm },
  infoLabel: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.extrabold, textTransform: "uppercase" },
  infoValue: { color: theme.colors.text.primary, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.black },
  preferenceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.colors.border.default, paddingVertical: theme.spacing.lg },
  preferenceRowLast: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.lg, paddingTop: theme.spacing.lg },
  preferenceTextArea: { flex: 1 },
  preferenceTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.xs },
  preferenceSubtitle: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, lineHeight: theme.lineHeights.md },
  actionRowBottom: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md, marginBottom: theme.spacing["2xl"] },
});
