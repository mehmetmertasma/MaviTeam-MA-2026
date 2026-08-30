import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppScreenLayout } from "@/components/AppScreenLayout";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { MemberProfileBubble } from "@/components/MemberProfileBubble";
import type { MemberProfileDraft } from "@/components/MemberProfileBubble";
import { PageHeader } from "@/components/PageHeader";
import { SearchField } from "@/components/SearchField";
import { StatusBadge } from "@/components/StatusBadge";
import type { StatusBadgeTone } from "@/components/StatusBadge";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/localization";
import { useAppDataContext } from "@/providers/AppDataProvider";
import { authService } from "@/services/authService";
import { firestoreMemberManagementService } from "@/services/firestoreMemberManagementService";
import type { AttendanceRecord, Payment, Team, UserProfile, UserRole, UserStatus } from "@/types/teamSync";
import { matchesSearchQuery } from "@/utils/search";

const EMPTY_USERS: UserProfile[] = [];
const EMPTY_TEAMS: Team[] = [];
const EMPTY_ATTENDANCE: AttendanceRecord[] = [];
const EMPTY_PAYMENTS: Payment[] = [];

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

function sortMembers(users: UserProfile[]) {
  return [...users].sort((firstUser, secondUser) => {
    if (firstUser.status === "removed" && secondUser.status !== "removed") return 1;
    if (firstUser.status !== "removed" && secondUser.status === "removed") return -1;
    return firstUser.fullName.localeCompare(secondUser.fullName);
  });
}

function getCopy(language: "tr" | "en") {
  const en = language === "en";

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
      ? "Browse members in a compact list and tap a person to open their full profile."
      : "Üyeleri kompakt listede gör, kişiye tıklayınca tam profilini aç.",
    heroLabel: en ? "Club user controls" : "Kulüp kullanıcı kontrolü",
    heroTitle: en ? "Roles, statuses, and team connections" : "Roller, durumlar ve takım bağlantıları",
    heroSubtitle: en
      ? "Tap anyone to see their profile -- info, recent attendance, and (for coaches/admins) their dues."
      : "Herhangi birine dokunarak profilini gör -- bilgileri, son yoklaması ve (koç/admin isen) aidat durumu.",
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
    // Status messages
    membersUpdated: en ? "Members updated." : "Üyeler güncellendi.",
    membersLoadFailed: en ? "Something went wrong while loading members." : "Üyeler yüklenirken bir sorun oluştu.",
    firebaseRequiredForMemberManagement: en
      ? "Signing in is required to manage member roles and teams."
      : "Üye rol/takım yönetimi için Firebase girişi gerekli.",
    memberSaved: (name: string) => (en ? `${name}'s details were saved.` : `${name} bilgileri kaydedildi.`),
    getMemberErrorMessage,
    roleLabels,
    statusLabels,
  };
}

export default function MembersScreen() {
  const { language } = useTranslation();
  const copy = useMemo(() => getCopy(language), [language]);
  const { appData, refresh } = useAppDataContext();
  const [selectedMemberForProfile, setSelectedMemberForProfile] = useState<UserProfile | null>(null);
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
  const attendanceRecords = appData?.attendanceRecords ?? EMPTY_ATTENDANCE;
  const payments = appData?.payments ?? EMPTY_PAYMENTS;
  const currency = appData?.club.currency ?? "TRY";
  const currentUser = appData?.currentUser;
  const clubOwnerId = appData?.club.ownerId ?? "";
  const userCanManageMembers = currentUser?.role === "clubAdmin";
  const userCanViewDues = currentUser?.role === "clubAdmin" || currentUser?.role === "coach";

  const members = useMemo(() => {
    if (appData === null) return EMPTY_USERS;
    return sortMembers(users.filter((user) => user.clubId === appData.club.id));
  }, [appData, users]);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => matchesSearchQuery(searchQuery, member.fullName, member.email));
  }, [members, searchQuery]);

  const activeCount = members.filter((member) => member.status === "active").length;
  const coachCount = members.filter((member) => member.role === "coach" && member.status !== "removed").length;

  async function saveMember(member: UserProfile, draft: MemberProfileDraft) {
    const firebaseUser = authService.getCurrentUser();

    if (!authService.isConfigured() || firebaseUser === null) {
      setStatusMessage(copy.firebaseRequiredForMemberManagement);
      return;
    }

    try {
      setIsSaving(true);
      await firestoreMemberManagementService.updateClubMember(firebaseUser, {
        targetUserId: member.id,
        role: draft.role,
        status: draft.status,
        teamIds: draft.teamIds,
        monthlyDuesAmountCents: draft.monthlyDuesAmountCents,
      });

      await refresh();
      setSelectedMemberForProfile(null);
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
                {filteredMembers.map((member) => (
                  <Card key={member.id} padding="none" style={styles.memberCard}>
                    <Pressable
                      onPress={() => setSelectedMemberForProfile(member)}
                      style={({ pressed }) => [styles.memberSummary, pressed ? styles.pressed : null]}
                    >
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
                  </Card>
                ))}
              </View>
            )}
          </>
        )}
      </Card>

      {selectedMemberForProfile !== null ? (
        <MemberProfileBubble
          key={selectedMemberForProfile.id}
          member={selectedMemberForProfile}
          teams={teams}
          attendanceRecords={attendanceRecords}
          payments={payments}
          currency={currency}
          canManage={userCanManageMembers}
          canViewDues={userCanViewDues}
          isProtected={
            selectedMemberForProfile.id === currentUser?.id
            || selectedMemberForProfile.id === clubOwnerId
            || selectedMemberForProfile.role === "superAdmin"
          }
          isSaving={isSaving}
          onSave={saveMember}
          onClose={() => setSelectedMemberForProfile(null)}
          language={language}
        />
      ) : null}
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
  memberSummary: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md, padding: theme.spacing.md },
  avatar: { width: 42, height: 42, borderRadius: theme.radius.full, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.brand.primarySoft },
  avatarText: { color: theme.colors.text.brand, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold },
  memberInfo: { flex: 1, minWidth: 0 },
  memberName: { color: theme.colors.text.primary, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.semibold },
  memberMeta: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.medium, marginTop: theme.spacing.xxs },
  memberBadges: { alignItems: "flex-end", gap: theme.spacing.xs },
  pressed: { opacity: 0.84, transform: [{ scale: 0.992 }] },
});
