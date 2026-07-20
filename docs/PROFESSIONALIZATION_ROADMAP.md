# MaviTeam Professionalization Roadmap

This document defines the order for turning the current application into a maintainable, production-ready multi-club platform.

## 1. Architecture cleanup

- Split large screens into feature components, hooks, utilities, and styles.
- Start with `src/app/schedule.tsx` because it currently combines date logic, data loading, form state, rendering, and styles.
- Split the large application service into feature services.
- Introduce repository interfaces so screens do not need to know whether data comes from Firebase or local demo storage.
- Replace remaining TeamSync-specific internal names with neutral domain names such as `Workspace`, `AppData`, and `WorkspaceRepository`.

Target feature structure:

```text
src/features/schedule/
├── components/
├── hooks/
├── services/
├── utils/
├── types.ts
└── ScheduleScreen.tsx
```

## 2. Data consistency

Authenticated users must use Firestore as the source of truth. AsyncStorage should be limited to language, theme, onboarding state, drafts, and small caches.

Create separate repositories for:

- clubs
- users
- teams
- announcements
- schedule
- attendance
- availability
- messages
- payments
- replays
- join requests

Each repository should have a Firebase implementation and, where useful, a local demo implementation.

## 3. Authorization and security

- Create one central permission map for all application roles.
- Apply permissions in navigation, screens, services, and Firestore Security Rules.
- Ensure every Firestore read and write is isolated by `clubId`.
- Add Firebase App Check before production release.
- Maintain separate development, staging, and production Firebase projects.

## 4. Performance and Firebase cost control

- Query schedule data by visible date range instead of loading all events.
- Paginate messages, payments, attendance history, and replays.
- Use real-time listeners only where live updates add clear value.
- Add required Firestore composite indexes.
- Avoid loading complete club collections on every screen focus.

## 5. Reliability

- Add typed application errors and user-friendly error mapping.
- Add an application-level error boundary.
- Add loading, empty, offline, and retry states.
- Add structured logging and crash reporting.

## 6. Testing

Priority test areas:

- role permissions
- club-code normalization
- schedule date creation
- join-request approval and rejection
- club creation
- Firestore converters
- route-guard decisions

Pull requests must pass lint and TypeScript checks before merge. Unit and integration tests will be added to the quality workflow after the first test suite is introduced.

## Recommended implementation order

1. Add automated quality checks.
2. Refactor the schedule feature without changing behavior.
3. Split `teamSyncService` into feature services and repositories.
4. Complete Firestore persistence for every feature.
5. Centralize role permissions and strengthen Firestore rules.
6. Add tests, error monitoring, and release environments.
