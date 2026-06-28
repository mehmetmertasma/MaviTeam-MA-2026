import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { theme } from "@/constants/theme";

type PaymentStatus = "paid" | "pending" | "overdue";
type PaymentView = "admin" | "parent";

type PaymentRecord = {
  id: number;
  athleteName: string;
  parentName: string;
  teamName: string;
  month: string;
  amount: string;
  dueDate: string;
  method: "Nakit" | "Online" | "Bekleniyor";
  status: PaymentStatus;
};

const initialPayments: PaymentRecord[] = [
  {
    id: 1,
    athleteName: "Efe Asma",
    parentName: "Ayşe Asma",
    teamName: "U16 Erkek",
    month: "Haziran",
    amount: "₺1.250",
    dueDate: "15 Haziran",
    method: "Nakit",
    status: "paid",
  },
  {
    id: 2,
    athleteName: "Deniz Yılmaz",
    parentName: "Mehmet Yılmaz",
    teamName: "A Takım",
    month: "Haziran",
    amount: "₺1.500",
    dueDate: "15 Haziran",
    method: "Bekleniyor",
    status: "pending",
  },
  {
    id: 3,
    athleteName: "Zeynep Kaya",
    parentName: "Selin Kaya",
    teamName: "U14 Kız",
    month: "Haziran",
    amount: "₺1.100",
    dueDate: "10 Haziran",
    method: "Bekleniyor",
    status: "overdue",
  },
];

const paymentStatusOptions: { label: string; status: PaymentStatus }[] = [
  { label: "Ödendi", status: "paid" },
  { label: "Ödenmedi", status: "pending" },
  { label: "Gecikti", status: "overdue" },
];

function getStatusLabel(status: PaymentStatus) {
  if (status === "paid") {
    return "Ödendi";
  }

  if (status === "pending") {
    return "Ödenmedi";
  }

  return "Gecikti";
}

function getPaymentMethodForStatus(status: PaymentStatus) {
  if (status === "paid") {
    return "Nakit";
  }

  return "Bekleniyor";
}

