import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppScreenLayout } from "@/components/AppScreenLayout";
import { Card } from "@/components/Card";
import { LanguageSelector } from "@/components/LanguageSelector";
import { LoadingState } from "@/components/LoadingState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { TextField } from "@/components/TextField";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/localization";
import { useAppDataContext } from "@/providers/AppDataProvider";
import { authService, getAuthErrorMessage } from "@/services/authService";
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

  return initials || "MT";
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

function getProfileCopy(language: "tr" | "en") {
  if (language === "en") {
    return {
      noEmail: "No email",
      noTeam: "No team selected",
      teamAccess: "Team access",
      activeMembers: "Active members",
      editDetails: "Edit profile and club information",
      summary: "Profile summary",
      pushNotifications: "Push notifications",
      pushDescription: "Announcements, schedule, and message notifications.",
      emailNotifications: "Email notifications",
      emailDescription: "Email updates for important club changes.",
      legalTitle: "Legal",
      legalSubtitle: "Review how your data is handled and the terms you agreed to.",
      legalPrivacy: "Privacy Policy",
      legalTerms: "Terms of Service",
      accountActions: "Account actions",
      accountActionsSubtitle: "Securely manage this session from your account center.",
      logoutTitle: "Log out",
      logoutDescription: "End this session securely and return to the login screen.",
      logoutButton: "Log out",
      signingOut: "Logging out...",
      logoutFailed: "Logout failed. Please try again.",
      editingEnabled: "Edit mode enabled.",
      editingCancelled: "Changes cancelled.",
      defaultUser: "MaviTeam User",
      defaultClub: "MaviTeam Club",
      defaultCity: "No city",
      city: "City",
    };
  }

  return {
    noEmail: "E-posta yok",
    noTeam: "Takım seçilmedi",
    teamAccess: "Takım erişimi",
    activeMembers: "Aktif üye",
    editDetails: "Profil ve kulüp bilgilerini düzenle",
    summary: "Profil özeti",
    pushNotifications: "Push bildirimleri",
    pushDescription: "Duyuru, program ve mesaj bildirimleri.",
    emailNotifications: "E-posta bildirimleri",
    emailDescription: "Önemli kulüp güncellemeleri için e-posta.",
    legalTitle: "Yasal",
    legalSubtitle: "Verilerinizin nasıl kullanıldığını ve kabul ettiğiniz koşulları inceleyin.",
    legalPrivacy: "Gizlilik Politikası",
    legalTerms: "Kullanım Koşulları",
    accountActions: "Hesap işlemleri",
    accountActionsSubtitle: "Oturumunuzu hesap merkezinden güvenli şekilde yönetebilirsiniz.",
    logoutTitle: "Çıkış yap",
    logoutDescription: "Bu oturumu güvenli şekilde kapatıp giriş ekranına dön.",
    logoutButton: "Çıkış yap",
    signingOut: "Çıkış yapılıyor...",
    logoutFailed: "Çıkış yapılamadı. Lütfen tekrar dene.",
    editingEnabled: "Düzenleme modu açık.",
    editingCancelled: "Değişiklikler iptal edildi.",
    defaultUser: "MaviTeam Kullanıcı",
    defaultClub: "MaviTeam Kulübü",
    defaultCity: "Şehir yok",
    city: "Şehir",
  };
}

