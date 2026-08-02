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
