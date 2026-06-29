import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { theme } from "@/constants/theme";
import { teamSyncService } from "@/services/teamSyncService";
import type { Payment, PaymentStatus, TeamSyncAppData, UserProfile } from "@/types/teamSync";

type PaymentView = "admin" | "parent";

const EMPTY_PAYMENTS: Payment[] = [];
const EMPTY_USERS: UserProfile[] = [];

const paymentStatusOptions: { label: string; status: PaymentStatus }[] = [
  { label: "Ödendi", status: "paid" },
  { label: "Ödenmedi", status: "unpaid" },
  { label: "Gecikti", status: "late" },
];

function getStatusLabel(status: PaymentStatus) {
  if (status === "paid") {
    return "Ödendi";
  }

  if (status === "unpaid") {
    return "Ödenmedi";
  }

  return "Gecikti";
}

function formatAmount(amountCents: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value || "Tarih yok";
  }

  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getUserName(userId: string, users: UserProfile[]) {
  return users.find((user) => user.id === userId)?.fullName ?? "Kullanıcı bulunamadı";
}

function getPrimaryTeamName(userId: string, appData: TeamSyncAppData) {
  const user = appData.users.find((currentUser) => currentUser.id === userId);
  const teamId = user?.teamIds[0];

  if (teamId === undefined) {
    return "Takım seçilmedi";
  }

  return appData.teams.find((team) => team.id === teamId)?.name ?? "Takım bulunamadı";
}

function buildDueAt(dateText: string) {
  const cleanDateText = dateText.trim();

  if (cleanDateText.length === 0) {
    return new Date().toISOString();
  }

  const parsedDate = new Date(cleanDateText);

  if (Number.isNaN(parsedDate.getTime())) {
    return new Date().toISOString();
  }

  return parsedDate.toISOString();
}

function parseAmountToCents(amountText: string) {
  const normalizedAmount = amountText.replace(/[^0-9.,]/g, "").replace(",", ".");
  const amount = Number(normalizedAmount);

  if (Number.isNaN(amount) || amount <= 0) {
    return 0;
  }

  return Math.round(amount * 100);
}

