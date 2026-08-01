import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppScreenLayout } from "@/components/AppScreenLayout";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import type { StatusBadgeTone } from "@/components/StatusBadge";
import { theme } from "@/constants/theme";
import { useAppDataContext } from "@/providers/AppDataProvider";
import { authService } from "@/services/authService";
import { firestoreMemberManagementService } from "@/services/firestoreMemberManagementService";
import type { Team, UserProfile, UserRole, UserStatus } from "@/types/teamSync";

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
  const { appData, refresh } = useAppDataContext();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [editingUserId, setEditingUserId] = useState("");
  const [draftRole, setDraftRole] = useState<EditableRole>("athlete");
  const [draftStatus, setDraftStatus] = useState<UserStatus>("active");
  const [draftTeamIds, setDraftTeamIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Üyeler MaviTeam kulüp datasından yüklendi.");

  async function refreshMembersData() {
    try {
      await refresh();
      setStatusMessage("Üyeler MaviTeam kulüp datasından yüklendi.");
    } catch {
      setStatusMessage("Üyeler yüklenirken bir sorun oluştu.");
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

      await refresh();
      setEditingUserId("");
      setStatusMessage(`${member.fullName} bilgileri kaydedildi.`);
    } catch (memberError) {
      setStatusMessage(getMemberErrorMessage(memberError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppScreenLayout>
      <PageHeader
        title="Üye Yönetimi"
        subtitle="Üyeleri kompakt listede gör, kişiye tıklayınca detayları aç ve admin olarak rol/takım bilgilerini düzenle."
      />

      <Card style={styles.heroCard} padding="lg">
        <StatusBadge label="Kulüp kullanıcı kontrolü" tone="info" style={styles.heroLabel} />
        <Text style={styles.heroTitle}>Roller, durumlar ve takım bağlantıları</Text>
        <Text style={styles.heroSubtitle}>Kartlar kapalıyken ekran sade kalır. Sadece seçtiğin kişinin detayları ve edit seçenekleri açılır.</Text>
      </Card>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}><Text style={styles.statValue}>{members.length}</Text><Text style={styles.statLabel}>Toplam</Text></Card>
        <Card style={styles.statCard}><Text style={styles.statValue}>{activeCount}</Text><Text style={styles.statLabel}>Aktif</Text></Card>
        <Card style={styles.statCard}><Text style={styles.statValue}>{coachCount}</Text><Text style={styles.statLabel}>Coach</Text></Card>
      </View>

      <Card style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>Kulüp üyeleri</Text>
            <Text style={styles.sectionSubtitle}>{statusMessage}</Text>
          </View>
          <AppButton title="Yenile" variant="ghost" onPress={refreshMembersData} style={styles.refreshButton} />
        </View>

        {members.length === 0 ? (
          <EmptyState title="Henüz üye yok" description="Kullanıcılar kulübe katıldıkça burada görünecek." />
        ) : (
          <View style={styles.memberList}>
            {members.map((member) => {
              const isSelected = selectedUserId === member.id;
              const isEditing = editingUserId === member.id;
              const isProtected = member.id === currentUser?.id || member.id === clubOwnerId || member.role === "superAdmin";

              return (
                <Card key={member.id} padding="none" style={[styles.memberCard, isSelected ? styles.memberCardSelected : null]}>
                  <Pressable onPress={() => openMember(member)} style={({ pressed }) => [styles.memberSummary, pressed ? styles.pressed : null]}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(member.fullName)}</Text></View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{member.fullName}</Text>
                      <Text style={styles.memberMeta}>{member.email || "E-posta yok"}</Text>
                    </View>
                    <View style={styles.memberBadges}>
                      <StatusBadge label={roleLabels[member.role]} tone="info" />
                      <StatusBadge label={statusLabels[member.status]} tone={statusTones[member.status]} />
                    </View>
                  </Pressable>

                  {isSelected ? (
                    <View style={styles.expandedArea}>
                      <View style={styles.detailGrid}>
                        <Card variant="subtle" padding="sm" style={styles.detailBox}><Text style={styles.detailLabel}>Takımlar</Text><Text style={styles.detailValue}>{getTeamNames(member, teams)}</Text></Card>
                        <Card variant="subtle" padding="sm" style={styles.detailBox}><Text style={styles.detailLabel}>Kullanıcı ID</Text><Text style={styles.detailValue}>{member.id}</Text></Card>
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
                            <AppButton title={isSaving ? "Saving..." : "Save"} disabled={isSaving} onPress={() => saveMember(member)} style={styles.actionButton} />
                            <AppButton title="Cancel" variant="ghost" disabled={isSaving} onPress={() => setEditingUserId("")} style={styles.actionButton} />
                          </View>
                        </View>
                      ) : (
                        <View style={styles.actionRow}>
                          <AppButton
                            title={isProtected ? "Protected" : "Edit"}
                            variant="secondary"
                            disabled={!userCanManageMembers || isProtected}
                            onPress={() => startEdit(member)}
                            style={styles.actionButton}
                          />
                          <Text style={styles.inlineHint}>{isProtected ? "Kendi hesabın, owner veya platform admin korunur." : "Rol, durum ve takımları düzenle."}</Text>
                        </View>
                      )}
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </View>
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
  memberList: { gap: theme.spacing.md },
  memberCard: { overflow: "hidden" },
  memberCardSelected: { borderColor: theme.colors.brand.primary },
  memberSummary: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md, padding: theme.spacing.lg },
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
  chip: { borderWidth: 1, borderColor: theme.colors.border.default, borderRadius: theme.radius.full, backgroundColor: theme.colors.background.surface, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.lg },
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
