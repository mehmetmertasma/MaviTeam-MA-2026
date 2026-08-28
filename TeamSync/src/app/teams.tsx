import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppScreenLayout } from "@/components/AppScreenLayout";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { SearchField } from "@/components/SearchField";
import { StatusBadge } from "@/components/StatusBadge";
import { TextField } from "@/components/TextField";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/localization";
import { useAppDataContext } from "@/providers/AppDataProvider";
import { authService, getAuthErrorMessage } from "@/services/authService";
import { firestoreMemberManagementService } from "@/services/firestoreMemberManagementService";
import { teamSyncService } from "@/services/teamSyncService";
import type { Team as TeamRecord, UserProfile } from "@/types/teamSync";
import { matchesSearchQuery } from "@/utils/search";

function getTeamMembershipErrorMessage(error: unknown, language: "tr" | "en") {
  const en = language === "en";
  const message = error instanceof Error ? error.message : "";

  if (message === "MEMBER_SELF_EDIT_DENIED") return en ? "You can't change your own team membership here." : "Kendi takım üyeliğini buradan değiştiremezsin.";
  if (message === "MEMBER_OWNER_EDIT_DENIED") return en ? "The club owner's team membership can't be changed here." : "Kulüp sahibinin takım üyeliği buradan değiştirilemez.";
  if (message === "MEMBER_PERMISSION_DENIED") return en ? "You need club admin access to do this." : "Bu işlem için kulüp admin yetkisi gerekli.";
  if (message === "MEMBER_TEAM_MISSING") return en ? "The selected team no longer exists." : "Seçilen takım artık mevcut değil.";
  if (message === "MEMBER_MISSING") return en ? "User not found." : "Kullanıcı bulunamadı.";

  return en ? "Something went wrong while updating team membership." : "Takım üyeliği güncellenirken bir sorun oluştu.";
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

function getTeamUsers(team: TeamRecord, users: UserProfile[]) {
  const userIds = new Set([...team.coachIds, ...team.memberIds]);

  return users.filter((user) => userIds.has(user.id) && user.status !== "removed");
}

function getAthleteCount(team: TeamRecord, users: UserProfile[]) {
  return getTeamUsers(team, users).filter((user) => user.role === "athlete").length;
}

function getCopy(language: "tr" | "en") {
  const en = language === "en";

  function getUserStatusLabel(status: UserProfile["status"]) {
    if (status === "active") {
      return en ? "Active" : "Aktif";
    }

    if (status === "pending") {
      return en ? "Pending approval" : "Onay bekliyor";
    }

    return en ? "Removed" : "Kaldırıldı";
  }

  function getTeamCoachNames(team: TeamRecord, users: UserProfile[]) {
    const coachNames = users
      .filter((user) => team.coachIds.includes(user.id))
      .map((user) => user.fullName);

    return coachNames.length > 0 ? coachNames.join(", ") : en ? "No coach assigned" : "Koç atanmadı";
  }

  return {
    pageTitle: en ? "Teams" : "Takımlar",
    pageSubtitle: en ? "Manage teams, coaches, and team members." : "Takımları, koçları ve takım üyelerini yönet.",
    heroLabel: en ? "Club organization" : "Kulüp organizasyonu",
    heroTitle: en ? "Team management center" : "Takım yönetim merkezi",
    heroSubtitle: en
      ? "Tap a team to expand its details in place. You can safely remove a team if needed."
      : "Takıma tıklayınca detaylar aynı kartın içinde açılır. Gerekirse takımı güvenli şekilde kaldırabilirsin.",
    statTeams: en ? "Teams" : "Takım",
    statAthletes: en ? "Athletes" : "Sporcu",
    statMembers: en ? "Members" : "Üye",
    formOpen: en ? "Form open" : "Form açık",
    newTeam: en ? "Create new team" : "Yeni takım oluştur",
    refresh: en ? "Refresh" : "Yenile",
    createFormTitle: en ? "Create new team" : "Yeni takım oluştur",
    createFormSubtitle: en
      ? "Enter a team name. If age group is left blank, General is used. Coach name is optional — it's assigned if it matches an existing coach account."
      : "Takım adını gir. Yaş grubu boş kalırsa Genel kullanılır. Koç adı opsiyonel; yazdığın ad mevcut koç kullanıcıyla eşleşirse atanır.",
    teamNameLabel: en ? "Team name" : "Takım adı",
    teamNamePlaceholder: en ? "e.g. U16 Boys" : "Örn. U16 Erkek",
    ageGroupLabel: en ? "Age group (optional)" : "Yaş grubu opsiyonel",
    ageGroupPlaceholder: en ? "e.g. U16 or General" : "Örn. U16 veya Genel",
    coachNameLabel: en ? "Coach name (optional)" : "Koç adı opsiyonel",
    coachNamePlaceholder: en ? "e.g. Jane Smith" : "Örn. Can Demir",
    creating: en ? "Creating..." : "Oluşturuluyor...",
    createTeamButton: en ? "Create team" : "Takımı oluştur",
    cancel: en ? "Cancel" : "Vazgeç",
    clubTeamsTitle: en ? "Club teams" : "Kulüp takımları",
    clubTeamsSubtitle: en
      ? "Tap a team to expand its details, members, and removal option in place."
      : "Takıma tıkla; detay, üyeler ve kaldırma işlemi kartın içinde açılacak.",
    noTeamsTitle: en ? "No teams yet" : "Henüz takım yok",
    noTeamsDescription: en
      ? "Use the Create new team button to add a team."
      : "Yeni takım oluştur butonuyla takım ekleyebilirsin.",
    coachPrefix: en ? "Coach" : "Koç",
    peopleCount: (count: number) => (en ? `${count} people` : `${count} kişi`),
    detailOpen: en ? "Details open" : "Detay açık",
    tapForDetails: en ? "Tap for details" : "Detay için tıkla",
    athletesCount: (count: number) => (en ? `${count} athletes` : `${count} sporcu`),
    ageGroupDetailLabel: en ? "Age group" : "Yaş grubu",
    totalPeopleLabel: en ? "Total people" : "Toplam kişi",
    athletesDetailLabel: en ? "Athletes" : "Sporcu",
    teamPeopleTitle: en ? "Team members" : "Takım içi kişiler",
    close: en ? "Close" : "Kapat",
    addPerson: en ? "Add person" : "Kişi ekle",
    noTeamPeople: en ? "This team has no people yet." : "Bu takımda henüz kişi yok.",
    searchInTeamPlaceholder: en ? "Search people in team..." : "Takım içinde kişi ara...",
    searchInTeamA11y: en ? "Search team members" : "Takım üyelerinde ara",
    noSearchMatches: en ? "No people match your search." : "Aramayla eşleşen kişi yok.",
    message: en ? "Message" : "Mesaj",
    remove: en ? "Remove" : "Çıkar",
    processing: en ? "Processing..." : "İşleniyor...",
    noAvailableMembers: en ? "No other active members are available to add." : "Eklenebilecek başka aktif üye yok.",
    searchToAddPlaceholder: en ? "Search people to add..." : "Eklenecek kişi ara...",
    searchToAddA11y: en ? "Search available members" : "Eklenebilecek üyelerde ara",
    add: en ? "Add" : "Ekle",
    removeConfirmTitle: en ? "Are you sure you want to remove this team?" : "Bu takımı kaldırmak istediğine emin misin?",
    removeConfirmText: en
      ? "The team card will be removed from the list and users will lose their connection to it."
      : "Takım kartı listeden kalkacak ve kullanıcıların takım bağlantısı temizlenecek.",
    confirmRemove: en ? "Yes, remove" : "Evet, kaldır",
    removeTeamButton: en ? "Remove team" : "Takımı kaldır",
    userStatusLabel: getUserStatusLabel,
    // Status messages
    teamsUpdated: en ? "Teams updated." : "Takımlar güncellendi.",
    firebaseRequiredForTeamMembership: en
      ? "Signing in is required to manage team membership."
      : "Takım üyeliği yönetimi için Firebase girişi gerekli.",
    cannotChangeMembershipForUser: en
      ? "Team membership can't be changed for this user."
      : "Bu kullanıcı için takım üyeliği değiştirilemez.",
    memberAdded: (memberName: string, teamName: string) =>
      en ? `${memberName} was added to ${teamName}.` : `${memberName} ${teamName} takımına eklendi.`,
    memberRemoved: (memberName: string, teamName: string) =>
      en ? `${memberName} was removed from ${teamName}.` : `${memberName} ${teamName} takımından çıkarıldı.`,
    teamDetailsClosed: (teamName: string) => (en ? `${teamName} details closed.` : `${teamName} detayları kapatıldı.`),
    teamDetailsOpened: (teamName: string) => (en ? `${teamName} details opened.` : `${teamName} detayları açıldı.`),
    pleaseWaitForLoad: en ? "Please wait for the page to finish loading." : "Sayfanın yüklenmesini bekle.",
    teamNameRequired: en ? "The team name can't be empty." : "Takım adı boş bırakılamaz.",
    ageGroupDefault: en ? "General" : "Genel",
    savingTeam: en ? "Creating team..." : "Takım oluşturuluyor...",
    teamCreatedWithCoach: en ? "New team created and coach assigned." : "Yeni takım oluşturuldu ve koç atandı.",
    teamCreatedNoCoach: en ? "New team created. You can assign a coach later." : "Yeni takım oluşturuldu. Koç daha sonra atanabilir.",
    createTeamCancelled: en ? "Team creation cancelled." : "Takım oluşturma iptal edildi.",
    confirmRemoveTeam: (teamName: string) =>
      en ? `${teamName} will be removed. Tap remove again to confirm.` : `${teamName} kaldırılacak. Eminsen tekrar Kaldır'a bas.`,
    teamRemoved: (teamName: string) => (en ? `${teamName} was removed.` : `${teamName} kaldırıldı.`),
    teamRemoveFailed: en ? "Something went wrong while removing the team." : "Takım kaldırılırken bir sorun oluştu.",
    removeTeamCancelled: en ? "Team removal cancelled." : "Takım kaldırma iptal edildi.",
    openingMessagesFor: (memberName: string) =>
      en ? `Opening messages for ${memberName}.` : `${memberName} için mesaj ekranı açılıyor.`,
    getTeamCoachNames,
  };
}

export default function TeamsScreen() {
  const { language } = useTranslation();
  const copy = useMemo(() => getCopy(language), [language]);
  const { appData, refresh, setAppData } = useAppDataContext();
  const [selectedTeamIdState, setSelectedTeamId] = useState("");
  const [pendingRemoveTeamId, setPendingRemoveTeamId] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [coachName, setCoachName] = useState("");
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [statusMessage, setStatusMessage] = useState(copy.teamsUpdated);
  const [addMemberOpenTeamId, setAddMemberOpenTeamId] = useState("");
  const [updatingMemberId, setUpdatingMemberId] = useState("");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [addMemberSearchQuery, setAddMemberSearchQuery] = useState("");

  const teams = appData?.teams ?? EMPTY_TEAMS;
  const users = appData?.users ?? EMPTY_USERS;
  const selectedTeamId = teams.some((team) => team.id === selectedTeamIdState) ? selectedTeamIdState : "";
  const currentUser = appData?.currentUser;
  const clubOwnerId = appData?.club.ownerId ?? "";
  const userCanManageTeamRoster = currentUser?.role === "clubAdmin";

  async function setTeamMembership(team: TeamRecord, member: UserProfile, isAdding: boolean) {
    if (!authService.isConfigured()) {
      setStatusMessage(copy.firebaseRequiredForTeamMembership);
      return;
    }

    const firebaseUser = authService.getCurrentUser();

    if (firebaseUser === null || member.role === "superAdmin") {
      setStatusMessage(copy.cannotChangeMembershipForUser);
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
      setStatusMessage(isAdding ? copy.memberAdded(member.fullName, team.name) : copy.memberRemoved(member.fullName, team.name));
    } catch (membershipError) {
      setStatusMessage(getTeamMembershipErrorMessage(membershipError, language));
    } finally {
      setUpdatingMemberId("");
    }
  }

  async function refreshTeamsData() {
    try {
      await refresh();
      setPendingRemoveTeamId("");
      setStatusMessage(copy.teamsUpdated);
    } catch (loadError) {
      console.warn("Teams data could not be loaded.", loadError);
      setStatusMessage(getAuthErrorMessage(loadError, language));
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
    setMemberSearchQuery("");
    setAddMemberOpenTeamId("");
    setAddMemberSearchQuery("");

    if (selectedTeamId === team.id) {
      setSelectedTeamId("");
      setStatusMessage(copy.teamDetailsClosed(team.name));
      return;
    }

    setSelectedTeamId(team.id);
    setStatusMessage(copy.teamDetailsOpened(team.name));
  }

  async function createTeam() {
    if (appData === null) {
      setStatusMessage(copy.pleaseWaitForLoad);
      return;
    }

    const cleanTeamName = teamName.trim();
    const cleanAgeGroup = ageGroup.trim() || copy.ageGroupDefault;
    const cleanCoachName = coachName.trim().toLowerCase();

    if (cleanTeamName === "") {
      setStatusMessage(copy.teamNameRequired);
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
      setStatusMessage(copy.savingTeam);

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
      setStatusMessage(matchingCoach ? copy.teamCreatedWithCoach : copy.teamCreatedNoCoach);
    } catch (createTeamError) {
      console.warn("Team creation failed.", createTeamError);
      setStatusMessage(getAuthErrorMessage(createTeamError, language));
    } finally {
      setIsCreatingTeam(false);
    }
  }

  async function removeTeam(team: TeamRecord) {
    if (pendingRemoveTeamId !== team.id) {
      setSelectedTeamId(team.id);
      setPendingRemoveTeamId(team.id);
      setStatusMessage(copy.confirmRemoveTeam(team.name));
      return;
    }

    try {
      const nextAppData = await teamSyncService.removeTeam(team.id);
      setAppData(nextAppData);
      setSelectedTeamId("");
      setPendingRemoveTeamId("");
      setStatusMessage(copy.teamRemoved(team.name));
    } catch {
      setStatusMessage(copy.teamRemoveFailed);
    }
  }

  function openMessages(memberName: string) {
    setStatusMessage(copy.openingMessagesFor(memberName));
    router.push("/messages" as never);
  }

  return (
    <AppScreenLayout>
      <PageHeader
        title={copy.pageTitle}
        subtitle={copy.pageSubtitle}
      />

      <Card style={styles.heroCard} padding="lg">
        <StatusBadge label={copy.heroLabel} tone="info" style={styles.heroLabel} />
        <Text style={styles.heroTitle}>{copy.heroTitle}</Text>
        <Text style={styles.heroSubtitle}>
          {copy.heroSubtitle}
        </Text>
      </Card>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{teams.length}</Text>
          <Text style={styles.statLabel}>{copy.statTeams}</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{totalAthletes}</Text>
          <Text style={styles.statLabel}>{copy.statAthletes}</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{totalMembers}</Text>
          <Text style={styles.statLabel}>{copy.statMembers}</Text>
        </Card>
      </View>

      <View style={styles.topActions}>
        {userCanManageTeamRoster ? (
          <AppButton
            title={showCreateForm ? copy.formOpen : copy.newTeam}
            onPress={() => setShowCreateForm(true)}
            disabled={showCreateForm}
            style={styles.actionButton}
          />
        ) : null}
        <AppButton
          title={copy.refresh}
          variant="ghost"
          onPress={refreshTeamsData}
          style={styles.actionButton}
        />
      </View>

      {showCreateForm && userCanManageTeamRoster ? (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{copy.createFormTitle}</Text>
          <Text style={styles.sectionSubtitle}>
            {copy.createFormSubtitle}
          </Text>

          <TextField
            label={copy.teamNameLabel}
            placeholder={copy.teamNamePlaceholder}
            value={teamName}
            onChangeText={setTeamName}
            containerStyle={styles.field}
          />

          <View style={styles.formGrid}>
            <TextField
              label={copy.ageGroupLabel}
              placeholder={copy.ageGroupPlaceholder}
              value={ageGroup}
              onChangeText={setAgeGroup}
              containerStyle={styles.formField}
            />
            <TextField
              label={copy.coachNameLabel}
              placeholder={copy.coachNamePlaceholder}
              value={coachName}
              onChangeText={setCoachName}
              containerStyle={styles.formField}
            />
          </View>

          <View style={styles.topActions}>
            <AppButton
              title={isCreatingTeam ? copy.creating : copy.createTeamButton}
              onPress={createTeam}
              disabled={isCreatingTeam}
              style={styles.actionButton}
            />
            <AppButton
              title={copy.cancel}
              variant="ghost"
              onPress={() => {
                clearForm();
                setShowCreateForm(false);
                setStatusMessage(copy.createTeamCancelled);
              }}
              style={styles.actionButton}
            />
          </View>
        </Card>
      ) : null}

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>{copy.clubTeamsTitle}</Text>
        <Text style={styles.sectionSubtitle}>{copy.clubTeamsSubtitle}</Text>

        {teams.length === 0 ? (
          <EmptyState title={copy.noTeamsTitle} description={copy.noTeamsDescription} />
        ) : (
          <View style={styles.teamList}>
            {teams.map((team) => {
              const isSelected = selectedTeamId === team.id;
              const teamUsers = getTeamUsers(team, users);
              const coachNames = copy.getTeamCoachNames(team, users);
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
                        <Text style={styles.teamMeta}>{team.ageGroup} · {copy.coachPrefix}: {coachNames}</Text>
                      </View>
                      <StatusBadge label={copy.peopleCount(teamUsers.length)} tone="neutral" />
                    </View>
                    <Text style={styles.teamHint}>
                      {copy.athletesCount(getAthleteCount(team, users))} · {isSelected ? copy.detailOpen : copy.tapForDetails}
                    </Text>
                  </Pressable>

                  {isSelected ? (
                    <View style={styles.expandedArea}>
                      <View style={styles.detailGrid}>
                        <Card variant="subtle" padding="sm" style={styles.detailCard}>
                          <Text style={styles.detailLabel}>{copy.ageGroupDetailLabel}</Text>
                          <Text style={styles.detailValue}>{team.ageGroup}</Text>
                        </Card>
                        <Card variant="subtle" padding="sm" style={styles.detailCard}>
                          <Text style={styles.detailLabel}>{copy.totalPeopleLabel}</Text>
                          <Text style={styles.detailValue}>{teamUsers.length}</Text>
                        </Card>
                        <Card variant="subtle" padding="sm" style={styles.detailCard}>
                          <Text style={styles.detailLabel}>{copy.athletesDetailLabel}</Text>
                          <Text style={styles.detailValue}>{getAthleteCount(team, users)}</Text>
                        </Card>
                      </View>

                      <View style={styles.memberBlock}>
                        <View style={styles.memberBlockHeaderRow}>
                          <Text style={styles.memberBlockTitle}>{copy.teamPeopleTitle}</Text>
                          {userCanManageTeamRoster ? (
                            <AppButton
                              title={addMemberOpenTeamId === team.id ? copy.close : copy.addPerson}
                              variant="secondary"
                              onPress={() => {
                                setAddMemberOpenTeamId(addMemberOpenTeamId === team.id ? "" : team.id);
                                setAddMemberSearchQuery("");
                              }}
                              style={styles.addMemberToggle}
                            />
                          ) : null}
                        </View>

                        {teamUsers.length === 0 ? (
                          <Card variant="subtle" padding="sm">
                            <Text style={styles.emptyText}>{copy.noTeamPeople}</Text>
                          </Card>
                        ) : (
                          <>
                            {teamUsers.length > 5 ? (
                              <SearchField
                                value={memberSearchQuery}
                                onChangeText={setMemberSearchQuery}
                                placeholder={copy.searchInTeamPlaceholder}
                                accessibilityLabel={copy.searchInTeamA11y}
                                style={styles.memberSearchField}
                              />
                            ) : null}

                            {(() => {
                              const filteredTeamUsers = teamUsers.filter((member) =>
                                matchesSearchQuery(memberSearchQuery, member.fullName, member.email)
                              );

                              if (filteredTeamUsers.length === 0) {
                                return (
                                  <Card variant="subtle" padding="sm">
                                    <Text style={styles.emptyText}>{copy.noSearchMatches}</Text>
                                  </Card>
                                );
                              }

                              return (
                                <View style={styles.memberList}>
                                  {filteredTeamUsers.map((member) => {
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
                                          <Text style={styles.memberMeta}>{member.email || copy.userStatusLabel(member.status)}</Text>
                                        </View>
                                        <AppButton
                                          title={copy.message}
                                          variant="secondary"
                                          onPress={() => openMessages(member.fullName)}
                                          style={styles.memberButton}
                                        />
                                        {userCanManageTeamRoster && !isProtectedMember ? (
                                          <AppButton
                                            title={isUpdatingThisMember ? copy.processing : copy.remove}
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
                              );
                            })()}
                          </>
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
                                return <Text style={styles.emptyText}>{copy.noAvailableMembers}</Text>;
                              }

                              const filteredAvailableUsers = availableUsers.filter((user) =>
                                matchesSearchQuery(addMemberSearchQuery, user.fullName, user.email)
                              );

                              return (
                                <>
                                  {availableUsers.length > 5 ? (
                                    <SearchField
                                      value={addMemberSearchQuery}
                                      onChangeText={setAddMemberSearchQuery}
                                      placeholder={copy.searchToAddPlaceholder}
                                      accessibilityLabel={copy.searchToAddA11y}
                                      style={styles.memberSearchField}
                                    />
                                  ) : null}

                                  {filteredAvailableUsers.length === 0 ? (
                                    <Text style={styles.emptyText}>{copy.noSearchMatches}</Text>
                                  ) : (
                                    filteredAvailableUsers.map((user) => {
                                      const isUpdatingThisUser = updatingMemberId === user.id;

                                      return (
                                        <View key={user.id} style={styles.addMemberRow}>
                                          <View style={styles.memberInfo}>
                                            <Text style={styles.memberName}>{user.fullName}</Text>
                                            <Text style={styles.memberMeta}>{user.email || copy.userStatusLabel(user.status)}</Text>
                                          </View>
                                          <AppButton
                                            title={isUpdatingThisUser ? copy.processing : copy.add}
                                            disabled={isUpdatingThisUser}
                                            onPress={() => setTeamMembership(team, user, true)}
                                            style={styles.memberButton}
                                          />
                                        </View>
                                      );
                                    })
                                  )}
                                </>
                              );
                            })()}
                          </Card>
                        ) : null}
                      </View>

                      {isPendingRemove ? (
                        <Card variant="danger" padding="sm">
                          <Text style={styles.confirmTitle}>{copy.removeConfirmTitle}</Text>
                          <Text style={styles.confirmText}>{copy.removeConfirmText}</Text>
                        </Card>
                      ) : null}

                      <View style={styles.teamActionsRow}>
                        <AppButton
                          title={isPendingRemove ? copy.confirmRemove : copy.removeTeamButton}
                          variant="danger"
                          onPress={() => removeTeam(team)}
                          style={styles.actionButton}
                        />

                        {isPendingRemove ? (
                          <AppButton
                            title={copy.cancel}
                            variant="ghost"
                            onPress={() => {
                              setPendingRemoveTeamId("");
                              setStatusMessage(copy.removeTeamCancelled);
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
  memberSearchField: { marginBottom: theme.spacing.md },
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
