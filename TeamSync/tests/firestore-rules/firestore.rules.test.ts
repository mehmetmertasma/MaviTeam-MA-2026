import { readFileSync } from "fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, getDocs, deleteDoc, collection, query, where } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

// Covers the security model touched by the attendance-permissions fix
// (parents/athletes can now read their own team's attendance, coaches are
// still team-scoped, cross-club data stays isolated) plus the schedule
// events rule the quick-create-session feature relies on. Run with:
// `npm run test:rules` (spins up the Firestore emulator via
// `firebase emulators:exec`, so it never touches production).

let testEnv: RulesTestEnvironment;

const CLUB_A = "club-a";
const CLUB_B = "club-b";
const TEAM_A1 = "team-a1";
const TEAM_A2 = "team-a2";

const ADMIN_A = "admin-a";
const COACH_A = "coach-a";
const PARENT_A1 = "parent-a1"; // on team-a1
const ATHLETE_A1 = "athlete-a1"; // on team-a1
const PARENT_A2 = "parent-a2"; // on team-a2, same club, NOT on team-a1
const ADMIN_B = "admin-b"; // different club entirely

async function seedFixtures() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    // belongsToCurrentUsersClub (used by nearly every collection's rules)
    // now also checks the club's own document for a 'suspended' status, so
    // every club referenced by a fixture user needs to actually exist.
    await setDoc(doc(db, "clubs", CLUB_A), { id: CLUB_A, name: "Club A", ownerId: ADMIN_A });
    await setDoc(doc(db, "clubs", CLUB_B), { id: CLUB_B, name: "Club B", ownerId: ADMIN_B });

    const users: Record<string, Record<string, unknown>> = {
      [ADMIN_A]: { role: "clubAdmin", status: "active", clubId: CLUB_A, teamIds: [] },
      [COACH_A]: { role: "coach", status: "active", clubId: CLUB_A, teamIds: [TEAM_A1] },
      [PARENT_A1]: { role: "parent", status: "active", clubId: CLUB_A, teamIds: [TEAM_A1] },
      [ATHLETE_A1]: { role: "athlete", status: "active", clubId: CLUB_A, teamIds: [TEAM_A1] },
      [PARENT_A2]: { role: "parent", status: "active", clubId: CLUB_A, teamIds: [TEAM_A2] },
      [ADMIN_B]: { role: "clubAdmin", status: "active", clubId: CLUB_B, teamIds: [] },
    };

    for (const [uid, data] of Object.entries(users)) {
      await setDoc(doc(db, "users", uid), data);
    }

    await setDoc(doc(db, "attendanceRecords", "record-a1"), {
      clubId: CLUB_A,
      teamId: TEAM_A1,
      userId: ATHLETE_A1,
      status: "present",
      sessionDate: "2026-08-01T17:00:00.000Z",
      recordedByUserId: COACH_A,
      recordedAt: "2026-08-01T17:00:00.000Z",
    });

    await setDoc(doc(db, "attendanceRecords", "record-a2"), {
      clubId: CLUB_A,
      teamId: TEAM_A2,
      userId: PARENT_A2,
      status: "present",
      sessionDate: "2026-08-01T17:00:00.000Z",
      recordedByUserId: ADMIN_A,
      recordedAt: "2026-08-01T17:00:00.000Z",
    });

    await setDoc(doc(db, "announcements", "announcement-a1-team"), {
      clubId: CLUB_A,
      targetType: "team",
      targetTeamId: TEAM_A1,
      title: "U17 antrenman iptal",
      message: "Bugunku antrenman iptal edildi.",
      createdByUserId: COACH_A,
      createdAt: "2026-08-01T00:00:00.000Z",
    });

    await setDoc(doc(db, "announcements", "announcement-a-clubwide"), {
      clubId: CLUB_A,
      targetType: "allClub",
      title: "Kulup duyurusu",
      message: "Tum kulube duyuru.",
      createdByUserId: ADMIN_A,
      createdAt: "2026-08-01T00:00:00.000Z",
    });

    await setDoc(doc(db, "chatGroups", "chatgroup-a1-team"), {
      clubId: CLUB_A,
      teamId: TEAM_A1,
      name: "U17 Grubu",
      visibleUserIds: [COACH_A, PARENT_A1, ATHLETE_A1],
    });

    await setDoc(doc(db, "chatGroups", "chatgroup-a-clubwide"), {
      clubId: CLUB_A,
      name: "Kulup Grubu",
      visibleUserIds: [ADMIN_A, COACH_A, PARENT_A1, ATHLETE_A1, PARENT_A2],
    });

    await setDoc(doc(db, "replays", "replay-a1-team"), {
      clubId: CLUB_A,
      teamId: TEAM_A1,
      title: "Mac analizi",
      description: "Gecen haftaki mac analizi.",
      type: "match",
      videoUrl: "https://example.com/replay-a1",
      createdByUserId: COACH_A,
      visibleUserIds: [COACH_A, PARENT_A1, ATHLETE_A1],
      createdAt: "2026-08-01T00:00:00.000Z",
    });

    await setDoc(doc(db, "replays", "replay-a-clubwide"), {
      clubId: CLUB_A,
      title: "Kulup videosu",
      description: "Kulup geneli video.",
      type: "practice",
      videoUrl: "https://example.com/replay-clubwide",
      createdByUserId: ADMIN_A,
      visibleUserIds: [ADMIN_A, COACH_A, PARENT_A1, ATHLETE_A1, PARENT_A2],
      createdAt: "2026-08-01T00:00:00.000Z",
    });

    await setDoc(doc(db, "scheduleEvents", "event-a1-team"), {
      clubId: CLUB_A,
      teamId: TEAM_A1,
      title: "U17 Antrenmani",
      type: "practice",
      startsAt: "2026-08-01T17:00:00.000Z",
      location: "Kulup Salonu",
      createdByUserId: COACH_A,
      createdAt: "2026-08-01T00:00:00.000Z",
    });

    await setDoc(doc(db, "scheduleEvents", "event-a-clubwide"), {
      clubId: CLUB_A,
      title: "Kulup Toplantisi",
      type: "meeting",
      startsAt: "2026-08-05T17:00:00.000Z",
      location: "Kulup Salonu",
      createdByUserId: ADMIN_A,
      createdAt: "2026-08-01T00:00:00.000Z",
    });
  });
}

