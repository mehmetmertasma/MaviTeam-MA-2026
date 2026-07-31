import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { theme } from "@/constants/theme";
import { useAppDataContext } from "@/providers/AppDataProvider";
import { authService, getAuthErrorMessage } from "@/services/authService";
import { firestoreTeamSyncService } from "@/services/firestoreTeamSyncService";
import { teamSyncService } from "@/services/teamSyncService";
import type { JoinRequest, UserProfile } from "@/types/teamSync";

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

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.pageHeader}>
          <Text style={styles.logo}>TeamSync</Text>
          <Text style={styles.pageTitle}>Bekleyen üyeler</Text>
          <Text style={styles.pageSubtitle}>
            Takım kodu ile katılmak isteyen kullanıcıları onayla veya reddet.
          </Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Üye onay sistemi</Text>
          <Text style={styles.heroTitle}>Kulübe giriş kontrolü</Text>
          <Text style={styles.heroSubtitle}>
            Onaylanan kullanıcılar active olur. Reddedilen kullanıcılar removed durumuna alınır.
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary.pendingCount}</Text>
            <Text style={styles.statLabel}>Bekleyen</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary.approvedCount}</Text>
            <Text style={styles.statLabel}>Onaylanan</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary.rejectedCount}</Text>
            <Text style={styles.statLabel}>Reddedilen</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Üye istekleri</Text>
              <Text style={styles.sectionSubtitle}>{statusMessage}</Text>
            </View>

            <Text style={styles.statusPill}>{summary.totalCount} kayıt</Text>
          </View>

          {requestRows.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>Henüz bekleyen istek yok</Text>
              <Text style={styles.emptyText}>
                Join Club ekranından doğru kulüp kodu ile başvuru gönderildiğinde burada görünecek.
              </Text>
            </View>
          ) : (
            <View style={styles.memberList}>
              {requestRows.map((row) => {
                const { request, user } = row;
                const isPending = request.status === "pending";
                const displayName = user?.fullName ?? "Kullanıcı bulunamadı";
                const displayEmail = user?.email ?? "E-posta yok";

                return (
                  <View key={request.id} style={styles.memberCard}>
                    <View style={styles.memberTopRow}>
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{displayName}</Text>
                        <Text style={styles.memberMeta}>{displayEmail}</Text>
                        <Text style={styles.memberDate}>İstek zamanı: {formatDate(request.createdAt)}</Text>
                      </View>

                      <Text
                        style={[
                          styles.memberStatus,
                          request.status === "approved" ? styles.statusApproved : null,
                          request.status === "rejected" ? styles.statusRejected : null,
                        ]}
                      >
                        {getStatusText(request.status)}
                      </Text>
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
                  </View>
                );
              })}
            </View>
          )}

          <AppButton
            title="Merkezi datayı yenile"
            variant="ghost"
            onPress={loadApprovalData}
            accessibilityLabel="Bekleyen istekleri yeniden yükle"
            style={styles.resetButton}
          />
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
  section: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    padding: theme.spacing["2xl"],
    marginBottom: theme.spacing["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    ...theme.shadows.sm,
  },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: theme.spacing.lg, marginBottom: theme.spacing.xl },
  sectionHeaderText: { flex: 1 },
  sectionTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes["2xl"], fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.xs },
  sectionSubtitle: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, lineHeight: theme.lineHeights.md },
  statusPill: { backgroundColor: theme.colors.brand.primarySoft, color: theme.colors.text.brand, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.black, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md, borderRadius: theme.radius.full },
  emptyBox: { backgroundColor: theme.colors.background.subtle, borderRadius: theme.radius.xl, padding: theme.spacing.xl, borderWidth: 1, borderColor: theme.colors.border.default },
  emptyTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.sm },
  emptyText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, lineHeight: theme.lineHeights.md },
  memberList: { gap: theme.spacing.md },
  memberCard: { backgroundColor: theme.colors.background.subtle, borderRadius: theme.radius.xl, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border.default },
  memberTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: theme.spacing.lg, marginBottom: theme.spacing.md },
  memberInfo: { flex: 1 },
  memberName: { color: theme.colors.text.primary, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.xs },
  memberMeta: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.xs },
  memberDate: { color: theme.colors.text.muted, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold },
  memberStatus: { backgroundColor: theme.colors.brand.primarySoft, color: theme.colors.text.brand, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.black, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md, borderRadius: theme.radius.full },
  statusApproved: { color: theme.colors.text.brand },
  statusRejected: { color: theme.colors.text.secondary, backgroundColor: theme.colors.background.surface },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md, marginTop: theme.spacing.md },
  actionButton: { flexGrow: 1, minWidth: 130 },
  resetButton: { marginTop: theme.spacing["2xl"], alignSelf: "flex-start" },
});
