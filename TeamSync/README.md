# MaviTeam

MaviTeam is an Expo, React Native, and Firebase app for sports club operations. It supports club setup, member approval, teams, announcements, schedule, attendance, availability, messages, payment tracking, replay links, and profile management across web, iOS, and Android.

## Stack

- Expo Router and React Native
- TypeScript
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Cloud Functions for email verification codes
- Firebase Hosting for the exported web app
- EAS Build for iOS and Android release builds

## Local Setup

Install app dependencies:

```bash
npm install
```

Copy the environment template:

```bash
cp .env.example .env
```

Fill `.env` with the Firebase web app values from the production Firebase project:

```text
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

Start the app:

```bash
npm run web
```

## Quality Gates

Run these before merging or deploying:

```bash
npm run quality
npm run audit:prod
npm run export:web
```

Cloud Functions checks:

```bash
cd functions
npm ci
npm audit --omit=dev --audit-level=high
npm run lint
```

The high-severity audit gate is expected to pass. npm may still report moderate `uuid` advisories through Expo/Firebase transitive tooling packages; npm currently recommends force paths that would downgrade or otherwise break the supported Expo/Firebase stack.

## Firebase Deployment

The repo is configured for the Firebase project in `.firebaserc`.

Deploy rules, indexes, functions, and hosting:

```bash
npm run deploy:firebase
```

Deploy only Firestore and Storage rules:

```bash
npm run deploy:firebase:rules
```

Deploy only web hosting:

```bash
npm run deploy:firebase:hosting
```

Email verification depends on the `requestEmailVerificationCode` and `verifyEmailCode` Cloud Functions. The functions write email records into the `mail` collection, so the Firebase project must have an email delivery extension or equivalent mail processor connected to that collection.

## Mobile Release

The app is configured with these release identifiers:

- iOS bundle identifier: `com.maviteam.app`
- Android package: `com.maviteam.app`

Initialize/link the EAS project with the Expo account:

```bash
npm exec --yes --ignore-scripts --package eas-cli -- eas init
```

Build production apps:

```bash
npm run build:mobile:production
```

Submit production apps:

```bash
npm run submit:android:production
npm run submit:ios:production
```

## Launch QA

Before public release, test with real Firebase accounts:

1. Register a new club admin.
2. Verify the email code.
3. Create a club.
4. Register a second user and verify the email code.
5. Join the club with the club code.
6. Approve and reject join requests.
7. Create and edit teams.
8. Create schedule events, announcements, attendance, messages, payment records, and replay links.
9. Confirm role-based visibility for admin, coach, athlete, and parent users.
10. Confirm Storage uploads only work for verified users with the right club role.

## Notes

- Real `.env` files are ignored and must not be committed.
- Firestore rules require Firebase Auth `email_verified == true`.
- Payment tracking is implemented, but real payment processing is not.
- Push notifications are not implemented yet.