function authedFirestore(uid: string) {
  return testEnv.authenticatedContext(uid, { email_verified: true }).firestore();
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "maviteam-rules-test",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await seedFixtures();
});

describe("attendanceRecords", () => {
  it("clubAdmin can read any attendance record in their club", async () => {
    const db = authedFirestore(ADMIN_A);
    await assertSucceeds(getDoc(doc(db, "attendanceRecords", "record-a1")));
  });

  it("coach can read their own team's attendance record", async () => {
    const db = authedFirestore(COACH_A);
    await assertSucceeds(getDoc(doc(db, "attendanceRecords", "record-a1")));
  });

  it("parent on the team can read the team's attendance record (this session's fix)", async () => {
    const db = authedFirestore(PARENT_A1);
    await assertSucceeds(getDoc(doc(db, "attendanceRecords", "record-a1")));
  });

  it("athlete on the team can read the team's attendance record", async () => {
    const db = authedFirestore(ATHLETE_A1);
    await assertSucceeds(getDoc(doc(db, "attendanceRecords", "record-a1")));
  });

  it("a user can always read their own attendance record, even off-team", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "attendanceRecords", "record-self"), {
        clubId: CLUB_A,
        teamId: TEAM_A1,
        userId: PARENT_A2,
        status: "excused",
        sessionDate: "2026-08-01T17:00:00.000Z",
        recordedByUserId: COACH_A,
        recordedAt: "2026-08-01T17:00:00.000Z",
      });
    });

    const db = authedFirestore(PARENT_A2);
    await assertSucceeds(getDoc(doc(db, "attendanceRecords", "record-self")));
  });

  it("parent on a different team cannot read the record", async () => {
    const db = authedFirestore(PARENT_A2);
    await assertFails(getDoc(doc(db, "attendanceRecords", "record-a1")));
  });

  it("a clubAdmin from a different club cannot read the record", async () => {
    const db = authedFirestore(ADMIN_B);
    await assertFails(getDoc(doc(db, "attendanceRecords", "record-a1")));
  });

  it("parent cannot create or edit an attendance record", async () => {
    const db = authedFirestore(PARENT_A1);
    await assertFails(
      setDoc(doc(db, "attendanceRecords", "record-a1"), {
        clubId: CLUB_A,
        teamId: TEAM_A1,
        userId: ATHLETE_A1,
        status: "absent",
        sessionDate: "2026-08-01T17:00:00.000Z",
        recordedByUserId: PARENT_A1,
        recordedAt: "2026-08-01T18:00:00.000Z",
      })
    );
  });

  it("coach can create an attendance record for their own team", async () => {
    const db = authedFirestore(COACH_A);
    await assertSucceeds(
      setDoc(doc(db, "attendanceRecords", "record-new"), {
        clubId: CLUB_A,
        teamId: TEAM_A1,
        userId: ATHLETE_A1,
        status: "late",
        sessionDate: "2026-08-02T17:00:00.000Z",
        recordedByUserId: COACH_A,
        recordedAt: "2026-08-02T17:00:00.000Z",
      })
    );
  });

  it("coach cannot create an attendance record for a team they don't coach", async () => {
    const db = authedFirestore(COACH_A);
    await assertFails(
      setDoc(doc(db, "attendanceRecords", "record-other-team"), {
        clubId: CLUB_A,
        teamId: TEAM_A2,
        userId: PARENT_A2,
        status: "present",
        sessionDate: "2026-08-02T17:00:00.000Z",
        recordedByUserId: COACH_A,
        recordedAt: "2026-08-02T17:00:00.000Z",
      })
    );
  });

  it("coach can delete an attendance record for their own team", async () => {
    const db = authedFirestore(COACH_A);
    await assertSucceeds(deleteDoc(doc(db, "attendanceRecords", "record-a1")));
  });

  it("coach cannot delete an attendance record for a team they don't coach", async () => {
    const db = authedFirestore(COACH_A);
    await assertFails(deleteDoc(doc(db, "attendanceRecords", "record-a2")));
  });

  it("clubAdmin can delete any attendance record in their club", async () => {
    const db = authedFirestore(ADMIN_A);
    await assertSucceeds(deleteDoc(doc(db, "attendanceRecords", "record-a2")));
  });

  it("parent cannot delete an attendance record", async () => {
    const db = authedFirestore(PARENT_A1);
    await assertFails(deleteDoc(doc(db, "attendanceRecords", "record-a1")));
  });
});

