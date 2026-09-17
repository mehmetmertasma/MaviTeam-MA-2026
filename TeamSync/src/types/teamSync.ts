export type UserRole = "superAdmin" | "clubAdmin" | "coach" | "parent" | "athlete";

export type UserStatus = "active" | "pending" | "removed";

export type TeamMemberRole = "coach" | "athlete" | "parent";

export type AnnouncementTarget = "allClub" | "team";

export type ScheduleEventType = "practice" | "match" | "meeting";

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export type PaymentStatus = "paid" | "unpaid" | "late";

export type ReplayType = "match" | "practice" | "drill";

export type JoinRequestStatus = "pending" | "approved" | "rejected";

export type TimestampString = string;

export type ClubStatus = "active" | "suspended";

export type ClubCountry = "TR" | "US";

export type ClubCurrency = "TRY" | "USD";

export type PaymentProvider = "iyzico" | "stripe";

export type ClubPaymentAccountStatus = "not_connected" | "pending" | "connected";

export type ClubPaymentAccount = {
  provider: PaymentProvider;
  status: ClubPaymentAccountStatus;
  externalAccountId?: string;
  connectedAt?: TimestampString;
};

export type ClubSubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";

export type ClubSubscriptionProvider = "stripe" | "iyzico" | "none";

export type ClubSubscription = {
  status: ClubSubscriptionStatus;
  provider: ClubSubscriptionProvider;
  // Provider-side customer/subscription references. Absent for "none"
  // (a promo-only trial that never touched a real payment provider).
  customerId?: string;
  subscriptionId?: string;
  // End of the period already paid for. Access stays on through this date
  // even after a cancellation, since cancelAtPeriodEnd defers lockout.
  currentPeriodEnd?: TimestampString;
  cancelAtPeriodEnd?: boolean;
  // Set the moment a payment first fails or a trial expires -- the grace-
  // period cron (functions/index.js's enforceSubscriptionGracePeriod) reads
  // this to know when 7 days are up. Cleared as soon as payment succeeds
  // again. Also reset by setClubStatus when a platform admin manually
  // reactivates a still-unpaid club, giving it a fresh grace window.
  pastDueSince?: TimestampString;
  // Only set when the subscription was started via a promo code.
  trialEndsAt?: TimestampString;
  promoCodeId?: string;
  // Dedupe keys for reminder emails/push (e.g. "trial7d", "pastDue1d") so
  // the daily reminders cron never sends the same nudge twice.
  remindersSent?: string[];
  // Set only by the grace-period cron, cleared once payment succeeds --
  // lets setClubStatus tell an automatic suspension apart from a manual one.
  autoSuspendedAt?: TimestampString;
  canceledAt?: TimestampString;
  updatedAt: TimestampString;
};

export type Club = {
  id: string;
  name: string;
  sport: string;
  city: string;
  code: string;
  ownerId: string;
  logoUrl?: string;
  primaryColor?: string;
  // Missing/undefined is treated as "active" everywhere that reads this --
  // only the platform admin panel (functions/index.js's setClubStatus) ever
  // writes it, via the Admin SDK, so every existing club document written
  // before this field existed keeps working without a backfill.
  status?: ClubStatus;
  // Missing/undefined is treated as "TR" everywhere that reads this --
  // every real club predates this field and is actually Turkish, so no
  // backfill is needed. Drives which online-payment provider a club uses
  // once it connects a payment account (see ClubPaymentAccount below).
  country?: ClubCountry;
  // Derived from country (TR -> TRY, US -> USD) at write time, stored
  // redundantly so screens can format amounts without re-deriving it.
  currency?: ClubCurrency;
  // Day of the month the monthly-dues generator creates new payments on
  // for this club. Missing/undefined is treated as 1. One setting per
  // club (not per athlete) -- keeps the generator simple.
  duesBillingDayOfMonth?: number;
  // Present only once a club has started connecting a real payment
  // account. Missing entirely = the club has never touched online
  // payments and behaves exactly as it does today (manual ledger only).
  paymentAccount?: ClubPaymentAccount;
  // The club's own $20/mo platform subscription (distinct from
  // paymentAccount, which is the club's *outgoing* dues-collection setup).
  // Missing/undefined only for clubs created before this feature shipped --
  // the one-time backfill script grandfathers them in as
  // { status: "active", provider: "none" }. The grace-period cron skips any
  // club still missing this field rather than ever guessing a default.
  subscription?: ClubSubscription;
  createdAt: TimestampString;
  updatedAt: TimestampString;
};

