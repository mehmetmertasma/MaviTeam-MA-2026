# TeamSync Firebase Ready Plan

TeamSync is moving from a local AsyncStorage prototype to a real multi-user Firebase app.

## Current foundation

The app already has:

- `src/types/teamSync.ts` for shared data types
- `src/data/initialTeamSyncData.ts` for the initial local workspace shape
- `src/services/teamSyncService.ts` for the current local service layer
- `src/lib/firebase.ts` for Firebase bootstrap using Expo public environment variables

For now, screens still use the local service. The next phase is to move service internals to Firebase one feature at a time.

## Firebase products we will use

- Firebase Authentication for sign up, login, logout, password reset, and user sessions
- Cloud Firestore for clubs, users, teams, announcements, schedule events, attendance, availability, messages, payments, replays, and join requests
- Firebase Storage for club logos, profile photos, documents, and replay videos
- Expo Notifications for push notifications, backed by notification records in Firestore

## Recommended Firestore collections

```text
clubs/{clubId}
users/{userId}
teams/{teamId}
announcements/{announcementId}
scheduleEvents/{eventId}
attendanceRecords/{attendanceRecordId}
availabilityResponses/{availabilityResponseId}
chatGroups/{groupId}
chatMessages/{messageId}
payments/{paymentId}
replays/{replayId}
joinRequests/{requestId}
subscriptions/{subscriptionId}
```

Every club-owned document should include `clubId` so security rules can separate clubs.

## Important production rules

- Do not store passwords in Firestore or AsyncStorage.
- Passwords are handled only by Firebase Authentication.
- Store Firebase config values in `.env`, not directly inside source files.
- Do not commit real `.env` files.
- When an admin removes someone, do not delete their history. Set `users/{userId}.status = "removed"` and remove their team access.
- Admin-only actions must be protected by Firestore Security Rules, not only by hidden UI buttons.
- Every write should include `createdAt`, `updatedAt`, and `createdByUserId` when useful.

## Migration order

1. Add Firebase bootstrap and environment config.
2. Create Auth service for register, login, logout, and current session.
3. Connect create-club flow to Firebase Auth and Firestore.
4. Connect join-club flow to Firebase Auth and join requests.
5. Connect dashboard/profile to real user and club documents.
6. Connect teams and member approval.
7. Connect announcements.
8. Connect schedule and attendance.
9. Connect messages.
10. Connect payments.
11. Add Firebase Storage for logos and replay files.
12. Add Firestore Security Rules.
13. Add notifications.

## Local setup

Create a `.env` file in the `TeamSync` folder and add the Firebase web app config values from Firebase Console.

```text
EXPO_PUBLIC_FIREBASE_API_KEY=your_value_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_value_here
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_value_here
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_value_here
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_value_here
EXPO_PUBLIC_FIREBASE_APP_ID=your_value_here
```

Then restart Expo after changing environment values.

```powershell
npm run web
```
