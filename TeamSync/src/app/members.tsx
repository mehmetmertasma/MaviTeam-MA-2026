import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { theme } from "@/constants/theme";
import { authService } from "@/services/authService";
import { firestoreMemberManagementService } from "@/services/firestoreMemberManagementService";
import { teamSyncService } from "@/services/teamSyncService";
import type { Team, TeamSyncAppData, UserProfile, UserRole, UserStatus } from "@/types/teamSync";

type EditableRole = Exclude<UserRole, "superAdmin">;

const EMPTY_USERS: UserProfile[] = [];
const EMPTY_TEAMS: Team[] = [];

const roleOptions: { label: string; value: EditableRole }[] = [
  { label: "Admin", value: "clubAdmin" },
  { label: "Coach", value: "coach" },
  { label: "Parent", value: "parent" },
  { label: "Athlete", value: "athlete" },
];

const statusOptions: { label: string; value: UserStatus }[] = [
  { label: "Active", value: "active" },
  { label: "Pending", value: "pending" },
  { label: "Removed", value: "removed" },
];

const roleLabels: Record<UserRole, string> = {
  superAdmin: "Platform Admin",
  clubAdmin: "Admin",
  coach: "Coach",
  parent: "Parent",
  athlete: "Athlete",
};

const statusLabels: Record<UserStatus, string> = {
  active: "Active",
  pending: "Pending",
  removed: "Removed",
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

function getTeamNames(user: UserProfile, teams: Team[]) {
  const names = teams.filter((team) => user.teamIds.includes(team.id)).map((team) => team.name);
  return names.length > 0 ? names.join(", ") : "Takım yok";
}

function getMemberErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message === "MEMBER_SELF_EDIT_DENIED") return "Kendi rolünü buradan değiştiremezsin.";
  if (message === "MEMBER_OWNER_EDIT_DENIED") return "Kulüp sahibinin rolü veya durumu buradan değiştirilemez.";
  if (message === "MEMBER_PERMISSION_DENIED") return "Bu işlem için kulüp admin yetkisi gerekli.";
  if (message === "MEMBER_TEAM_MISSING") return "Seçilen takımlardan biri artık mevcut değil.";
  if (message === "MEMBER_MISSING") return "Kullanıcı bulunamadı.";

  return "Üye güncellenirken bir sorun oluştu.";
}