describe("scheduleEvents", () => {
  it("any club member can read a club-wide event", async () => {
    const db = authedFirestore(PARENT_A2);
    await assertSucceeds(getDoc(doc(db, "scheduleEvents", "event-a-clubwide")));
  });

  it("a member off the team cannot read a team-scoped event", async () => {
    const db = authedFirestore(PARENT_A2);
    await assertFails(getDoc(doc(db, "scheduleEvents", "event-a1-team")));
  });

  it("coach can create a schedule event (quick-create-session) for their own team", async () => {
    const db = authedFirestore(COACH_A);
    await assertSucceeds(
      setDoc(doc(db, "scheduleEvents", "event-quick-create"), {
        clubId: CLUB_A,
        teamId: TEAM_A1,
        title: "U17 Cumartesi Antrenmani",
        type: "practice",
        startsAt: "2026-08-08T17:00:00.000Z",
        location: "Kapali Spor Salonu",
        createdByUserId: COACH_A,
        createdAt: "2026-08-08T00:00:00.000Z",
      })
    );
  });

  it("parent cannot create a schedule event", async () => {
    const db = authedFirestore(PARENT_A1);
    await assertFails(
      setDoc(doc(db, "scheduleEvents", "event-parent-attempt"), {
        clubId: CLUB_A,
        teamId: TEAM_A1,
        title: "Should not be allowed",
        type: "practice",
        startsAt: "2026-08-08T17:00:00.000Z",
        location: "Kapali Spor Salonu",
        createdByUserId: PARENT_A1,
        createdAt: "2026-08-08T00:00:00.000Z",
      })
    );
  });

  it("coach can delete a schedule event for their own team", async () => {
    const db = authedFirestore(COACH_A);
    await assertSucceeds(deleteDoc(doc(db, "scheduleEvents", "event-a1-team")));
  });

  it("coach cannot delete a schedule event for a team they don't coach", async () => {
    const db = authedFirestore(COACH_A);
    await assertFails(deleteDoc(doc(db, "scheduleEvents", "event-a-clubwide")));
  });

  it("clubAdmin can delete any schedule event in their club", async () => {
    const db = authedFirestore(ADMIN_A);
    await assertSucceeds(deleteDoc(doc(db, "scheduleEvents", "event-a-clubwide")));
  });

  it("parent cannot delete a schedule event", async () => {
    const db = authedFirestore(PARENT_A1);
    await assertFails(deleteDoc(doc(db, "scheduleEvents", "event-a1-team")));
  });
});

