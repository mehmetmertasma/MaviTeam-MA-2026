import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { theme } from "@/constants/theme";
import { useAppDataContext } from "@/providers/AppDataProvider";
import { getAuthErrorMessage } from "@/services/authService";
import { teamSyncService } from "@/services/teamSyncService";
import type { Team as TeamRecord, UserProfile } from "@/types/teamSync";

const EMPTY_TEAMS: TeamRecord[] = [];
const EMPTY_USERS: UserProfile[] = [];

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

function getUserStatusLabel(status: UserProfile["status"]) {
  if (status === "active") {
    return "Aktif";
  }

  if (status === "pending") {
    return "Onay bekliyor";
  }

  return "Kaldırıldı";
}

function getTeamUsers(team: TeamRecord, users: UserProfile[]) {
  const userIds = new Set([...team.coachIds, ...team.memberIds]);

  return users.filter((user) => userIds.has(user.id) && user.status !== "removed");
}

function getTeamCoachNames(team: TeamRecord, users: UserProfile[]) {
  const coachNames = users
    .filter((user) => team.coachIds.includes(user.id))
    .map((user) => user.fullName);

  return coachNames.length > 0 ? coachNames.join(", ") : "Koç atanmadı";
}

function getAthleteCount(team: TeamRecord, users: UserProfile[]) {
  return getTeamUsers(team, users).filter((user) => user.role === "athlete").length;
}

