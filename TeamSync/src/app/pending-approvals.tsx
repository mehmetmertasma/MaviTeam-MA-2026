import { Link } from "expo-router";
import { useState } from "react";
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

export default function PendingApprovalsScreen() {
  const [members, setMembers] = useState<PendingMember[]>(
    initialPendingMembers
  );

  const pendingCount = members.filter(
    (member) => member.status === "pending"
  ).length;

  function handleApprove(memberId: string) {
    setMembers((currentMembers) =>
      currentMembers.map((member) =>
        member.id === memberId ? { ...member, status: "approved" } : member
      )
    );
  }

  function handleReject(memberId: string) {
    setMembers((currentMembers) =>
      currentMembers.map((member) =>
        member.id === memberId ? { ...member, status: "rejected" } : member
      )
    );
  }

  function getStatusText(status: MemberStatus) {
    if (status === "approved") {
      return "Onaylandı";
    }

    if (status === "rejected") {
      return "Reddedildi";
    }

    return "Onay bekliyor";
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>TeamSync</Text>

          <Text style={styles.title}>Bekleyen üyeler</Text>

          <Text style={styles.subtitle}>
            Takım kodu ile katılmak isteyen kullanıcıları buradan onaylayabilir
            veya reddedebilirsiniz.
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Bekleyen istek</Text>

          <Text style={styles.summaryValue}>{pendingCount}</Text>

          <Text style={styles.summaryHint}>
            Onaylanan kullanıcılar ileride kendi rolüne göre dashboard görecek.
          </Text>
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

                    <Text style={styles.memberDate}>
                      İstek zamanı: {member.requestedAt}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.statusBadge,
                      member.status === "approved" && styles.statusApproved,
                      member.status === "rejected" && styles.statusRejected,
                    ]}
                  >
                    {getStatusText(member.status)}
                  </Text>
                </View>

                {isPending && (
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
                )}
              </View>
            );
          })}
        </View>

        <Link href="/dashboard" asChild>
          <AppButton
            title="Dashboard'a dön"
            variant="secondary"
            accessibilityLabel="Dashboard ekranına dön"
            style={styles.backButton}
          />
        </Link>

        <Link href="/" asChild>
          <AppButton
            title="Ana sayfaya dön"
            variant="ghost"
            accessibilityLabel="Ana sayfaya dön"
            style={styles.backButton}
          />
        </Link>
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
    padding: theme.spacing["2xl"],
  },
  container: {
    width: "100%",
    maxWidth: 780,
    alignSelf: "center",
  },
  header: {
    marginTop: theme.spacing["2xl"],
    marginBottom: theme.spacing["2xl"],
  },
  logo: {
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.brand.primary,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSizes["5xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.inverse,
    lineHeight: theme.lineHeights["5xl"],
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text.inverse,
    opacity: 0.78,
    fontWeight: theme.fontWeights.semibold,
    lineHeight: theme.lineHeights.xl,
  },
  summaryCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    padding: theme.spacing["2xl"],
    marginBottom: theme.spacing["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    ...theme.shadows.md,
  },
  summaryLabel: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  summaryValue: {
    fontSize: theme.fontSizes["5xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.brand.primary,
    marginBottom: theme.spacing.sm,
  },
  summaryHint: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.md,
  },
  memberList: {
    gap: theme.spacing.lg,
    marginBottom: theme.spacing["2xl"],
  },
  memberCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    padding: theme.spacing["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    ...theme.shadows.sm,
  },
  memberTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.lg,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  memberMeta: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  memberDate: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.muted,
  },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.state.warningSoft,
    color: theme.colors.text.warning,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.full,
  },
  statusApproved: {
    backgroundColor: theme.colors.state.successSoft,
    color: theme.colors.text.success,
  },
  statusRejected: {
    backgroundColor: theme.colors.state.dangerSoft,
    color: theme.colors.text.danger,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
  actionButton: {
    flexGrow: 1,
    flexBasis: 160,
  },
  backButton: {
    width: "100%",
    marginBottom: theme.spacing.md,
  },
});