describe("announcements", () => {
  it("coach can delete an announcement targeted at their own team", async () => {
    const db = authedFirestore(COACH_A);
    await assertSucceeds(deleteDoc(doc(db, "announcements", "announcement-a1-team")));
  });

  it("coach cannot delete a club-wide announcement", async () => {
    const db = authedFirestore(COACH_A);
    await assertFails(deleteDoc(doc(db, "announcements", "announcement-a-clubwide")));
  });

  it("clubAdmin can delete any announcement in their club", async () => {
    const db = authedFirestore(ADMIN_A);
    await assertSucceeds(deleteDoc(doc(db, "announcements", "announcement-a-clubwide")));
  });

  it("parent cannot delete an announcement", async () => {
    const db = authedFirestore(PARENT_A1);
    await assertFails(deleteDoc(doc(db, "announcements", "announcement-a1-team")));
  });

  it("athlete cannot delete an announcement", async () => {
    const db = authedFirestore(ATHLETE_A1);
    await assertFails(deleteDoc(doc(db, "announcements", "announcement-a1-team")));
  });
});

describe("chatGroups", () => {
  it("coach can delete a chat group for their own team", async () => {
    const db = authedFirestore(COACH_A);
    await assertSucceeds(deleteDoc(doc(db, "chatGroups", "chatgroup-a1-team")));
  });

  it("coach cannot delete a club-wide chat group", async () => {
    const db = authedFirestore(COACH_A);
    await assertFails(deleteDoc(doc(db, "chatGroups", "chatgroup-a-clubwide")));
  });

  it("clubAdmin can delete any chat group in their club", async () => {
    const db = authedFirestore(ADMIN_A);
    await assertSucceeds(deleteDoc(doc(db, "chatGroups", "chatgroup-a-clubwide")));
  });

  it("parent cannot delete a chat group", async () => {
    const db = authedFirestore(PARENT_A1);
    await assertFails(deleteDoc(doc(db, "chatGroups", "chatgroup-a1-team")));
  });

  // Regression coverage for a real production bug: the rule worked fine for
  // a single get() but denied the WHOLE list query when its allow-read
  // condition mixed a get()-dependent branch (admin/team) with a plain
  // resource.data array-membership check (visibleUserIds) in one boolean --
  // see the split allow-read statements on the chatGroups match block.
  it("a member can list (not just get) chat groups where their uid is in visibleUserIds", async () => {
    const db = authedFirestore(ATHLETE_A1);
    await assertSucceeds(
      getDocs(query(collection(db, "chatGroups"), where("clubId", "==", CLUB_A), where("visibleUserIds", "array-contains", ATHLETE_A1)))
    );
  });

  it("a member's visibleUserIds list query only returns groups they're actually in", async () => {
    const db = authedFirestore(PARENT_A2);
    const results = await getDocs(
      query(collection(db, "chatGroups"), where("clubId", "==", CLUB_A), where("visibleUserIds", "array-contains", PARENT_A2))
    );
    // PARENT_A2 is only listed in the club-wide group's visibleUserIds, not
    // the team-scoped one -- confirms per-document filtering still works
    // correctly with the split rule, not just that the request succeeds.
    if (results.docs.length !== 1 || results.docs[0].id !== "chatgroup-a-clubwide") {
      throw new Error(`Expected exactly chatgroup-a-clubwide, got: ${results.docs.map((d) => d.id).join(", ")}`);
    }
  });

  it("clubAdmin can list every chat group in their club (no visibleUserIds filter)", async () => {
    const db = authedFirestore(ADMIN_A);
    await assertSucceeds(getDocs(query(collection(db, "chatGroups"), where("clubId", "==", CLUB_A))));
  });
});

