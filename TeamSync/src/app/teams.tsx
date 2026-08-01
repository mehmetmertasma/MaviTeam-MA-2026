import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppScreenLayout } from "@/components/AppScreenLayout";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { TextField } from "@/components/TextField";
import { theme } from "@/constants/theme";
import { useAppDataContext } from "@/providers/AppDataProvider";
import { authService, getAuthErrorMessage } from "@/services/authService";
import { firestoreMemberManagementService } from "@/services/firestoreMemberManagementService";
import { teamSyncService } from "@/services/teamSyncService";
import type { Team as TeamRecord, UserProfile } from "@/types/teamSync";

function getTeamMembershipErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message === "MEMBER_SELF_EDIT_DENIED") return "Kendi takım üyeliğini buradan değiştiremezsin.";
  if (message === "MEMBER_OWNER_EDIT_DENIED") return "Kulüp sahibinin takım üyeliği buradan değiştirilemez.";
  if (message === "MEMBER_PERMISSION_DENIED") return "Bu işlem için kulüp admin yetkisi gerekli.";
  if (message === "MEMBER_TEAM_MISSING") return "Seçilen takım artık mevcut değil.";
  if (message === "MEMBER_MISSING") return "Kullanıcı bulunamadı.";

  return "Takım üyeliği güncellenirken bir sorun oluştu.";
}

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
  const [addMemberOpenTeamId, setAddMemberOpenTeamId] = useState("");
  const [updatingMemberId, setUpdatingMemberId] = useState("");

  const teams = appData?.teams ?? EMPTY_TEAMS;
  const users = appData?.users ?? EMPTY_USERS;
  const selectedTeamId = teams.some((team) => team.id === selectedTeamIdState) ? selectedTeamIdState : "";
  const currentUser = appData?.currentUser;
  const clubOwnerId = appData?.club.ownerId ?? "";
  const userCanManageTeamRoster = currentUser?.role === "clubAdmin";

  async function setTeamMembership(team: TeamRecord, member: UserProfile, isAdding: boolean) {
    if (!authService.isConfigured()) {
      setStatusMessage("Takım üyeliği yönetimi için Firebase girişi gerekli.");
      return;
    }

    const firebaseUser = authService.getCurrentUser();

    if (firebaseUser === null || member.role === "superAdmin") {
      setStatusMessage("Bu kullanıcı için takım üyeliği değiştirilemez.");
      return;
    }

    const nextTeamIds = isAdding
      ? Array.from(new Set([...member.teamIds, team.id]))
      : member.teamIds.filter((teamId) => teamId !== team.id);

    try {
      setUpdatingMemberId(member.id);

      await firestoreMemberManagementService.updateClubMember(firebaseUser, {
        targetUserId: member.id,
        role: member.role,
        status: member.status,
        teamIds: nextTeamIds,
      });

      await refresh();
      setStatusMessage(isAdding ? `${member.fullName} ${team.name} takımına eklendi.` : `${member.fullName} ${team.name} takımından çıkarıldı.`);
    } catch (membershipError) {
      setStatusMessage(getTeamMembershipErrorMessage(membershipError));
    } finally {
      setUpdatingMemberId("");
    }
  }

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
    <AppScreenLayout>
      <PageHeader
        title="Takımlar"
        subtitle="Takımları, koçları ve takım üyelerini merkezi data üzerinden yönet."
      />

      <Card style={styles.heroCard} padding="lg">
        <StatusBadge label="Kulüp organizasyonu" tone="info" style={styles.heroLabel} />
        <Text style={styles.heroTitle}>Takım yönetim merkezi</Text>
        <Text style={styles.heroSubtitle}>
          Takıma tıklayınca detaylar aynı kartın içinde açılır. Gerekirse takımı güvenli şekilde kaldırabilirsin.
        </Text>
      </Card>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{teams.length}</Text>
          <Text style={styles.statLabel}>Takım</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{totalAthletes}</Text>
          <Text style={styles.statLabel}>Sporcu</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{totalMembers}</Text>
          <Text style={styles.statLabel}>Üye</Text>
        </Card>
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
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Yeni takım oluştur</Text>
          <Text style={styles.sectionSubtitle}>
            Takım adını gir. Yaş grubu boş kalırsa Genel kullanılır. Koç adı opsiyonel; yazdığın ad mevcut koç kullanıcıyla eşleşirse atanır.
          </Text>

          <TextField
            label="Takım adı"
            placeholder="Örn. U16 Erkek"
            value={teamName}
            onChangeText={setTeamName}
            containerStyle={styles.field}
          />

          <View style={styles.formGrid}>
            <TextField
              label="Yaş grubu opsiyonel"
              placeholder="Örn. U16 veya Genel"
              value={ageGroup}
              onChangeText={setAgeGroup}
              containerStyle={styles.formField}
            />
            <TextField
              label="Koç adı opsiyonel"
              placeholder="Örn. Can Demir"
              value={coachName}
              onChangeText={setCoachName}
              containerStyle={styles.formField}
            />
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
        </Card>
      ) : null}

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Kulüp takımları</Text>
        <Text style={styles.sectionSubtitle}>Takıma tıkla; detay, üyeler ve kaldırma işlemi kartın içinde açılacak.</Text>

        {teams.length === 0 ? (
          <EmptyState title="Henüz takım yok" description="Yeni takım oluştur butonu ile merkezi dataya takım ekleyebilirsin." />
        ) : (
          <View style={styles.teamList}>
            {teams.map((team) => {
              const isSelected = selectedTeamId === team.id;
              const teamUsers = getTeamUsers(team, users);
              const coachNames = getTeamCoachNames(team, users);
              const isPendingRemove = pendingRemoveTeamId === team.id;

              return (
                <Card key={team.id} padding="none" style={[styles.teamCard, isSelected ? styles.teamCardSelected : null]}>
                  <Pressable
                    onPress={() => toggleTeamDetails(team)}
                    style={({ pressed }) => [styles.teamPressArea, pressed ? styles.pressed : null]}
                  >
                    <View style={styles.teamTopRow}>
                      <View style={styles.teamInfo}>
                        <Text style={styles.teamName}>{team.name}</Text>
                        <Text style={styles.teamMeta}>{team.ageGroup} · Koç: {coachNames}</Text>
                      </View>
                      <StatusBadge label={`${teamUsers.length} kişi`} tone="neutral" />
                    </View>
                    <Text style={styles.teamHint}>
                      {getAthleteCount(team, users)} sporcu · {isSelected ? "Detay açık" : "Detay için tıkla"}
                    </Text>
                  </Pressable>

                  {isSelected ? (
                    <View style={styles.expandedArea}>
                      <View style={styles.detailGrid}>
                        <Card variant="subtle" padding="sm" style={styles.detailCard}>
                          <Text style={styles.detailLabel}>Yaş grubu</Text>
                          <Text style={styles.detailValue}>{team.ageGroup}</Text>
                        </Card>
                        <Card variant="subtle" padding="sm" style={styles.detailCard}>
                          <Text style={styles.detailLabel}>Toplam kişi</Text>
                          <Text style={styles.detailValue}>{teamUsers.length}</Text>
                        </Card>
                        <Card variant="subtle" padding="sm" style={styles.detailCard}>
                          <Text style={styles.detailLabel}>Sporcu</Text>
                          <Text style={styles.detailValue}>{getAthleteCount(team, users)}</Text>
                        </Card>
                      </View>

                      <View style={styles.memberBlock}>
                        <View style={styles.memberBlockHeaderRow}>
                          <Text style={styles.memberBlockTitle}>Takım içi kişiler</Text>
                          {userCanManageTeamRoster ? (
                            <AppButton
                              title={addMemberOpenTeamId === team.id ? "Kapat" : "Kişi ekle"}
                              variant="secondary"
                              onPress={() => setAddMemberOpenTeamId(addMemberOpenTeamId === team.id ? "" : team.id)}
                              style={styles.addMemberToggle}
                            />
                          ) : null}
                        </View>

                        {teamUsers.length === 0 ? (
                          <Card variant="subtle" padding="sm">
                            <Text style={styles.emptyText}>Bu takımda henüz kişi yok.</Text>
                          </Card>
                        ) : (
                          <View style={styles.memberList}>
                            {teamUsers.map((member) => {
                              const isProtectedMember =
                                member.id === currentUser?.id || member.id === clubOwnerId || member.role === "superAdmin";
                              const isUpdatingThisMember = updatingMemberId === member.id;

                              return (
                                <Card key={member.id} variant="subtle" padding="sm" style={styles.memberCard}>
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
                                  {userCanManageTeamRoster && !isProtectedMember ? (
                                    <AppButton
                                      title={isUpdatingThisMember ? "..." : "Çıkar"}
                                      variant="ghost"
                                      disabled={isUpdatingThisMember}
                                      onPress={() => setTeamMembership(team, member, false)}
                                      style={styles.memberButton}
                                    />
                                  ) : null}
                                </Card>
                              );
                            })}
                          </View>
                        )}

                        {userCanManageTeamRoster && addMemberOpenTeamId === team.id ? (
                          <Card variant="subtle" padding="sm" style={styles.addMemberPanel}>
                            {(() => {
                              const availableUsers = users.filter(
                                (user) =>
                                  user.status === "active" &&
                                  user.role !== "superAdmin" &&
                                  !teamUsers.some((member) => member.id === user.id)
                              );

                              if (availableUsers.length === 0) {
                                return <Text style={styles.emptyText}>Eklenebilecek başka aktif üye yok.</Text>;
                              }

                              return availableUsers.map((user) => {
                                const isUpdatingThisUser = updatingMemberId === user.id;

                                return (
                                  <View key={user.id} style={styles.addMemberRow}>
                                    <View style={styles.memberInfo}>
                                      <Text style={styles.memberName}>{user.fullName}</Text>
                                      <Text style={styles.memberMeta}>{user.email || getUserStatusLabel(user.status)}</Text>
                                    </View>
                                    <AppButton
                                      title={isUpdatingThisUser ? "..." : "Ekle"}
                                      disabled={isUpdatingThisUser}
                                      onPress={() => setTeamMembership(team, user, true)}
                                      style={styles.memberButton}
                                    />
                                  </View>
                                );
                              });
                            })()}
                          </Card>
                        ) : null}
                      </View>

                      {isPendingRemove ? (
                        <Card variant="danger" padding="sm">
                          <Text style={styles.confirmTitle}>Bu takımı kaldırmak istediğine emin misin?</Text>
                          <Text style={styles.confirmText}>Takım kartı listeden kalkacak ve kullanıcıların takım bağlantısı temizlenecek.</Text>
                        </Card>
                      ) : null}

                      <View style={styles.teamActionsRow}>
                        <AppButton
                          title={isPendingRemove ? "Evet, kaldır" : "Takımı kaldır"}
                          variant="danger"
                          onPress={() => removeTeam(team)}
                          style={styles.actionButton}
                        />

                        {isPendingRemove ? (
                          <AppButton
                            title="Vazgeç"
                            variant="ghost"
                            onPress={() => {
                              setPendingRemoveTeamId("");
                              setStatusMessage("Takım kaldırma iptal edildi.");
                            }}
                            style={styles.actionButton}
                          />
                        ) : null}
                      </View>
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </View>
        )}

        <Text style={styles.statusText}>{statusMessage}</Text>
      </Card>
    </AppScreenLayout>
  );
}

const styles = StyleSheet.create({
  heroCard: { marginBottom: theme.spacing["2xl"] },
  heroLabel: { marginBottom: theme.spacing.lg },
  heroTitle: {
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.primary,
    lineHeight: theme.lineHeights["2xl"],
    marginBottom: theme.spacing.sm,
  },
  heroSubtitle: { fontSize: theme.fontSizes.lg, color: theme.colors.text.secondary, lineHeight: theme.lineHeights.xl, fontWeight: theme.fontWeights.regular },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.lg, marginBottom: theme.spacing["2xl"] },
  statCard: { flexGrow: 1, flexBasis: 145 },
  statValue: { color: theme.colors.brand.primary, fontSize: theme.fontSizes["4xl"], fontWeight: theme.fontWeights.bold, marginBottom: theme.spacing.xs },
  statLabel: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.medium },
  topActions: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md, marginBottom: theme.spacing["2xl"] },
  actionButton: { minWidth: 170 },
  section: { marginBottom: theme.spacing["2xl"] },
  sectionTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes["2xl"], fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.xs },
  sectionSubtitle: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.regular, lineHeight: theme.lineHeights.md, marginBottom: theme.spacing.xl },
  field: { marginBottom: theme.spacing.lg },
  formGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.lg, marginBottom: theme.spacing.lg },
  formField: { flex: 1, minWidth: 220 },
  emptyText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.regular, lineHeight: theme.lineHeights.md },
  teamList: { gap: theme.spacing.md },
  teamCard: { overflow: "hidden" },
  teamCardSelected: { borderColor: theme.colors.brand.primary },
  teamPressArea: { padding: theme.spacing.lg },
  teamTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: theme.spacing.lg, marginBottom: theme.spacing.sm },
  teamInfo: { flex: 1 },
  teamName: { color: theme.colors.text.primary, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.xs },
  teamMeta: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.regular },
  teamHint: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.medium },
  expandedArea: { borderTopWidth: 1, borderTopColor: theme.colors.border.default, padding: theme.spacing.lg, gap: theme.spacing.lg },
  detailGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md },
  detailCard: { flexGrow: 1, flexBasis: 130 },
  detailLabel: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.medium, marginBottom: theme.spacing.xs },
  detailValue: { color: theme.colors.text.primary, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.semibold },
  memberBlock: { gap: theme.spacing.md },
  memberBlockHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.md },
  memberBlockTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.semibold },
  addMemberToggle: { alignSelf: "flex-start" },
  memberList: { gap: theme.spacing.md },
  memberCard: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md },
  avatar: { width: 46, height: 46, borderRadius: theme.radius.full, backgroundColor: theme.colors.brand.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: theme.colors.text.inverse, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold },
  memberInfo: { flex: 1 },
  memberName: { color: theme.colors.text.primary, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.xs },
  memberMeta: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.regular },
  memberButton: { minWidth: 96 },
  addMemberPanel: { backgroundColor: theme.colors.background.subtle, borderRadius: theme.radius.xl, borderWidth: 1, borderColor: theme.colors.border.default, padding: theme.spacing.lg, gap: theme.spacing.md },
  addMemberRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md },
  confirmTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.xs },
  confirmText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.regular, lineHeight: theme.lineHeights.md },
  teamActionsRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md },
  statusText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.regular, marginTop: theme.spacing.xl, lineHeight: theme.lineHeights.md },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
