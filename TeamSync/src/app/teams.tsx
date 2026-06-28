import { useMemo, useState } from "react";
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
  const [statusMessage, setStatusMessage] = useState(
    "Takımlar şimdilik bu oturum içinde tutuluyor."
  );

  const totalAthletes = useMemo(() => {
    return teams.reduce((total, team) => total + team.athleteCount, 0);
  }, [teams]);

  function handleCreateTeam() {
    if (teamName.trim() === "") {
      setStatusMessage("Lütfen takım adını giriniz.");
      return;
    }

    if (ageGroup.trim() === "") {
      setStatusMessage("Lütfen yaş grubunu giriniz.");
      return;
    }

    if (coachName.trim() === "") {
      setStatusMessage("Lütfen koç adını giriniz.");
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
    setStatusMessage("Yeni takım oluşturuldu.");
  }

  function resetTeams() {
    setTeams(initialTeams);
    setTeamName("");
    setAgeGroup("");
    setCoachName("");
    setStatusMessage("Takımlar demo haline sıfırlandı.");
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.pageHeader}>
          <Text style={styles.logo}>TeamSync</Text>
          <Text style={styles.pageTitle}>Takımlar</Text>
          <Text style={styles.pageSubtitle}>
            Kulübünüzdeki takımları oluşturun, koçları takip edin ve kadro yapısını yönetin.
          </Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Kulüp organizasyonu</Text>
          <Text style={styles.heroTitle}>Takım yönetim merkezi</Text>
          <Text style={styles.heroSubtitle}>
            Her takım ileride kendi programına, yoklamasına, mesajlarına ve ödeme kayıtlarına bağlanacak.
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{teams.length}</Text>
            <Text style={styles.statLabel}>Takım</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalAthletes}</Text>
            <Text style={styles.statLabel}>Sporcu</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{teams.length}</Text>
            <Text style={styles.statLabel}>Koç</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Yeni takım oluştur</Text>
              <Text style={styles.sectionSubtitle}>
                Takım adı, yaş grubu ve sorumlu koçu gir.
              </Text>
            </View>

            <Text style={styles.statusPill}>{teams.length} aktif</Text>
          </View>

          <Text style={styles.label}>Takım adı</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn. U16 Erkek"
            placeholderTextColor={theme.colors.text.muted}
            value={teamName}
            onChangeText={setTeamName}
            accessibilityLabel="Takım adı"
          />

          <View style={styles.formGrid}>
            <View style={styles.formField}>
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

            <View style={styles.formField}>
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

          <View style={styles.actionRow}>
            <AppButton
              title="Takımı oluştur"
              onPress={handleCreateTeam}
              accessibilityLabel="Yeni takımı oluştur"
              style={styles.actionButton}
            />

            <AppButton
              title="Sıfırla"
              variant="ghost"
              onPress={resetTeams}
              accessibilityLabel="Takımları sıfırla"
              style={styles.actionButton}
            />
          </View>

          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kulüp takımları</Text>

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

                  <Text style={styles.athleteBadge}>{team.athleteCount} sporcu</Text>
                </View>

                <Text style={styles.teamHint}>
                  Sporcu ekleme, program oluşturma ve yoklama özellikleri ileride bu takım üzerinden çalışacak.
                </Text>
              </View>
            ))}
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
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.md,
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
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.lg,
  },
  formGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.lg,
  },
  formField: {
    flexGrow: 1,
    flexBasis: 220,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  actionButton: {
    flexGrow: 1,
  },
  statusText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.lg,
  },
  teamList: {
    gap: theme.spacing.md,
  },
  teamCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  teamTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  teamMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
  },
  athleteBadge: {
    backgroundColor: theme.colors.brand.primarySoft,
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.full,
  },
  teamHint: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.md,
  },
});
