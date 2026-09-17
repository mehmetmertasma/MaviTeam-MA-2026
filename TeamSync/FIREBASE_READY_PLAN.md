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
- Resend for verification email delivery through the `RESEND_API_KEY` Firebase Secret

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
promoCodes/{code}
pendingClubSignups/{signupId}
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
- The `RESEND_API_KEY` Firebase Secret is set
- Resend has verified `maviteam.com` for `MaviTeam <no-reply@maviteam.com>`
- A new user can receive and verify the 6-digit code
- The verified Firebase Auth token refreshes before the user creates or joins a club

## Online Dues Payments (Stripe + iyzico)

Club admins can connect a payment account (Stripe for US clubs, iyzico for
TR clubs) so members can pay dues online instead of only by manual ledger.
The code is written against each provider's standard test/sandbox setup —
none of this works until real credentials are set. Before launch:

- Create a Stripe account, enable Connect, and get a **test-mode** secret
  key. After first deploying `stripeWebhook`, register its URL
  (`https://us-central1-teamsync-29ea1.cloudfunctions.net/stripeWebhook`) as
  a webhook endpoint in the Stripe dashboard, subscribed to:
  `checkout.session.completed`, `account.updated`, `invoice.paid`,
  `invoice.payment_failed`, `customer.subscription.updated`,
  `customer.subscription.deleted` (the last four are for club subscriptions,
  see below, not the per-athlete dues flow) — to get its signing secret.
- Create an iyzico **sandbox** merchant account to get sandbox API/secret
  keys. iyzico has no hosted onboarding page for sub-merchants, so a TR
  club admin's business details (name, IBAN, national ID, etc.) are
  collected directly in-app and sent straight to iyzico's sub-merchant API
  — personal ("PERSONAL") sub-merchants only for now, not registered
  companies.
- Set all four secrets: `firebase functions:secrets:set STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`, `IYZICO_API_KEY`, `IYZICO_SECRET_KEY`.
- Switch `IYZICO_BASE_URL` in `functions/index.js` from iyzico's sandbox
  host to their production host once using real (non-sandbox) iyzico
  credentials.
- Confirm end-to-end with each provider's test cards/sandbox flow: connect
  a club, pay a due, and see the webhook mark it `paid`. This can't be
  verified without real sandbox credentials, so it hasn't been tested yet.
- MaviTeam currently takes a 2% platform fee on every online payment
  (`platformFeeCents`, hardcoded in `functions/index.js`) — revisit if the
  business decides on a different rate.

## Club Subscriptions ($20/mo + promo codes)

Every new club now has to pay $20/month (real Stripe recurring billing, US
clubs only for now) or redeem a single-use promo code before it's actually
created — see `startClubSignup` in `functions/index.js`. This is a
*different* Stripe integration from the per-athlete dues flow above (a
separate Checkout mode, `"subscription"` instead of `"payment"`), but reuses
the same `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` secrets and the same
`stripeWebhook` endpoint. Before launch:

- Make sure the `stripeWebhook` endpoint (see above) is subscribed to
  `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`,
  and `customer.subscription.deleted` in addition to
  `checkout.session.completed` — without these, subscriptions will start but
  never renew, fail, or cancel correctly.
- Confirm end-to-end in Stripe test mode: sign up a new club with a test
  card, confirm it's created once `checkout.session.completed` fires,
  simulate `invoice.payment_failed` (Stripe CLI: `stripe trigger
  invoice.payment_failed`) and confirm the club goes `past_due`, then wait
  out (or manually adjust) the 7-day grace period and confirm
  `enforceSubscriptionGracePeriod` suspends it. **Not yet verified** — no
  real Stripe test-mode run has been done against this flow.
- Generate at least one promo code from the admin panel (Promo codes card)
  and confirm redeeming it at signup creates a club immediately with a
  6-month (or however many months specified) trial, no payment required.
- **TR/iyzico club subscriptions are not implemented.** `startClubSignup`
  and `startSubscriptionRenewalCheckout` both throw
  `TR_SUBSCRIPTIONS_NOT_YET_AVAILABLE` for non-US clubs — iyzico's recurring
  Subscription API (distinct from the one-off Checkout Form used for dues
  above) has never been integrated here. TR clubs can only join via promo
  code until this is built as its own follow-up.
- `enforceSubscriptionGracePeriod` and `sendSubscriptionReminders` are
  scheduled Cloud Functions (`onSchedule`) — they deploy automatically with
  `npm run deploy:firebase:functions`, no extra setup needed, but confirm
  they show up under Cloud Scheduler in the Firebase/GCP console after first
  deploy.

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

- Real payment processing end-to-end verification (code is written against
  Stripe/iyzico's sandbox shape -- see "Online Dues Payments" above, but
  untested without real sandbox credentials)
- iyzico company (non-personal) sub-merchant onboarding
- Native crash reporting
- App Store and Play Store listing assets