export default function PaymentsScreen() {
  const [appData, setAppData] = useState<TeamSyncAppData | null>(null);
  const [activeView, setActiveView] = useState<PaymentView>("admin");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [paymentTitle, setPaymentTitle] = useState("");
  const [amountText, setAmountText] = useState("");
  const [dueDateText, setDueDateText] = useState("");
  const [statusMessage, setStatusMessage] = useState("Ödeme kayıtları merkezi TeamSync datasından yüklenecek.");

  const loadPaymentsData = useCallback(async () => {
    try {
      const loadedAppData = await teamSyncService.getAppData();
      setAppData(loadedAppData);
      setSelectedUserId((currentUserId) => {
        const currentStillExists = loadedAppData.users.some((user) => user.id === currentUserId && user.status !== "removed");
        return currentStillExists ? currentUserId : loadedAppData.users.find((user) => user.status !== "removed")?.id ?? "";
      });
      setStatusMessage("Ödeme kayıtları merkezi TeamSync datasından yüklendi.");
    } catch {
      setStatusMessage("Ödemeler yüklenirken bir sorun oluştu.");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPaymentsData();
    }, [loadPaymentsData])
  );

  const payments = appData?.payments ?? EMPTY_PAYMENTS;
  const users = appData?.users ?? EMPTY_USERS;
  const activeUsers = users.filter((user) => user.status !== "removed");

  const summary = useMemo(() => {
    const paidCount = payments.filter((payment) => payment.status === "paid").length;
    const unpaidCount = payments.filter((payment) => payment.status === "unpaid").length;
    const lateCount = payments.filter((payment) => payment.status === "late").length;

    return {
      paidCount,
      unpaidCount,
      lateCount,
      totalCount: payments.length,
    };
  }, [payments]);

  const visiblePayments = useMemo(() => {
    if (appData === null) {
      return EMPTY_PAYMENTS;
    }

    if (activeView === "admin") {
      return payments;
    }

    return payments.filter((payment) => payment.userId === appData.currentUser.id);
  }, [activeView, appData, payments]);

  const canCreatePayment = selectedUserId.length > 0 && paymentTitle.trim().length > 0 && parseAmountToCents(amountText) > 0;

  function clearForm() {
    setPaymentTitle("");
    setAmountText("");
    setDueDateText("");
  }

  async function handleCreatePayment() {
    if (appData === null) {
      setStatusMessage("Önce merkezi data yüklenmeli.");
      return;
    }

    const amountCents = parseAmountToCents(amountText);

    if (!canCreatePayment) {
      setStatusMessage("Kullanıcı, başlık ve geçerli tutar gerekli.");
      return;
    }

    try {
      const nextAppData = await teamSyncService.createPayment({
        clubId: appData.club.id,
        userId: selectedUserId,
        title: paymentTitle.trim(),
        amountCents,
        status: "unpaid",
        dueAt: buildDueAt(dueDateText),
      });

      setAppData(nextAppData);
      clearForm();
      setShowCreateForm(false);
      setStatusMessage("Yeni ödeme merkezi dataya eklendi.");
    } catch {
      setStatusMessage("Ödeme oluşturulurken bir sorun oluştu.");
    }
  }

  async function handleChangePaymentStatus(paymentId: string, newStatus: PaymentStatus) {
    try {
      const nextAppData = await teamSyncService.updatePaymentStatus(paymentId, newStatus);
      setAppData(nextAppData);
      setStatusMessage("Ödeme durumu merkezi datada güncellendi.");
    } catch {
      setStatusMessage("Ödeme durumu güncellenirken bir sorun oluştu.");
    }
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
            Ödemeler TeamSync service layer içindeki appData.payments üzerinden gelir ve güncellenir.
          </Text>
        </View>

        <View style={styles.viewSwitcher}>
          <Pressable onPress={() => setActiveView("admin")} style={({ pressed }) => [styles.viewButton, activeView === "admin" ? styles.viewButtonActive : null, pressed ? styles.pressed : null]}>
            <Text style={[styles.viewButtonText, activeView === "admin" ? styles.viewButtonTextActive : null]}>Admin görünümü</Text>
          </Pressable>

          <Pressable onPress={() => setActiveView("parent")} style={({ pressed }) => [styles.viewButton, activeView === "parent" ? styles.viewButtonActive : null, pressed ? styles.pressed : null]}>
            <Text style={[styles.viewButtonText, activeView === "parent" ? styles.viewButtonTextActive : null]}>Veli görünümü</Text>
          </Pressable>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}><Text style={styles.statValue}>{summary.paidCount}</Text><Text style={styles.statLabel}>Ödenen</Text></View>
          <View style={styles.statCard}><Text style={styles.statValue}>{summary.unpaidCount}</Text><Text style={styles.statLabel}>Ödenmeyen</Text></View>
          <View style={styles.statCard}><Text style={styles.statValue}>{summary.lateCount}</Text><Text style={styles.statLabel}>Geciken</Text></View>
        </View>

        {activeView === "admin" ? (
          <View style={styles.topActions}>
            <AppButton title={showCreateForm ? "Form açık" : "Yeni ödeme oluştur"} onPress={() => { setShowCreateForm(true); setStatusMessage("Yeni ödeme bilgilerini doldurabilirsin."); }} disabled={showCreateForm} style={styles.actionButton} />
            <AppButton title="Merkezi datayı yenile" variant="ghost" onPress={loadPaymentsData} style={styles.actionButton} />
          </View>
        ) : null}

        {showCreateForm && activeView === "admin" ? (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}><View style={styles.sectionHeaderText}><Text style={styles.sectionTitle}>Yeni ödeme oluştur</Text><Text style={styles.sectionSubtitle}>Bir üyeye aidat veya ödeme kaydı ekle.</Text></View><Text style={styles.statusPill}>Yeni</Text></View>
            <Text style={styles.label}>Kullanıcı</Text>
            <View style={styles.optionGrid}>{activeUsers.map((user) => { const isSelected = selectedUserId === user.id; return (<Pressable key={user.id} onPress={() => setSelectedUserId(user.id)} style={({ pressed }) => [styles.optionButton, isSelected ? styles.optionButtonSelected : null, pressed ? styles.pressed : null]}><Text style={[styles.optionButtonText, isSelected ? styles.optionButtonTextSelected : null]}>{user.fullName}</Text></Pressable>); })}</View>
            <Text style={styles.label}>Başlık</Text>
            <TextInput value={paymentTitle} onChangeText={setPaymentTitle} placeholder="Örn: Temmuz aidatı" placeholderTextColor={theme.colors.text.muted} style={styles.input} />
            <View style={styles.formGrid}>
              <View style={styles.formField}><Text style={styles.label}>Tutar</Text><TextInput value={amountText} onChangeText={setAmountText} placeholder="Örn: 1250" placeholderTextColor={theme.colors.text.muted} keyboardType="numeric" style={styles.input} /></View>
              <View style={styles.formField}><Text style={styles.label}>Son tarih</Text><TextInput value={dueDateText} onChangeText={setDueDateText} placeholder="Örn: 2026-07-15" placeholderTextColor={theme.colors.text.muted} autoCapitalize="none" style={styles.input} /></View>
            </View>
            <View style={styles.topActions}>
              <AppButton title="Ödemeyi kaydet" onPress={handleCreatePayment} disabled={!canCreatePayment} style={styles.actionButton} />
              <AppButton title="Vazgeç" variant="ghost" onPress={() => { clearForm(); setShowCreateForm(false); setStatusMessage("Ödeme oluşturma iptal edildi."); }} style={styles.actionButton} />
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}><View style={styles.sectionHeaderText}><Text style={styles.sectionTitle}>{activeView === "admin" ? "Kulüp ödeme listesi" : "Benim ödeme durumum"}</Text><Text style={styles.sectionSubtitle}>{statusMessage}</Text></View><Text style={styles.statusPill}>{visiblePayments.length} kayıt</Text></View>

          {appData !== null && visiblePayments.length > 0 ? (
            <View style={styles.paymentList}>
              {visiblePayments.map((payment) => {
                const isPaid = payment.status === "paid";
                const isLate = payment.status === "late";
                return (
                  <View key={payment.id} style={styles.paymentCard}>
                    <View style={styles.cardTopRow}><View style={styles.cardTitleGroup}><Text style={styles.athleteName}>{getUserName(payment.userId, users)}</Text><Text style={styles.parentName}>{payment.title}</Text></View><Text style={[styles.statusBadge, isPaid ? styles.statusBadgePaid : null, isLate ? styles.statusBadgeOverdue : null]}>{getStatusLabel(payment.status)}</Text></View>
                    <View style={styles.infoGrid}>
                      <View style={styles.infoBox}><Text style={styles.infoLabel}>Takım</Text><Text style={styles.infoValue}>{getPrimaryTeamName(payment.userId, appData)}</Text></View>
                      <View style={styles.infoBox}><Text style={styles.infoLabel}>Tutar</Text><Text style={styles.infoValue}>{formatAmount(payment.amountCents)}</Text></View>
                      <View style={styles.infoBox}><Text style={styles.infoLabel}>Son tarih</Text><Text style={styles.infoValue}>{formatDate(payment.dueAt)}</Text></View>
                      <View style={styles.infoBox}><Text style={styles.infoLabel}>Ödendi</Text><Text style={styles.infoValue}>{payment.paidAt ? formatDate(payment.paidAt) : "Bekleniyor"}</Text></View>
                    </View>
                    {activeView === "admin" ? (<View style={styles.statusActions}>{paymentStatusOptions.map((option) => { const isSelected = payment.status === option.status; return (<Pressable key={option.status} onPress={() => handleChangePaymentStatus(payment.id, option.status)} style={({ pressed }) => [styles.statusButton, isSelected ? styles.statusButtonSelected : null, pressed ? styles.pressed : null]}><Text style={[styles.statusButtonText, isSelected ? styles.statusButtonTextSelected : null]}>{option.label}</Text></Pressable>); })}</View>) : null}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyCard}><Text style={styles.emptyTitle}>Henüz ödeme kaydı yok</Text><Text style={styles.emptyText}>Yeni ödeme oluştur butonuyla ilk merkezi ödeme kaydını ekleyebilirsin.</Text></View>
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
  heroTitle: { fontSize: theme.fontSizes["4xl"], fontWeight: theme.fontWeights.black, color: theme.colors.text.primary, lineHeight: theme.lineHeights["4xl"], marginBottom: theme.spacing.md },
  heroSubtitle: { fontSize: theme.fontSizes.lg, color: theme.colors.text.secondary, lineHeight: theme.lineHeights.xl },
  viewSwitcher: { flexDirection: "row", backgroundColor: theme.colors.background.surface, borderRadius: theme.radius.xl, padding: theme.spacing.sm, marginBottom: theme.spacing["2xl"], ...theme.shadows.sm },
  viewButton: { flex: 1, borderRadius: theme.radius.lg, paddingVertical: theme.spacing.md, alignItems: "center" },
  viewButtonActive: { backgroundColor: theme.colors.brand.primary },
  viewButtonText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.black },
  viewButtonTextActive: { color: theme.colors.text.inverse },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.lg, marginBottom: theme.spacing["2xl"] },
  statCard: { flexGrow: 1, flexBasis: 145, backgroundColor: theme.colors.background.surface, borderRadius: theme.radius.xl, padding: theme.spacing.xl, borderWidth: 1, borderColor: theme.colors.border.default, ...theme.shadows.sm },
  statValue: { fontSize: theme.fontSizes["4xl"], fontWeight: theme.fontWeights.black, color: theme.colors.brand.primary, marginBottom: theme.spacing.xs },
  statLabel: { fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.extrabold, color: theme.colors.text.secondary },
  topActions: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md, marginBottom: theme.spacing["2xl"] },
  actionButton: { flexGrow: 1, minWidth: 170 },
  section: { backgroundColor: theme.colors.background.surface, borderRadius: theme.radius["2xl"], padding: theme.spacing["2xl"], marginBottom: theme.spacing["2xl"], borderWidth: 1, borderColor: theme.colors.border.default, ...theme.shadows.sm },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: theme.spacing.lg, marginBottom: theme.spacing.xl },
  sectionHeaderText: { flex: 1 },
  sectionTitle: { fontSize: theme.fontSizes["2xl"], fontWeight: theme.fontWeights.black, color: theme.colors.text.primary, marginBottom: theme.spacing.xs },
  sectionSubtitle: { fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, color: theme.colors.text.secondary, lineHeight: theme.lineHeights.md },
  statusPill: { backgroundColor: theme.colors.brand.primarySoft, color: theme.colors.text.brand, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.black, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md, borderRadius: theme.radius.full },
  label: { color: theme.colors.text.primary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.sm },
  input: { minHeight: 52, backgroundColor: theme.colors.background.subtle, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border.default, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, color: theme.colors.text.primary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.lg },
  formGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.lg },
  formField: { flex: 1, minWidth: 220 },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm, marginBottom: theme.spacing.xl },
  optionButton: { borderRadius: theme.radius.full, borderWidth: 1, borderColor: theme.colors.border.default, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.lg, backgroundColor: theme.colors.background.subtle },
  optionButtonSelected: { backgroundColor: theme.colors.brand.primary, borderColor: theme.colors.brand.primary },
  optionButtonText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.black },
  optionButtonTextSelected: { color: theme.colors.text.inverse },
  paymentList: { gap: theme.spacing.lg },
  paymentCard: { backgroundColor: theme.colors.background.subtle, borderRadius: theme.radius.xl, padding: theme.spacing.xl, borderWidth: 1, borderColor: theme.colors.border.default },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.lg, marginBottom: theme.spacing.lg },
  cardTitleGroup: { flex: 1 },
  athleteName: { color: theme.colors.text.primary, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.xs },
  parentName: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold },
  statusBadge: { alignSelf: "flex-start", backgroundColor: "#fef3c7", color: "#92400e", fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.black, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md, borderRadius: theme.radius.full },
  statusBadgePaid: { backgroundColor: "#dcfce7", color: "#166534" },
  statusBadgeOverdue: { backgroundColor: "#fee2e2", color: "#991b1b" },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md, marginBottom: theme.spacing.lg },
  infoBox: { flexGrow: 1, flexBasis: 135, backgroundColor: theme.colors.background.surface, borderRadius: theme.radius.lg, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border.default },
  infoLabel: { color: theme.colors.text.muted, fontSize: theme.fontSizes.xs, fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.xs, textTransform: "uppercase" },
  infoValue: { color: theme.colors.text.primary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.black },
  statusActions: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  statusButton: { flexGrow: 1, minWidth: 110, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border.default, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md, backgroundColor: theme.colors.background.surface, alignItems: "center" },
  statusButtonSelected: { backgroundColor: theme.colors.brand.primary, borderColor: theme.colors.brand.primary },
  statusButtonText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.black },
  statusButtonTextSelected: { color: theme.colors.text.inverse },
  emptyCard: { backgroundColor: theme.colors.background.subtle, borderRadius: theme.radius.xl, padding: theme.spacing.xl, borderWidth: 1, borderColor: theme.colors.border.default },
  emptyTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.black, marginBottom: theme.spacing.sm },
  emptyText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, lineHeight: theme.lineHeights.md },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
});
