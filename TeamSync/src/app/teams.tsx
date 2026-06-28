import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { theme } from "@/constants/theme";

type TeamMember = {
  id: string;
  name: string;
  role: "Koç" | "Sporcu" | "Veli";
  status: "Aktif" | "Onay bekliyor";
};

type Team = {
  id: string;
  name: string;
  ageGroup: string;
  coachName: string;
  members: TeamMember[];
};

const initialTeams: Team[] = [
  {
    id: "1",
    name: "A Takım",
    ageGroup: "Senior",
    coachName: "Can Demir",
    members: [
      { id: "1-coach", name: "Can Demir", role: "Koç", status: "Aktif" },
      { id: "1-athlete-1", name: "Emir Yılmaz", role: "Sporcu", status: "Aktif" },
      { id: "1-athlete-2", name: "Kerem Aksoy", role: "Sporcu", status: "Aktif" },
      { id: "1-parent-1", name: "Selin Yılmaz", role: "Veli", status: "Aktif" },
    ],
  },
  {
    id: "2",
    name: "U16 Erkek",
    ageGroup: "U16",
    coachName: "Mehmet Kaya",
    members: [
      { id: "2-coach", name: "Mehmet Kaya", role: "Koç", status: "Aktif" },
      { id: "2-athlete-1", name: "Mert Asma", role: "Sporcu", status: "Aktif" },
      { id: "2-athlete-2", name: "Efe Demir", role: "Sporcu", status: "Aktif" },
      { id: "2-athlete-3", name: "Arda Çelik", role: "Sporcu", status: "Onay bekliyor" },
      { id: "2-parent-1", name: "Ayhan Demir", role: "Veli", status: "Aktif" },
    ],
  },
  {
    id: "3",
    name: "U14 Kız",
    ageGroup: "U14",
    coachName: "Ayşe Yıldız",
    members: [
      { id: "3-coach", name: "Ayşe Yıldız", role: "Koç", status: "Aktif" },
      { id: "3-athlete-1", name: "Zeynep Acar", role: "Sporcu", status: "Aktif" },
      { id: "3-athlete-2", name: "Elif Şahin", role: "Sporcu", status: "Aktif" },
      { id: "3-parent-1", name: "Deniz Acar", role: "Veli", status: "Aktif" },
    ],
  },
];

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

function getAthleteCount(team: Team) {
  return team.members.filter((member) => member.role === "Sporcu").length;
}

export default function TeamsScreen() {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [selectedTeamId, setSelectedTeamId] = useState(initialTeams[0].id);
  const [teamName, setTeamName] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [coachName, setCoachName] = useState("");
  const [statusMessage, setStatusMessage] = useState(
    "Bir takıma tıklayarak içindeki üyeleri görebilirsin."
  );

  const selectedTeam = useMemo(() => {
    return teams.find((team) => team.id === selectedTeamId) ?? teams[0];
  }, [selectedTeamId, teams]);

  const totalAthletes = useMemo(() => {
    return teams.reduce((total, team) => total + getAthleteCount(team), 0);
  }, [teams]);

  const totalMembers = useMemo(() => {
    return teams.reduce((total, team) => total + team.members.length, 0);
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
      members: [
        {
          id: `${Date.now()}-coach`,
          name: coachName.trim(),
          role: "Koç",
          status: "Aktif",
        },
      ],
    };

    setTeams((currentTeams) => [newTeam, ...currentTeams]);
    setSelectedTeamId(newTeam.id);
    setTeamName("");
    setAgeGroup("");
    setCoachName("");
    setStatusMessage("Yeni takım oluşturuldu ve seçildi.");
  }

  function resetTeams() {
    setTeams(initialTeams);
    setSelectedTeamId(initialTeams[0].id);
    setTeamName("");
    setAgeGroup("");
    setCoachName("");
    setStatusMessage("Takımlar demo haline sıfırlandı.");
  }

  function handleSelectTeam(team: Team) {
    setSelectedTeamId(team.id);
    setStatusMessage(`${team.name} seçildi. Aşağıda takım üyelerini görebilirsin.`);
  }

  function handleSendMessage(memberName: string) {
    setStatusMessage(`${memberName} için mesaj ekranı açılıyor.`);
    router.push("/messages" as never);
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
            Takıma tıklayınca o takımın içindeki koç, sporcu ve veli profilleri burada listelenir.
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
            <Text style={styles.statValue}>{totalMembers}</Text>
            <Text style={styles.statLabel}>Üye</Text>
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
          <Text style={styles.sectionSubtitle}>
            Bir takıma tıkla; seçilen takımın profilleri aşağıda açılacak.
          </Text>

          <View style={styles.teamList}>
            {teams.map((team) => {
              const isSelected = selectedTeam?.id === team.id;

              return (
                <Pressable
                  key={team.id}
                  onPress={() => handleSelectTeam(team)}
                  style={({ pressed }) => [
                    styles.teamCard,
                    isSelected ? styles.teamCardSelected : null,
                    pressed ? styles.cardPressed : null,
                  ]}
                >
                  <View style={styles.teamTopRow}>
                    <View style={styles.teamInfo}>
                      <Text style={styles.teamName}>{team.name}</Text>
                      <Text style={styles.teamMeta}>
                        {team.ageGroup} · Koç: {team.coachName}
                      </Text>
                    </View>

                    <View style={styles.badgeColumn}>
                      {isSelected ? <Text style={styles.selectedBadge}>Seçili</Text> : null}
                      <Text style={styles.athleteBadge}>{getAthleteCount(team)} sporcu</Text>
                    </View>
                  </View>

                  <Text style={styles.teamHint}>
                    {team.members.length} profil bağlı · Takım detaylarını açmak için tıkla.
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {selectedTeam ? (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>{selectedTeam.name} profilleri</Text>
                <Text style={styles.sectionSubtitle}>
                  Bu takımın içindeki kişiler ve hızlı mesaj işlemleri.
                </Text>
              </View>

              <Text style={styles.statusPill}>{selectedTeam.members.length} kişi</Text>
            </View>

            <View style={styles.memberList}>
              {selectedTeam.members.map((member) => (
                <View key={member.id} style={styles.memberCard}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(member.name)}</Text>
                  </View>

                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberMeta}>
                      {member.role} · {member.status}
                    </Text>
                  </View>

                  <AppButton
                    title="Mesaj yolla"
                    variant="secondary"
                    accessibilityLabel={`${member.name} kişisine mesaj yolla`}
                    onPress={() => handleSendMessage(member.name)}
                    style={styles.memberButton}
                  />
                </View>
              ))}
            </View>
          </View>
        ) : null}
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
  teamCardSelected: {
    borderColor: theme.colors.brand.primary,
    backgroundColor: theme.colors.brand.primarySoft,
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
  badgeColumn: {
    alignItems: "flex-end",
    gap: theme.spacing.sm,
  },
  selectedBadge: {
    backgroundColor: theme.colors.brand.primary,
    color: theme.colors.text.inverse,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.full,
  },
  athleteBadge: {
    backgroundColor: theme.colors.background.surface,
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
  memberList: {
    gap: theme.spacing.md,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  memberMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
  },
  memberButton: {
    minWidth: 128,
  },
  cardPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
});