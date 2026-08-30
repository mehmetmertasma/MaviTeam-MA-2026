import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { StatusBadge } from "@/components/StatusBadge";
import type { StatusBadgeTone } from "@/components/StatusBadge";
import { TextField } from "@/components/TextField";
import { theme } from "@/constants/theme";
import type { AttendanceRecord, Payment, PaymentStatus, Team, UserProfile, UserRole, UserStatus } from "@/types/teamSync";

type EditableRole = Exclude<UserRole, "superAdmin">;

export type MemberProfileDraft = {
  role: EditableRole;
  status: UserStatus;
  teamIds: string[];
  monthlyDuesAmountCents: number;
};

type MemberProfileBubbleProps = {
  member: UserProfile;
  teams: Team[];
  attendanceRecords: AttendanceRecord[];
  payments: Payment[];
  currency: string;
  // Viewer is a clubAdmin at all -- general editing capability.
  canManage: boolean;
  // Viewer is a clubAdmin or coach -- allowed to see this person's dues.
  canViewDues: boolean;
  // This specific member can't be edited (self, club owner, platform admin),
  // independent of whether the viewer can manage members in general.
  isProtected: boolean;
  isSaving: boolean;
  onSave: (member: UserProfile, draft: MemberProfileDraft) => void;
  onClose: () => void;
  language: "tr" | "en";
};

const paymentToneByStatus: Record<PaymentStatus, StatusBadgeTone> = {
  paid: "success",
  unpaid: "warning",
  late: "danger",
};

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "MT";
}

function isEditableRole(role: UserRole): role is EditableRole {
  return role !== "superAdmin";
}

function parseAmountToCents(amountText: string) {
  const normalizedAmount = amountText.replace(/[^0-9.,]/g, "").replace(",", ".");
  const amount = Number(normalizedAmount);
  if (Number.isNaN(amount) || amount <= 0) return 0;
  return Math.round(amount * 100);
}

function formatCentsAsAmountText(amountCents: number | undefined) {
  if (amountCents === undefined || amountCents <= 0) return "";
  return (amountCents / 100).toString();
}

function formatAmount(amountCents: number, locale: string, currency: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(amountCents / 100);
}

// Payments created by the monthly dues generator carry a billingPeriodKey
// ("2026-09") instead of a meaningful free-text title -- label those by
// month/year instead of the generic stored title. Mirrors payments.tsx's
// own formatPaymentTitle.
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

// Present + late counts as "attended" -- mirrors attendance.tsx/statistics.tsx's
// own definition so the same person reads the same rate everywhere.
function getAttendanceRate(records: AttendanceRecord[]) {
  if (records.length === 0) return null;
  const attendedCount = records.filter((record) => record.status === "present" || record.status === "late").length;
  return Math.round((attendedCount / records.length) * 100);
}

