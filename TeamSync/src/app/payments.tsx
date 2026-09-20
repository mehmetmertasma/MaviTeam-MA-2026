import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppScreenLayout } from "@/components/AppScreenLayout";
import { BillingDetailsModal } from "@/components/BillingDetailsModal";
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
import { paymentGatewayService } from "@/services/paymentGatewayService";
import { teamSyncService } from "@/services/teamSyncService";
import type { BillingDetails, Payment, PaymentStatus, TeamSyncAppData, UserProfile } from "@/types/teamSync";
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

function formatAmount(amountCents: number, locale: string, currency: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(amountCents / 100);
}

// Payments the monthly dues generator creates (functions/index.js's
// generateMonthlyDues) carry a billingPeriodKey ("2026-09") instead of a
// meaningful free-text title -- label those by month/year instead of
// showing the generic placeholder title stored on the doc.
function formatPaymentTitle(payment: Payment, locale: string) {
  if (payment.billingPeriodKey === undefined) {
    return payment.title;
  }

  const [year, month] = payment.billingPeriodKey.split("-").map(Number);
  if (year === undefined || month === undefined) {
    return payment.title;
  }

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString(locale, { month: "long", year: "numeric" });
  return locale === "tr-TR" ? `${monthLabel} aidatı` : `${monthLabel} dues`;
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

// Prefix search, not substring: typing "e" should surface names starting
// with "e" (Emre), not every name that merely contains an "e" somewhere
// (Mehmet, Ahmet, ...). Checked per word so a surname prefix ("yil" for
// "Emre Yılmaz") also matches, the way contact pickers usually behave.
function matchesRecipientQuery(query: string, fullName: string, email: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery === "") return true;

  const matchesName = fullName.toLowerCase().split(/\s+/).some((word) => word.startsWith(normalizedQuery));
  const matchesEmail = email.toLowerCase().startsWith(normalizedQuery);
  return matchesName || matchesEmail;
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
    selectedUserLabel: en ? "Selected" : "Seçili",
    clearSelectedUser: en ? "Clear selected member" : "Seçili üyeyi kaldır",
    searchMembersPlaceholder: en ? "Type a name or email to search..." : "İsim veya e-posta yazarak ara...",
    searchMembersLabel: en ? "Search members" : "Üyelerde ara",
    searchMembersHint: en ? "Start typing to find a member." : "Aramaya başlamak için yazmaya başla.",
    noMatchingMembersTitle: en ? "No matching members" : "Aramayla eşleşen üye yok",
    noMatchingMembersDescription: en ? "Try a different name or email." : "Farklı bir isim veya e-posta ile tekrar dene.",
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
    payNow: en ? "Pay now" : "Şimdi öde",
    payingNow: en ? "Opening checkout..." : "Ödeme açılıyor...",
    payNowError: en ? "Could not start the payment. Please try again." : "Ödeme başlatılamadı. Lütfen tekrar dene.",
  };
}

