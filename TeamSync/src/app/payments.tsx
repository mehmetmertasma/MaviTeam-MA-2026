import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppScreenLayout } from "@/components/AppScreenLayout";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import type { StatusBadgeTone } from "@/components/StatusBadge";
import { TextField } from "@/components/TextField";
import { theme } from "@/constants/theme";
import { useAppDataContext } from "@/providers/AppDataProvider";
import { teamSyncService } from "@/services/teamSyncService";
import type { Payment, PaymentStatus, TeamSyncAppData, UserProfile } from "@/types/teamSync";

const EMPTY_PAYMENTS: Payment[] = [];
const EMPTY_USERS: UserProfile[] = [];

const paymentStatusOptions: { label: string; status: PaymentStatus }[] = [
  { label: "Ödendi", status: "paid" },
  { label: "Ödenmedi", status: "unpaid" },
  { label: "Gecikti", status: "late" },
];

const paymentToneByStatus: Record<PaymentStatus, StatusBadgeTone> = {
  paid: "success",
  unpaid: "warning",
  late: "danger",
};

function canManagePayments(appData: TeamSyncAppData | null) {
  return appData?.currentUser.role === "superAdmin" || appData?.currentUser.role === "clubAdmin";
}

function getStatusLabel(status: PaymentStatus) {
  if (status === "paid") return "Ödendi";
  if (status === "unpaid") return "Ödenmedi";
  return "Gecikti";
}

function formatAmount(amountCents: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(amountCents / 100);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "Tarih yok";
  return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
}

function getUserName(userId: string, users: UserProfile[]) {
  return users.find((user) => user.id === userId)?.fullName ?? "Kullanıcı bulunamadı";
}

function getPrimaryTeamName(userId: string, appData: TeamSyncAppData) {
  const user = appData.users.find((currentUser) => currentUser.id === userId);
  const teamId = user?.teamIds[0];
  if (teamId === undefined) return "Takım seçilmedi";
  return appData.teams.find((team) => team.id === teamId)?.name ?? "Takım bulunamadı";
}

function buildDueAt(dateText: string) {
  const cleanDateText = dateText.trim();
  if (cleanDateText.length === 0) return new Date().toISOString();
  const parsedDate = new Date(cleanDateText);
  return Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
}

function parseAmountToCents(amountText: string) {
  const normalizedAmount = amountText.replace(/[^0-9.,]/g, "").replace(",", ".");
  const amount = Number(normalizedAmount);
  if (Number.isNaN(amount) || amount <= 0) return 0;
  return Math.round(amount * 100);
}