function getCopy(language: "tr" | "en") {
  const en = language === "en";

  const roleOptions: { label: string; value: EditableRole }[] = [
    { label: en ? "Admin" : "Yönetici", value: "clubAdmin" },
    { label: en ? "Coach" : "Koç", value: "coach" },
    { label: en ? "Parent" : "Veli", value: "parent" },
    { label: en ? "Athlete" : "Sporcu", value: "athlete" },
  ];

  const statusOptions: { label: string; value: UserStatus }[] = [
    { label: en ? "Active" : "Aktif", value: "active" },
    { label: en ? "Pending" : "Beklemede", value: "pending" },
    { label: en ? "Removed" : "Çıkarıldı", value: "removed" },
  ];

  const roleLabels: Record<UserRole, string> = {
    superAdmin: en ? "Platform Admin" : "Platform Yöneticisi",
    clubAdmin: en ? "Admin" : "Yönetici",
    coach: en ? "Coach" : "Koç",
    parent: en ? "Parent" : "Veli",
    athlete: en ? "Athlete" : "Sporcu",
  };

  const statusLabels: Record<UserStatus, string> = {
    active: en ? "Active" : "Aktif",
    pending: en ? "Pending" : "Beklemede",
    removed: en ? "Removed" : "Çıkarıldı",
  };

  const paymentStatusLabels: Record<PaymentStatus, string> = {
    paid: en ? "Paid" : "Ödendi",
    unpaid: en ? "Unpaid" : "Ödenmedi",
    late: en ? "Late" : "Gecikti",
  };

  return {
    closeAccessibilityLabel: en ? "Close member profile" : "Üye profilini kapat",
    roleLabel: en ? "Role" : "Rol",
    statusLabel: en ? "Status" : "Durum",
    teamsLabel: en ? "Teams" : "Takımlar",
    noTeam: en ? "No team" : "Takım yok",
    joinedLabel: en ? "Joined" : "Katılım tarihi",
    noEmail: en ? "No email" : "E-posta yok",
    noDate: en ? "No date" : "Tarih yok",
    attendanceTitle: en ? "Recent attendance (last 2 weeks)" : "Son yoklama (son 2 hafta)",
    present: en ? "Present" : "Katıldı",
    absent: en ? "Absent" : "Katılmadı",
    late: en ? "Late" : "Geç kaldı",
    excused: en ? "Excused" : "İzinli",
    noAttendanceRecords: en ? "No attendance records in the last 2 weeks." : "Son 2 haftada yoklama kaydı yok.",
    duesTitle: en ? "Dues & payments" : "Aidat ve ödemeler",
    noDues: en ? "No payment records for this person." : "Bu kişi için ödeme kaydı yok.",
    paymentStatusLabels,
    dueLabel: en ? "Due" : "Son tarih",
    paidLabel: en ? "Paid" : "Ödendi",
    editButton: en ? "Edit" : "Düzenle",
    protectedHint: en
      ? "Your own account, the owner, and platform admins are protected."
      : "Kendi hesabın, owner veya platform admin korunur.",
    monthlyDuesLabel: en ? "Monthly dues" : "Aylık aidat tutarı",
    monthlyDuesPlaceholder: en ? "E.g. 300 (leave empty for none)" : "Örn. 300 (yoksa boş bırak)",
    monthlyDuesHint: en
      ? "If set, a new payment is created automatically for this athlete every month."
      : "Girilirse bu sporcu için her ay otomatik olarak yeni bir ödeme oluşturulur.",
    noTeamsYet: en ? "No teams yet." : "Henüz takım yok.",
    saving: en ? "Saving..." : "Kaydediliyor...",
    save: en ? "Save" : "Kaydet",
    cancel: en ? "Cancel" : "Vazgeç",
    roleOptions,
    statusOptions,
    roleLabels,
    statusLabels,
  };
}