describe("replays", () => {
  it("coach can delete a replay for their own team", async () => {
    const db = authedFirestore(COACH_A);
    await assertSucceeds(deleteDoc(doc(db, "replays", "replay-a1-team")));
  });

  it("coach cannot delete a club-wide replay", async () => {
    const db = authedFirestore(COACH_A);
    await assertFails(deleteDoc(doc(db, "replays", "replay-a-clubwide")));
  });

  it("clubAdmin can delete any replay in their club", async () => {
    const db = authedFirestore(ADMIN_A);
    await assertSucceeds(deleteDoc(doc(db, "replays", "replay-a-clubwide")));
  });

  it("athlete cannot delete a replay", async () => {
    const db = authedFirestore(ATHLETE_A1);
    await assertFails(deleteDoc(doc(db, "replays", "replay-a1-team")));
  });

  // Same regression class as the chatGroups list-query tests above.
  it("a member can list (not just get) replays where their uid is in visibleUserIds", async () => {
    const db = authedFirestore(ATHLETE_A1);
    await assertSucceeds(
      getDocs(query(collection(db, "replays"), where("clubId", "==", CLUB_A), where("visibleUserIds", "array-contains", ATHLETE_A1)))
    );
  });

  it("clubAdmin can list every replay in their club (no visibleUserIds filter)", async () => {
    const db = authedFirestore(ADMIN_A);
    await assertSucceeds(getDocs(query(collection(db, "replays"), where("clubId", "==", CLUB_A))));
  });
});

describe("chatMessages", () => {
  const GROUP_MESSAGE_FIXTURE = {
    clubId: CLUB_A,
    groupId: "chatgroup-a1-team",
    senderUserId: COACH_A,
    text: "Practice moved to 6pm",
    createdAt: "2026-08-01T00:00:00.000Z",
    visibleUserIds: [COACH_A, PARENT_A1, ATHLETE_A1],
  };

  const DIRECT_MESSAGE_FIXTURE = {
    clubId: CLUB_A,
    senderUserId: PARENT_A1,
    text: "Hi coach",
    createdAt: "2026-08-01T00:00:00.000Z",
    directUserIds: [PARENT_A1, COACH_A],
  };

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "chatMessages", "message-group"), GROUP_MESSAGE_FIXTURE);
      await setDoc(doc(db, "chatMessages", "message-direct"), DIRECT_MESSAGE_FIXTURE);
    });
  });

  // Regression coverage: this exact query shape (clubId + visibleUserIds
  // array-contains) is what firestoreMaviTeamDataService.
  // listVisibleChatMessagesForCurrentUser now uses instead of a
  // groupId-based lookup, specifically because a get() into a different
  // document (the chatGroups doc) keyed off a field of the message being
  // evaluated could never be proven safe for a list query.
  it("a group member can list messages via visibleUserIds", async () => {
    const db = authedFirestore(ATHLETE_A1);
    await assertSucceeds(
      getDocs(query(collection(db, "chatMessages"), where("clubId", "==", CLUB_A), where("visibleUserIds", "array-contains", ATHLETE_A1)))
    );
  });

  it("a non-member's visibleUserIds list query returns nothing for that group", async () => {
    const db = authedFirestore(PARENT_A2);
    const results = await getDocs(
      query(collection(db, "chatMessages"), where("clubId", "==", CLUB_A), where("visibleUserIds", "array-contains", PARENT_A2))
    );

    if (results.docs.length !== 0) {
      throw new Error(`Expected no visible messages for PARENT_A2, got: ${results.docs.map((d) => d.id).join(", ")}`);
    }
  });

  it("a participant can list their direct messages", async () => {
    const db = authedFirestore(PARENT_A1);
    await assertSucceeds(
      getDocs(query(collection(db, "chatMessages"), where("clubId", "==", CLUB_A), where("directUserIds", "array-contains", PARENT_A1)))
    );
  });

  it("clubAdmin can list every message in their club (no filter beyond clubId)", async () => {
    const db = authedFirestore(ADMIN_A);
    await assertSucceeds(getDocs(query(collection(db, "chatMessages"), where("clubId", "==", CLUB_A))));
  });
});

