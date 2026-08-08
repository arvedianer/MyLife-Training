# Legacy Data Export Design

## Goal

Add a safe JSON export to the legacy MyLife Training web app so locally stored training data can be migrated into the newer app.

## Scope

The export must prioritize training migration while preserving all meaningful legacy app data that is safe to include. Authentication/session credentials must never be exported.

## Data source

The legacy app is offline-first and persists Zustand state in browser `localStorage`. The export reads an explicit allowlist of MyLife-owned persistence keys rather than dumping the full browser storage.

Allowlisted keys:

- `mylife-user`
- `mylife-history`
- `mylife-plan`
- `mylife-workout`
- `mylife-achievements`
- `mylife-custom-exercises`
- `pr-storage`
- `gym-storage`
- `mylife-chat`
- `tour-store`

Supabase auth/session keys and unrelated browser storage are excluded.

## Export format

The downloaded JSON uses schema `mylife.training.migration`, version `1`.

It contains:

- metadata and export timestamp
- a summary with counts
- normalized migration fields for sessions, sets, rest days, plans, active plan, custom exercises, personal records, active workout and recent exercise IDs
- profile/settings/body-weight history
- achievements
- auxiliary safe data such as gyms/chat/tour state
- `legacyBackup` with the parsed original payload of every allowlisted persistence key so no safe legacy information is silently lost

This dual representation makes the file easy for the new app to import while keeping an exact safe fallback copy of the legacy persisted data.

## UX

Add a `Daten & Migration` section to Settings with a `Daten als JSON exportieren` action and short explanatory copy. Clicking it downloads `mylife-training-export-YYYY-MM-DD.json`. The user receives a concise success alert with the number of exported training sessions. Errors produce a clear German error alert.

## Error handling

Missing stores are treated as empty. Malformed allowlisted values are preserved in `legacyBackup` as their raw string while normalized sections fall back to empty values. Export failure must not mutate any app data.

## Validation

The change must remain TypeScript-strict and compile in the existing Next.js 14 project. No new runtime dependency is required.