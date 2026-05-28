# Alert Channel Evidence Snapshot

## Goal

Make physical-device evidence show which alert output channels were enabled when a smoke report was generated.

## Implemented

- Added enabled alert channel fields to `EvidenceSnapshotReceiver`:
  - `enabledAlertChannelCount`
  - `phoneNotificationEnabled`
  - `phoneVibrationEnabled`
  - `ttsEnabled`
  - `metaDisplayEnabled`
  - `androidXrDisplayEnabled`
- Updated `scripts/validate-device-evidence.mjs` to require those fields in the non-PII snapshot block.
- Updated the validator fixture to include the new fields.

## Privacy Boundary

- The snapshot records only enum-derived booleans and counts.
- It does not store alert text, speaker labels, transcripts, raw audio, PCM, embeddings, or encrypted preference payload values.

## Trial/Error

- Alert delivery status alone is not enough evidence because disabled channels intentionally do not emit delivery rows.
- Keeping enabled-channel state in the same snapshot lets a tester compare configuration and delivery results without pasting private UI content.
- Physical observation is still required to prove a vibration was felt, TTS was heard, or a display cue appeared.

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

- Run the smoke script on a physical Android phone after toggling alert channels.
- Compare enabled channel fields with `latestDelivery*` fields and manual observations.
