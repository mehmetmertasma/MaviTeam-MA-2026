import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
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
import { useAppDataContext } from "@/providers/AppDataProvider";
import { authService, getAuthErrorMessage } from "@/services/authService";
import { firestoreTeamSyncService } from "@/services/firestoreTeamSyncService";
import { teamSyncService } from "@/services/teamSyncService";
import type { JoinRequest, UserProfile } from "@/types/teamSync";
import { matchesSearchQuery } from "@/utils/search";

type RequestRow = {
  request: JoinRequest;
  user?: UserProfile;
};

function getStatusText(status: JoinRequest["status"]) {
  if (status === "approved") {
    return "Onaylandı";
  }

  if (status === "rejected") {
    return "Reddedildi";
  }

  return "Onay bekliyor";
}

const statusTones: Record<JoinRequest["status"], StatusBadgeTone> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Tarih yok";
  }

  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PendingApprovalsScreen() {
  const { appData, refresh, setAppData } = useAppDataContext();
  const [firestoreRows, setFirestoreRows] = useState<RequestRow[] | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    "Kulüp kodu ile katılmak isteyen kullanıcıları buradan yönet."
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const loadApprovalData = useCallback(async () => {
    try {
      if (authService.isConfigured()) {
        const firebaseUser = authService.getCurrentUser();

        if (firebaseUser === null) {
          setFirestoreRows([]);
          setStatusMessage("Bekleyen istekleri görmek için giriş yapmalısın.");
          return;
        }

        const rows = await firestoreTeamSyncService.listJoinRequestRowsForCurrentClub(firebaseUser);
        setFirestoreRows(rows);
        setStatusMessage("Bekleyen istekler Firestore kulüp datasından yüklendi.");
        return;
      }

      await refresh();
      setFirestoreRows(null);
      setStatusMessage("Bekleyen istekler local TeamSync datasından yüklendi.");
    } catch (approvalError) {
      setStatusMessage(getAuthErrorMessage(approvalError));
    }
  }, [refresh]);

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

  const filteredRows = useMemo(() => {
    return requestRows.filter((row) => matchesSearchQuery(searchQuery, row.user?.fullName, row.user?.email));
  }, [requestRows, searchQuery]);

  const pendingRows = useMemo(() => filteredRows.filter((row) => row.request.status === "pending"), [filteredRows]);
  const resolvedRows = useMemo(() => filteredRows.filter((row) => row.request.status !== "pending"), [filteredRows]);

  async function handleApprove(requestId: string) {
    try {
      if (authService.isConfigured()) {
        const firebaseUser = authService.getCurrentUser();

        if (firebaseUser === null) {
          setStatusMessage("Onaylamak için giriş yapmalısın.");
          return;
        }

        await firestoreTeamSyncService.approveJoinRequest(firebaseUser, requestId);
        await loadApprovalData();
        setStatusMessage("Üye Firestore içinde onaylandı ve active yapıldı.");
        return;
      }

      const nextAppData = await teamSyncService.approveJoinRequest(requestId);
      setAppData(nextAppData);
      setStatusMessage("Üye onaylandı ve kullanıcı active yapıldı.");
    } catch (approvalError) {
      setStatusMessage(getAuthErrorMessage(approvalError));
    }
  }

  async function handleReject(requestId: string) {
    try {
      if (authService.isConfigured()) {
        const firebaseUser = authService.getCurrentUser();

        if (firebaseUser === null) {
          setStatusMessage("Reddetmek için giriş yapmalısın.");
          return;
        }

        await firestoreTeamSyncService.rejectJoinRequest(firebaseUser, requestId);
        await loadApprovalData();
        setStatusMessage("Üye Firestore içinde reddedildi ve removed yapıldı.");
        return;
      }

      const nextAppData = await teamSyncService.rejectJoinRequest(requestId);
      setAppData(nextAppData);
      setStatusMessage("Üye reddedildi ve kullanıcı removed yapıldı.");
    } catch (rejectError) {
      setStatusMessage(getAuthErrorMessage(rejectError));
    }
  }

  function renderRequestRow(row: RequestRow, dense: boolean) {
    const { request, user } = row;
    const isPending = request.status === "pending";
    const displayName = user?.fullName ?? "Kullanıcı bulunamadı";
    const displayEmail = user?.email ?? "E-posta yok";

    return (
      <Card key={request.id} variant="subtle" padding={dense ? "sm" : "md"} style={styles.memberCard}>
        <View style={styles.memberTopRow}>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{displayName}</Text>
            <Text style={styles.memberMeta}>{displayEmail}</Text>
            <Text style={styles.memberDate}>İstek zamanı: {formatDate(request.createdAt)}</Text>
          </View>

          <StatusBadge label={getStatusText(request.status)} tone={statusTones[request.status]} />
        </View>

        {isPending ? (
          <View style={styles.actionRow}>
            <AppButton
              title="Onayla"
              onPress={() => handleApprove(request.id)}
              accessibilityLabel={`${displayName} kullanıcısını onayla`}
              style={styles.actionButton}
            />

            <AppButton
              title="Reddet"
              variant="ghost"
              onPress={() => handleReject(request.id)}
              accessibilityLabel={`${displayName} kullanıcısını reddet`}
              style={styles.actionButton}
            />
          </View>
        ) : null}
      </Card>
    );
  }

  return (
    <AppScreenLayout>
      <PageHeader title="Bekleyen üyeler" subtitle="Takım kodu ile katılmak isteyen kullanıcıları onayla veya reddet." />

      <Card variant="elevated" style={styles.heroCard}>
        <StatusBadge label="Üye onay sistemi" tone="info" style={styles.heroLabel} />
        <Text style={styles.heroTitle}>Kulübe giriş kontrolü</Text>
        <Text style={styles.heroSubtitle}>
          Onaylanan kullanıcılar active olur. Reddedilen kullanıcılar removed durumuna alınır.
        </Text>
      </Card>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{summary.pendingCount}</Text>
          <Text style={styles.statLabel}>Bekleyen</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{summary.approvedCount}</Text>
          <Text style={styles.statLabel}>Onaylanan</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{summary.rejectedCount}</Text>
          <Text style={styles.statLabel}>Reddedilen</Text>
        </Card>
      </View>

      <Card style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>Üye istekleri</Text>
            <Text style={styles.sectionSubtitle}>{statusMessage}</Text>
          </View>

          <StatusBadge label={`${summary.totalCount} kayıt`} tone="info" />
        </View>

        {requestRows.length === 0 ? (
          <EmptyState
            title="Henüz bekleyen istek yok"
            description="Join Club ekranından doğru kulüp kodu ile başvuru gönderildiğinde burada görünecek."
          />
        ) : (
          <>
            {requestRows.length > 5 ? (
              <SearchField
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="İsim veya e-posta ara..."
                accessibilityLabel="İsteklerde ara"
                style={styles.searchField}
              />
            ) : null}

            {pendingRows.length === 0 ? (
              <EmptyState title="Bekleyen istek yok" description="Şu anda onay bekleyen kimse yok." />
            ) : (
              <View style={styles.memberList}>{pendingRows.map((row) => renderRequestRow(row, false))}</View>
            )}

            {resolvedRows.length > 0 ? (
              <View style={styles.historySection}>
                <Pressable
                  onPress={() => setShowHistory((currentValue) => !currentValue)}
                  style={({ pressed }) => [styles.historyToggle, pressed ? styles.pressed : null]}
                >
                  <Text style={styles.historyToggleText}>Geçmiş ({resolvedRows.length})</Text>
                  <Text style={styles.historyToggleChevron}>{showHistory ? "▲" : "▼"}</Text>
                </Pressable>

                {showHistory ? (
                  <View style={styles.memberList}>{resolvedRows.map((row) => renderRequestRow(row, true))}</View>
                ) : null}
              </View>
            ) : null}
          </>
        )}

        <AppButton
          title="Merkezi datayı yenile"
          variant="ghost"
          onPress={loadApprovalData}
          accessibilityLabel="Bekleyen istekleri yeniden yükle"
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
  searchField: { marginBottom: theme.spacing.md },
  memberList: { gap: theme.spacing.sm },
  memberCard: { padding: theme.spacing.md },
  memberTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: theme.spacing.lg, marginBottom: theme.spacing.md },
  memberInfo: { flex: 1 },
  memberName: { color: theme.colors.text.primary, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.xs },
  memberMeta: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.regular, marginBottom: theme.spacing.xs },
  memberDate: { color: theme.colors.text.muted, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.medium },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md, marginTop: theme.spacing.md },
  actionButton: { flexGrow: 1, minWidth: 130 },
  resetButton: { marginTop: theme.spacing["2xl"], alignSelf: "flex-start" },
  historySection: { marginTop: theme.spacing.lg },
  historyToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    backgroundColor: theme.colors.background.subtle,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  historyToggleText: { color: theme.colors.text.primary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold },
  historyToggleChevron: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
