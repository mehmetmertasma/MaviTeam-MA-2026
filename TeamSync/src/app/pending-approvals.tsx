import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppScreenLayout } from "@/components/AppScreenLayout";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import type { StatusBadgeTone } from "@/components/StatusBadge";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/localization";
import { useAppDataContext } from "@/providers/AppDataProvider";
import { authService, getAuthErrorMessage } from "@/services/authService";
import { firestoreTeamSyncService } from "@/services/firestoreTeamSyncService";
import { teamSyncService } from "@/services/teamSyncService";
import type { JoinRequest, UserProfile } from "@/types/teamSync";

type RequestRow = {
  request: JoinRequest;
  user?: UserProfile;
};

function getStatusText(status: JoinRequest["status"], copy: ReturnType<typeof getCopy>) {
  if (status === "approved") {
    return copy.statusApproved;
  }

  if (status === "rejected") {
    return copy.statusRejected;
  }

  return copy.statusPending;
}

const statusTones: Record<JoinRequest["status"], StatusBadgeTone> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

function formatDate(value: string, locale: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return locale === "tr-TR" ? "Tarih yok" : "No date";
  }

  return date.toLocaleString(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCopy(language: "tr" | "en") {
  const en = language === "en";

  return {
    pageTitle: en ? "Pending members" : "Bekleyen üyeler",
    pageSubtitle: en
      ? "Approve or decline users who requested to join with a team code."
      : "Takım kodu ile katılmak isteyen kullanıcıları onayla veya reddet.",
    heroLabel: en ? "Member approval system" : "Üye onay sistemi",
    heroTitle: en ? "Club entry control" : "Kulübe giriş kontrolü",
    heroSubtitle: en
      ? "Approve or decline join requests for your club."
      : "Kulübüne katılma isteklerini onayla veya reddet.",
    statCardPending: en ? "Pending" : "Bekleyen",
    statCardApproved: en ? "Approved" : "Onaylanan",
    statCardRejected: en ? "Rejected" : "Reddedilen",
    memberRequests: en ? "Member requests" : "Üye istekleri",
    recordCount: (count: number) => (en ? `${count} records` : `${count} kayıt`),
    emptyTitle: en ? "No pending requests yet" : "Henüz bekleyen istek yok",
    emptyDescription: en
      ? "Requests submitted from the Join Club screen with a valid club code will appear here."
      : "Join Club ekranından doğru kulüp kodu ile başvuru gönderildiğinde burada görünecek.",
    userNotFound: en ? "User not found" : "Kullanıcı bulunamadı",
    noEmail: en ? "No email" : "E-posta yok",
    requestedAt: en ? "Requested" : "İstek zamanı",
    approve: en ? "Approve" : "Onayla",
    reject: en ? "Reject" : "Reddet",
    approveAccessibilityLabel: (name: string) => (en ? `Approve ${name}` : `${name} kullanıcısını onayla`),
    rejectAccessibilityLabel: (name: string) => (en ? `Decline ${name}` : `${name} kullanıcısını reddet`),
    refresh: en ? "Refresh" : "Yenile",
    refreshAccessibilityLabel: en ? "Reload pending requests" : "Bekleyen istekleri yeniden yükle",
    statusApproved: en ? "Approved" : "Onaylandı",
    statusRejected: en ? "Declined" : "Reddedildi",
    statusPending: en ? "Awaiting review" : "Onay bekliyor",
    statusIntro: en
      ? "Manage users who want to join with a club code here."
      : "Kulüp kodu ile katılmak isteyen kullanıcıları buradan yönet.",
    statusSignInToView: en ? "Sign in to view pending requests." : "Bekleyen istekleri görmek için giriş yapmalısın.",
    statusUpdated: en ? "Pending requests updated." : "Bekleyen istekler güncellendi.",
    statusSignInToApprove: en ? "Sign in to approve." : "Onaylamak için giriş yapmalısın.",
    statusMemberApproved: en ? "Member approved." : "Üye onaylandı.",
    statusSignInToReject: en ? "Sign in to decline." : "Reddetmek için giriş yapmalısın.",
    statusMemberRemoved: en ? "Member removed." : "Üye çıkarıldı.",
  };
}

export default function PendingApprovalsScreen() {
  const { language } = useTranslation();
  const copy = useMemo(() => getCopy(language), [language]);
  const locale = language === "tr" ? "tr-TR" : "en-US";
  const { appData, refresh, setAppData } = useAppDataContext();
  const [firestoreRows, setFirestoreRows] = useState<RequestRow[] | null>(null);
  const [customStatusMessage, setStatusMessage] = useState<string | null>(null);
  const statusMessage = customStatusMessage ?? copy.statusIntro;

  const loadApprovalData = useCallback(async () => {
    try {
      if (authService.isConfigured()) {
        const firebaseUser = authService.getCurrentUser();

        if (firebaseUser === null) {
          setFirestoreRows([]);
          setStatusMessage(copy.statusSignInToView);
          return;
        }

        const rows = await firestoreTeamSyncService.listJoinRequestRowsForCurrentClub(firebaseUser);
        setFirestoreRows(rows);
        setStatusMessage(copy.statusUpdated);
        return;
      }

      await refresh();
      setFirestoreRows(null);
      setStatusMessage(copy.statusUpdated);
    } catch (approvalError) {
      setStatusMessage(getAuthErrorMessage(approvalError, language));
    }
  }, [refresh, copy, language]);

  useFocusEffect(
    useCallback(() => {
      loadApprovalData();
    }, [loadApprovalData])
  );

  const requestRows = useMemo<RequestRow[]>(() => {
    if (firestoreRows !== null) {
      return firestoreRows;
    }

    if (appData === null) {
      return [];
    }

    return appData.joinRequests.map((request) => ({
      request,
      user: appData.users.find((user) => user.id === request.userId),
    }));
  }, [appData, firestoreRows]);

  const summary = useMemo(() => {
    const pendingCount = requestRows.filter((row) => row.request.status === "pending").length;
    const approvedCount = requestRows.filter((row) => row.request.status === "approved").length;
    const rejectedCount = requestRows.filter((row) => row.request.status === "rejected").length;

    return {
      pendingCount,
      approvedCount,
      rejectedCount,
      totalCount: requestRows.length,
    };
  }, [requestRows]);

  async function handleApprove(requestId: string) {
    try {
      if (authService.isConfigured()) {
        const firebaseUser = authService.getCurrentUser();

        if (firebaseUser === null) {
          setStatusMessage(copy.statusSignInToApprove);
          return;
        }

        await firestoreTeamSyncService.approveJoinRequest(firebaseUser, requestId);
        await loadApprovalData();
        setStatusMessage(copy.statusMemberApproved);
        return;
      }

      const nextAppData = await teamSyncService.approveJoinRequest(requestId);
      setAppData(nextAppData);
      setStatusMessage(copy.statusMemberApproved);
    } catch (approvalError) {
      setStatusMessage(getAuthErrorMessage(approvalError, language));
    }
  }

  async function handleReject(requestId: string) {
    try {
      if (authService.isConfigured()) {
        const firebaseUser = authService.getCurrentUser();

        if (firebaseUser === null) {
          setStatusMessage(copy.statusSignInToReject);
          return;
        }

        await firestoreTeamSyncService.rejectJoinRequest(firebaseUser, requestId);
        await loadApprovalData();
        setStatusMessage(copy.statusMemberRemoved);
        return;
      }

      const nextAppData = await teamSyncService.rejectJoinRequest(requestId);
      setAppData(nextAppData);
      setStatusMessage(copy.statusMemberRemoved);
    } catch (rejectError) {
      setStatusMessage(getAuthErrorMessage(rejectError, language));
    }
  }

  return (
    <AppScreenLayout>
      <PageHeader title={copy.pageTitle} subtitle={copy.pageSubtitle} />

      <Card variant="elevated" style={styles.heroCard}>
        <StatusBadge label={copy.heroLabel} tone="info" style={styles.heroLabel} />
        <Text style={styles.heroTitle}>{copy.heroTitle}</Text>
        <Text style={styles.heroSubtitle}>{copy.heroSubtitle}</Text>
      </Card>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{summary.pendingCount}</Text>
          <Text style={styles.statLabel}>{copy.statCardPending}</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{summary.approvedCount}</Text>
          <Text style={styles.statLabel}>{copy.statCardApproved}</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{summary.rejectedCount}</Text>
          <Text style={styles.statLabel}>{copy.statCardRejected}</Text>
        </Card>
      </View>

      <Card style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>{copy.memberRequests}</Text>
            <Text style={styles.sectionSubtitle}>{statusMessage}</Text>
          </View>

          <StatusBadge label={copy.recordCount(summary.totalCount)} tone="info" />
        </View>

        {requestRows.length === 0 ? (
          <EmptyState
            title={copy.emptyTitle}
            description={copy.emptyDescription}
          />
        ) : (
          <View style={styles.memberList}>
            {requestRows.map((row) => {
              const { request, user } = row;
              const isPending = request.status === "pending";
              const displayName = user?.fullName ?? copy.userNotFound;
              const displayEmail = user?.email ?? copy.noEmail;

              return (
                <Card key={request.id} variant="subtle" style={styles.memberCard}>
                  <View style={styles.memberTopRow}>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{displayName}</Text>
                      <Text style={styles.memberMeta}>{displayEmail}</Text>
                      <Text style={styles.memberDate}>
                        {copy.requestedAt}: {formatDate(request.createdAt, locale)}
                      </Text>
                    </View>

                    <StatusBadge label={getStatusText(request.status, copy)} tone={statusTones[request.status]} />
                  </View>

                  {isPending ? (
                    <View style={styles.actionRow}>
                      <AppButton
                        title={copy.approve}
                        onPress={() => handleApprove(request.id)}
                        accessibilityLabel={copy.approveAccessibilityLabel(displayName)}
                        style={styles.actionButton}
                      />

                      <AppButton
                        title={copy.reject}
                        variant="ghost"
                        onPress={() => handleReject(request.id)}
                        accessibilityLabel={copy.rejectAccessibilityLabel(displayName)}
                        style={styles.actionButton}
                      />
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </View>
        )}

        <AppButton
          title={copy.refresh}
          variant="ghost"
          onPress={loadApprovalData}
          accessibilityLabel={copy.refreshAccessibilityLabel}
          style={styles.resetButton}
        />
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
  heroSubtitle: { fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.regular, color: theme.colors.text.secondary, lineHeight: theme.lineHeights.xl },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.lg, marginBottom: theme.spacing["2xl"] },
  statCard: { flexGrow: 1, flexBasis: 145 },
  statValue: { color: theme.colors.brand.primary, fontSize: theme.fontSizes["4xl"], fontWeight: theme.fontWeights.bold, marginBottom: theme.spacing.xs },
  statLabel: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.medium },
  section: { marginBottom: theme.spacing["2xl"] },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: theme.spacing.lg, marginBottom: theme.spacing.xl },
  sectionHeaderText: { flex: 1 },
  sectionTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes["2xl"], fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.xs },
  sectionSubtitle: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.regular, lineHeight: theme.lineHeights.md },
  memberList: { gap: theme.spacing.md },
  memberCard: { padding: theme.spacing.lg },
  memberTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: theme.spacing.lg, marginBottom: theme.spacing.md },
  memberInfo: { flex: 1 },
  memberName: { color: theme.colors.text.primary, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.xs },
  memberMeta: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.regular, marginBottom: theme.spacing.xs },
  memberDate: { color: theme.colors.text.muted, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.medium },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md, marginTop: theme.spacing.md },
  actionButton: { flexGrow: 1, minWidth: 130 },
  resetButton: { marginTop: theme.spacing["2xl"], alignSelf: "flex-start" },
});