export type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  clubId: string;
  teamIds: string[];
  // Expo push tokens for every device this user is signed into -- an array,
  // not a single token, since the same person can have a phone and a
  // tablet, or reinstall and pick up a new token without invalidating an
  // older one still in use elsewhere. Written only by the signed-in user
  // themselves (see firestoreTeamSyncService.registerPushToken).
  expoPushTokens?: string[];
  // Unset/0 = no recurring due for this person -- most parents/coaches/
  // admins never have this set, only athletes with an active monthly fee
  // do. Set by a clubAdmin via the members screen; read by the monthly
  // dues generator (functions/index.js's generateMonthlyDues).
  monthlyDuesAmountCents?: number;
  // Only ever set for a TR-club user paying online -- iyzico's checkout API
  // requires the payer's national ID, phone, and address on every
  // transaction, so this is collected once (see BillingDetailsModal) and
  // reused for every subsequent online payment instead of asking again.
  billingDetails?: BillingDetails;
  createdAt: TimestampString;
  updatedAt: TimestampString;
};

export type BillingDetails = {
  nationalId: string;
  phone: string;
  address: string;
  city: string;
};

export type Team = {
  id: string;
  clubId: string;
  name: string;
  ageGroup: string;
  coachIds: string[];
  memberIds: string[];
  createdAt: TimestampString;
  updatedAt: TimestampString;
};

export type Announcement = {
  id: string;
  clubId: string;
  title: string;
  message: string;
  targetType: AnnouncementTarget;
  targetTeamId?: string;
  createdByUserId: string;
  createdAt: TimestampString;
  updatedAt?: TimestampString;
};

export type ScheduleEvent = {
  id: string;
  clubId: string;
  teamId?: string;
  title: string;
  type: ScheduleEventType;
  startsAt: TimestampString;
  endsAt?: TimestampString;
  location: string;
  note?: string;
  createdByUserId: string;
  createdAt: TimestampString;
  updatedAt?: TimestampString;
};

export type AttendanceRecord = {
  id: string;
  clubId: string;
  teamId?: string;
  userId: string;
  status: AttendanceStatus;
  sessionDate: TimestampString;
  recordedByUserId: string;
  recordedAt: TimestampString;
  updatedAt?: TimestampString;
};

// Raw AttendanceRecord documents are only kept for a couple of weeks (see
// functions/index.js's cleanupOldAttendance) -- once a record ages out, its
// status is folded into the matching year here (keyed by session year) and
// the raw record is deleted, so "yearly average attendance" survives the
// cleanup even though the day-by-day records don't.
export type AttendanceYearlyTotals = {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
};

export type AttendanceSummary = {
  userId: string;
  clubId: string;
  years: Record<string, AttendanceYearlyTotals>;
  updatedAt: TimestampString;
};

export type ChatGroup = {
  id: string;
  clubId: string;
  teamId?: string;
  name: string;
  visibleUserIds: string[];
  createdAt: TimestampString;
  updatedAt: TimestampString;
};

export type ChatMessage = {
  id: string;
  clubId: string;
  groupId?: string;
  directUserIds?: string[];
  // Denormalized copy of the target chat group's visibleUserIds at send time,
  // so the read rule can authorize group messages without a per-document
  // Firestore lookup (see canReadChatMessage in firestore.rules).
  visibleUserIds?: string[];
  senderUserId: string;
  text: string;
  createdAt: TimestampString;
};

