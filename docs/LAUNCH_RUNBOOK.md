# MaviTeam Launch Runbook

## Code Readiness

- Main branch contains the launch integration.
- App quality gate: `npm run quality`
- Production dependency audit: `npm run audit:prod`
- Web export: `npm run export:web`
- Functions audit: `cd TeamSync/functions && npm audit --omit=dev --audit-level=high`

The high-severity audit gates should pass. npm may still report moderate `uuid` advisories through Expo/Firebase transitive tooling packages; do not use force/downgrade fixes without retesting the Expo and Firebase release paths.

## Firebase Launch

1. Confirm `.firebaserc` points to the production Firebase project.
2. Confirm Firebase Auth email/password provider is enabled.
3. Confirm the project is on a plan that can deploy Cloud Functions.
4. Confirm email delivery is configured for documents written to the `mail` collection.
5. From `TeamSync`, run `npm run deploy:firebase`.
6. Register a new admin and verify the email code.
7. Create a club and confirm the Firestore documents are written.

## Web Launch

1. From `TeamSync`, run `npm run export:web`.
2. From `TeamSync`, run `npm run deploy:firebase:hosting`.
3. Open the Firebase Hosting URL.
4. Test register, verify email, create club, join club, dashboard, and sign out.

## Mobile Launch

1. Confirm `ios.bundleIdentifier` and `android.package` in `TeamSync/app.json`.
2. Link EAS with `npx --yes eas-cli init`.
3. Configure Apple and Google credentials in EAS.
4. Build with `npm run build:mobile:production`.
5. Test the builds on real devices.
6. Submit with `npm run submit:ios:production` and `npm run submit:android:production`.

## Store Assets

- App name
- Short description
- Full description
- Support email
- Privacy policy URL
- Terms URL
- App screenshots
- App icon and splash assets
- Data safety answers for Google Play
- App privacy answers for Apple App Store

## Known MVP Scope

- Payment tracking exists, but real payment collection is not connected.
- Replay links exist, but native video upload QA is still needed.
- Push notifications are planned, not implemented.
- Automated Firestore rules tests are not yet implemented.
