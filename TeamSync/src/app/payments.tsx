import { Link } from "expo-router";
import { useState } from "react";
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

const paymentStatusOptions: {
  label: string;
  status: PaymentStatus;
}[] = [
  {
    label: "Ödendi",
    status: "paid",
  },
  {
    label: "Ödenmedi",
    status: "pending",
  },
  {
    label: "Gecikti",
    status: "overdue",
  },
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

  const totalPaid = payments.filter((payment) => payment.status === "paid").length;

  const totalPending = payments.filter(
    (payment) => payment.status === "pending",
  ).length;

  const totalOverdue = payments.filter(
    (payment) => payment.status === "overdue",
  ).length;

  const parentPayments = payments.filter(
    (payment) => payment.athleteName === "Efe Asma",
  );

  const visiblePayments = activeView === "admin" ? payments : parentPayments;

  function handleChangePaymentStatus(
    paymentId: number,
    newStatus: PaymentStatus,
  ) {
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
      }),
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>TeamSync</Text>

          <View>
            <Text style={styles.pageTitle}>Ödemeler</Text>

            <Text style={styles.pageSubtitle}>
              Kulüp aidatlarını takip et, ödeme durumlarını düzenle ve velilere
              güncel ödeme bilgisini göster.
            </Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Kulüp finans merkezi</Text>

          <Text style={styles.heroTitle}>Aidat ve ödeme takibi</Text>

          <Text style={styles.heroSubtitle}>
            Admin yanlışlıkla bir ödemeyi ödendi olarak işaretlerse tekrar
            ödenmedi veya gecikti durumuna çevirebilir.
          </Text>
        </View>

        <View style={styles.viewSwitcher}>
          <Pressable
            onPress={() => setActiveView("admin")}
            style={[
              styles.viewButton,
              activeView === "admin" && styles.viewButtonActive,
            ]}
          >
            <Text
              style={[
                styles.viewButtonText,
                activeView === "admin" && styles.viewButtonTextActive,
              ]}
            >
              Admin görünümü
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveView("parent")}
            style={[
              styles.viewButton,
              activeView === "parent" && styles.viewButtonActive,
            ]}
          >
            <Text
              style={[
                styles.viewButtonText,
                activeView === "parent" && styles.viewButtonTextActive,
              ]}
            >
              Veli görünümü
            </Text>
          </Pressable>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalPaid}</Text>
            <Text style={styles.statLabel}>Ödenen</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalPending}</Text>
            <Text style={styles.statLabel}>Ödenmeyen</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalOverdue}</Text>
            <Text style={styles.statLabel}>Geciken</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>
                {activeView === "admin"
                  ? "Kulüp ödeme listesi"
                  : "Benim ödeme durumum"}
              </Text>

              <Text style={styles.sectionSubtitle}>
                {activeView === "admin"
                  ? "Admin her ödeme için ödendi, ödenmedi veya gecikti durumunu seçebilir."
                  : "Veli sadece kendi sporcusunun ödeme durumunu görür."}
              </Text>
            </View>

            <Text style={styles.countText}>{visiblePayments.length} kayıt</Text>
          </View>

          <View style={styles.paymentList}>
            {visiblePayments.map((payment) => {
              const isPaid = payment.status === "paid";
              const isOverdue = payment.status === "overdue";

              return (
                <View key={payment.id} style={styles.paymentCard}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardTitleGroup}>
                      <Text style={styles.athleteName}>
                        {payment.athleteName}
                      </Text>

                      <Text style={styles.parentName}>
                        {payment.parentName}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        isPaid && styles.statusBadgePaid,
                        isOverdue && styles.statusBadgeOverdue,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          isPaid && styles.statusTextPaid,
                          isOverdue && styles.statusTextOverdue,
                        ]}
                      >
                        {getStatusLabel(payment.status)}
                      </Text>
                    </View>
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
                      <Text style={styles.infoLabel}>Son gün</Text>
                      <Text style={styles.infoValue}>{payment.dueDate}</Text>
                    </View>
                  </View>

                  <View style={styles.bottomRow}>
                    <Text style={styles.methodText}>Yöntem: {payment.method}</Text>
                  </View>

                  {activeView === "admin" && (
                    <View style={styles.statusActions}>
                      {paymentStatusOptions.map((option) => {
                        const isSelected = payment.status === option.status;

                        return (
                          <Pressable
                            key={option.status}
                            onPress={() =>
                              handleChangePaymentStatus(
                                payment.id,
                                option.status,
                              )
                            }
                            style={({ pressed }) => [
                              styles.statusActionButton,
                              isSelected && styles.statusActionButtonActive,
                              pressed && styles.statusActionButtonPressed,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusActionButtonText,
                                isSelected &&
                                  styles.statusActionButtonTextActive,
                              ]}
                            >
                              {option.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Gerçek sistemde nasıl olacak?</Text>

          <Text style={styles.noteText}>
            Firebase eklendiğinde adminin yaptığı her ödeme durumu değişikliği
            database’e kaydedilecek. Böylece yanlışlıkla işaretlenen ödeme
            tekrar düzeltilebilecek.
          </Text>
        </View>

        <Link href="/dashboard" asChild>
          <AppButton
            title="Dashboard'a dön"
            variant="ghost"
            accessibilityLabel="Dashboard sayfasına dön"
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
    maxWidth: 980,
    alignSelf: "center",
  },
  header: {
    marginTop: theme.spacing["2xl"],
    marginBottom: theme.spacing["2xl"],
    gap: theme.spacing.lg,
  },
  logo: {
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.brand.primary,
  },
  pageTitle: {
    fontSize: theme.fontSizes["5xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.inverse,
    lineHeight: theme.lineHeights["5xl"],
    marginBottom: theme.spacing.sm,
  },
  pageSubtitle: {
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text.inverse,
    opacity: 0.76,
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
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
  },
  viewButtonActive: {
    backgroundColor: theme.colors.brand.primary,
    borderColor: theme.colors.brand.primary,
  },
  viewButtonText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.secondary,
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
    flexBasis: 180,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    ...theme.shadows.sm,
  },
  statValue: {
    fontSize: theme.fontSizes["4xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.brand.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.secondary,
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: theme.fontSizes["2xl"],
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  sectionSubtitle: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.md,
  },
  countText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
  },
  paymentList: {
    gap: theme.spacing.md,
  },
  paymentCard: {
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.lg,
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
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  parentName: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
  },
  statusBadge: {
    backgroundColor: theme.colors.state.warningSoft,
    borderRadius: theme.radius.full,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  statusBadgePaid: {
    backgroundColor: theme.colors.state.successSoft,
  },
  statusBadgeOverdue: {
    backgroundColor: theme.colors.state.dangerSoft,
  },
  statusText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.warning,
  },
  statusTextPaid: {
    color: theme.colors.text.success,
  },
  statusTextOverdue: {
    color: theme.colors.text.danger,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  infoBox: {
    flexGrow: 1,
    flexBasis: 140,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  infoLabel: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.muted,
    marginBottom: theme.spacing.xs,
  },
  infoValue: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  methodText: {
    flex: 1,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.extrabold,
    color: theme.colors.text.secondary,
  },
  statusActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  statusActionButton: {
    flexGrow: 1,
    flexBasis: 120,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
  },
  statusActionButtonActive: {
    backgroundColor: theme.colors.brand.primary,
    borderColor: theme.colors.brand.primary,
  },
  statusActionButtonPressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
  statusActionButtonText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.black,
  },
  statusActionButtonTextActive: {
    color: theme.colors.text.inverse,
  },
  noteCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius["2xl"],
    padding: theme.spacing["2xl"],
    marginBottom: theme.spacing["2xl"],
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  noteTitle: {
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.black,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  noteText: {
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text.secondary,
    lineHeight: theme.lineHeights.md,
  },
  backButton: {
    marginBottom: theme.spacing["2xl"],
  },
});