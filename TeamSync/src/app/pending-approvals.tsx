import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { theme } from "@/constants/theme";

type MemberStatus = "pending" | "approved" | "rejected";

type PendingMember = {
  id: string;
  name: string;
  role: string;
  team: string;
  requestedAt: string;
  status: MemberStatus;
};

const initialPendingMembers: PendingMember[] = [
  {
    id: "1",
    name: "Efe Yılmaz",
    role: "Sporcu",
    team: "U16 Erkek",
    requestedAt: "Bugün, 14:20",
    status: "pending",
  },
  {
    id: "2",
    name: "Ayşe Yılmaz",
    role: "Veli",
    team: "U16 Erkek",
    requestedAt: "Bugün, 14:23",
    status: "pending",
  },
  {
    id: "3",
    name: "Can Demir",
    role: "Koç",
    team: "A Takım",
    requestedAt: "Dün, 19:10",
    status: "pending",
  },
];

function getStatusText(status: MemberStatus) {
  if (status === "approved") {
    return "Onaylandı";
  }

  if (status === "rejected") {
    return "Reddedildi";
  }

  return "Onay bekliyor";
}

export default function PendingApprovalsScreen() {
  const [members, setMembers] = useState<PendingMember[]>(initialPendingMembers);
  const [statusMessage, setStatusMessage] = useState(
    "Kulüp kodu ile katılmak isteyen kullanıcıları buradan yönet."
  );

  const summary = useMemo(() => {
    const pendingCount = members.filter((member) => member.status === "pending").length;
    const approvedCount = members.filter((member) => member.status === "approved").length;
    const rejectedCount = members.filter((member) => member.status === "rejected").length;

    return {
      pendingCount,
      approvedCount,
      rejectedCount,
      totalCount: members.length,
    };
  }, [members]);

  function handleApprove(memberId: string) {
    setMembers((currentMembers) =>
      currentMembers.map((member) =>
        member.id === memberId ? { ...member, status: "approved" } : member
      )
    );
    setStatusMessage("Üye onaylandı.");
  }

  function handleReject(memberId: string) {
    setMembers((currentMembers) =>
      currentMembers.map((member) =>
        member.id === memberId ? { ...member, status: "rejected" } : member
      )
    );
    setStatusMessage("Üye reddedildi.");
  }

  function resetMembers() {
    setMembers(initialPendingMembers);
    setStatusMessage("Bekleyen üyeler demo haline sıfırlandı.");
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
            Onaylanan kullanıcılar ileride kendi rolüne göre dashboard, takım, mesaj ve program erişimi alacak.
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

          <View style={styles.memberList}>
            {members.map((member) => {
              const isPending = member.status === "pending";

              return (
                <View key={member.id} style={styles.memberCard}>
                  <View style={styles.memberTopRow}>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      <Text style={styles.memberMeta}>
                        {member.role} · {member.team}
                      </Text>
                      <Text style={styles.memberDate}>İstek zamanı: {member.requestedAt}</Text>
                    </View>

                    <Text
                      style={[
                        styles.memberStatus,
                        member.status === "approved" ? styles.statusApproved : null,
                        member.status === "rejected" ? styles.statusRejected : null,
                      ]}
                    >
                      {getStatusText(member.status)}
                    </Text>
                  </View>

                  {isPending ? (
                    <View style={styles.actionRow}>
                      <AppButton
                        title="Onayla"
                        onPress={() => handleApprove(member.id)}
                        accessibilityLabel={`${member.name} kullanıcısını onayla`}
                        style={styles.actionButton}
                      />

                      <AppButton
                        title="Reddet"
                        variant="ghost"
                        onPress={() => handleReject(member.id)}
                        accessibilityLabel={`${member.name} kullanıcısını reddet`}
                        style={styles.actionButton}
                      />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>

          <AppButton
            title="Demo veriyi sıfırla"
            variant="ghost"
            onPress={resetMembers}
            accessibilityLabel="Bekleyen üyeleri sıfırla"
            style={styles.resetButton}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: theme.colors.background.app,
  },
  screen: {
    flexGrow: 1,
    backgroundColor: theme.colors.background.app,
    paddingHorizontal: theme.spacing["2xl"],
    paddingBottom: theme.spacing["2xl"],
  },
  container: {
    width: "100%",
    maxWidth: 980,
    alignSelf: "center",
  },
  pageHeader: {
    marginBottom: theme.spacing["2xl"],
  },
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
  heroSubtitle: {
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.xl,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing["2xl"],
  },
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
  statValue: {
    color: theme.colors.brand.primary,
    fontSize: theme.fontSizes["4xl"],
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
  },
  section: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    padding: theme.spacing["2xl"],
    marginBottom: theme.spacing["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    ...theme.shadows.sm,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.md,
  },
  statusPill: {
    backgroundColor: theme.colors.brand.primarySoft,
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.full,
  },
  memberList: {
    gap: theme.spacing.md,
  },
  memberCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  memberTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  memberMeta: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.xs,
  },
  memberDate: {
    color: theme.colors.text.muted,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
  },
  memberStatus: {
    backgroundColor: theme.colors.brand.primarySoft,
    color: theme.colors.text.brand,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.full,
  },
  statusApproved: {
    color: theme.colors.text.brand,
  },
  statusRejected: {
    color: theme.colors.text.secondary,
    backgroundColor: theme.colors.background.surface,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  actionButton: {
    flexGrow: 1,
  },
  resetButton: {
    marginTop: theme.spacing["2xl"],
  },
});
