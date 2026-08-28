import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppScreenLayout } from "@/components/AppScreenLayout";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { SearchField } from "@/components/SearchField";
import { StatusBadge } from "@/components/StatusBadge";
import type { StatusBadgeTone } from "@/components/StatusBadge";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/localization";
import { useAppDataContext } from "@/providers/AppDataProvider";
import { authService } from "@/services/authService";
import { firestoreMemberManagementService } from "@/services/firestoreMemberManagementService";
import type { Team, UserProfile, UserRole, UserStatus } from "@/types/teamSync";
import { matchesSearchQuery } from "@/utils/search";

type EditableRole = Exclude<UserRole, "superAdmin">;

const EMPTY_USERS: UserProfile[] = [];
const EMPTY_TEAMS: Team[] = [];

const statusTones: Record<UserStatus, StatusBadgeTone> = {
  active: "success",
  pending: "warning",
  removed: "danger",
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

function isEditableRole(role: UserRole): role is EditableRole {
  return role !== "superAdmin";
}

function sortMembers(users: UserProfile[]) {
  return [...users].sort((firstUser, secondUser) => {
    if (firstUser.status === "removed" && secondUser.status !== "removed") return 1;
    if (firstUser.status !== "removed" && secondUser.status === "removed") return -1;
    return firstUser.fullName.localeCompare(secondUser.fullName);
  });
}

function getCopy(language: "tr" | "en") {
  const en = language === "en";

  const roleOptions: { label: string; value: EditableRole }[] = [
    { label: en ? "Admin" : "Yönetici", value: "clubAdmin" },
    { label: en ? "Coach" : "Koç", value: "coach" },
    { label: en ? "Parent" : "Veli", value: "parent" },
    { label: en ? "Athlete" : "Sporcu", value: "athlete" },
  ];

  const statusOptions: { label: string; value: UserStatus }[] = [
    { label: en ? "Active" : "Aktif", value: "active" },
    { label: en ? "Pending" : "Beklemede", value: "pending" },
    { label: en ? "Removed" : "Çıkarıldı", value: "removed" },
  ];

  const roleLabels: Record<UserRole, string> = {
    superAdmin: en ? "Platform Admin" : "Platform Yöneticisi",
    clubAdmin: en ? "Admin" : "Yönetici",
    coach: en ? "Coach" : "Koç",
    parent: en ? "Parent" : "Veli",
    athlete: en ? "Athlete" : "Sporcu",
  };

  const statusLabels: Record<UserStatus, string> = {
    active: en ? "Active" : "Aktif",
    pending: en ? "Pending" : "Beklemede",
    removed: en ? "Removed" : "Çıkarıldı",
  };

  function getTeamNames(user: UserProfile, teams: Team[]) {
    const names = teams.filter((team) => user.teamIds.includes(team.id)).map((team) => team.name);
    return names.length > 0 ? names.join(", ") : en ? "No team" : "Takım yok";
  }

  function getMemberErrorMessage(error: unknown) {
    const message = error instanceof Error ? error.message : "";

    if (message === "MEMBER_SELF_EDIT_DENIED") return en ? "You can't change your own role here." : "Kendi rolünü buradan değiştiremezsin.";
    if (message === "MEMBER_OWNER_EDIT_DENIED") return en ? "The club owner's role or status can't be changed here." : "Kulüp sahibinin rolü veya durumu buradan değiştirilemez.";
    if (message === "MEMBER_PERMISSION_DENIED") return en ? "You need club admin access to do this." : "Bu işlem için kulüp admin yetkisi gerekli.";
    if (message === "MEMBER_TEAM_MISSING") return en ? "One of the selected teams no longer exists." : "Seçilen takımlardan biri artık mevcut değil.";
    if (message === "MEMBER_MISSING") return en ? "User not found." : "Kullanıcı bulunamadı.";

    return en ? "Something went wrong while updating the member." : "Üye güncellenirken bir sorun oluştu.";
  }

  return {
    pageTitle: en ? "Member Management" : "Üye Yönetimi",
    pageSubtitle: en
      ? "Browse members in a compact list, tap a person to expand their details, and edit role/team info as an admin."
      : "Üyeleri kompakt listede gör, kişiye tıklayınca detayları aç ve admin olarak rol/takım bilgilerini düzenle.",
    heroLabel: en ? "Club user controls" : "Kulüp kullanıcı kontrolü",
    heroTitle: en ? "Roles, statuses, and team connections" : "Roller, durumlar ve takım bağlantıları",
    heroSubtitle: en
      ? "The screen stays simple while cards are collapsed. Only the person you select expands with details and edit options."
      : "Kartlar kapalıyken ekran sade kalır. Sadece seçtiğin kişinin detayları ve edit seçenekleri açılır.",
    statTotal: en ? "Total" : "Toplam",
    statActive: en ? "Active" : "Aktif",
    statCoaches: en ? "Coaches" : "Koç",
    clubMembersTitle: en ? "Club members" : "Kulüp üyeleri",
    refresh: en ? "Refresh" : "Yenile",
    noMembersTitle: en ? "No members yet" : "Henüz üye yok",
    noMembersDescription: en ? "Members will appear here as they join the club." : "Kullanıcılar kulübe katıldıkça burada görünecek.",
    searchPlaceholder: en ? "Search name or email..." : "İsim veya e-posta ara...",
    searchA11y: en ? "Search members" : "Üyelerde ara",
    noSearchMatchesTitle: en ? "No members match your search" : "Aramayla eşleşen üye yok",
    noSearchMatchesDescription: en ? "Try a different name or email." : "Farklı bir isim veya e-posta ile tekrar dene.",
    noEmail: en ? "No email" : "E-posta yok",
    teamsLabel: en ? "Teams" : "Takımlar",
    userIdLabel: en ? "User ID" : "Kullanıcı ID",
    roleLabel: en ? "Role" : "Rol",
    statusLabel: en ? "Status" : "Durum",
    teamsChipLabel: en ? "Teams" : "Takımlar",
    noTeamsYet: en ? "No teams yet." : "Henüz takım yok.",
    saving: en ? "Saving..." : "Kaydediliyor...",
    save: en ? "Save" : "Kaydet",
    cancel: en ? "Cancel" : "Vazgeç",
    protected: en ? "Protected" : "Korumalı",
    edit: en ? "Edit" : "Düzenle",
    protectedHint: en
      ? "Your own account, the owner, and platform admins are protected."
      : "Kendi hesabın, owner veya platform admin korunur.",
    editableHint: en ? "Edit role, status, and teams." : "Rol, durum ve takımları düzenle.",
    // Status messages
    membersUpdated: en ? "Members updated." : "Üyeler güncellendi.",
    membersLoadFailed: en ? "Something went wrong while loading members." : "Üyeler yüklenirken bir sorun oluştu.",
    memberDetailClosed: en ? "Member details closed." : "Üye detayı kapatıldı.",
    memberDetailOpened: (name: string) => (en ? `${name} details opened.` : `${name} detayı açıldı.`),
    mustBeAdminToEdit: en ? "You need to be a club admin to edit members." : "Üye düzenlemek için kulüp admin olmalısın.",
    cannotEditOwnRole: en ? "You can't change your own role here." : "Kendi rolünü buradan değiştiremezsin.",
    cannotEditOwnerRole: en ? "The club owner's role or status can't be changed here." : "Kulüp sahibinin rolü veya durumu buradan değiştirilemez.",
    platformAdminNotEditable: en ? "The platform admin role can't be edited from this screen." : "Platform admin rolü bu ekrandan düzenlenemez.",
    editModeOpened: en ? "Edit mode opened. Tap Save once you're done making changes." : "Düzenleme modu açıldı. Değişiklikleri yaptıktan sonra Kaydet'e bas.",
    firebaseRequiredForMemberManagement: en
      ? "Signing in is required to manage member roles and teams."
      : "Üye rol/takım yönetimi için Firebase girişi gerekli.",
    memberSaved: (name: string) => (en ? `${name}'s details were saved.` : `${name} bilgileri kaydedildi.`),
    getMemberErrorMessage,
    getTeamNames,
    roleOptions,
    statusOptions,
    roleLabels,
    statusLabels,
  };
}

export default function MembersScreen() {
  const { language } = useTranslation();
  const copy = useMemo(() => getCopy(language), [language]);
  const { appData, refresh } = useAppDataContext();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [editingUserId, setEditingUserId] = useState("");
  const [draftRole, setDraftRole] = useState<EditableRole>("athlete");
  const [draftStatus, setDraftStatus] = useState<UserStatus>("active");
  const [draftTeamIds, setDraftTeamIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(copy.membersUpdated);
  const [searchQuery, setSearchQuery] = useState("");

  async function refreshMembersData() {
    try {
      await refresh();
      setStatusMessage(copy.membersUpdated);
    } catch {
      setStatusMessage(copy.membersLoadFailed);
    }
  }

  const users = appData?.users ?? EMPTY_USERS;
  const teams = appData?.teams ?? EMPTY_TEAMS;
  const currentUser = appData?.currentUser;
  const clubOwnerId = appData?.club.ownerId ?? "";
  const userCanManageMembers = currentUser?.role === "clubAdmin";

  const members = useMemo(() => {
    if (appData === null) return EMPTY_USERS;
    return sortMembers(users.filter((user) => user.clubId === appData.club.id));
  }, [appData, users]);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => matchesSearchQuery(searchQuery, member.fullName, member.email));
  }, [members, searchQuery]);

  const activeCount = members.filter((member) => member.status === "active").length;
  const coachCount = members.filter((member) => member.role === "coach" && member.status !== "removed").length;

  function openMember(member: UserProfile) {
    const nextSelectedId = selectedUserId === member.id ? "" : member.id;
    setSelectedUserId(nextSelectedId);
    setEditingUserId("");
    setStatusMessage(nextSelectedId === "" ? copy.memberDetailClosed : copy.memberDetailOpened(member.fullName));
  }

  function startEdit(member: UserProfile) {
    if (!userCanManageMembers || currentUser === undefined) {
      setStatusMessage(copy.mustBeAdminToEdit);
      return;
    }

    if (member.id === currentUser.id) {
      setStatusMessage(copy.cannotEditOwnRole);
      return;
    }

    if (member.id === clubOwnerId) {
      setStatusMessage(copy.cannotEditOwnerRole);
      return;
    }

    if (!isEditableRole(member.role)) {
      setStatusMessage(copy.platformAdminNotEditable);
      return;
    }

    setEditingUserId(member.id);
    setDraftRole(member.role);
    setDraftStatus(member.status);
    setDraftTeamIds(member.teamIds);
    setStatusMessage(copy.editModeOpened);
  }

  function toggleDraftTeam(teamId: string) {
    setDraftTeamIds((currentTeamIds) => {
      if (currentTeamIds.includes(teamId)) {
        return currentTeamIds.filter((currentTeamId) => currentTeamId !== teamId);
      }

      return [...currentTeamIds, teamId];
    });
  }

  async function saveMember(member: UserProfile) {
    const firebaseUser = authService.getCurrentUser();

    if (!authService.isConfigured() || firebaseUser === null) {
      setStatusMessage(copy.firebaseRequiredForMemberManagement);
      return;
    }

    try {
      setIsSaving(true);
      await firestoreMemberManagementService.updateClubMember(firebaseUser, {
        targetUserId: member.id,
        role: draftRole,
        status: draftStatus,
        teamIds: draftStatus === "removed" ? [] : draftTeamIds,
      });

      await refresh();
      setEditingUserId("");
      setStatusMessage(copy.memberSaved(member.fullName));
    } catch (memberError) {
      setStatusMessage(copy.getMemberErrorMessage(memberError));
    } finally {
      setIsSaving(false);
    }
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
        <Text style={styles.heroSubtitle}>{copy.heroSubtitle}</Text>
      </Card>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}><Text style={styles.statValue}>{members.length}</Text><Text style={styles.statLabel}>{copy.statTotal}</Text></Card>
        <Card style={styles.statCard}><Text style={styles.statValue}>{activeCount}</Text><Text style={styles.statLabel}>{copy.statActive}</Text></Card>
        <Card style={styles.statCard}><Text style={styles.statValue}>{coachCount}</Text><Text style={styles.statLabel}>{copy.statCoaches}</Text></Card>
      </View>

      <Card style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>{copy.clubMembersTitle}</Text>
            <Text style={styles.sectionSubtitle}>{statusMessage}</Text>
          </View>
          <AppButton title={copy.refresh} variant="ghost" onPress={refreshMembersData} style={styles.refreshButton} />
        </View>

        {members.length === 0 ? (
          <EmptyState title={copy.noMembersTitle} description={copy.noMembersDescription} />
        ) : (
          <>
            {members.length > 5 ? (
              <SearchField
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={copy.searchPlaceholder}
                accessibilityLabel={copy.searchA11y}
                style={styles.searchField}
              />
            ) : null}

            {filteredMembers.length === 0 ? (
              <EmptyState title={copy.noSearchMatchesTitle} description={copy.noSearchMatchesDescription} />
            ) : (
          <View style={styles.memberList}>
            {filteredMembers.map((member) => {
              const isSelected = selectedUserId === member.id;
              const isEditing = editingUserId === member.id;
              const isProtected = member.id === currentUser?.id || member.id === clubOwnerId || member.role === "superAdmin";

              return (
                <Card key={member.id} padding="none" style={[styles.memberCard, isSelected ? styles.memberCardSelected : null]}>
                  <Pressable onPress={() => openMember(member)} style={({ pressed }) => [styles.memberSummary, pressed ? styles.pressed : null]}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(member.fullName)}</Text></View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{member.fullName}</Text>
                      <Text style={styles.memberMeta}>{member.email || copy.noEmail}</Text>
                    </View>
                    <View style={styles.memberBadges}>
                      <StatusBadge label={copy.roleLabels[member.role]} tone="info" />
                      <StatusBadge label={copy.statusLabels[member.status]} tone={statusTones[member.status]} />
                    </View>
                  </Pressable>

                  {isSelected ? (
                    <View style={styles.expandedArea}>
                      <View style={styles.detailGrid}>
                        <Card variant="subtle" padding="sm" style={styles.detailBox}><Text style={styles.detailLabel}>{copy.teamsLabel}</Text><Text style={styles.detailValue}>{copy.getTeamNames(member, teams)}</Text></Card>
                        <Card variant="subtle" padding="sm" style={styles.detailBox}><Text style={styles.detailLabel}>{copy.userIdLabel}</Text><Text style={styles.detailValue}>{member.id}</Text></Card>
                      </View>

                      {isEditing ? (
                        <View style={styles.editPanel}>
                          <Text style={styles.editLabel}>{copy.roleLabel}</Text>
                          <View style={styles.chipRow}>{copy.roleOptions.map((option) => (<Pressable key={option.value} onPress={() => setDraftRole(option.value)} style={({ pressed }) => [styles.chip, draftRole === option.value ? styles.chipSelected : null, pressed ? styles.pressed : null]}><Text style={[styles.chipText, draftRole === option.value ? styles.chipTextSelected : null]}>{option.label}</Text></Pressable>))}</View>

                          <Text style={styles.editLabel}>{copy.statusLabel}</Text>
                          <View style={styles.chipRow}>{copy.statusOptions.map((option) => (<Pressable key={option.value} onPress={() => setDraftStatus(option.value)} style={({ pressed }) => [styles.chip, draftStatus === option.value ? styles.chipSelected : null, pressed ? styles.pressed : null]}><Text style={[styles.chipText, draftStatus === option.value ? styles.chipTextSelected : null]}>{option.label}</Text></Pressable>))}</View>

                          <Text style={styles.editLabel}>{copy.teamsChipLabel}</Text>
                          <View style={styles.chipRow}>{teams.length === 0 ? <Text style={styles.emptyText}>{copy.noTeamsYet}</Text> : teams.map((team) => { const isTeamSelected = draftTeamIds.includes(team.id); return (<Pressable key={team.id} onPress={() => toggleDraftTeam(team.id)} disabled={draftStatus === "removed"} style={({ pressed }) => [styles.chip, isTeamSelected ? styles.chipSelected : null, draftStatus === "removed" ? styles.chipDisabled : null, pressed ? styles.pressed : null]}><Text style={[styles.chipText, isTeamSelected ? styles.chipTextSelected : null]}>{team.name}</Text></Pressable>); })}</View>

                          <View style={styles.actionRow}>
                            <AppButton title={isSaving ? copy.saving : copy.save} disabled={isSaving} onPress={() => saveMember(member)} style={styles.actionButton} />
                            <AppButton title={copy.cancel} variant="ghost" disabled={isSaving} onPress={() => setEditingUserId("")} style={styles.actionButton} />
                          </View>
                        </View>
                      ) : (
                        <View style={styles.actionRow}>
                          <AppButton
                            title={isProtected ? copy.protected : copy.edit}
                            variant="secondary"
                            disabled={!userCanManageMembers || isProtected}
                            onPress={() => startEdit(member)}
                            style={styles.actionButton}
                          />
                          <Text style={styles.inlineHint}>{isProtected ? copy.protectedHint : copy.editableHint}</Text>
                        </View>
                      )}
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </View>
            )}
          </>
        )}
      </Card>
    </AppScreenLayout>
  );
}

const styles = StyleSheet.create({
  heroCard: { marginBottom: theme.spacing["2xl"] },
  heroLabel: { marginBottom: theme.spacing.lg },
  heroTitle: { fontSize: theme.fontSizes["2xl"], fontWeight: theme.fontWeights.semibold, color: theme.colors.text.primary, lineHeight: theme.lineHeights["2xl"], marginBottom: theme.spacing.sm },
  heroSubtitle: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.lg, lineHeight: theme.lineHeights.xl, fontWeight: theme.fontWeights.regular },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.lg, marginBottom: theme.spacing["2xl"] },
  statCard: { flexGrow: 1, flexBasis: 160 },
  statValue: { color: theme.colors.text.primary, fontSize: theme.fontSizes["4xl"], fontWeight: theme.fontWeights.bold },
  statLabel: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.medium, marginTop: theme.spacing.xs },
  section: { marginBottom: theme.spacing["2xl"] },
  sectionHeaderRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: theme.spacing.md, marginBottom: theme.spacing.xl },
  sectionHeaderText: { flex: 1 },
  sectionTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes["2xl"], fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.xs },
  sectionSubtitle: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.regular, lineHeight: theme.lineHeights.md },
  refreshButton: { alignSelf: "flex-start" },
  searchField: { marginBottom: theme.spacing.md },
  memberList: { gap: theme.spacing.sm },
  memberCard: { overflow: "hidden" },
  memberCardSelected: { borderColor: theme.colors.brand.primary },
  memberSummary: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md, padding: theme.spacing.md },
  avatar: { width: 42, height: 42, borderRadius: theme.radius.full, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.brand.primarySoft },
  avatarText: { color: theme.colors.text.brand, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold },
  memberInfo: { flex: 1, minWidth: 0 },
  memberName: { color: theme.colors.text.primary, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.semibold },
  memberMeta: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.medium, marginTop: theme.spacing.xxs },
  memberBadges: { alignItems: "flex-end", gap: theme.spacing.xs },
  expandedArea: { borderTopWidth: 1, borderTopColor: theme.colors.border.default, padding: theme.spacing.lg, gap: theme.spacing.lg, backgroundColor: theme.colors.background.subtle },
  detailGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md },
  detailBox: { flexGrow: 1, flexBasis: 220 },
  detailLabel: { color: theme.colors.text.muted, fontSize: theme.fontSizes.xs, fontWeight: theme.fontWeights.medium, textTransform: "uppercase", marginBottom: theme.spacing.xs },
  detailValue: { color: theme.colors.text.primary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold },
  editPanel: { gap: theme.spacing.md },
  editLabel: { color: theme.colors.text.primary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  chip: { borderWidth: 1, borderColor: theme.colors.border.default, borderRadius: theme.radius.md, backgroundColor: theme.colors.background.surface, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.lg },
  chipSelected: { backgroundColor: theme.colors.brand.primary, borderColor: theme.colors.brand.primary },
  chipDisabled: { opacity: 0.45 },
  chipText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.medium },
  chipTextSelected: { color: theme.colors.text.inverse },
  actionRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: theme.spacing.sm },
  actionButton: { minWidth: 120 },
  inlineHint: { flex: 1, color: theme.colors.text.muted, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.medium },
  emptyText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.regular },
  pressed: { opacity: 0.84, transform: [{ scale: 0.992 }] },
});