describe("payments", () => {
  const MANUAL_PAYMENT_FIXTURE = {
    clubId: CLUB_A,
    userId: ATHLETE_A1,
    title: "Aylık aidat",
    amountCents: 30000,
    status: "unpaid",
    dueAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
  };

  const ONLINE_PAYMENT_FIXTURE = {
    ...MANUAL_PAYMENT_FIXTURE,
    paymentMethod: "online",
  };

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "payments", "payment-manual"), MANUAL_PAYMENT_FIXTURE);
      await setDoc(doc(db, "payments", "payment-online"), ONLINE_PAYMENT_FIXTURE);
    });
  });

  it("clubAdmin can create a valid manual payment", async () => {
    const db = authedFirestore(ADMIN_A);
    await assertSucceeds(
      setDoc(doc(db, "payments", "payment-new"), {
        clubId: CLUB_A,
        userId: ATHLETE_A1,
        title: "Turnuva ücreti",
        amountCents: 15000,
        status: "unpaid",
        dueAt: "2026-09-10T00:00:00.000Z",
        updatedAt: "2026-08-01T00:00:00.000Z",
      })
    );
  });

  it("clubAdmin cannot create a payment that starts as already paid", async () => {
    const db = authedFirestore(ADMIN_A);
    await assertFails(
      setDoc(doc(db, "payments", "payment-fake-paid"), {
        ...MANUAL_PAYMENT_FIXTURE,
        status: "paid",
      })
    );
  });

  it("clubAdmin cannot create a payment with a zero/negative amount", async () => {
    const db = authedFirestore(ADMIN_A);
    await assertFails(
      setDoc(doc(db, "payments", "payment-zero"), {
        ...MANUAL_PAYMENT_FIXTURE,
        amountCents: 0,
      })
    );
  });

  it("clubAdmin cannot directly create an online-method payment", async () => {
    const db = authedFirestore(ADMIN_A);
    await assertFails(
      setDoc(doc(db, "payments", "payment-fake-online"), {
        ...MANUAL_PAYMENT_FIXTURE,
        paymentMethod: "online",
      })
    );
  });

  it("parent/athlete cannot create a payment", async () => {
    const db = authedFirestore(PARENT_A1);
    await assertFails(
      setDoc(doc(db, "payments", "payment-parent-attempt"), MANUAL_PAYMENT_FIXTURE)
    );
  });

  it("clubAdmin can mark a manual payment as paid", async () => {
    const db = authedFirestore(ADMIN_A);
    await assertSucceeds(
      setDoc(doc(db, "payments", "payment-manual"), { ...MANUAL_PAYMENT_FIXTURE, status: "paid" })
    );
  });

  it("clubAdmin cannot flip an online-method payment's status by hand", async () => {
    const db = authedFirestore(ADMIN_A);
    await assertFails(
      setDoc(doc(db, "payments", "payment-online"), { ...ONLINE_PAYMENT_FIXTURE, status: "paid" })
    );
  });

  it("clubAdmin can still edit an online-method payment as long as status is unchanged", async () => {
    const db = authedFirestore(ADMIN_A);
    await assertSucceeds(
      setDoc(doc(db, "payments", "payment-online"), { ...ONLINE_PAYMENT_FIXTURE, title: "Güncellenmiş başlık" })
    );
  });

  it("a member can read their own payment", async () => {
    const db = authedFirestore(ATHLETE_A1);
    await assertSucceeds(getDoc(doc(db, "payments", "payment-manual")));
  });

  it("a member cannot read someone else's payment", async () => {
    const db = authedFirestore(PARENT_A2);
    await assertFails(getDoc(doc(db, "payments", "payment-manual")));
  });

  it("clubAdmin can delete a payment", async () => {
    const db = authedFirestore(ADMIN_A);
    await assertSucceeds(deleteDoc(doc(db, "payments", "payment-manual")));
  });

  it("parent/athlete cannot delete a payment", async () => {
    const db = authedFirestore(ATHLETE_A1);
    await assertFails(deleteDoc(doc(db, "payments", "payment-manual")));
  });
});

describe("clubs.paymentAccount", () => {
  it("clubAdmin cannot create a club with paymentAccount already set", async () => {
    const db = authedFirestore(ADMIN_A);
    await assertFails(
      setDoc(doc(db, "clubs", "club-new"), {
        id: "club-new",
        name: "New Club",
        ownerId: ADMIN_A,
        paymentAccount: { provider: "stripe", status: "connected" },
      })
    );
  });

  it("clubAdmin cannot set paymentAccount.status to connected directly on an existing club", async () => {
    const db = authedFirestore(ADMIN_A);
    await assertFails(
      setDoc(
        doc(db, "clubs", CLUB_A),
        { paymentAccount: { provider: "stripe", status: "connected" } },
        { merge: true }
      )
    );
  });

  it("clubAdmin can still update other club fields when paymentAccount is left untouched", async () => {
    const db = authedFirestore(ADMIN_A);
    await assertSucceeds(setDoc(doc(db, "clubs", CLUB_A), { name: "Renamed Club A" }, { merge: true }));
  });
});