export default function PaymentsScreen() {
  const { language } = useTranslation();
  const copy = useMemo(() => getCopy(language), [language]);
  const locale = language === "tr" ? "tr-TR" : "en-US";
  const { appData, refresh, setAppData } = useAppDataContext();
  const { checkout: checkoutReturnParam } = useLocalSearchParams<{ checkout?: string }>();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedUserIdState, setSelectedUserId] = useState("");
  const [paymentTitle, setPaymentTitle] = useState("");
  const [amountText, setAmountText] = useState("");
  const [dueDateText, setDueDateText] = useState("");
  const [customStatusMessage, setStatusMessage] = useState<string | null>(null);
  const statusMessage = customStatusMessage ?? copy.paymentsUpdated;
  const [searchQuery, setSearchQuery] = useState("");
  const [recipientQuery, setRecipientQuery] = useState("");
  const [payingPaymentId, setPayingPaymentId] = useState<string | null>(null);
  const [pendingCheckoutPaymentId, setPendingCheckoutPaymentId] = useState<string | null>(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);

  const users = appData?.users ?? EMPTY_USERS;
  const selectedUserId = users.find((user) => user.id === selectedUserIdState && user.status !== "removed")?.id ?? "";

  async function refreshPaymentsData() {
    try {
      await refresh();
      setStatusMessage(copy.paymentsUpdated);
    } catch {
      setStatusMessage(copy.loadError);
    }
  }

  // Stripe/iyzico's hosted checkout returns the browser here with
  // ?checkout=return once the payer finishes (or abandons) paying --
  // refresh so a payment the webhook already marked "paid" shows up without
  // a manual pull-to-refresh.
  useFocusEffect(
    useCallback(() => {
      if (checkoutReturnParam === "return") {
        refresh()
          .then(() => setStatusMessage(copy.paymentsUpdated))
          .catch(() => setStatusMessage(copy.loadError));
      }
    }, [checkoutReturnParam, refresh, copy.paymentsUpdated, copy.loadError])
  );

  async function startCheckout(paymentId: string) {
    try {
      setPayingPaymentId(paymentId);
      const { url } = await paymentGatewayService.createCheckoutSession(paymentId);
      await openBrowserAsync(url);
    } catch {
      setStatusMessage(copy.payNowError);
    } finally {
      setPayingPaymentId(null);
    }
  }

  async function handlePayNow(payment: Payment) {
    if (appData === null || payingPaymentId !== null) {
      return;
    }

    // iyzico needs the payer's national ID/phone/address on every checkout
    // -- collect it once via BillingDetailsModal before the very first
    // online payment instead of asking every time.
    if (appData.club.country !== "US" && appData.currentUser.billingDetails === undefined) {
      setPendingCheckoutPaymentId(payment.id);
      return;
    }

    await startCheckout(payment.id);
  }

  async function handleSaveBillingDetails(billingDetails: BillingDetails) {
    if (appData === null) {
      return;
    }

    try {
      setPayingPaymentId(pendingCheckoutPaymentId);
      const nextAppData = await teamSyncService.updateCurrentUser({ billingDetails });
      setAppData(nextAppData);

      const paymentId = pendingCheckoutPaymentId;
      setPendingCheckoutPaymentId(null);

      if (paymentId !== null) {
        await startCheckout(paymentId);
      }
    } catch {
      setStatusMessage(copy.payNowError);
      setPayingPaymentId(null);
    }
  }

  const currency = appData?.club.currency ?? "TRY";
  const payments = appData?.payments ?? EMPTY_PAYMENTS;
  const activeUsers = users.filter((user) => user.status !== "removed");
  const selectedUser = activeUsers.find((user) => user.id === selectedUserId);

  const filteredRecipients = useMemo(() => {
    return activeUsers.filter((user) => matchesRecipientQuery(recipientQuery, user.fullName, user.email));
  }, [activeUsers, recipientQuery]);
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
      setIsCreatingPayment(true);

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
    } finally {
      setIsCreatingPayment(false);
    }
  }

  async function handleChangePaymentStatus(paymentId: string, newStatus: PaymentStatus) {
    if (updatingPaymentId !== null) {
      return;
    }

    try {
      setUpdatingPaymentId(paymentId);
      const nextAppData = await teamSyncService.updatePaymentStatus(paymentId, newStatus);
      setAppData(nextAppData);
      setStatusMessage(copy.statusUpdated);
    } catch {
      setStatusMessage(copy.statusUpdateError);
    } finally {
      setUpdatingPaymentId(null);
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
          {selectedUser ? (
            <View style={styles.selectedRecipientBanner}>
              <View style={styles.selectedRecipientText}>
                <Text style={styles.selectedRecipientLabel}>{copy.selectedUserLabel}</Text>
                <Text style={styles.selectedRecipientName}>{selectedUser.fullName}</Text>
              </View>
              <Pressable
                onPress={() => { setSelectedUserId(""); setRecipientQuery(""); }}
                accessibilityLabel={copy.clearSelectedUser}
                style={({ pressed }) => [styles.clearRecipientButton, pressed ? styles.pressed : null]}
              >
                <Text style={styles.clearRecipientButtonText}>×</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <SearchField
                value={recipientQuery}
                onChangeText={setRecipientQuery}
                placeholder={copy.searchMembersPlaceholder}
                accessibilityLabel={copy.searchMembersLabel}
                style={styles.field}
              />
              {recipientQuery.trim().length === 0 ? (
                <Text style={styles.searchHint}>{copy.searchMembersHint}</Text>
              ) : filteredRecipients.length === 0 ? (
                <EmptyState title={copy.noMatchingMembersTitle} description={copy.noMatchingMembersDescription} />
              ) : (
                <ScrollView style={styles.recipientList} nestedScrollEnabled>
                  {filteredRecipients.map((user) => (
                    <Pressable
                      key={user.id}
                      onPress={() => { setSelectedUserId(user.id); setRecipientQuery(""); }}
                      style={({ pressed }) => [styles.recipientRow, pressed ? styles.pressed : null]}
                    >
                      <Text style={styles.recipientName}>{user.fullName}</Text>
                      <Text style={styles.recipientMeta}>{user.email}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </>
          )}
          <TextField label={copy.titleLabel} value={paymentTitle} onChangeText={setPaymentTitle} placeholder={copy.titlePlaceholder} containerStyle={styles.field} />
          <View style={styles.formGrid}>
            <TextField label={copy.amountLabel} value={amountText} onChangeText={setAmountText} placeholder={copy.amountPlaceholder} keyboardType="numeric" containerStyle={styles.formField} />
            <TextField label={copy.dueDateLabel} value={dueDateText} onChangeText={setDueDateText} placeholder={copy.dueDatePlaceholder} autoCapitalize="none" containerStyle={styles.formField} />
          </View>
          <View style={styles.topActions}>
            <AppButton
              title={copy.savePayment}
              onPress={handleCreatePayment}
              loading={isCreatingPayment}
              disabled={!canCreatePayment || isCreatingPayment}
              style={styles.actionButton}
            />
            <AppButton
              title={copy.cancel}
              variant="ghost"
              disabled={isCreatingPayment}
              onPress={() => { clearForm(); setShowCreateForm(false); setStatusMessage(copy.createCanceled); }}
              style={styles.actionButton}
            />
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
                      <Text style={styles.parentName}>{formatPaymentTitle(payment, locale)}</Text>
                    </View>
                    <StatusBadge label={copy.statusLabels[payment.status]} tone={paymentToneByStatus[payment.status]} />
                  </View>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoBox}><Text style={styles.infoLabel}>{copy.team}</Text><Text style={styles.infoValue}>{getPrimaryTeamName(payment.userId, appData, copy.noTeamSelected, copy.teamNotFound)}</Text></View>
                    <View style={styles.infoBox}><Text style={styles.infoLabel}>{copy.amount}</Text><Text style={styles.infoValue}>{formatAmount(payment.amountCents, locale, currency)}</Text></View>
                    <View style={styles.infoBox}><Text style={styles.infoLabel}>{copy.dueDate}</Text><Text style={styles.infoValue}>{formatDate(payment.dueAt, locale, copy.noDate)}</Text></View>
                    <View style={styles.infoBox}><Text style={styles.infoLabel}>{copy.paidOn}</Text><Text style={styles.infoValue}>{payment.paidAt ? formatDate(payment.paidAt, locale, copy.noDate) : copy.pending}</Text></View>
                  </View>
                  {userCanManagePayments && payment.paymentMethod !== "online" ? (
                    <View style={styles.statusActions}>
                      {copy.paymentStatusOptions.map((option) => {
                        const isSelected = payment.status === option.status;
                        return (
                          <Pressable
                            key={option.status}
                            disabled={updatingPaymentId === payment.id}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            onPress={() => handleChangePaymentStatus(payment.id, option.status)}
                            style={({ pressed }) => [styles.statusButton, isSelected ? styles.statusButtonSelected : null, pressed ? styles.pressed : null]}
                          >
                            <Text style={[styles.statusButtonText, isSelected ? styles.statusButtonTextSelected : null]}>{option.label}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}
                  {payment.paymentMethod === "online" && payment.userId === appData.currentUser.id && payment.status !== "paid" ? (
                    <AppButton
                      title={payingPaymentId === payment.id ? copy.payingNow : copy.payNow}
                      loading={payingPaymentId === payment.id}
                      disabled={payingPaymentId !== null}
                      onPress={() => handlePayNow(payment)}
                      style={styles.payNowButton}
                    />
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

      {pendingCheckoutPaymentId !== null ? (
        <BillingDetailsModal
          initialValues={appData?.currentUser.billingDetails}
          isSaving={payingPaymentId !== null}
          onSave={handleSaveBillingDetails}
          onClose={() => setPendingCheckoutPaymentId(null)}
          language={language}
        />
      ) : null}
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
  selectedRecipientBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: theme.spacing.sm, backgroundColor: theme.colors.brand.primarySoft, borderRadius: theme.radius.md, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md, marginBottom: theme.spacing.lg },
  selectedRecipientText: { flex: 1 },
  selectedRecipientLabel: { color: theme.colors.text.brand, fontSize: theme.fontSizes.xs, fontWeight: theme.fontWeights.semibold, textTransform: "uppercase" },
  selectedRecipientName: { color: theme.colors.text.brand, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold },
  clearRecipientButton: { width: 28, height: 28, borderRadius: theme.radius.full, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.background.surface },
  clearRecipientButtonText: { color: theme.colors.text.brand, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.semibold, lineHeight: theme.fontSizes.lg },
  searchHint: { color: theme.colors.text.muted, fontSize: theme.fontSizes.sm, marginBottom: theme.spacing.lg },
  recipientList: { maxHeight: 220, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border.default, marginBottom: theme.spacing.xl },
  recipientRow: { paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border.default, backgroundColor: theme.colors.background.subtle },
  recipientName: { color: theme.colors.text.primary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold },
  recipientMeta: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm },
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
  payNowButton: { marginTop: theme.spacing.sm },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
});
