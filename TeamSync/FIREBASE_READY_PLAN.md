# TeamSync Firebase Ready Plan

This app is moving away from page-by-page demo state and toward one shared data layer.

## Current foundation

The app now has:

- `src/types/teamSync.ts` for shared app data types
- `src/data/demoTeamSyncData.ts` for centralized demo data
- `src/services/teamSyncService.ts` for one service layer that pages can call

For now, the service uses AsyncStorage. Later, we replace the service internals with Firestore calls.

## Firebase products we will use

- Firebase Authentication for login/register
- Cloud Firestore for clubs, users, teams, announcements, schedule events, messages, payments, and join requests
- Firebase Storage later for club logos, profile photos, announcement files, and replay videos
- Push notifications later through Expo Notifications plus stored notification records in Firestore

## Firestore collections

Recommended first schema:

```text
clubs/{clubId}
users/{userId}
teams/{teamId}
announcements/{announcementId}
scheduleEvents/{eventId}
chatGroups/{groupId}
chatMessages/{messageId}
payments/{paymentId}
joinRequests/{requestId}
```

Each document should include `clubId` when it belongs to a club.

## Important rules

- Do not store passwords in Firestore or AsyncStorage.
- Passwords are handled only by Firebase Authentication.
- When an admin removes someone, do not delete their history. Set `users/{userId}.status = "removed"` and remove their team access.
- Announcements and schedule events should keep `createdAt` and `updatedAt`.
- Admin-only actions should be protected by Firestore Security Rules later.

## Migration order

1. Install Firebase package.
2. Create `src/lib/firebase.ts` with Firebase config.
3. Connect register/login to Firebase Auth.
4. Connect dashboard/profile to `users` and `clubs`.
5. Connect teams to `teams` and `users`.
6. Connect announcements to `announcements`.
7. Connect schedule to `scheduleEvents`.
8. Connect messages to `chatGroups` and `chatMessages`.
9. Add Security Rules.

## Install command

```powershell
npx expo install firebase
```

## Firebase config file template

After installing Firebase, create `src/lib/firebase.ts`:

```ts
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "PASTE_FROM_FIREBASE",
  authDomain: "PASTE_FROM_FIREBASE",
  projectId: "PASTE_FROM_FIREBASE",
  storageBucket: "PASTE_FROM_FIREBASE",
  messagingSenderId: "PASTE_FROM_FIREBASE",
  appId: "PASTE_FROM_FIREBASE",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```