export default function PaymentsScreen() {
  const { appData, refresh, setAppData } = useAppDataContext();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedUserIdState, setSelectedUserId] = useState("");
  const [paymentTitle, setPaymentTitle] = useState("");
  const [amountText, setAmountText] = useState("");
  const [dueDateText, setDueDateText] = useState("");
  const [statusMessage, setStatusMessage] = useState("Ödeme kayıtları merkezi TeamSync datasından yüklendi.");

  const users = appData?.users ?? EMPTY_USERS;
  const selectedUserId = users.some((user) => user.id === selectedUserIdState && user.status !== "removed")
    ? selectedUserIdState
    : users.find((user) => user.status !== "removed")?.id ?? "";

  async function refreshPaymentsData() {
    try {
      await refresh();
      setStatusMessage("Ödeme kayıtları merkezi TeamSync datasından yüklendi.");
    } catch {
      setStatusMessage("Ödemeler yüklenirken bir sorun oluştu.");
    }
  }

  const payments = appData?.payments ?? EMPTY_PAYMENTS;
  const activeUsers = users.filter((user) => user.status !== "removed");
  const userCanManagePayments = canManagePayments(appData);
  const visiblePayments = userCanManagePayments || appData === null ? payments : payments.filter((payment) => payment.userId === appData.currentUser.id);

  const summary = useMemo(() => ({
    paidCount: payments.filter((payment) => payment.status === "paid").length,
    unpaidCount: payments.filter((payment) => payment.status === "unpaid").length,
    lateCount: payments.filter((payment) => payment.status === "late").length,
  }), [payments]);

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

    if (!canCreatePayment) {
      setStatusMessage("Kullanıcı, başlık ve geçerli tutar gerekli.");
      return;
    }

    try {
      const nextAppData = await teamSyncService.createPayment({
        clubId: appData.club.id,
        userId: selectedUserId,
        title: paymentTitle.trim(),
        amountCents: parseAmountToCents(amountText),
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
    <AppScreenLayout variant="standard">
      <PageHeader
        eyebrow="Kulüp finans merkezi"
        title="Ödemeler"
        subtitle="Kulüp aidatlarını takip et, ödeme durumlarını düzenle ve velilere güncel ödeme bilgisini göster."
      />

      <Card style={styles.heroCard}>
        <Text style={styles.heroTitle}>Aidat ve ödeme takibi</Text>
        <Text style={styles.heroSubtitle}>Ödemeler TeamSync service layer içindeki appData.payments üzerinden gelir ve güncellenir.</Text>
      </Card>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}><Text style={styles.statValue}>{summary.paidCount}</Text><Text style={styles.statLabel}>Ödenen</Text></Card>
        <Card style={styles.statCard}><Text style={styles.statValue}>{summary.unpaidCount}</Text><Text style={styles.statLabel}>Ödenmeyen</Text></Card>
        <Card style={styles.statCard}><Text style={styles.statValue}>{summary.lateCount}</Text><Text style={styles.statLabel}>Geciken</Text></Card>
      </View>

      {userCanManagePayments ? (
        <View style={styles.topActions}>
          <AppButton title={showCreateForm ? "Form açık" : "Yeni ödeme oluştur"} onPress={() => { setShowCreateForm(true); setStatusMessage("Yeni ödeme bilgilerini doldurabilirsin."); }} disabled={showCreateForm} style={styles.actionButton} />
          <AppButton title="Merkezi datayı yenile" variant="ghost" onPress={refreshPaymentsData} style={styles.actionButton} />
        </View>
      ) : null}

      {showCreateForm && userCanManagePayments ? (
        <Card style={styles.section}>
          <View style={styles.sectionHeaderRow}><View style={styles.sectionHeaderText}><Text style={styles.sectionTitle}>Yeni ödeme oluştur</Text><Text style={styles.sectionSubtitle}>Bir üyeye aidat veya ödeme kaydı ekle.</Text></View><Text style={styles.statusPill}>Yeni</Text></View>
          <Text style={styles.label}>Kullanıcı</Text>
          <View style={styles.optionGrid}>{activeUsers.map((user) => { const isSelected = selectedUserId === user.id; return (<Pressable key={user.id} onPress={() => setSelectedUserId(user.id)} style={({ pressed }) => [styles.optionButton, isSelected ? styles.optionButtonSelected : null, pressed ? styles.pressed : null]}><Text style={[styles.optionButtonText, isSelected ? styles.optionButtonTextSelected : null]}>{user.fullName}</Text></Pressable>); })}</View>
          <TextField label="Başlık" value={paymentTitle} onChangeText={setPaymentTitle} placeholder="Örn: Temmuz aidatı" containerStyle={styles.field} />
          <View style={styles.formGrid}>
            <TextField label="Tutar" value={amountText} onChangeText={setAmountText} placeholder="Örn: 1250" keyboardType="numeric" containerStyle={styles.formField} />
            <TextField label="Son tarih" value={dueDateText} onChangeText={setDueDateText} placeholder="Örn: 2026-07-15" autoCapitalize="none" containerStyle={styles.formField} />
          </View>
          <View style={styles.topActions}>
            <AppButton title="Ödemeyi kaydet" onPress={handleCreatePayment} disabled={!canCreatePayment} style={styles.actionButton} />
            <AppButton title="Vazgeç" variant="ghost" onPress={() => { clearForm(); setShowCreateForm(false); setStatusMessage("Ödeme oluşturma iptal edildi."); }} style={styles.actionButton} />
          </View>
        </Card>
      ) : null}

      <Card style={styles.section}>
        <View style={styles.sectionHeaderRow}><View style={styles.sectionHeaderText}><Text style={styles.sectionTitle}>Ödeme listesi</Text><Text style={styles.sectionSubtitle}>{statusMessage}</Text></View><Text style={styles.statusPill}>{visiblePayments.length} kayıt</Text></View>

        {appData !== null && visiblePayments.length > 0 ? (
          <View style={styles.paymentList}>
            {visiblePayments.map((payment) => {
              return (
                <View key={payment.id} style={styles.paymentCard}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardTitleGroup}>
                      <Text style={styles.athleteName}>{getUserName(payment.userId, users)}</Text>
                      <Text style={styles.parentName}>{payment.title}</Text>
                    </View>
                    <StatusBadge label={getStatusLabel(payment.status)} tone={paymentToneByStatus[payment.status]} />
                  </View>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoBox}><Text style={styles.infoLabel}>Takım</Text><Text style={styles.infoValue}>{getPrimaryTeamName(payment.userId, appData)}</Text></View>
                    <View style={styles.infoBox}><Text style={styles.infoLabel}>Tutar</Text><Text style={styles.infoValue}>{formatAmount(payment.amountCents)}</Text></View>
                    <View style={styles.infoBox}><Text style={styles.infoLabel}>Son tarih</Text><Text style={styles.infoValue}>{formatDate(payment.dueAt)}</Text></View>
                    <View style={styles.infoBox}><Text style={styles.infoLabel}>Ödendi</Text><Text style={styles.infoValue}>{payment.paidAt ? formatDate(payment.paidAt) : "Bekleniyor"}</Text></View>
                  </View>
                  {userCanManagePayments ? (
                    <View style={styles.statusActions}>
                      {paymentStatusOptions.map((option) => {
                        const isSelected = payment.status === option.status;
                        return (
                          <Pressable key={option.status} onPress={() => handleChangePaymentStatus(payment.id, option.status)} style={({ pressed }) => [styles.statusButton, isSelected ? styles.statusButtonSelected : null, pressed ? styles.pressed : null]}>
                            <Text style={[styles.statusButtonText, isSelected ? styles.statusButtonTextSelected : null]}>{option.label}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : (
          <EmptyState title="Henüz ödeme kaydı yok" description="Yeni ödeme oluştur butonuyla ilk merkezi ödeme kaydını ekleyebilirsin." />
        )}
      </Card>
    </AppScreenLayout>
  );
}

const styles = StyleSheet.create({
  heroCard: { gap: theme.spacing.md, marginBottom: theme.spacing["2xl"] },
  heroTitle: { fontSize: theme.fontSizes["4xl"], fontWeight: theme.fontWeights.semibold, color: theme.colors.text.primary, lineHeight: theme.lineHeights["4xl"] },
  heroSubtitle: { fontSize: theme.fontSizes.lg, color: theme.colors.text.secondary, lineHeight: theme.lineHeights.xl },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.lg, marginBottom: theme.spacing["2xl"] },
  statCard: { flexGrow: 1, flexBasis: 145 },
  statValue: { fontSize: theme.fontSizes["4xl"], fontWeight: theme.fontWeights.bold, color: theme.colors.brand.primary, marginBottom: theme.spacing.xs },
  statLabel: { fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.medium, color: theme.colors.text.secondary },
  topActions: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md, marginBottom: theme.spacing["2xl"] },
  actionButton: { flexGrow: 1, minWidth: 170 },
  section: { marginBottom: theme.spacing["2xl"] },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: theme.spacing.lg, marginBottom: theme.spacing.xl },
  sectionHeaderText: { flex: 1 },
  sectionTitle: { fontSize: theme.fontSizes["2xl"], fontWeight: theme.fontWeights.semibold, color: theme.colors.text.primary, marginBottom: theme.spacing.xs },
  sectionSubtitle: { fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.regular, color: theme.colors.text.secondary, lineHeight: theme.lineHeights.md },
  statusPill: { backgroundColor: theme.colors.brand.primarySoft, color: theme.colors.text.brand, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md, borderRadius: theme.radius.full, overflow: "hidden" },
  label: { color: theme.colors.text.primary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.sm },
  field: { marginBottom: theme.spacing.lg },
  formGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.lg },
  formField: { flex: 1, minWidth: 220 },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm, marginBottom: theme.spacing.xl },
  optionButton: { borderRadius: theme.radius.full, borderWidth: 1, borderColor: theme.colors.border.default, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.lg, backgroundColor: theme.colors.background.subtle },
  optionButtonSelected: { backgroundColor: theme.colors.brand.primary, borderColor: theme.colors.brand.primary },
  optionButtonText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold },
  optionButtonTextSelected: { color: theme.colors.text.inverse },
  paymentList: { gap: theme.spacing.lg },
  paymentCard: { backgroundColor: theme.colors.background.subtle, borderRadius: theme.radius.xl, padding: theme.spacing.xl, borderWidth: 1, borderColor: theme.colors.border.default },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.lg, marginBottom: theme.spacing.lg },
  cardTitleGroup: { flex: 1 },
  athleteName: { color: theme.colors.text.primary, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.xs },
  parentName: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.regular },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md, marginBottom: theme.spacing.lg },
  infoBox: { flexGrow: 1, flexBasis: 135, backgroundColor: theme.colors.background.surface, borderRadius: theme.radius.lg, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border.default },
  infoLabel: { color: theme.colors.text.muted, fontSize: theme.fontSizes.xs, fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.xs, textTransform: "uppercase" },
  infoValue: { color: theme.colors.text.primary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold },
  statusActions: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  statusButton: { flexGrow: 1, minWidth: 110, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border.default, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md, backgroundColor: theme.colors.background.surface, alignItems: "center" },
  statusButtonSelected: { backgroundColor: theme.colors.brand.primary, borderColor: theme.colors.brand.primary },
  statusButtonText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold },
  statusButtonTextSelected: { color: theme.colors.text.inverse },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
});