// A real Modal (not an inline expand) -- same reasoning as
// EventDetailsBubble: the trigger is a row inside a scrollable list, so it
// needs to float over the whole page and not get clipped by the list's own
// scroll container.
export function MemberProfileBubble({
  member,
  teams,
  attendanceRecords,
  payments,
  currency,
  canManage,
  canViewDues,
  isProtected,
  isSaving,
  onSave,
  onClose,
  language,
}: MemberProfileBubbleProps) {
  const copy = useMemo(() => getCopy(language), [language]);
  const locale = language === "tr" ? "tr-TR" : "en-US";
  const [isEditing, setIsEditing] = useState(false);
  const [draftRole, setDraftRole] = useState<EditableRole>(isEditableRole(member.role) ? member.role : "athlete");
  const [draftStatus, setDraftStatus] = useState<UserStatus>(member.status);
  const [draftTeamIds, setDraftTeamIds] = useState<string[]>(member.teamIds);
  const [draftMonthlyDuesText, setDraftMonthlyDuesText] = useState(formatCentsAsAmountText(member.monthlyDuesAmountCents));

  const memberAttendance = useMemo(
    () => attendanceRecords.filter((record) => record.userId === member.id),
    [attendanceRecords, member.id]
  );
  const memberPayments = useMemo(() => payments.filter((payment) => payment.userId === member.id), [payments, member.id]);
  const attendanceRate = getAttendanceRate(memberAttendance);
  const teamNames = teams.filter((team) => member.teamIds.includes(team.id)).map((team) => team.name);
  const teamsDisplay = teamNames.length > 0 ? teamNames.join(", ") : copy.noTeam;

  function toggleDraftTeam(teamId: string) {
    setDraftTeamIds((currentTeamIds) =>
      currentTeamIds.includes(teamId) ? currentTeamIds.filter((currentTeamId) => currentTeamId !== teamId) : [...currentTeamIds, teamId]
    );
  }

  function startEditing() {
    setDraftRole(isEditableRole(member.role) ? member.role : "athlete");
    setDraftStatus(member.status);
    setDraftTeamIds(member.teamIds);
    setDraftMonthlyDuesText(formatCentsAsAmountText(member.monthlyDuesAmountCents));
    setIsEditing(true);
  }

  function handleSave() {
    onSave(member, {
      role: draftRole,
      status: draftStatus,
      teamIds: draftStatus === "removed" ? [] : draftTeamIds,
      monthlyDuesAmountCents: draftRole === "athlete" ? parseAmountToCents(draftMonthlyDuesText) : 0,
    });
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={copy.closeAccessibilityLabel}>
        <Pressable style={styles.panel} onPress={(pressEvent) => pressEvent.stopPropagation()}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(member.fullName)}</Text>
              </View>
              <View style={styles.headerText}>
                <Text style={styles.name}>{member.fullName}</Text>
                <Text style={styles.email}>{member.email || copy.noEmail}</Text>
              </View>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [styles.closeButton, pressed ? styles.pressed : null]}
                accessibilityLabel={copy.closeAccessibilityLabel}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>

            {isEditing ? (
              <View style={styles.editPanel}>
                <Text style={styles.sectionLabel}>{copy.roleLabel}</Text>
                <View style={styles.chipRow}>
                  {copy.roleOptions.map((option) => {
                    const isSelected = draftRole === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => setDraftRole(option.value)}
                        style={({ pressed }) => [styles.chip, isSelected ? styles.chipSelected : null, pressed ? styles.pressed : null]}
                      >
                        <Text style={[styles.chipText, isSelected ? styles.chipTextSelected : null]}>{option.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.sectionLabel}>{copy.statusLabel}</Text>
                <View style={styles.chipRow}>
                  {copy.statusOptions.map((option) => {
                    const isSelected = draftStatus === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => setDraftStatus(option.value)}
                        style={({ pressed }) => [styles.chip, isSelected ? styles.chipSelected : null, pressed ? styles.pressed : null]}
                      >
                        <Text style={[styles.chipText, isSelected ? styles.chipTextSelected : null]}>{option.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.sectionLabel}>{copy.teamsLabel}</Text>
                <View style={styles.chipRow}>
                  {teams.length === 0 ? (
                    <Text style={styles.emptyText}>{copy.noTeamsYet}</Text>
                  ) : (
                    teams.map((team) => {
                      const isSelected = draftTeamIds.includes(team.id);
                      return (
                        <Pressable
                          key={team.id}
                          onPress={() => toggleDraftTeam(team.id)}
                          disabled={draftStatus === "removed"}
                          style={({ pressed }) => [
                            styles.chip,
                            isSelected ? styles.chipSelected : null,
                            draftStatus === "removed" ? styles.chipDisabled : null,
                            pressed ? styles.pressed : null,
                          ]}
                        >
                          <Text style={[styles.chipText, isSelected ? styles.chipTextSelected : null]}>{team.name}</Text>
                        </Pressable>
                      );
                    })
                  )}
                </View>

                {draftRole === "athlete" ? (
                  <View>
                    <TextField
                      label={copy.monthlyDuesLabel}
                      value={draftMonthlyDuesText}
                      onChangeText={setDraftMonthlyDuesText}
                      placeholder={copy.monthlyDuesPlaceholder}
                      keyboardType="decimal-pad"
                    />
                    <Text style={styles.inlineHint}>{copy.monthlyDuesHint}</Text>
                  </View>
                ) : null}

                <View style={styles.actionRow}>
                  <AppButton title={isSaving ? copy.saving : copy.save} disabled={isSaving} onPress={handleSave} style={styles.actionButton} />
                  <AppButton title={copy.cancel} variant="ghost" disabled={isSaving} onPress={() => setIsEditing(false)} style={styles.actionButton} />
                </View>
              </View>
            ) : (
              <>
                <View style={styles.metaGrid}>
                  <View style={styles.metaBox}>
                    <Text style={styles.metaLabel}>{copy.roleLabel}</Text>
                    <Text style={styles.metaValue}>{copy.roleLabels[member.role]}</Text>
                  </View>
                  <View style={styles.metaBox}>
                    <Text style={styles.metaLabel}>{copy.statusLabel}</Text>
                    <Text style={styles.metaValue}>{copy.statusLabels[member.status]}</Text>
                  </View>
                  <View style={styles.metaBox}>
                    <Text style={styles.metaLabel}>{copy.teamsLabel}</Text>
                    <Text style={styles.metaValue}>{teamsDisplay}</Text>
                  </View>
                  <View style={styles.metaBox}>
                    <Text style={styles.metaLabel}>{copy.joinedLabel}</Text>
                    <Text style={styles.metaValue}>{formatDate(member.createdAt, locale, copy.noDate)}</Text>
                  </View>
                </View>

                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>{copy.attendanceTitle}</Text>
                    {attendanceRate !== null ? (
                      <StatusBadge
                        label={`${attendanceRate}%`}
                        tone={attendanceRate >= 75 ? "success" : attendanceRate >= 50 ? "warning" : "danger"}
                      />
                    ) : null}
                  </View>
                  {memberAttendance.length === 0 ? (
                    <Text style={styles.emptyText}>{copy.noAttendanceRecords}</Text>
                  ) : (
                    <View style={styles.attendanceGrid}>
                      <View style={styles.attendanceBox}>
                        <Text style={styles.attendanceValue}>{memberAttendance.filter((record) => record.status === "present").length}</Text>
                        <Text style={styles.attendanceLabel}>{copy.present}</Text>
                      </View>
                      <View style={styles.attendanceBox}>
                        <Text style={styles.attendanceValue}>{memberAttendance.filter((record) => record.status === "absent").length}</Text>
                        <Text style={styles.attendanceLabel}>{copy.absent}</Text>
                      </View>
                      <View style={styles.attendanceBox}>
                        <Text style={styles.attendanceValue}>{memberAttendance.filter((record) => record.status === "late").length}</Text>
                        <Text style={styles.attendanceLabel}>{copy.late}</Text>
                      </View>
                      <View style={styles.attendanceBox}>
                        <Text style={styles.attendanceValue}>{memberAttendance.filter((record) => record.status === "excused").length}</Text>
                        <Text style={styles.attendanceLabel}>{copy.excused}</Text>
                      </View>
                    </View>
                  )}
                </View>

                {canViewDues ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{copy.duesTitle}</Text>
                    {memberPayments.length === 0 ? (
                      <Text style={styles.emptyText}>{copy.noDues}</Text>
                    ) : (
                      <View style={styles.paymentList}>
                        {memberPayments.map((payment) => (
                          <View key={payment.id} style={styles.paymentRow}>
                            <View style={styles.paymentTextArea}>
                              <Text style={styles.paymentTitle}>{formatPaymentTitle(payment, locale)}</Text>
                              <Text style={styles.paymentMeta}>
                                {copy.dueLabel}: {formatDate(payment.dueAt, locale, copy.noDate)}
                                {payment.paidAt ? ` · ${copy.paidLabel}: ${formatDate(payment.paidAt, locale, copy.noDate)}` : ""}
                              </Text>
                            </View>
                            <View style={styles.paymentAmountArea}>
                              <Text style={styles.paymentAmount}>{formatAmount(payment.amountCents, locale, currency)}</Text>
                              <StatusBadge label={copy.paymentStatusLabels[payment.status]} tone={paymentToneByStatus[payment.status]} />
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ) : null}

                {canManage ? (
                  <View style={styles.footerRow}>
                    {isProtected ? (
                      <Text style={styles.inlineHint}>{copy.protectedHint}</Text>
                    ) : (
                      <AppButton title={copy.editButton} variant="secondary" onPress={startEditing} style={styles.actionButton} />
                    )}
                  </View>
                ) : null}
              </>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default MemberProfileBubble;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.overlay,
  },
  panel: {
    width: "100%",
    maxWidth: 480,
    maxHeight: "88%",
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.brand.primarySoft,
    ...theme.shadows.lg,
  },
  scrollContent: { padding: theme.spacing.lg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.brand.primarySoft,
  },
  avatarText: { color: theme.colors.text.brand, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold },
  headerText: { flex: 1, minWidth: 0 },
  name: { color: theme.colors.text.primary, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.semibold },
  email: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.medium, marginTop: theme.spacing.xxs },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.subtle,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: { color: theme.colors.text.primary, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.semibold, marginTop: -2 },
  metaGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm, marginBottom: theme.spacing.lg },
  metaBox: {
    flexGrow: 1,
    flexBasis: 130,
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.sm,
  },
  metaLabel: { color: theme.colors.text.muted, fontSize: theme.fontSizes.xs, fontWeight: theme.fontWeights.medium, textTransform: "uppercase", marginBottom: theme.spacing.xs },
  metaValue: { color: theme.colors.text.primary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold },
  section: { marginBottom: theme.spacing.lg },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.sm },
  sectionTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes.md, fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.sm },
  attendanceGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  attendanceBox: {
    flexGrow: 1,
    flexBasis: 70,
    alignItems: "center",
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    paddingVertical: theme.spacing.sm,
  },
  attendanceValue: { color: theme.colors.text.primary, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.bold },
  attendanceLabel: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.xs, fontWeight: theme.fontWeights.medium },
  paymentList: { gap: theme.spacing.sm },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background.subtle,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    padding: theme.spacing.sm,
  },
  paymentTextArea: { flex: 1 },
  paymentTitle: { color: theme.colors.text.primary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold },
  paymentMeta: { color: theme.colors.text.muted, fontSize: theme.fontSizes.xs, fontWeight: theme.fontWeights.medium, marginTop: theme.spacing.xxs },
  paymentAmountArea: { alignItems: "flex-end", gap: theme.spacing.xs },
  paymentAmount: { color: theme.colors.text.primary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold },
  editPanel: { gap: theme.spacing.md },
  sectionLabel: { color: theme.colors.text.primary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.semibold },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  chip: { borderWidth: 1, borderColor: theme.colors.border.default, borderRadius: theme.radius.md, backgroundColor: theme.colors.background.surface, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.lg },
  chipSelected: { backgroundColor: theme.colors.brand.primary, borderColor: theme.colors.brand.primary },
  chipDisabled: { opacity: 0.45 },
  chipText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.medium },
  chipTextSelected: { color: theme.colors.text.inverse },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  footerRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  actionButton: { flexGrow: 1, minWidth: 120 },
  inlineHint: { flex: 1, color: theme.colors.text.muted, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.medium },
  emptyText: { color: theme.colors.text.secondary, fontSize: theme.fontSizes.sm, fontWeight: theme.fontWeights.regular },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
});
