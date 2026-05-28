# Direction Target Progress Evidence Snapshot

Date: 2026-05-28 KST

## Goal

Persist the controlled direction target-progress counters into generated device evidence, not only the in-app UI.

## Why

Stage 106 added 20-per-direction target progress to the app UI. A physical phone evidence report still needed the same target-progress fields so QA can verify that the generated `device-evidence.md` records planned rows, missing rows, and target-complete status without private data.

## Implemented

- Updated `EvidenceSnapshotReceiver` to include:
  - `directionRequiredTrialsPerDirection`
  - `directionRequiredTotalTrials`
  - `directionMissingTotalTrials`
  - `directionControlledTrialTargetComplete`
  - `directionFrontMissingTrials`
  - `directionBackMissingTrials`
  - `directionLeftMissingTrials`
  - `directionRightMissingTrials`
- Updated `scripts/validate-device-evidence.mjs` to require the new non-PII markers.
- Updated `data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md`.
- Updated device evidence and direction validation docs.

## Current Result

The fixture now records:

- Required trials per direction: 20.
- Required total trials: 80.
- Existing fixture trials: 4.
- Missing total trials: 76.
- Missing trials by direction: 19 each.
- Controlled trial target complete: false.

## Verification

```bash
node --check scripts/validate-device-evidence.mjs
node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json
bash -n scripts/android-device-smoke-test.sh
cd apps/voice-direction-glass
./gradlew --no-daemon test assembleDebug
```

Result:

- Device evidence validator syntax passed.
- Fixture validation passed.
- Smoke script syntax passed.
- Unit tests passed.
- Debug APK assembled.

## Trial/Error Notes

- The new fields are counts and booleans only.
- They do not include raw audio, transcripts, speaker labels, Bluetooth names, room notes, or exact locations.
- `directionControlledTrialTargetComplete=true` is still only a row-count milestone. It is not production direction accuracy proof.