export type PaymentMethod = "manual" | "online";

export type Payment = {
  id: string;
  clubId: string;
  userId: string;
  title: string;
  amountCents: number;
  status: PaymentStatus;
  dueAt: TimestampString;
  paidAt?: TimestampString;
  updatedAt: TimestampString;
  // Missing/undefined is treated as "manual" -- every existing payment
  // predates online collection and was tracked by hand. "online" rows are
  // only ever created server-side (the monthly generator or the checkout
  // function), never directly by a client -- see firestore.rules.
  paymentMethod?: PaymentMethod;
  provider?: PaymentProvider;
  // The gateway's own id for this specific payment/checkout session --
  // used by the webhook to find the matching document idempotently.
  providerPaymentId?: string;
  // MaviTeam's commission on this specific payment, if any. Informational
  // only (the actual split happens at the gateway); kept for reporting.
  platformFeeCents?: number;
  // Present only on payments created by the monthly dues generator, e.g.
  // "2026-09". Used both to label the row ("September dues") and by the
  // generator itself to avoid creating a second due for the same person
  // in the same month.
  billingPeriodKey?: string;
};

export type Replay = {
  id: string;
  clubId: string;
  teamId?: string;
  title: string;
  description: string;
  type: ReplayType;
  videoUrl: string;
  visibleUserIds: string[];
  createdByUserId: string;
  createdAt: TimestampString;
  updatedAt: TimestampString;
};

export type JoinRequest = {
  id: string;
  clubId: string;
  userId: string;
  requestedRole: UserRole;
  status: JoinRequestStatus;
  createdAt: TimestampString;
  reviewedByUserId?: string;
  reviewedAt?: TimestampString;
};

export type PromoCodeStatus = "unredeemed" | "redeemed" | "revoked";

// Platform-admin-generated, single-use codes redeemable at club signup for a
// number of free months. Never read or written directly by a client -- only
// validated/redeemed inside startClubSignup's Firestore transaction and
// managed via the admin-panel-only createPromoCode/listPromoCodes/
// revokePromoCode callables. See firestore.rules: deny-all on this collection.
export type PromoCode = {
  code: string;
  grantMonths: number;
  status: PromoCodeStatus;
  createdByUid: string;
  note?: string;
  createdAt: TimestampString;
  redeemedByClubId?: string;
  redeemedByUid?: string;
  redeemedAt?: TimestampString;
  revokedAt?: TimestampString;
};

export type PendingClubSignupStatus = "pending" | "completed" | "failed";

// A draft club captured while its first checkout is in flight, so the real
// clubs/{id} document only ever gets created (server-side, by
// startClubSignup or the Stripe webhook) once payment is confirmed. The
// client polls its own doc for resultClubId after returning from checkout --
// see firestore.rules, which lets only the creator read this and never lets
// a client write it (a client-set resultClubId would let someone walk into a
// club they never paid for).
export type PendingClubSignup = {
  id: string;
  createdByUid: string;
  createdByFullName: string;
  createdByEmail: string;
  draft: {
    name: string;
    sport: string;
    city: string;
    country: ClubCountry;
  };
  provider: ClubSubscriptionProvider;
  checkoutSessionId?: string;
  status: PendingClubSignupStatus;
  resultClubId?: string;
  failureReason?: string;
  createdAt: TimestampString;
  updatedAt: TimestampString;
};

export type TeamSyncAppData = {
  club: Club;
  currentUser: UserProfile;
  users: UserProfile[];
  teams: Team[];
  announcements: Announcement[];
  scheduleEvents: ScheduleEvent[];
  attendanceRecords: AttendanceRecord[];
  chatGroups: ChatGroup[];
  chatMessages: ChatMessage[];
  payments: Payment[];
  replays: Replay[];
  joinRequests: JoinRequest[];
};