export default function ProfileScreen() {
  const { t, language } = useTranslation();
  const copy = getProfileCopy(language === "tr" ? "tr" : "en");
  const { appData, error: appDataError, setAppData } = useAppDataContext();
  const [draftProfileData, setDraftProfileData] = useState<ProfileFormData>(emptyFormData);
  const [isEditing, setIsEditing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [statusMessage, setStatusMessage] = useState(t.common.loading);

  useFocusEffect(
    useCallback(() => {
      if (appData !== null) {
        setStatusMessage(t.profile.messages.loaded);
      } else if (appDataError !== null) {
        console.error("Failed to load profile data:", appDataError);
        setStatusMessage(t.profile.messages.failedToLoad);
      }
    }, [appData, appDataError, t.profile.messages.failedToLoad, t.profile.messages.loaded])
  );

  function startEditing() {
    if (appData !== null) {
      setDraftProfileData(getFormDataFromAppData(appData));
    }

    setIsEditing(true);
    setStatusMessage(copy.editingEnabled);
  }

  function cancelEditing() {
    if (appData !== null) {
      setDraftProfileData(getFormDataFromAppData(appData));
    }

    setIsEditing(false);
    setStatusMessage(copy.editingCancelled);
  }

  async function saveProfile() {
    if (appData === null) {
      return;
    }

    try {
      // Every member can rename themselves. Note: email is intentionally
      // never sent here — it's tied to the Firebase Auth account, can't be
      // changed via this form, and the field below is read-only.
      let nextAppData = await teamSyncService.updateCurrentUser({
        fullName: draftProfileData.fullName.trim() || copy.defaultUser,
      });

      // Club-wide settings can only be changed by the club admin — the
      // fields aren't even shown to other roles (see the form below).
      if (appData.currentUser.role === "clubAdmin") {
        nextAppData = await teamSyncService.updateCurrentClub({
          name: draftProfileData.clubName.trim() || copy.defaultClub,
          sport: draftProfileData.clubSport.trim() || t.common.volleyball,
          city: draftProfileData.clubCity.trim() || copy.defaultCity,
          code: draftProfileData.clubCode.trim().toUpperCase() || "MAVITEAM",
        });
      }

      setAppData(nextAppData);
      setDraftProfileData(getFormDataFromAppData(nextAppData));
      setIsEditing(false);
      setStatusMessage(t.profile.messages.updated);
    } catch {
      setStatusMessage(t.profile.messages.failedToUpdate);
    }
  }

  async function handleLogout() {
    if (isSigningOut) {
      return;
    }

    try {
      setIsSigningOut(true);
      setIsEditing(false);
      setStatusMessage(copy.signingOut);

      if (authService.isConfigured()) {
        await authService.logout();
      }

      const resetData = await teamSyncService.resetAppData();
      setAppData(resetData);
      setDraftProfileData(emptyFormData);
      router.replace("/login" as never);
    } catch (logoutError) {
      setStatusMessage(getAuthErrorMessage(logoutError) || copy.logoutFailed);
      setIsSigningOut(false);
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
      <AppScreenLayout>
        <PageHeader title={t.profile.title} subtitle={statusMessage} />
        <LoadingState label={statusMessage} />
      </AppScreenLayout>
    );
  }

  const currentUser = appData.currentUser;
  const currentClub = appData.club;
  const primaryTeam = appData.teams.find((team) => currentUser.teamIds.includes(team.id));
  const displayData = isEditing ? draftProfileData : getFormDataFromAppData(appData);

  return (
    <AppScreenLayout>
      <PageHeader title={t.profile.title} subtitle={t.profile.subtitle} />

      <Card variant="elevated" style={styles.heroCard}>
        <View style={styles.profileHeroRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(displayData.fullName)}</Text>
          </View>

          <View style={styles.profileHeroText}>
            <StatusBadge label={t.profile.heroLabel} tone="info" style={styles.heroLabel} />
            <Text style={styles.heroTitle}>{displayData.fullName}</Text>
            <Text style={styles.heroSubtitle}>
              {displayData.email || copy.noEmail} · {displayData.clubName}
            </Text>
          </View>
        </View>

        {!isEditing ? (
          <AppButton
            title={t.profile.editProfile}
            variant="secondary"
            accessibilityLabel={t.profile.editProfile}
            style={styles.heroButton}
            onPress={startEditing}
          />
        ) : (
          <View style={styles.actionRow}>
            <AppButton
              title={t.common.save}
              variant="secondary"
              accessibilityLabel={t.common.save}
              style={styles.actionButton}
              onPress={saveProfile}
            />

            <AppButton
              title={t.common.cancel}
              variant="secondary"
              accessibilityLabel={t.common.cancel}
              style={styles.actionButton}
              onPress={cancelEditing}
            />
          </View>
        )}
      </Card>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>1</Text>
          <Text style={styles.statLabel}>{t.profile.club}</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{currentUser.teamIds.length}</Text>
          <Text style={styles.statLabel}>{copy.teamAccess}</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{appData.users.filter((user) => user.status === "active").length}</Text>
          <Text style={styles.statLabel}>{copy.activeMembers}</Text>
        </Card>
      </View>

      <Card style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>{isEditing ? copy.editDetails : copy.summary}</Text>
            <Text style={styles.sectionSubtitle}>{statusMessage}</Text>
          </View>
        </View>

        {isEditing ? (
          <View style={styles.form}>
            <View style={styles.formGrid}>
              <TextField
                label={t.profile.fullName}
                value={draftProfileData.fullName}
                onChangeText={(value) => updateDraftProfile("fullName", value)}
                placeholder={t.profile.fullName}
                containerStyle={styles.formField}
              />

              <TextField
                label={t.profile.email}
                value={draftProfileData.email || copy.noEmail}
                readOnly
                containerStyle={styles.formField}
              />
            </View>

            {currentUser.role === "clubAdmin" ? (
              <>
                <View style={styles.formGrid}>
                  <TextField
                    label={t.profile.club}
                    value={draftProfileData.clubName}
                    onChangeText={(value) => updateDraftProfile("clubName", value)}
                    placeholder={t.profile.club}
                    containerStyle={styles.formField}
                  />

                  <TextField
                    label={t.common.volleyball}
                    value={draftProfileData.clubSport}
                    onChangeText={(value) => updateDraftProfile("clubSport", value)}
                    placeholder={t.common.volleyball}
                    containerStyle={styles.formField}
                  />
                </View>

                <View style={styles.formGrid}>
                  <TextField
                    label={copy.city}
                    value={draftProfileData.clubCity}
                    onChangeText={(value) => updateDraftProfile("clubCity", value)}
                    placeholder={copy.city}
                    containerStyle={styles.formField}
                  />

                  <TextField
                    label={t.profile.clubCode}
                    value={draftProfileData.clubCode}
                    onChangeText={(value) => updateDraftProfile("clubCode", value.toUpperCase())}
                    placeholder={t.profile.clubCode}
                    autoCapitalize="characters"
                    containerStyle={styles.formField}
                  />
                </View>
              </>
            ) : null}
          </View>
        ) : (
          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t.profile.fullName}</Text>
              <Text style={styles.infoValue}>{currentUser.fullName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t.profile.email}</Text>
              <Text style={styles.infoValue}>{currentUser.email || copy.noEmail}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t.profile.club}</Text>
              <Text style={styles.infoValue}>{currentClub.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t.profile.team}</Text>
              <Text style={styles.infoValue}>{primaryTeam?.name ?? copy.noTeam}</Text>
            </View>
            <View style={styles.infoRowLast}>
              <Text style={styles.infoLabel}>{t.profile.clubCode}</Text>
              <Text style={styles.infoValue}>{currentClub.code}</Text>
            </View>
          </View>
        )}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>{t.profile.languageSettings}</Text>
        <Text style={styles.sectionSubtitle}>{t.language.subtitle}</Text>
        <View style={styles.languageBox}>
          <LanguageSelector />
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>{t.profile.notifications}</Text>
        <Text style={styles.sectionSubtitle}>{copy.pushDescription}</Text>

        <View style={styles.preferenceRow}>
          <View style={styles.preferenceTextArea}>
            <Text style={styles.preferenceTitle}>{copy.pushNotifications}</Text>
            <Text style={styles.preferenceSubtitle}>{copy.pushDescription}</Text>
          </View>
          <Switch value={pushNotifications} onValueChange={setPushNotifications} />
        </View>

        <View style={styles.preferenceRowLast}>
          <View style={styles.preferenceTextArea}>
            <Text style={styles.preferenceTitle}>{copy.emailNotifications}</Text>
            <Text style={styles.preferenceSubtitle}>{copy.emailDescription}</Text>
          </View>
          <Switch value={emailNotifications} onValueChange={setEmailNotifications} />
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>{copy.legalTitle}</Text>
        <Text style={styles.sectionSubtitle}>{copy.legalSubtitle}</Text>

        <View style={styles.legalLinksRow}>
          <AppButton
            title={copy.legalPrivacy}
            variant="ghost"
            onPress={() => router.push("/privacy-policy" as never)}
            style={styles.legalLinkButton}
          />
          <AppButton
            title={copy.legalTerms}
            variant="ghost"
            onPress={() => router.push("/terms-of-service" as never)}
            style={styles.legalLinkButton}
          />
        </View>
      </Card>

      <Card variant="danger" style={styles.section}>
        <Text style={styles.sectionTitle}>{copy.accountActions}</Text>
        <Text style={styles.sectionSubtitle}>{copy.accountActionsSubtitle}</Text>

        <View style={styles.logoutCard}>
          <View style={styles.logoutTextArea}>
            <Text style={styles.logoutTitle}>{copy.logoutTitle}</Text>
            <Text style={styles.logoutDescription}>{copy.logoutDescription}</Text>
          </View>

          <AppButton
            title={isSigningOut ? copy.signingOut : copy.logoutButton}
            variant="ghost"
            accessibilityLabel={copy.logoutButton}
            style={styles.logoutButton}
            textStyle={styles.logoutButtonText}
            onPress={handleLogout}
            disabled={isSigningOut}
          />
        </View>

        {!isEditing ? (
          <AppButton title={t.profile.editProfile} onPress={startEditing} style={styles.editBottomButton} />
        ) : null}
      </Card>
    </AppScreenLayout>
  );
}

