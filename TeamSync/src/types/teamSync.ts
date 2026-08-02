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

export type Club = {
  id: string;
  name: string;
  sport: string;
  city: string;
  code: string;
  ownerId: string;
  logoUrl?: string;
  primaryColor?: string;
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
  createdAt: TimestampString;
  updatedAt: TimestampString;
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
