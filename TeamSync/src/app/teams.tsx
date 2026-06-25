import { Link } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { theme } from "@/constants/theme";

type Team = {
  id: string;
  name: string;
  ageGroup: string;
  coachName: string;
  athleteCount: number;
};

const initialTeams: Team[] = [
  {
    id: "1",
    name: "A Takım",
    ageGroup: "Senior",
    coachName: "Can Demir",
    athleteCount: 18,
  },
  {
    id: "2",
    name: "U16 Erkek",
    ageGroup: "U16",
    coachName: "Mehmet Kaya",
    athleteCount: 14,
  },
  {
    id: "3",
    name: "U14 Kız",
    ageGroup: "U14",
    coachName: "Ayşe Yıldız",
    athleteCount: 16,
  },
];

export default function TeamsScreen() {
  const [teams, setTeams] = useState<Team[]>(initialTeams);

  const [teamName, setTeamName] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [coachName, setCoachName] = useState("");
  const [error, setError] = useState("");

  function handleCreateTeam() {
    if (teamName.trim() === "") {
      setError("Lütfen takım adını giriniz.");
      return;
    }

    if (ageGroup.trim() === "") {
      setError("Lütfen yaş grubunu giriniz.");
      return;
    }

    if (coachName.trim() === "") {
      setError("Lütfen koç adını giriniz.");
      return;
    }

    const newTeam: Team = {
      id: Date.now().toString(),
      name: teamName.trim(),
      ageGroup: ageGroup.trim(),
      coachName: coachName.trim(),
      athleteCount: 0,
    };

    setTeams((currentTeams) => [newTeam, ...currentTeams]);

    setTeamName("");
    setAgeGroup("");
    setCoachName("");
    setError("");
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>TeamSync</Text>

          <Text style={styles.title}>Takım yönetimi</Text>

          <Text style={styles.subtitle}>
            Kulübünüzdeki takımları oluşturun ve hangi koçun hangi takımdan
            sorumlu olduğunu takip edin.
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Yeni takım oluştur</Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Takım adı</Text>

              <TextInput
                style={styles.input}
                placeholder="Örn. U16 Erkek"
                placeholderTextColor={theme.colors.text.muted}
                value={teamName}
                onChangeText={setTeamName}
                accessibilityLabel="Takım adı"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Yaş grubu</Text>

              <TextInput
                style={styles.input}
                placeholder="Örn. U16"
                placeholderTextColor={theme.colors.text.muted}
                value={ageGroup}
                onChangeText={setAgeGroup}
                accessibilityLabel="Yaş grubu"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Koç adı</Text>

              <TextInput
                style={styles.input}
                placeholder="Örn. Can Demir"
                placeholderTextColor={theme.colors.text.muted}
                value={coachName}
                onChangeText={setCoachName}
                accessibilityLabel="Koç adı"
              />
            </View>
          </View>

          {error !== "" && <Text style={styles.errorText}>{error}</Text>}

          <AppButton
            title="Takımı oluştur"
            onPress={handleCreateTeam}
            accessibilityLabel="Yeni takımı oluştur"
            style={styles.createButton}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Kulüp takımları</Text>
            <Text style={styles.countBadge}>{teams.length} takım</Text>
          </View>

          <View style={styles.teamList}>
            {teams.map((team) => (
              <View key={team.id} style={styles.teamCard}>
                <View style={styles.teamTopRow}>
                  <View style={styles.teamInfo}>
                    <Text style={styles.teamName}>{team.name}</Text>
                    <Text style={styles.teamMeta}>
                      {team.ageGroup} · Koç: {team.coachName}
                    </Text>
                  </View>

                  <Text style={styles.athleteBadge}>
                    {team.athleteCount} sporcu
                  </Text>
                </View>

                <Text style={styles.teamHint}>
                  Sporcu ekleme, program oluşturma ve yoklama özellikleri
                  ileride bu takım üzerinden çalışacak.
                </Text>
              </View>
            ))}
          </View>
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
    maxWidth: 820,
    alignSelf: "center",
  },
  header: {
    marginTop: theme.spacing["2xl"],
    marginBottom: theme.spacing["2xl"],
  },
  logo: {
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.brand.primary,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSizes["5xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.inverse,
    lineHeight: theme.lineHeights["5xl"],
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text.inverse,
    opacity: 0.78,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.xl,
  },
  formCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    padding: theme.spacing["2xl"],
    marginBottom: theme.spacing["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    ...theme.shadows.md,
  },
  form: {
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
  errorText: {
    marginTop: theme.spacing.lg,
    color: theme.colors.text.danger,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    textAlign: "center",
    lineHeight: theme.lineHeights.md,
  },
  createButton: {
    width: "100%",
    marginTop: theme.spacing["2xl"],
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    flex: 1,
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
  },
  countBadge: {
    backgroundColor: theme.colors.brand.primarySoft,
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.full,
  },
  teamList: {
    gap: theme.spacing.lg,
  },
  teamCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  teamTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  teamMeta: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.secondary,
  },
  athleteBadge: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.state.successSoft,
    color: theme.colors.text.success,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.full,
  },
  teamHint: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.muted,
    lineHeight: theme.lineHeights.md,
  },
  backButton: {
    width: "100%",
    marginBottom: theme.spacing.md,
  },
});