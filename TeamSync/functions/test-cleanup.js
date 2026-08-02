// Smoke test for runAttendanceCleanup against the Firestore emulator.
// Requires the emulator running locally first:
//   firebase emulators:start --only firestore --project cleanup-test
// Then: node test-cleanup.js

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || "cleanup-test";

const admin = require("firebase-admin");
const { runAttendanceCleanup } = require("./index.js");

const checks = [];

function check(label, passed) {
  checks.push([label, passed]);
  console.log(`${passed ? "PASS" : "FAIL"}: ${label}`);
}

async function main() {
  const db = admin.firestore();

  // Clear any state from a previous run of this script.
  const existing = await db.collection("attendanceRecords").get();
  await Promise.all(existing.docs.map((doc) => doc.ref.delete()));
  await db.doc("attendanceSummaries/user-1").delete().catch(() => {});
  await db.doc("attendanceSummaries/user-2").delete().catch(() => {});

  const oldIso = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(); // 20 days ago -> should be cleaned
  const recentIso = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days ago -> should stay
  const oldYear = new Date(oldIso).getFullYear();

  await db.doc("attendanceRecords/old-1").set({
    clubId: "club-a", teamId: "team-a", userId: "user-1", status: "present",
    sessionDate: oldIso, recordedByUserId: "coach-1", recordedAt: oldIso,
  });
  await db.doc("attendanceRecords/old-2").set({
    clubId: "club-a", teamId: "team-a", userId: "user-1", status: "absent",
    sessionDate: oldIso, recordedByUserId: "coach-1", recordedAt: oldIso,
  });
  await db.doc("attendanceRecords/old-3").set({
    clubId: "club-a", teamId: "team-a", userId: "user-2", status: "late",
    sessionDate: oldIso, recordedByUserId: "coach-1", recordedAt: oldIso,
  });
  await db.doc("attendanceRecords/recent-1").set({
    clubId: "club-a", teamId: "team-a", userId: "user-1", status: "present",
    sessionDate: recentIso, recordedByUserId: "coach-1", recordedAt: recentIso,
  });

  const firstRun = await runAttendanceCleanup(db);
  console.log("first run result:", firstRun);

  const remaining = await db.collection("attendanceRecords").get();
  const user1Summary = (await db.doc("attendanceSummaries/user-1").get()).data();
  const user2Summary = (await db.doc("attendanceSummaries/user-2").get()).data();
  const user1Year = user1Summary?.years?.[oldYear];
  const user2Year = user2Summary?.years?.[oldYear];

  check("deletedCount === 3", firstRun.deletedCount === 3);
  check("summarizedUserCount === 2", firstRun.summarizedUserCount === 2);
  check("recent-1 survived", remaining.docs.some((d) => d.id === "recent-1"));
  check("old-1/2/3 gone", !remaining.docs.some((d) => ["old-1", "old-2", "old-3"].includes(d.id)));
  check("user-1 present=1", user1Year?.present === 1);
  check("user-1 absent=1", user1Year?.absent === 1);
  check("user-1 total=2", user1Year?.total === 2);
  check("user-2 late=1", user2Year?.late === 1);
  check("user-2 total=1", user2Year?.total === 1);

  const secondRunNoOp = await runAttendanceCleanup(db);
  check("re-running with nothing new to clean deletes 0", secondRunNoOp.deletedCount === 0);

  // A later day's old record for the same user/year should ADD to the
  // existing summary (increment), not overwrite it.
  await db.doc("attendanceRecords/old-4").set({
    clubId: "club-a", teamId: "team-a", userId: "user-1", status: "present",
    sessionDate: oldIso, recordedByUserId: "coach-1", recordedAt: oldIso,
  });
  await runAttendanceCleanup(db);

  const user1YearAfterAccumulation = (await db.doc("attendanceSummaries/user-1").get()).data()?.years?.[oldYear];
  check("accumulates across runs: present=2", user1YearAfterAccumulation?.present === 2);
  check("accumulates across runs: total=3", user1YearAfterAccumulation?.total === 3);
  check("accumulates across runs: absent untouched=1", user1YearAfterAccumulation?.absent === 1);

  const allPassed = checks.every(([, passed]) => passed);
  console.log(allPassed ? "\nALL CHECKS PASSED" : "\nSOME CHECKS FAILED");
  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
