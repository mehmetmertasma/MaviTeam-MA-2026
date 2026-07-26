# MaviTeam Firebase Launch Plan

MaviTeam now uses Firebase as the production data layer for the core launch workflows. This document tracks what is ready, what must be deployed, and what remains after MVP launch.

## Ready in Code

- Firebase bootstrap through Expo public environment variables in `src/lib/firebase.ts`
- Firebase Auth registration, login, logout, password reset, and session state
- Email verification code flow through Cloud Functions
- Firestore-backed club creation and join requests
- Firestore-backed workspace guard and profile loading
- Firestore-backed teams, announcements, schedule, attendance, messages, payments, member management, and replay links
- Firestore Security Rules for role and club isolation
- Storage Security Rules for profile images, club logos, replay videos, and attachments
- Firebase Hosting config for the Expo web export
- EAS build profiles for internal and production mobile builds

## Firebase Products

- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Cloud Functions
- Firebase Hosting
- Optional: Firebase Extensions or a custom worker to send mail records from the `mail` collection

## Collections

```text
clubs/{clubId}
clubCodes/{clubCode}
users/{userId}
teams/{teamId}
announcements/{announcementId}
scheduleEvents/{eventId}
attendanceRecords/{attendanceRecordId}
chatGroups/{groupId}
chatMessages/{messageId}
payments/{paymentId}
replays/{replayId}
joinRequests/{requestId}
emailVerificationCodes/{userId}
mail/{mailId}
```

Every club-owned document should include `clubId`. Security rules use `clubId`, user `role`, user `status`, and user `teamIds` to separate club data.

## Required Production Deployment

Run from the `TeamSync` directory after authenticating with Firebase:

```bash
npm run deploy:firebase
```

That deploys:

- Firestore rules
- Firestore indexes
- Storage rules
- Cloud Functions
- Firebase Hosting

If you want to deploy in smaller pieces:

```bash
npm run deploy:firebase:rules
npm run deploy:firebase:indexes
npm run deploy:firebase:functions
npm run deploy:firebase:hosting
```

## Email Verification

Firestore rules now require:

```text
request.auth.token.email_verified == true
```

The registration flow creates a Firebase Auth user, sends a verification code through Cloud Functions, opens `/verify-email`, and creates the Firestore user profile only after the code is verified.

Before launch, confirm:

- Cloud Functions are deployed to `us-central1`
- Firebase Auth is enabled for email/password sign-in
- A mail delivery system processes documents from the `mail` collection
- A new user can receive and verify the 6-digit code
- The verified Firebase Auth token refreshes before the user creates or joins a club

## Manual Launch QA

Use the production Firebase project and a clean browser/device:

1. Register a club admin.
2. Receive and verify the email code.
3. Create a club and confirm the club code is saved.
4. Register a second user.
5. Verify the second user's email code.
6. Join the club with the club code.
7. Approve the join request as the club admin.
8. Create a team and assign members.
9. Create schedule events, announcements, attendance records, payment records, chat messages, and replay links.
10. Confirm unauthorized users cannot read or write another club's data.

## Not Yet Implemented

- Push notifications
- Real payment processing
- Native crash reporting
- Automated Firestore rules tests
- App Store and Play Store listing assets