export default function MembersScreen() {
  const [appData, setAppData] = useState<TeamSyncAppData | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [editingUserId, setEditingUserId] = useState("");
  const [draftRole, setDraftRole] = useState<EditableRole>("athlete");
  const [draftStatus, setDraftStatus] = useState<UserStatus>("active");
  const [draftTeamIds, setDraftTeamIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Üyeler MaviTeam kulüp datasından yüklenecek.");

  const loadMembersData = useCallback(async () => {
    try {
      const loadedAppData = await teamSyncService.getAppData();
      setAppData(loadedAppData);
      setStatusMessage("Üyeler MaviTeam kulüp datasından yüklendi.");
    } catch {
      setStatusMessage("Üyeler yüklenirken bir sorun oluştu.");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMembersData();
    }, [loadMembersData])
  );

  const users = appData?.users ?? EMPTY_USERS;
  const teams = appData?.teams ?? EMPTY_TEAMS;
  const currentUser = appData?.currentUser;
  const clubOwnerId = appData?.club.ownerId ?? "";
  const userCanManageMembers = currentUser?.role === "clubAdmin";

  const members = useMemo(() => {
    if (appData === null) return EMPTY_USERS;
    return sortMembers(users.filter((user) => user.clubId === appData.club.id));
  }, [appData, users]);

  const activeCount = members.filter((member) => member.status === "active").length;
  const coachCount = members.filter((member) => member.role === "coach" && member.status !== "removed").length;

  function openMember(member: UserProfile) {
    const nextSelectedId = selectedUserId === member.id ? "" : member.id;
    setSelectedUserId(nextSelectedId);
    setEditingUserId("");
    setStatusMessage(nextSelectedId === "" ? "Üye detayı kapatıldı." : `${member.fullName} detayı açıldı.`);
  }

  function startEdit(member: UserProfile) {
    if (!userCanManageMembers || currentUser === undefined) {
      setStatusMessage("Üye düzenlemek için kulüp admin olmalısın.");
      return;
    }

    if (member.id === currentUser.id) {
      setStatusMessage("Kendi rolünü buradan değiştiremezsin.");
      return;
    }

    if (member.id === clubOwnerId) {
      setStatusMessage("Kulüp sahibinin rolü veya durumu buradan değiştirilemez.");
      return;
    }

    if (!isEditableRole(member.role)) {
      setStatusMessage("Platform admin rolü bu ekrandan düzenlenemez.");
      return;
    }

    setEditingUserId(member.id);
    setDraftRole(member.role);
    setDraftStatus(member.status);
    setDraftTeamIds(member.teamIds);
    setStatusMessage("Düzenleme modu açıldı. Değişiklikleri yaptıktan sonra Save'e bas.");
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
      setStatusMessage("Üye rol/takım yönetimi için Firebase girişi gerekli.");
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

      const refreshedData = await teamSyncService.getAppData();
      setAppData(refreshedData);
      setEditingUserId("");
      setStatusMessage(`${member.fullName} bilgileri kaydedildi.`);
    } catch (memberError) {
      setStatusMessage(getMemberErrorMessage(memberError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.pageHeader}>
          <Text style={styles.logo}>MaviTeam</Text>
          <Text style={styles.pageTitle}>Üye Yönetimi</Text>
          <Text style={styles.pageSubtitle}>Üyeleri kompakt listede gör, kişiye tıklayınca detayları aç ve admin olarak rol/takım bilgilerini düzenle.</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Kulüp kullanıcı kontrolü</Text>
          <Text style={styles.heroTitle}>Roller, durumlar ve takım bağlantıları</Text>
          <Text style={styles.heroSubtitle}>Kartlar kapalıyken ekran sade kalır. Sadece seçtiğin kişinin detayları ve edit seçenekleri açılır.</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}><Text style={styles.statValue}>{members.length}</Text><Text style={styles.statLabel}>Toplam</Text></View>
          <View style={styles.statCard}><Text style={styles.statValue}>{activeCount}</Text><Text style={styles.statLabel}>Aktif</Text></View>
          <View style={styles.statCard}><Text style={styles.statValue}>{coachCount}</Text><Text style={styles.statLabel}>Coach</Text></View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Kulüp üyeleri</Text>
              <Text style={styles.sectionSubtitle}>{statusMessage}</Text>
            </View>
            <Pressable onPress={loadMembersData} style={({ pressed }) => [styles.refreshButton, pressed ? styles.pressed : null]}>
              <Text style={styles.refreshButtonText}>Yenile</Text>
            </Pressable>
          </View>

          {members.length === 0 ? (
            <View style={styles.emptyCard}><Text style={styles.emptyTitle}>Henüz üye yok</Text><Text style={styles.emptyText}>Kullanıcılar kulübe katıldıkça burada görünecek.</Text></View>
          ) : (
            <View style={styles.memberList}>
              {members.map((member) => {
                const isSelected = selectedUserId === member.id;
                const isEditing = editingUserId === member.id;
                const isProtected = member.id === currentUser?.id || member.id === clubOwnerId || member.role === "superAdmin";

                return (
                  <View key={member.id} style={[styles.memberCard, isSelected ? styles.memberCardSelected : null]}>
                    <Pressable onPress={() => openMember(member)} style={({ pressed }) => [styles.memberSummary, pressed ? styles.pressed : null]}>
                      <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(member.fullName)}</Text></View>
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{member.fullName}</Text>
                        <Text style={styles.memberMeta}>{member.email || "E-posta yok"}</Text>
                      </View>
                      <View style={styles.memberBadges}>
                        <Text style={styles.roleBadge}>{roleLabels[member.role]}</Text>
                        <Text style={[styles.statusBadge, member.status === "active" ? styles.statusActive : null, member.status === "pending" ? styles.statusPending : null, member.status === "removed" ? styles.statusRemoved : null]}>{statusLabels[member.status]}</Text>
                      </View>
                    </Pressable>

                    {isSelected ? (
                      <View style={styles.expandedArea}>
                        <View style={styles.detailGrid}>
                          <View style={styles.detailBox}><Text style={styles.detailLabel}>Takımlar</Text><Text style={styles.detailValue}>{getTeamNames(member, teams)}</Text></View>
                          <View style={styles.detailBox}><Text style={styles.detailLabel}>Kullanıcı ID</Text><Text style={styles.detailValue}>{member.id}</Text></View>
                        </View>

                        {isEditing ? (
                          <View style={styles.editPanel}>
                            <Text style={styles.editLabel}>Rol</Text>
                            <View style={styles.chipRow}>{roleOptions.map((option) => (<Pressable key={option.value} onPress={() => setDraftRole(option.value)} style={({ pressed }) => [styles.chip, draftRole === option.value ? styles.chipSelected : null, pressed ? styles.pressed : null]}><Text style={[styles.chipText, draftRole === option.value ? styles.chipTextSelected : null]}>{option.label}</Text></Pressable>))}</View>

                            <Text style={styles.editLabel}>Durum</Text>
                            <View style={styles.chipRow}>{statusOptions.map((option) => (<Pressable key={option.value} onPress={() => setDraftStatus(option.value)} style={({ pressed }) => [styles.chip, draftStatus === option.value ? styles.chipSelected : null, pressed ? styles.pressed : null]}><Text style={[styles.chipText, draftStatus === option.value ? styles.chipTextSelected : null]}>{option.label}</Text></Pressable>))}</View>

                            <Text style={styles.editLabel}>Takımlar</Text>
                            <View style={styles.chipRow}>{teams.length === 0 ? <Text style={styles.emptyText}>Henüz takım yok.</Text> : teams.map((team) => { const isTeamSelected = draftTeamIds.includes(team.id); return (<Pressable key={team.id} onPress={() => toggleDraftTeam(team.id)} disabled={draftStatus === "removed"} style={({ pressed }) => [styles.chip, isTeamSelected ? styles.chipSelected : null, draftStatus === "removed" ? styles.chipDisabled : null, pressed ? styles.pressed : null]}><Text style={[styles.chipText, isTeamSelected ? styles.chipTextSelected : null]}>{team.name}</Text></Pressable>); })}</View>

                            <View style={styles.actionRow}>
                              <Pressable disabled={isSaving} onPress={() => saveMember(member)} style={({ pressed }) => [styles.saveButton, isSaving ? styles.buttonDisabled : null, pressed && !isSaving ? styles.pressed : null]}><Text style={styles.saveButtonText}>{isSaving ? "Saving..." : "Save"}</Text></Pressable>
                              <Pressable disabled={isSaving} onPress={() => setEditingUserId("")} style={({ pressed }) => [styles.cancelButton, pressed && !isSaving ? styles.pressed : null]}><Text style={styles.cancelButtonText}>Cancel</Text></Pressable>
                            </View>
                          </View>
                        ) : (
                          <View style={styles.actionRow}>
                            <Pressable disabled={!userCanManageMembers || isProtected} onPress={() => startEdit(member)} style={({ pressed }) => [styles.editButton, (!userCanManageMembers || isProtected) ? styles.buttonDisabled : null, pressed && userCanManageMembers && !isProtected ? styles.pressed : null]}><Text style={styles.editButtonText}>{isProtected ? "Protected" : "Edit"}</Text></Pressable>
                            <Text style={styles.inlineHint}>{isProtected ? "Kendi hesabın, owner veya platform admin korunur." : "Rol, durum ve takımları düzenle."}</Text>
                          </View>
                        )}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: theme.colors.background.app },
  screen: { flexGrow: 1, backgroundColor: theme.colors.background.app, paddingHorizontal: theme.spacing["2xl"], paddingBottom: theme.spacing["2xl"] },
  container: { width: "100%", maxWidth: 980, alignSelf: "center" },
  pageHeader: { marginBottom: theme.spacing["2xl"] },
  logo: { color: theme.colors.brand.primary, fontSize: theme.fontSizes["2xl"], fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.md },
  pageTitle: { color: theme.colors.text.inverse, fontSize: theme.fontSizes["5xl"], fontWeight: theme.fontWeights.black, lineHeight: theme.lineHeights["5xl"], marginBottom: theme.spacing.sm },
  pageSubtitle: { color: theme.colors.text.inverse, opacity: 0.76, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.semibold, lineHeight: theme.lineHeights.xl },
  heroCard: { backgroundColor: theme.colors.background.surface, borderRadius: theme.radius["2xl"], padding: theme.spacing["3xl"], marginBottom: theme.spacing["2xl"], ...theme.shadows.md },
  heroLabel: { alignSelf: "flex-start", backgroundColor: theme.colors.brand.primarySoft, color: theme.colors.text.brand, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.extrabold, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.lg, borderRadius: theme.radius.full, marginBottom: theme.spacing.lg },
  heroTitle: { fontSize: theme.fontSizes["4xl"], fontWeight: theme.fontWeights.black, color: theme.colors.text.primary, lineHeight: theme.lineHeights["4xl"], marginBottom: theme.spacing.sm },
  heroSubtitle: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.lg, lineHeight: theme.lineHeights.xl, fontWeight: theme.fontWeights.semibold },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.lg, marginBottom: theme.spacing["2xl"] },
  statCard: { flexGrow: 1, flexBasis: 160, backgroundColor: theme.colors.background.surface, borderRadius: theme.radius.xl, padding: theme.spacing.xl, ...theme.shadows.sm },
  statValue: { color: theme.colors.text.primary, fontSize: theme.fontSizes["4xl"], fontWeight: theme.fontWeights.black },
  statLabel: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.extrabold, marginTop: theme.spacing.xs },
  section: { backgroundColor: theme.colors.background.surface, borderRadius: theme.radius["2xl"], padding: theme.spacing["2xl"], ...theme.shadows.md },
  sectionHeaderRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: theme.spacing.md, marginBottom: theme.spacing.xl },
  sectionHeaderText: { flex: 1 },
  sectionTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes["2xl"], fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.xs },
  sectionSubtitle: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, lineHeight: theme.lineHeights.md },
  refreshButton: { backgroundColor: theme.colors.background.subtle, borderWidth: 1, borderColor: theme.colors.border.default, borderRadius: theme.radius.full, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.lg },
  refreshButtonText: { color: theme.colors.text.brand, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.black },
  memberList: { gap: theme.spacing.md },
  memberCard: { borderWidth: 1, borderColor: theme.colors.border.default, borderRadius: theme.radius.xl, backgroundColor: theme.colors.background.elevated, overflow: "hidden" },
  memberCardSelected: { borderColor: theme.colors.brand.primary },
  memberSummary: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md, padding: theme.spacing.lg },
  avatar: { width: 42, height: 42, borderRadius: theme.radius.full, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.brand.primarySoft },
  avatarText: { color: theme.colors.text.brand, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.black },
  memberInfo: { flex: 1, minWidth: 0 },
  memberName: { color: theme.colors.text.primary, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.black },
  memberMeta: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold, marginTop: theme.spacing.xxs },
  memberBadges: { alignItems: "flex-end", gap: theme.spacing.xs },
  roleBadge: { overflow: "hidden", borderRadius: theme.radius.full, backgroundColor: theme.colors.brand.primarySoft, color: theme.colors.text.brand, fontSize: theme.fontSizes.xs, fontWeight: theme.fontWeights.black, paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.md },
  statusBadge: { overflow: "hidden", borderRadius: theme.radius.full, backgroundColor: theme.colors.background.subtle, color: theme.colors.text.secondary, fontSize: theme.fontSizes.xs, fontWeight: theme.fontWeights.black, paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.md },
  statusActive: { backgroundColor: theme.colors.state.successSoft, color: theme.colors.text.success },
  statusPending: { backgroundColor: theme.colors.state.warningSoft, color: theme.colors.text.warning },
  statusRemoved: { backgroundColor: theme.colors.state.dangerSoft, color: theme.colors.text.danger },
  expandedArea: { borderTopWidth: 1, borderTopColor: theme.colors.border.default, padding: theme.spacing.lg, gap: theme.spacing.lg, backgroundColor: theme.colors.background.subtle },
  detailGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md },
  detailBox: { flexGrow: 1, flexBasis: 220, backgroundColor: theme.colors.background.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border.default, padding: theme.spacing.lg },
  detailLabel: { color: theme.colors.text.muted, fontSize: theme.fontSizes.xs, fontWeight: theme.fontWeights.black, textTransform: "uppercase", marginBottom: theme.spacing.xs },
  detailValue: { color: theme.colors.text.primary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.bold },
  editPanel: { gap: theme.spacing.md },
  editLabel: { color: theme.colors.text.primary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.black },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  chip: { borderWidth: 1, borderColor: theme.colors.border.default, borderRadius: theme.radius.full, backgroundColor: theme.colors.background.surface, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.lg },
  chipSelected: { backgroundColor: theme.colors.brand.primary, borderColor: theme.colors.brand.primary },
  chipDisabled: { opacity: 0.45 },
  chipText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.black },
  chipTextSelected: { color: theme.colors.text.inverse },
  actionRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: theme.spacing.sm },
  editButton: { backgroundColor: theme.colors.brand.primarySoft, borderRadius: theme.radius.full, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.xl },
  editButtonText: { color: theme.colors.text.brand, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.black },
  saveButton: { backgroundColor: theme.colors.brand.primary, borderRadius: theme.radius.full, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.xl },
  saveButtonText: { color: theme.colors.text.inverse, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.black },
  cancelButton: { backgroundColor: theme.colors.background.surface, borderWidth: 1, borderColor: theme.colors.border.default, borderRadius: theme.radius.full, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.xl },
  cancelButtonText: { color: theme.colors.text.brand, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.black },
  buttonDisabled: { opacity: 0.48 },
  inlineHint: { flex: 1, color: theme.colors.text.muted, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold },
  emptyCard: { backgroundColor: theme.colors.background.subtle, borderRadius: theme.radius.xl, borderWidth: 1, borderColor: theme.colors.border.default, padding: theme.spacing["2xl"], alignItems: "center" },
  emptyTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.xs },
  emptyText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold },
  pressed: { opacity: 0.84, transform: [{ scale: 0.992 }] },
});