describe("clubs.create (must go through startClubSignup, never direct)", () => {
  it("no client, not even a verified signed-in user, can create a club document directly", async () => {
    const db = authedFirestore(ADMIN_A);
    await assertFails(
      setDoc(doc(db, "clubs", "club-new"), {
        id: "club-new",
        name: "New Club",
        ownerId: ADMIN_A,
      })
    );
  });
});

describe("clubs.subscription", () => {
  it("clubAdmin cannot hand-write subscription.status to active", async () => {
    const db = authedFirestore(ADMIN_A);
    await assertFails(
      setDoc(doc(db, "clubs", CLUB_A), { subscription: { status: "active", provider: "none" } }, { merge: true })
    );
  });

  it("clubAdmin can still update other club fields when subscription is left untouched", async () => {
    const db = authedFirestore(ADMIN_A);
    await assertSucceeds(setDoc(doc(db, "clubs", CLUB_A), { city: "Ankara" }, { merge: true }));
  });
});

describe("promoCodes", () => {
  const PROMO_CODE = "FREE6MONTHS";

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "promoCodes", PROMO_CODE), {
        code: PROMO_CODE,
        grantMonths: 6,
        status: "unredeemed",
        createdByUid: "platform-admin",
        createdAt: "2026-09-01T00:00:00.000Z",
      });
    });
  });

  it("no client can read a promo code directly", async () => {
    const db = authedFirestore(ADMIN_A);
    await assertFails(getDoc(doc(db, "promoCodes", PROMO_CODE)));
  });

  it("no client can redeem (write) a promo code directly", async () => {
    const db = authedFirestore(ADMIN_A);
    await assertFails(
      setDoc(doc(db, "promoCodes", PROMO_CODE), { status: "redeemed" }, { merge: true })
    );
  });
});

describe("pendingClubSignups", () => {
  const SIGNUP_ID = "signup-1";

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "pendingClubSignups", SIGNUP_ID), {
        id: SIGNUP_ID,
        createdByUid: ADMIN_A,
        draft: { name: "New Club", sport: "Soccer", city: "Istanbul", country: "TR" },
        provider: "iyzico",
        status: "pending",
        createdAt: "2026-09-01T00:00:00.000Z",
        updatedAt: "2026-09-01T00:00:00.000Z",
      });
    });
  });

  it("the creator can read their own pending signup", async () => {
    const db = authedFirestore(ADMIN_A);
    await assertSucceeds(getDoc(doc(db, "pendingClubSignups", SIGNUP_ID)));
  });

  it("another user cannot read someone else's pending signup", async () => {
    const db = authedFirestore(ADMIN_B);
    await assertFails(getDoc(doc(db, "pendingClubSignups", SIGNUP_ID)));
  });

  it("no client, not even the creator, can write resultClubId directly", async () => {
    const db = authedFirestore(ADMIN_A);
    await assertFails(
      setDoc(
        doc(db, "pendingClubSignups", SIGNUP_ID),
        { status: "completed", resultClubId: CLUB_A },
        { merge: true }
      )
    );
  });
});

describe("users.billingDetails", () => {
  const BILLING_DETAILS_FIXTURE = {
    nationalId: "11111111111",
    phone: "+905551112233",
    address: "Test Address",
    city: "Istanbul",
  };

  it("a user can write their own billingDetails", async () => {
    const db = authedFirestore(ATHLETE_A1);
    await assertSucceeds(
      setDoc(doc(db, "users", ATHLETE_A1), { billingDetails: BILLING_DETAILS_FIXTURE }, { merge: true })
    );
  });

  it("a user cannot write another user's billingDetails", async () => {
    const db = authedFirestore(PARENT_A1);
    await assertFails(
      setDoc(doc(db, "users", ATHLETE_A1), { billingDetails: BILLING_DETAILS_FIXTURE }, { merge: true })
    );
  });
});

