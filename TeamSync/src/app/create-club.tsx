import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { ScreenCard } from "@/components/ScreenCard";
import { defaultLanguage, translations } from "@/constants/i18n";
import { theme } from "@/constants/theme";

const t = translations[defaultLanguage];

const CLUB_STORAGE_KEY = "teamsync_created_club_data";
const PROFILE_STORAGE_KEY = "teamsync_profile_data";

type CreatedClubData = {
  name: string;
  sport: string;
  city: string;
  code: string;
};

type ProfileData = {
  name: string;
  email: string;
  club: string;
  team: string;
  role: string;
  season: string;
  membership: string;
};

export default function CreateClubScreen() {
  const router = useRouter();

  const [clubName, setClubName] = useState("");
  const [sport, setSport] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState("");

  const previewCode =
    clubName.trim() === ""
      ? "TS-2026"
      : `${clubName.trim().slice(0, 2).toUpperCase()}-2026`;

  async function handleCreateClub() {
    const trimmedClubName = clubName.trim();
    const trimmedSport = sport.trim();
    const trimmedCity = city.trim();

    if (trimmedClubName === "") {
      setError("Lütfen kulüp adını giriniz.");
      return;
    }

    if (trimmedSport === "") {
      setError("Lütfen branş bilgisini giriniz.");
      return;
    }

    if (trimmedCity === "") {
      setError("Lütfen şehir bilgisini giriniz.");
      return;
    }

    const createdClubData: CreatedClubData = {
      name: trimmedClubName,
      sport: trimmedSport,
      city: trimmedCity,
      code: previewCode,
    };

    const demoProfileData: ProfileData = {
      name: "Yönetici",
      email: "demo@teamsync.app",
      club: trimmedClubName,
      team: `${trimmedSport} Takımı`,
      role: "Kulüp yöneticisi",
      season: "2026 Bahar",
      membership: "Kulüp öder, veli/sporcu ücretsiz",
    };

    try {
      await AsyncStorage.multiSet([
        [CLUB_STORAGE_KEY, JSON.stringify(createdClubData)],
        [PROFILE_STORAGE_KEY, JSON.stringify(demoProfileData)],
      ]);

      setError("");
      router.replace("/dashboard");
    } catch {
      setError("Kulüp bilgileri kaydedilirken bir sorun oluştu.");
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <ScreenCard style={styles.card}>
        <Text style={styles.logo}>{t.common.appName}</Text>

        <Text style={styles.badge}>Kulüp sahibi / yönetici</Text>

        <Text style={styles.title}>Yeni kulüp oluştur</Text>

        <Text style={styles.subtitle}>
          Kulübünüz için TeamSync çalışma alanını hazırlayın. Oyuncular,
          veliler ve koçlar daha sonra kulüp kodu ile katılabilecek.
        </Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kulüp adı</Text>

            <TextInput
              style={styles.input}
              placeholder="Örn. İstanbul Voleybol Kulübü"
              placeholderTextColor={theme.colors.text.muted}
              value={clubName}
              onChangeText={setClubName}
              accessibilityLabel="Kulüp adı"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Branş</Text>

            <TextInput
              style={styles.input}
              placeholder="Örn. Voleybol"
              placeholderTextColor={theme.colors.text.muted}
              value={sport}
              onChangeText={setSport}
              accessibilityLabel="Branş"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Şehir</Text>

            <TextInput
              style={styles.input}
              placeholder="Örn. İstanbul"
              placeholderTextColor={theme.colors.text.muted}
              value={city}
              onChangeText={setCity}
              accessibilityLabel="Şehir"
            />
          </View>
        </View>

        <View style={styles.codePreviewBox}>
          <Text style={styles.codePreviewLabel}>Oluşacak örnek kulüp kodu</Text>
          <Text style={styles.codePreviewValue}>{previewCode}</Text>
          <Text style={styles.codePreviewHint}>
            Bu kodu ileride oyuncu, veli ve koçlar kulübe katılmak için
            kullanacak.
          </Text>
        </View>

        {error !== "" && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.buttonGroup}>
          <AppButton
            title="Kulübü oluştur"
            onPress={handleCreateClub}
            accessibilityLabel="Kulübü oluştur ve kontrol paneline git"
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
  scroll: {
    flex: 1,
    backgroundColor: theme.colors.background.app,
  },
  screen: {
    flexGrow: 1,
    backgroundColor: theme.colors.background.app,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing["2xl"],
  },
  card: {
    padding: theme.spacing["3xl"],
  },
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
  form: {
    width: "100%",
    gap: theme.spacing.lg,
  },
  inputGroup: {
    width: "100%",
  },
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
  codePreviewBox: {
    width: "100%",
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  codePreviewLabel: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  codePreviewValue: {
    fontSize: theme.fontSizes["3xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.brand.primary,
    marginBottom: theme.spacing.sm,
  },
  codePreviewHint: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.md,
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
  button: {
    width: "100%",
  },
});