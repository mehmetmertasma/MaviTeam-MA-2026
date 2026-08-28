import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppScreenLayout } from "@/components/AppScreenLayout";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { SearchField } from "@/components/SearchField";
import { StatusBadge } from "@/components/StatusBadge";
import type { StatusBadgeTone } from "@/components/StatusBadge";
import { TextField } from "@/components/TextField";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/localization";
import { useAppDataContext } from "@/providers/AppDataProvider";
import { teamSyncService } from "@/services/teamSyncService";
import type { Payment, PaymentStatus, TeamSyncAppData, UserProfile } from "@/types/teamSync";
import { matchesSearchQuery } from "@/utils/search";

const EMPTY_PAYMENTS: Payment[] = [];
const EMPTY_USERS: UserProfile[] = [];

const paymentToneByStatus: Record<PaymentStatus, StatusBadgeTone> = {
  paid: "success",
  unpaid: "warning",
  late: "danger",
};

function canManagePayments(appData: TeamSyncAppData | null) {
  return appData?.currentUser.role === "superAdmin" || appData?.currentUser.role === "clubAdmin";
}

function formatAmount(amountCents: number, locale: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(amountCents / 100);
}

function formatDate(value: string, locale: string, noDateLabel: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || noDateLabel;
  return date.toLocaleDateString(locale, { day: "2-digit", month: "long", year: "numeric" });
}

function getUserName(userId: string, users: UserProfile[], userNotFoundLabel: string) {
  return users.find((user) => user.id === userId)?.fullName ?? userNotFoundLabel;
}

