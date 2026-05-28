# Alert Delivery Source Snapshot

## Goal

Let physical-device evidence distinguish a direct alert-output test from a real detection-triggered alert without exposing event ids or private content.

## Implemented

- Added `latestDeliverySource` to the debug non-PII evidence snapshot.
- Source values are:
  - `TEST_CUE` for `alert-test-*` delivery snapshots.
  - `DETECTION_EVENT` for `event-*` delivery snapshots.
  - `UNKNOWN` for unrecognized internal ids.
  - `MISSING` when no delivery snapshot exists.
- Updated `scripts/validate-device-evidence.mjs` so generated reports must include `latestDeliverySource=`.
- Updated the validator fixture with `latestDeliverySource=TEST_CUE`.

## Privacy Boundary

- The snapshot never prints the actual delivery event id.
- It records only a coarse source enum, counts, booleans, channel statuses, and direction enums.
- It does not store or export transcripts, speaker labels, raw audio, PCM, embeddings, alert text, or encrypted payload values.

## Trial/Error

- `알림 출력 점검` is useful for first-pass hardware output checks, but it must not be mistaken for real voice detection evidence.
- This source enum lets the tester record both paths separately in one evidence report.

## Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

From the repository root:

```bash
node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json
```

Result:

- Build and unit tests passed.
- Validator fixture passed with `"ok": true`.

## Next Work

- On a physical phone, run `알림 출력 점검` and confirm the generated snapshot shows `latestDeliverySource=TEST_CUE`.
- Run a real actionable detection and confirm the generated snapshot changes to `latestDeliverySource=DETECTION_EVENT`.