const styles = StyleSheet.create({
  heroCard: { marginBottom: theme.spacing["2xl"] },
  profileHeroRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing.lg },
  avatar: { width: 74, height: 74, borderRadius: theme.radius.full, backgroundColor: theme.colors.brand.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: theme.colors.text.inverse, fontSize: theme.fontSizes["2xl"], fontWeight: theme.fontWeights.semibold },
  profileHeroText: { flex: 1 },
  heroLabel: { alignSelf: "flex-start", marginBottom: theme.spacing.md },
  heroTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes["4xl"], fontWeight: theme.fontWeights.bold, lineHeight: theme.lineHeights["4xl"], marginBottom: theme.spacing.sm },
  heroSubtitle: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.regular, lineHeight: theme.lineHeights.xl },
  heroButton: { marginTop: theme.spacing["2xl"], alignSelf: "flex-start" },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md, marginTop: theme.spacing["2xl"] },
  actionButton: { minWidth: 160 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.lg, marginBottom: theme.spacing["2xl"] },
  statCard: { flexGrow: 1, flexBasis: 160 },
  statValue: { color: theme.colors.brand.primary, fontSize: theme.fontSizes["4xl"], fontWeight: theme.fontWeights.bold, marginBottom: theme.spacing.xs },
  statLabel: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.medium },
  section: { marginBottom: theme.spacing["2xl"] },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: theme.spacing.lg, marginBottom: theme.spacing.xl },
  sectionHeaderText: { flex: 1 },
  sectionTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes["2xl"], fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.md },
  sectionSubtitle: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.regular, lineHeight: theme.lineHeights.md },
  languageBox: { marginTop: theme.spacing.xl },
  legalLinksRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md, marginTop: theme.spacing.lg },
  legalLinkButton: { flexGrow: 1, minWidth: 160 },
  form: { gap: theme.spacing.lg },
  formGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.lg },
  formField: { flex: 1, minWidth: 240 },
  infoList: { width: "100%" },
  infoRow: { borderBottomWidth: 1, borderBottomColor: theme.colors.border.default, paddingVertical: theme.spacing.lg, gap: theme.spacing.sm },
  infoRowLast: { paddingTop: theme.spacing.lg, gap: theme.spacing.sm },
  infoLabel: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.medium, textTransform: "uppercase" },
  infoValue: { color: theme.colors.text.primary, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.semibold },
  preferenceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.colors.border.default, paddingVertical: theme.spacing.lg },
  preferenceRowLast: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.lg, paddingTop: theme.spacing.lg },
  preferenceTextArea: { flex: 1 },
  preferenceTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.xs },
  preferenceSubtitle: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.regular, lineHeight: theme.lineHeights.md },
  logoutCard: { backgroundColor: theme.colors.state.dangerSoft, borderWidth: 1, borderColor: "rgba(225, 29, 72, 0.22)", borderRadius: theme.radius.xl, padding: theme.spacing.lg, flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.lg, marginTop: theme.spacing.xl },
  logoutTextArea: { flex: 1, minWidth: 240 },
  logoutTitle: { color: theme.colors.text.danger, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.xs },
  logoutDescription: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.regular, lineHeight: theme.lineHeights.md },
  logoutButton: { minWidth: 160, borderColor: "rgba(225, 29, 72, 0.28)" },
  logoutButtonText: { color: theme.colors.text.danger },
  editBottomButton: { marginTop: theme.spacing.lg, alignSelf: "flex-start", minWidth: 180 },
});