function getPrimaryTeamName(userId: string, appData: TeamSyncAppData, noTeamLabel: string, teamNotFoundLabel: string) {
  const user = appData.users.find((currentUser) => currentUser.id === userId);
  const teamId = user?.teamIds[0];
  if (teamId === undefined) return noTeamLabel;
  return appData.teams.find((team) => team.id === teamId)?.name ?? teamNotFoundLabel;
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

function getCopy(language: "tr" | "en") {
  const en = language === "en";

  const statusLabels: Record<PaymentStatus, string> = {
    paid: en ? "Paid" : "Ödendi",
    unpaid: en ? "Unpaid" : "Ödenmedi",
    late: en ? "Late" : "Gecikti",
  };

  const paymentStatusOptions: { label: string; status: PaymentStatus }[] = [
    { label: statusLabels.paid, status: "paid" },
    { label: statusLabels.unpaid, status: "unpaid" },
    { label: statusLabels.late, status: "late" },
  ];

  return {
    statusLabels,
    paymentStatusOptions,
    noDate: en ? "No date" : "Tarih yok",
    userNotFound: en ? "User not found" : "Kullanıcı bulunamadı",
    noTeamSelected: en ? "No team selected" : "Takım seçilmedi",
    teamNotFound: en ? "Team not found" : "Takım bulunamadı",
    paymentsUpdated: en ? "Payments updated." : "Ödemeler güncellendi.",
    loadError: en ? "There was a problem loading payments." : "Ödemeler yüklenirken bir sorun oluştu.",
    waitForPageLoad: en ? "Please wait for the page to finish loading." : "Sayfanın yüklenmesini bekle.",
    missingFields: en ? "A user, title, and valid amount are required." : "Kullanıcı, başlık ve geçerli tutar gerekli.",
    paymentAdded: en ? "New payment added." : "Yeni ödeme eklendi.",
    createError: en ? "There was a problem creating the payment." : "Ödeme oluşturulurken bir sorun oluştu.",
    statusUpdated: en ? "Payment status updated." : "Ödeme durumu güncellendi.",
    statusUpdateError: en ? "There was a problem updating the payment status." : "Ödeme durumu güncellenirken bir sorun oluştu.",
    eyebrow: en ? "Club finance hub" : "Kulüp finans merkezi",
    pageTitle: en ? "Payments" : "Ödemeler",
    pageSubtitle: en
      ? "Track club dues, update payment statuses, and keep parents informed on where things stand."
      : "Kulüp aidatlarını takip et, ödeme durumlarını düzenle ve velilere güncel ödeme bilgisini göster.",
    heroTitle: en ? "Dues and payment tracking" : "Aidat ve ödeme takibi",
    heroSubtitle: en
      ? "Track membership dues and see who still owes for the season."
      : "Aidat ödemelerini takip et, kimin borcu olduğunu gör.",
    paid: en ? "Paid" : "Ödenen",
    unpaid: en ? "Unpaid" : "Ödenmeyen",
    late: en ? "Late" : "Geciken",
    formOpen: en ? "Form open" : "Form açık",
    newPayment: en ? "New payment" : "Yeni ödeme oluştur",
    refresh: en ? "Refresh" : "Yenile",
    fillNewPaymentStatus: en ? "Fill in the new payment details." : "Yeni ödeme bilgilerini doldurabilirsin.",
    newPaymentTitle: en ? "Create a new payment" : "Yeni ödeme oluştur",
    newPaymentSubtitle: en ? "Add a dues or payment record for a member." : "Bir üyeye aidat veya ödeme kaydı ekle.",
    newBadge: en ? "New" : "Yeni",
    userLabel: en ? "User" : "Kullanıcı",
    titleLabel: en ? "Title" : "Başlık",
    titlePlaceholder: en ? "E.g. July dues" : "Örn: Temmuz aidatı",
    amountLabel: en ? "Amount" : "Tutar",
    amountPlaceholder: en ? "E.g. 1250" : "Örn: 1250",
    dueDateLabel: en ? "Due date" : "Son tarih",
    dueDatePlaceholder: en ? "E.g. 2026-07-15" : "Örn: 2026-07-15",
    savePayment: en ? "Save payment" : "Ödemeyi kaydet",
    cancel: en ? "Cancel" : "Vazgeç",
    createCanceled: en ? "Payment creation canceled." : "Ödeme oluşturma iptal edildi.",
    paymentListTitle: en ? "Payment list" : "Ödeme listesi",
    recordsCount: (count: number) => (en ? `${count} records` : `${count} kayıt`),
    searchNameOrTitle: en ? "Search by name or title..." : "İsim veya başlık ara...",
    searchPaymentsLabel: en ? "Search payments" : "Ödemelerde ara",
    team: en ? "Team" : "Takım",
    amount: en ? "Amount" : "Tutar",
    dueDate: en ? "Due date" : "Son tarih",
    paidOn: en ? "Paid" : "Ödendi",
    pending: en ? "Pending" : "Bekleniyor",
    noMatchingPaymentsTitle: en ? "No matching payments" : "Aramayla eşleşen ödeme yok",
    noMatchingPaymentsDescription: en
      ? "Try again with a different name or title."
      : "Farklı bir isim veya başlık ile tekrar dene.",
    noPaymentsYetTitle: en ? "No payment records yet" : "Henüz ödeme kaydı yok",
    noPaymentsYetDescription: en
      ? "Use the New payment button to add the first payment record."
      : "Yeni ödeme oluştur butonuyla ilk ödeme kaydını ekleyebilirsin.",
  };
}

export default function PaymentsScreen() {
  const { language } = useTranslation();
  const copy = useMemo(() => getCopy(language), [language]);
  const locale = language === "tr" ? "tr-TR" : "en-US";
  const { appData, refresh, setAppData } = useAppDataContext();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedUserIdState, setSelectedUserId] = useState("");
  const [paymentTitle, setPaymentTitle] = useState("");
  const [amountText, setAmountText] = useState("");
  const [dueDateText, setDueDateText] = useState("");
  const [statusMessage, setStatusMessage] = useState(copy.paymentsUpdated);
  const [searchQuery, setSearchQuery] = useState("");

  const users = appData?.users ?? EMPTY_USERS;
  const selectedUserId = users.some((user) => user.id === selectedUserIdState && user.status !== "removed")
    ? selectedUserIdState
    : users.find((user) => user.status !== "removed")?.id ?? "";

  async function refreshPaymentsData() {
    try {
      await refresh();
      setStatusMessage(copy.paymentsUpdated);
    } catch {
      setStatusMessage(copy.loadError);
    }
  }

  const payments = appData?.payments ?? EMPTY_PAYMENTS;
  const activeUsers = users.filter((user) => user.status !== "removed");
  const userCanManagePayments = canManagePayments(appData);
  const visiblePayments = userCanManagePayments || appData === null ? payments : payments.filter((payment) => payment.userId === appData.currentUser.id);

  const filteredPayments = useMemo(() => {
    return visiblePayments.filter((payment) => matchesSearchQuery(searchQuery, getUserName(payment.userId, users, copy.userNotFound), payment.title));
  }, [visiblePayments, users, searchQuery, copy]);

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
      setStatusMessage(copy.waitForPageLoad);
      return;
    }

    if (!canCreatePayment) {
      setStatusMessage(copy.missingFields);
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
      setStatusMessage(copy.paymentAdded);
    } catch {
      setStatusMessage(copy.createError);
    }
  }

  async function handleChangePaymentStatus(paymentId: string, newStatus: PaymentStatus) {
    try {
      const nextAppData = await teamSyncService.updatePaymentStatus(paymentId, newStatus);
      setAppData(nextAppData);
      setStatusMessage(copy.statusUpdated);
    } catch {
      setStatusMessage(copy.statusUpdateError);
    }
  }

  return (
    <AppScreenLayout variant="standard">
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.pageTitle}
        subtitle={copy.pageSubtitle}
      />

      <Card style={styles.heroCard}>
        <Text style={styles.heroTitle}>{copy.heroTitle}</Text>
        <Text style={styles.heroSubtitle}>{copy.heroSubtitle}</Text>
      </Card>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}><Text style={styles.statValue}>{summary.paidCount}</Text><Text style={styles.statLabel}>{copy.paid}</Text></Card>
        <Card style={styles.statCard}><Text style={styles.statValue}>{summary.unpaidCount}</Text><Text style={styles.statLabel}>{copy.unpaid}</Text></Card>
        <Card style={styles.statCard}><Text style={styles.statValue}>{summary.lateCount}</Text><Text style={styles.statLabel}>{copy.late}</Text></Card>
      </View>

      {userCanManagePayments ? (
        <View style={styles.topActions}>
          <AppButton title={showCreateForm ? copy.formOpen : copy.newPayment} onPress={() => { setShowCreateForm(true); setStatusMessage(copy.fillNewPaymentStatus); }} disabled={showCreateForm} style={styles.actionButton} />
          <AppButton title={copy.refresh} variant="ghost" onPress={refreshPaymentsData} style={styles.actionButton} />
        </View>
      ) : null}

      {showCreateForm && userCanManagePayments ? (
        <Card style={styles.section}>
          <View style={styles.sectionHeaderRow}><View style={styles.sectionHeaderText}><Text style={styles.sectionTitle}>{copy.newPaymentTitle}</Text><Text style={styles.sectionSubtitle}>{copy.newPaymentSubtitle}</Text></View><Text style={styles.statusPill}>{copy.newBadge}</Text></View>
          <Text style={styles.label}>{copy.userLabel}</Text>
          <View style={styles.optionGrid}>{activeUsers.map((user) => { const isSelected = selectedUserId === user.id; return (<Pressable key={user.id} onPress={() => setSelectedUserId(user.id)} style={({ pressed }) => [styles.optionButton, isSelected ? styles.optionButtonSelected : null, pressed ? styles.pressed : null]}><Text style={[styles.optionButtonText, isSelected ? styles.optionButtonTextSelected : null]}>{user.fullName}</Text></Pressable>); })}</View>
          <TextField label={copy.titleLabel} value={paymentTitle} onChangeText={setPaymentTitle} placeholder={copy.titlePlaceholder} containerStyle={styles.field} />
          <View style={styles.formGrid}>
            <TextField label={copy.amountLabel} value={amountText} onChangeText={setAmountText} placeholder={copy.amountPlaceholder} keyboardType="numeric" containerStyle={styles.formField} />
            <TextField label={copy.dueDateLabel} value={dueDateText} onChangeText={setDueDateText} placeholder={copy.dueDatePlaceholder} autoCapitalize="none" containerStyle={styles.formField} />
          </View>
          <View style={styles.topActions}>
            <AppButton title={copy.savePayment} onPress={handleCreatePayment} disabled={!canCreatePayment} style={styles.actionButton} />
            <AppButton title={copy.cancel} variant="ghost" onPress={() => { clearForm(); setShowCreateForm(false); setStatusMessage(copy.createCanceled); }} style={styles.actionButton} />
          </View>
        </Card>
      ) : null}

      <Card style={styles.section}>
        <View style={styles.sectionHeaderRow}><View style={styles.sectionHeaderText}><Text style={styles.sectionTitle}>{copy.paymentListTitle}</Text><Text style={styles.sectionSubtitle}>{statusMessage}</Text></View><Text style={styles.statusPill}>{copy.recordsCount(visiblePayments.length)}</Text></View>

        {visiblePayments.length > 5 ? (
          <SearchField
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={copy.searchNameOrTitle}
            accessibilityLabel={copy.searchPaymentsLabel}
            style={styles.searchField}
          />
        ) : null}

        {appData !== null && filteredPayments.length > 0 ? (
          <View style={styles.paymentList}>
            {filteredPayments.map((payment) => {
              return (
                <View key={payment.id} style={styles.paymentCard}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardTitleGroup}>
                      <Text style={styles.athleteName}>{getUserName(payment.userId, users, copy.userNotFound)}</Text>
                      <Text style={styles.parentName}>{payment.title}</Text>
                    </View>
                    <StatusBadge label={copy.statusLabels[payment.status]} tone={paymentToneByStatus[payment.status]} />
                  </View>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoBox}><Text style={styles.infoLabel}>{copy.team}</Text><Text style={styles.infoValue}>{getPrimaryTeamName(payment.userId, appData, copy.noTeamSelected, copy.teamNotFound)}</Text></View>
                    <View style={styles.infoBox}><Text style={styles.infoLabel}>{copy.amount}</Text><Text style={styles.infoValue}>{formatAmount(payment.amountCents, locale)}</Text></View>
                    <View style={styles.infoBox}><Text style={styles.infoLabel}>{copy.dueDate}</Text><Text style={styles.infoValue}>{formatDate(payment.dueAt, locale, copy.noDate)}</Text></View>
                    <View style={styles.infoBox}><Text style={styles.infoLabel}>{copy.paidOn}</Text><Text style={styles.infoValue}>{payment.paidAt ? formatDate(payment.paidAt, locale, copy.noDate) : copy.pending}</Text></View>
                  </View>
                  {userCanManagePayments ? (
                    <View style={styles.statusActions}>
                      {copy.paymentStatusOptions.map((option) => {
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
        ) : visiblePayments.length > 0 ? (
          <EmptyState title={copy.noMatchingPaymentsTitle} description={copy.noMatchingPaymentsDescription} />
        ) : (
          <EmptyState title={copy.noPaymentsYetTitle} description={copy.noPaymentsYetDescription} />
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
  statusPill: { backgroundColor: theme.colors.brand.primarySoft, color: theme.colors.text.brand, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md, borderRadius: theme.radius.sm, overflow: "hidden" },
  label: { color: theme.colors.text.primary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.sm },
  field: { marginBottom: theme.spacing.lg },
  formGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.lg },
  formField: { flex: 1, minWidth: 220 },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm, marginBottom: theme.spacing.xl },
  optionButton: { borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border.default, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.lg, backgroundColor: theme.colors.background.subtle },
  optionButtonSelected: { backgroundColor: theme.colors.brand.primary, borderColor: theme.colors.brand.primary },
  optionButtonText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold },
  optionButtonTextSelected: { color: theme.colors.text.inverse },
  searchField: { marginBottom: theme.spacing.lg },
  paymentList: { gap: theme.spacing.md },
  paymentCard: { backgroundColor: theme.colors.background.subtle, borderRadius: theme.radius.xl, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border.default },
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
