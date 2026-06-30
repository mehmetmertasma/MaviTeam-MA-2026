import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AppBackButton } from "@/components/AppBackButton";
import { AppButton } from "@/components/AppButton";
import { ScreenCard } from "@/components/ScreenCard";
import { defaultLanguage, translations } from "@/constants/i18n";
import { theme } from "@/constants/theme";
import { authService, getAuthErrorMessage } from "@/services/authService";
import { firestoreTeamSyncService } from "@/services/firestoreTeamSyncService";
import { teamSyncService } from "@/services/teamSyncService";

const t = translations[defaultLanguage];

function getParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default function JoinClubScreen() {
  const router = useRouter();
  const { fullName, email } = useLocalSearchParams();

  const requestFullName = getParamValue(fullName);
  const requestEmail = getParamValue(email);

  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleInviteCodeChange(text: string) {
    const formattedCode = text.toUpperCase().replace(/\s/g, "");

    setInviteCode(formattedCode);

    if (error !== "") {
      setError("");
    }
  }

  async function handleJoinClub() {
    const cleanedCode = inviteCode.trim();

    if (cleanedCode === "") {
      setError("Lütfen takım/kulüp kodunu giriniz.");
      return;
    }

    if (cleanedCode.length < 4) {
      setError("Kod en az 4 karakter olmalıdır.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      if (authService.isConfigured()) {
        const firebaseUser = authService.getCurrentUser();

        if (firebaseUser === null) {
          setError("Kulübe katılmak için önce giriş yapmalısın.");
          return;
        }

        if (!firebaseUser.emailVerified) {
          setError("Kulübe katılmadan önce e-posta adresini doğrulamalısın.");
          return;
        }

        await firestoreTeamSyncService.requestJoinClub({
          firebaseUser,
          inviteCode: cleanedCode,
          requestedRole: "athlete",
        });
      } else {
        await teamSyncService.createJoinRequest({
          fullName: requestFullName || "Yeni Kullanıcı",
          email: requestEmail || "pending@teamsync.app",
          inviteCode: cleanedCode,
          requestedRole: "athlete",
        });
      }

      router.replace("/join-request-sent");
    } catch (joinError) {
      const message = joinError instanceof Error && joinError.message === "INVALID_CLUB_CODE"
        ? "Bu kulüp kodu bulunamadı. Lütfen kodu kontrol edip tekrar deneyiniz."
        : getAuthErrorMessage(joinError);

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <ScreenCard style={styles.card}>
        <AppBackButton fallbackHref="/" />
        <Text style={styles.logo}>{t.common.appName}</Text>

        <Text style={styles.badge}>Takım kodu ile giriş</Text>

        <Text style={styles.title}>Kulübüne katıl</Text>

        <Text style={styles.subtitle}>
          Kulüp yöneticinizden aldığınız takım kodunu girerek TeamSync çalışma
          alanına katılma isteği gönderebilirsiniz.
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Kayıt bilgileri</Text>
          <Text style={styles.infoText}>{requestFullName || "Firebase hesabındaki ad kullanılacak"}</Text>
          <Text style={styles.infoText}>{requestEmail || "Firebase hesabındaki e-posta kullanılacak"}</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Kod örneği</Text>
          <Text style={styles.infoText}>Kulüp yöneticisinin dashboard üzerinde gördüğü kulüp kodu.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Takım / kulüp kodu</Text>

            <TextInput
              style={styles.input}
              placeholder="Örn. TS2026"
              placeholderTextColor={theme.colors.text.muted}
              value={inviteCode}
              onChangeText={handleInviteCodeChange}
              autoCapitalize="characters"
              accessibilityLabel="Takım veya kulüp kodu"
            />
          </View>
        </View>

        {error !== "" && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.buttonGroup}>
          <AppButton
            title={isSubmitting ? "İstek gönderiliyor..." : "Katılma isteği gönder"}
            onPress={handleJoinClub}
            disabled={isSubmitting}
            accessibilityLabel="Takım kodu ile katılma isteği gönder"
            style={styles.button}
          />

          <Link href="/" asChild>
            <AppButton
              title="Ana sayfaya dön"
              variant="ghost"
              accessibilityLabel="Ana sayfaya dön"
              style={styles.button}
            />
          </Link>
        </View>
      </ScreenCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: theme.colors.background.app },
  screen: {
    flexGrow: 1,
    backgroundColor: theme.colors.background.app,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing["2xl"],
  },
  card: { padding: theme.spacing["3xl"] },
  logo: {
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.brand.primary,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  badge: {
    alignSelf: "center",
    backgroundColor: theme.colors.brand.primarySoft,
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.extrabold,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.full,
    marginBottom: theme.spacing["2xl"],
    textAlign: "center",
  },
  title: {
    fontSize: theme.fontSizes["4xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    textAlign: "center",
    lineHeight: theme.lineHeights["4xl"],
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: theme.lineHeights.xl,
    marginBottom: theme.spacing["2xl"],
  },
  infoBox: {
    width: "100%",
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  infoTitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  infoText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.md,
  },
  form: { width: "100%", gap: theme.spacing.lg },
  inputGroup: { width: "100%" },
  label: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    width: "100%",
    minHeight: 52,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text.primary,
  },
  errorText: {
    marginTop: theme.spacing.lg,
    color: theme.colors.text.danger,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    textAlign: "center",
    lineHeight: theme.lineHeights.md,
  },
  buttonGroup: {
    width: "100%",
    gap: theme.spacing.md,
    marginTop: theme.spacing["2xl"],
  },
  button: { width: "100%" },
});