export default function TeamsScreen() {
  const { appData, refresh, setAppData } = useAppDataContext();
  const [selectedTeamIdState, setSelectedTeamId] = useState("");
  const [pendingRemoveTeamId, setPendingRemoveTeamId] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [coachName, setCoachName] = useState("");
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Takımlar merkezi TeamSync datasından yüklendi.");

  const teams = appData?.teams ?? EMPTY_TEAMS;
  const users = appData?.users ?? EMPTY_USERS;
  const selectedTeamId = teams.some((team) => team.id === selectedTeamIdState) ? selectedTeamIdState : "";

  async function refreshTeamsData() {
    try {
      await refresh();
      setPendingRemoveTeamId("");
      setStatusMessage("Takımlar merkezi TeamSync datasından yüklendi.");
    } catch (loadError) {
      console.warn("Teams data could not be loaded.", loadError);
      setStatusMessage(getAuthErrorMessage(loadError));
    }
  }

  const totalMembers = useMemo(() => {
    return teams.reduce((total, team) => total + getTeamUsers(team, users).length, 0);
  }, [teams, users]);

  const totalAthletes = useMemo(() => {
    return teams.reduce((total, team) => total + getAthleteCount(team, users), 0);
  }, [teams, users]);

  function clearForm() {
    setTeamName("");
    setAgeGroup("");
    setCoachName("");
  }

  function toggleTeamDetails(team: TeamRecord) {
    setPendingRemoveTeamId("");

    if (selectedTeamId === team.id) {
      setSelectedTeamId("");
      setStatusMessage(`${team.name} detayları kapatıldı.`);
      return;
    }

    setSelectedTeamId(team.id);
    setStatusMessage(`${team.name} detayları açıldı.`);
  }

  async function createTeam() {
    if (appData === null) {
      setStatusMessage("Önce merkezi data yüklenmeli.");
      return;
    }

    const cleanTeamName = teamName.trim();
    const cleanAgeGroup = ageGroup.trim() || "Genel";
    const cleanCoachName = coachName.trim().toLowerCase();

    if (cleanTeamName === "") {
      setStatusMessage("Takım adı boş bırakılamaz.");
      return;
    }

    const matchingCoach =
      cleanCoachName === ""
        ? undefined
        : users.find((user) => {
            return user.role === "coach" && user.fullName.toLowerCase() === cleanCoachName;
          });

    try {
      setIsCreatingTeam(true);
      setStatusMessage("Takım merkezi dataya kaydediliyor...");

      const nextAppData = await teamSyncService.createTeam({
        clubId: appData.club.id,
        name: cleanTeamName,
        ageGroup: cleanAgeGroup,
        coachIds: matchingCoach ? [matchingCoach.id] : [],
        memberIds: [],
      });

      const createdTeam = nextAppData.teams[0];
      setAppData(nextAppData);
      setSelectedTeamId(createdTeam?.id ?? "");
      setPendingRemoveTeamId("");
      clearForm();
      setShowCreateForm(false);
      setStatusMessage(
        matchingCoach
          ? "Yeni takım merkezi dataya kaydedildi ve koç atandı."
          : "Yeni takım merkezi dataya kaydedildi. Koç daha sonra atanabilir."
      );
    } catch (createTeamError) {
      console.warn("Team creation failed.", createTeamError);
      setStatusMessage(getAuthErrorMessage(createTeamError));
    } finally {
      setIsCreatingTeam(false);
    }
  }

  async function removeTeam(team: TeamRecord) {
    if (pendingRemoveTeamId !== team.id) {
      setSelectedTeamId(team.id);
      setPendingRemoveTeamId(team.id);
      setStatusMessage(`${team.name} kaldırılacak. Eminsen tekrar Kaldır'a bas.`);
      return;
    }

    try {
      const nextAppData = await teamSyncService.removeTeam(team.id);
      setAppData(nextAppData);
      setSelectedTeamId("");
      setPendingRemoveTeamId("");
      setStatusMessage(`${team.name} kaldırıldı.`);
    } catch {
      setStatusMessage("Takım kaldırılırken bir sorun oluştu.");
    }
  }

  function openMessages(memberName: string) {
    setStatusMessage(`${memberName} için mesaj ekranı açılıyor.`);
    router.push("/messages" as never);
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.pageHeader}>
          <Text style={styles.logo}>TeamSync</Text>
          <Text style={styles.pageTitle}>Takımlar</Text>
          <Text style={styles.pageSubtitle}>Takımları, koçları ve takım üyelerini merkezi data üzerinden yönet.</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Kulüp organizasyonu</Text>
          <Text style={styles.heroTitle}>Takım yönetim merkezi</Text>
          <Text style={styles.heroSubtitle}>
            Takıma tıklayınca detaylar aynı kartın içinde açılır. Gerekirse takımı güvenli şekilde kaldırabilirsin.
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

        <View style={styles.topActions}>
          <AppButton
            title={showCreateForm ? "Form açık" : "Yeni takım oluştur"}
            onPress={() => setShowCreateForm(true)}
            disabled={showCreateForm}
            style={styles.actionButton}
          />
          <AppButton
            title="Merkezi datayı yenile"
            variant="ghost"
            onPress={refreshTeamsData}
            style={styles.actionButton}
          />
        </View>

        {showCreateForm ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Yeni takım oluştur</Text>
            <Text style={styles.sectionSubtitle}>
              Takım adını gir. Yaş grubu boş kalırsa Genel kullanılır. Koç adı opsiyonel; yazdığın ad mevcut koç kullanıcıyla eşleşirse atanır.
            </Text>

            <Text style={styles.label}>Takım adı</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn. U16 Erkek"
              placeholderTextColor={theme.colors.text.muted}
              value={teamName}
              onChangeText={setTeamName}
            />

            <View style={styles.formGrid}>
              <View style={styles.formField}>
                <Text style={styles.label}>Yaş grubu opsiyonel</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Örn. U16 veya Genel"
                  placeholderTextColor={theme.colors.text.muted}
                  value={ageGroup}
                  onChangeText={setAgeGroup}
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.label}>Koç adı opsiyonel</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Örn. Can Demir"
                  placeholderTextColor={theme.colors.text.muted}
                  value={coachName}
                  onChangeText={setCoachName}
                />
              </View>
            </View>

            <View style={styles.topActions}>
              <AppButton
                title={isCreatingTeam ? "Oluşturuluyor..." : "Takımı oluştur"}
                onPress={createTeam}
                disabled={isCreatingTeam}
                style={styles.actionButton}
              />
              <AppButton
                title="Vazgeç"
                variant="ghost"
                onPress={() => {
                  clearForm();
                  setShowCreateForm(false);
                  setStatusMessage("Takım oluşturma iptal edildi.");
                }}
                style={styles.actionButton}
              />
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kulüp takımları</Text>
          <Text style={styles.sectionSubtitle}>Takıma tıkla; detay, üyeler ve kaldırma işlemi kartın içinde açılacak.</Text>

          {teams.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>Henüz takım yok</Text>
              <Text style={styles.emptyText}>Yeni takım oluştur butonu ile merkezi dataya takım ekleyebilirsin.</Text>
            </View>
          ) : (
            <View style={styles.teamList}>
              {teams.map((team) => {
                const isSelected = selectedTeamId === team.id;
                const teamUsers = getTeamUsers(team, users);
                const coachNames = getTeamCoachNames(team, users);
                const isPendingRemove = pendingRemoveTeamId === team.id;

                return (
                  <View key={team.id} style={[styles.teamCard, isSelected ? styles.teamCardSelected : null]}>
                    <Pressable
                      onPress={() => toggleTeamDetails(team)}
                      style={({ pressed }) => [styles.teamPressArea, pressed ? styles.pressed : null]}
                    >
                      <View style={styles.teamTopRow}>
                        <View style={styles.teamInfo}>
                          <Text style={styles.teamName}>{team.name}</Text>
                          <Text style={styles.teamMeta}>{team.ageGroup} · Koç: {coachNames}</Text>
                        </View>
                        <Text style={styles.teamBadge}>{teamUsers.length} kişi</Text>
                      </View>
                      <Text style={styles.teamHint}>
                        {getAthleteCount(team, users)} sporcu · {isSelected ? "Detay açık" : "Detay için tıkla"}
                      </Text>
                    </Pressable>

                    {isSelected ? (
                      <View style={styles.expandedArea}>
                        <View style={styles.detailGrid}>
                          <View style={styles.detailCard}>
                            <Text style={styles.detailLabel}>Yaş grubu</Text>
                            <Text style={styles.detailValue}>{team.ageGroup}</Text>
                          </View>
                          <View style={styles.detailCard}>
                            <Text style={styles.detailLabel}>Toplam kişi</Text>
                            <Text style={styles.detailValue}>{teamUsers.length}</Text>
                          </View>
                          <View style={styles.detailCard}>
                            <Text style={styles.detailLabel}>Sporcu</Text>
                            <Text style={styles.detailValue}>{getAthleteCount(team, users)}</Text>
                          </View>
                        </View>

                        <View style={styles.memberBlock}>
                          <Text style={styles.memberBlockTitle}>Takım içi kişiler</Text>
                          {teamUsers.length === 0 ? (
                            <View style={styles.emptyBoxCompact}>
                              <Text style={styles.emptyText}>Bu takımda henüz kişi yok.</Text>
                            </View>
                          ) : (
                            <View style={styles.memberList}>
                              {teamUsers.map((member) => (
                                <View key={member.id} style={styles.memberCard}>
                                  <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{getInitials(member.fullName)}</Text>
                                  </View>
                                  <View style={styles.memberInfo}>
                                    <Text style={styles.memberName}>{member.fullName}</Text>
                                    <Text style={styles.memberMeta}>{member.email || getUserStatusLabel(member.status)}</Text>
                                  </View>
                                  <AppButton
                                    title="Mesaj"
                                    variant="secondary"
                                    onPress={() => openMessages(member.fullName)}
                                    style={styles.memberButton}
                                  />
                                </View>
                              ))}
                            </View>
                          )}
                        </View>

                        {isPendingRemove ? (
                          <View style={styles.confirmBox}>
                            <Text style={styles.confirmTitle}>Bu takımı kaldırmak istediğine emin misin?</Text>
                            <Text style={styles.confirmText}>Takım kartı listeden kalkacak ve kullanıcıların takım bağlantısı temizlenecek.</Text>
                          </View>
                        ) : null}

                        <View style={styles.teamActionsRow}>
                          <Pressable
                            onPress={() => removeTeam(team)}
                            style={({ pressed }) => [
                              styles.removeButton,
                              isPendingRemove ? styles.removeButtonConfirm : null,
                              pressed ? styles.pressed : null,
                            ]}
                          >
                            <Text style={styles.removeButtonText}>{isPendingRemove ? "Evet, kaldır" : "Takımı kaldır"}</Text>
                          </Pressable>

                          {isPendingRemove ? (
                            <Pressable
                              onPress={() => {
                                setPendingRemoveTeamId("");
                                setStatusMessage("Takım kaldırma iptal edildi.");
                              }}
                              style={({ pressed }) => [styles.cancelRemoveButton, pressed ? styles.pressed : null]}
                            >
                              <Text style={styles.cancelRemoveButtonText}>Vazgeç</Text>
                            </Pressable>
                          ) : null}
                        </View>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}

          <Text style={styles.statusText}>{statusMessage}</Text>
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
  heroSubtitle: { fontSize: theme.fontSizes.lg, color: theme.colors.text.secondary, lineHeight: theme.lineHeights.xl },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.lg, marginBottom: theme.spacing["2xl"] },
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
  statValue: { color: theme.colors.brand.primary, fontSize: theme.fontSizes["4xl"], fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.xs },
  statLabel: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.extrabold },
  topActions: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md, marginBottom: theme.spacing["2xl"] },
  actionButton: { minWidth: 170 },
  section: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    padding: theme.spacing["2xl"],
    marginBottom: theme.spacing["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    ...theme.shadows.sm,
  },
  sectionTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes["2xl"], fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.xs },
  sectionSubtitle: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, lineHeight: theme.lineHeights.md, marginBottom: theme.spacing.xl },
  label: { color: theme.colors.text.primary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.extrabold, marginBottom: theme.spacing.sm },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.lg,
    marginBottom: theme.spacing.lg,
  },
  formGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.lg },
  formField: { flex: 1, minWidth: 220 },
  emptyBox: { backgroundColor: theme.colors.background.subtle, borderRadius: theme.radius.xl, padding: theme.spacing.xl, borderWidth: 1, borderColor: theme.colors.border.default },
  emptyBoxCompact: { backgroundColor: theme.colors.background.subtle, borderRadius: theme.radius.lg, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border.default },
  emptyTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.sm },
  emptyText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, lineHeight: theme.lineHeights.md },
  teamList: { gap: theme.spacing.md },
  teamCard: { backgroundColor: theme.colors.background.subtle, borderRadius: theme.radius.xl, borderWidth: 1, borderColor: theme.colors.border.default, overflow: "hidden" },
  teamCardSelected: { borderColor: theme.colors.brand.primary, backgroundColor: theme.colors.background.surface },
  teamPressArea: { padding: theme.spacing.lg },
  teamTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: theme.spacing.lg, marginBottom: theme.spacing.sm },
  teamInfo: { flex: 1 },
  teamName: { color: theme.colors.text.primary, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.xs },
  teamMeta: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold },
  teamBadge: { backgroundColor: theme.colors.background.surface, color: theme.colors.text.brand, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.black, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md, borderRadius: theme.radius.full, overflow: "hidden" },
  teamHint: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold },
  expandedArea: { borderTopWidth: 1, borderTopColor: theme.colors.border.default, padding: theme.spacing.lg, gap: theme.spacing.lg },
  detailGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md },
  detailCard: { flexGrow: 1, flexBasis: 130, backgroundColor: theme.colors.background.subtle, borderRadius: theme.radius.lg, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border.default },
  detailLabel: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.extrabold, marginBottom: theme.spacing.xs },
  detailValue: { color: theme.colors.text.primary, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.black },
  memberBlock: { gap: theme.spacing.md },
  memberBlockTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.black },
  memberList: { gap: theme.spacing.md },
  memberCard: { backgroundColor: theme.colors.background.subtle, borderRadius: theme.radius.xl, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border.default, flexDirection: "row", alignItems: "center", gap: theme.spacing.md },
  avatar: { width: 46, height: 46, borderRadius: theme.radius.full, backgroundColor: theme.colors.brand.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: theme.colors.text.inverse, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.black },
  memberInfo: { flex: 1 },
  memberName: { color: theme.colors.text.primary, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.xs },
  memberMeta: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold },
  memberButton: { minWidth: 96 },
  confirmBox: { backgroundColor: theme.colors.state.warningSoft, borderRadius: theme.radius.lg, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.state.warning },
  confirmTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.xs },
  confirmText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, lineHeight: theme.lineHeights.md },
  teamActionsRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md },
  removeButton: { minHeight: 46, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.state.danger, paddingHorizontal: theme.spacing.lg, alignItems: "center", justifyContent: "center" },
  removeButtonConfirm: { backgroundColor: theme.colors.state.danger },
  removeButtonText: { color: theme.colors.state.danger, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.black },
  cancelRemoveButton: { minHeight: 46, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border.default, paddingHorizontal: theme.spacing.lg, alignItems: "center", justifyContent: "center" },
  cancelRemoveButtonText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.black },
  statusText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, marginTop: theme.spacing.xl, lineHeight: theme.lineHeights.md },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