export default function PaymentsScreen() {
  const [payments, setPayments] = useState<PaymentRecord[]>(initialPayments);
  const [activeView, setActiveView] = useState<PaymentView>("admin");
  const [statusMessage, setStatusMessage] = useState(
    "Ödeme kayıtları şimdilik bu oturum içinde tutuluyor."
  );

  const summary = useMemo(() => {
    const paidCount = payments.filter((payment) => payment.status === "paid").length;
    const pendingCount = payments.filter((payment) => payment.status === "pending").length;
    const overdueCount = payments.filter((payment) => payment.status === "overdue").length;

    return {
      paidCount,
      pendingCount,
      overdueCount,
      totalCount: payments.length,
    };
  }, [payments]);

  const parentPayments = payments.filter(
    (payment) => payment.athleteName === "Efe Asma"
  );

  const visiblePayments = activeView === "admin" ? payments : parentPayments;

  function handleChangePaymentStatus(paymentId: number, newStatus: PaymentStatus) {
    setPayments((currentPayments) =>
      currentPayments.map((payment) => {
        if (payment.id !== paymentId) {
          return payment;
        }

        return {
          ...payment,
          method: getPaymentMethodForStatus(newStatus),
          status: newStatus,
        };
      })
    );

    setStatusMessage("Ödeme durumu güncellendi.");
  }

  function resetPayments() {
    setPayments(initialPayments);
    setStatusMessage("Ödemeler demo haline sıfırlandı.");
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.pageHeader}>
          <Text style={styles.logo}>TeamSync</Text>
          <Text style={styles.pageTitle}>Ödemeler</Text>
          <Text style={styles.pageSubtitle}>
            Kulüp aidatlarını takip et, ödeme durumlarını düzenle ve velilere güncel ödeme bilgisini göster.
          </Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Kulüp finans merkezi</Text>
          <Text style={styles.heroTitle}>Aidat ve ödeme takibi</Text>
          <Text style={styles.heroSubtitle}>
            Admin ödeme durumlarını günceller. Veli ise sadece kendi sporcusunun ödeme durumunu görür.
          </Text>
        </View>

        <View style={styles.viewSwitcher}>
          <Pressable
            onPress={() => setActiveView("admin")}
            style={({ pressed }) => [
              styles.viewButton,
              activeView === "admin" ? styles.viewButtonActive : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text
              style={[
                styles.viewButtonText,
                activeView === "admin" ? styles.viewButtonTextActive : null,
              ]}
            >
              Admin görünümü
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveView("parent")}
            style={({ pressed }) => [
              styles.viewButton,
              activeView === "parent" ? styles.viewButtonActive : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text
              style={[
                styles.viewButtonText,
                activeView === "parent" ? styles.viewButtonTextActive : null,
              ]}
            >
              Veli görünümü
            </Text>
          </Pressable>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary.paidCount}</Text>
            <Text style={styles.statLabel}>Ödenen</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary.pendingCount}</Text>
            <Text style={styles.statLabel}>Ödenmeyen</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary.overdueCount}</Text>
            <Text style={styles.statLabel}>Geciken</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>
                {activeView === "admin" ? "Kulüp ödeme listesi" : "Benim ödeme durumum"}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {activeView === "admin"
                  ? "Admin her ödeme için ödendi, ödenmedi veya gecikti durumunu seçebilir."
                  : "Veli sadece kendi sporcusunun ödeme durumunu görür."}
              </Text>
            </View>

            <Text style={styles.statusPill}>{visiblePayments.length} kayıt</Text>
          </View>

          <View style={styles.paymentList}>
            {visiblePayments.map((payment) => {
              const isPaid = payment.status === "paid";
              const isOverdue = payment.status === "overdue";

              return (
                <View key={payment.id} style={styles.paymentCard}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardTitleGroup}>
                      <Text style={styles.athleteName}>{payment.athleteName}</Text>
                      <Text style={styles.parentName}>{payment.parentName}</Text>
                    </View>

                    <Text
                      style={[
                        styles.statusBadge,
                        isPaid ? styles.statusBadgePaid : null,
                        isOverdue ? styles.statusBadgeOverdue : null,
                      ]}
                    >
                      {getStatusLabel(payment.status)}
                    </Text>
                  </View>

                  <View style={styles.infoGrid}>
                    <View style={styles.infoBox}>
                      <Text style={styles.infoLabel}>Takım</Text>
                      <Text style={styles.infoValue}>{payment.teamName}</Text>
                    </View>

                    <View style={styles.infoBox}>
                      <Text style={styles.infoLabel}>Ay</Text>
                      <Text style={styles.infoValue}>{payment.month}</Text>
                    </View>

                    <View style={styles.infoBox}>
                      <Text style={styles.infoLabel}>Tutar</Text>
                      <Text style={styles.infoValue}>{payment.amount}</Text>
                    </View>

                    <View style={styles.infoBox}>
                      <Text style={styles.infoLabel}>Son tarih</Text>
                      <Text style={styles.infoValue}>{payment.dueDate}</Text>
                    </View>
                  </View>

                  <Text style={styles.methodText}>Yöntem: {payment.method}</Text>

                  {activeView === "admin" ? (
                    <View style={styles.statusActions}>
                      {paymentStatusOptions.map((option) => {
                        const isSelected = payment.status === option.status;

                        return (
                          <Pressable
                            key={option.status}
                            onPress={() => handleChangePaymentStatus(payment.id, option.status)}
                            style={({ pressed }) => [
                              styles.statusButton,
                              isSelected ? styles.statusButtonSelected : null,
                              pressed ? styles.pressed : null,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusButtonText,
                                isSelected ? styles.statusButtonTextSelected : null,
                              ]}
                            >
                              {option.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>

          <Text style={styles.statusText}>{statusMessage}</Text>

          <AppButton
            title="Demo veriyi sıfırla"
            variant="ghost"
            onPress={resetPayments}
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
  viewSwitcher: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginBottom: theme.spacing["2xl"],
  },
  viewButton: {
    flex: 1,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
  },
  viewButtonActive: {
    backgroundColor: theme.colors.brand.primary,
    borderColor: theme.colors.brand.primary,
  },
  viewButtonText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  viewButtonTextActive: {
    color: theme.colors.text.inverse,
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
  paymentList: {
    gap: theme.spacing.md,
  },
  paymentCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  cardTitleGroup: {
    flex: 1,
  },
  athleteName: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    marginBottom: theme.spacing.xs,
  },
  parentName: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
  },
  statusBadge: {
    backgroundColor: theme.colors.background.surface,
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  statusBadgePaid: {
    backgroundColor: theme.colors.brand.primarySoft,
    color: theme.colors.text.brand,
    borderColor: theme.colors.brand.primarySoft,
  },
  statusBadgeOverdue: {
    color: theme.colors.text.primary,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  infoBox: {
    flexGrow: 1,
    flexBasis: 130,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.md,
  },
  infoLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.spacing.xs,
  },
  infoValue: {
    color: theme.colors.text.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
  },
  methodText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.lg,
  },
  statusActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  statusButton: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  statusButtonSelected: {
    backgroundColor: theme.colors.brand.primary,
    borderColor: theme.colors.brand.primary,
  },
  statusButtonText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  statusButtonTextSelected: {
    color: theme.colors.text.inverse,
  },
  statusText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    marginTop: theme.spacing.lg,
  },
  resetButton: {
    marginTop: theme.spacing.lg,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
});