describe("attendanceSummaries", () => {
  const SUMMARY_FIXTURE = {
    userId: ATHLETE_A1,
    clubId: CLUB_A,
    years: { "2026": { present: 10, absent: 2, late: 1, excused: 0, total: 13 } },
    updatedAt: "2026-08-01T00:00:00.000Z",
  };

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "attendanceSummaries", ATHLETE_A1), SUMMARY_FIXTURE);
    });
  });

  it("a user can read their own attendance summary", async () => {
    const db = authedFirestore(ATHLETE_A1);
    await assertSucceeds(getDoc(doc(db, "attendanceSummaries", ATHLETE_A1)));
  });

  it("clubAdmin can read any summary in their club", async () => {
    const db = authedFirestore(ADMIN_A);
    await assertSucceeds(getDoc(doc(db, "attendanceSummaries", ATHLETE_A1)));
  });

  it("another club member cannot read someone else's summary", async () => {
    const db = authedFirestore(PARENT_A2);
    await assertFails(getDoc(doc(db, "attendanceSummaries", ATHLETE_A1)));
  });

  it("a clubAdmin from a different club cannot read the summary", async () => {
    const db = authedFirestore(ADMIN_B);
    await assertFails(getDoc(doc(db, "attendanceSummaries", ATHLETE_A1)));
  });

  it("no client, not even the record's own owner, can write a summary directly", async () => {
    const db = authedFirestore(ATHLETE_A1);
    await assertFails(
      setDoc(doc(db, "attendanceSummaries", ATHLETE_A1), {
        ...SUMMARY_FIXTURE,
        years: { "2026": { present: 999, absent: 0, late: 0, excused: 0, total: 999 } },
      })
    );
  });
});

describe("club suspension", () => {
  async function suspendClubA() {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "clubs", CLUB_A), { status: "suspended" }, { merge: true });
    });
  }

  it("an active club (no status field) behaves normally -- baseline sanity check", async () => {
    const db = authedFirestore(COACH_A);
    await assertSucceeds(getDoc(doc(db, "attendanceRecords", "record-a1")));
  });

  it("clubAdmin loses access to their own club's data once suspended", async () => {
    await suspendClubA();
    const db = authedFirestore(ADMIN_A);
    await assertFails(getDoc(doc(db, "attendanceRecords", "record-a1")));
  });

  it("coach loses access to their own team's data once suspended", async () => {
    await suspendClubA();
    const db = authedFirestore(COACH_A);
    await assertFails(getDoc(doc(db, "attendanceRecords", "record-a1")));
  });

  it("parent/athlete lose access to their own club's data once suspended", async () => {
    await suspendClubA();
    const db = authedFirestore(ATHLETE_A1);
    await assertFails(getDoc(doc(db, "attendanceRecords", "record-a1")));
    await assertFails(getDoc(doc(db, "scheduleEvents", "event-a-clubwide")));
  });

  it("a suspended club's own document is still readable by its owner", async () => {
    await suspendClubA();
    const db = authedFirestore(ADMIN_A);
    await assertSucceeds(getDoc(doc(db, "clubs", CLUB_A)));
  });

  it("a suspended club's document is still readable by any of its active members (not just the owner) -- needed so every role lands on a friendly renew screen instead of a permission error", async () => {
    await suspendClubA();
    const db = authedFirestore(COACH_A);
    await assertSucceeds(getDoc(doc(db, "clubs", CLUB_A)));
  });

  it("a suspended club's document is NOT readable by someone from a different club", async () => {
    await suspendClubA();
    const db = authedFirestore(ADMIN_B);
    await assertFails(getDoc(doc(db, "clubs", CLUB_A)));
  });

  it("an unrelated club (club-b) is unaffected by club-a being suspended", async () => {
    await suspendClubA();

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "attendanceRecords", "record-b1"), {
        clubId: CLUB_B,
        userId: ADMIN_B,
        status: "present",
        sessionDate: "2026-08-01T17:00:00.000Z",
        recordedByUserId: ADMIN_B,
        recordedAt: "2026-08-01T17:00:00.000Z",
      });
    });

    const db = authedFirestore(ADMIN_B);
    await assertSucceeds(getDoc(doc(db, "attendanceRecords", "record-b1")));
  });
});

describe("cross-club isolation", () => {
  it("a user cannot read another club's user profiles via a list query", async () => {
    const db = authedFirestore(ADMIN_B);
    await assertFails(getDocs(query(collection(db, "users"), where("clubId", "==", CLUB_A))));
  });

  it("a user cannot read another club's attendance via a list query", async () => {
    const db = authedFirestore(ADMIN_B);
    await assertFails(
      getDocs(query(collection(db, "attendanceRecords"), where("clubId", "==", CLUB_A)))
    );
  });
});
