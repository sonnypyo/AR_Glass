# Debug Glasses Cue Seed Evidence

## Goal

Make the ADB smoke test prepare a deterministic projected-glasses cue before launching `GlassesProjectedActivity`, without storing or exporting a real speaker label.

## Why

The projected screen renders `latestGlassesCue`. If the smoke script launches the projected Activity before any actionable detection has saved a cue, the activity launch can pass while the screen still shows the idle state. That is weak evidence for the glasses handoff. A debug-only seed gives the physical-device report a repeatable, non-PII cue to validate.

## Changes

- Added `GlassesCueSeedReceiver` for `DEBUG_GLASSES_CUE_SEED`.
- Wired `scripts/android-device-smoke-test.sh` to run the seed before projected Activity launch.
- Added device evidence setup, functional, output-block, log, and validator requirements for the seed path.
- Updated release readiness so phone private alpha now tracks the seed as a manual physical-device evidence gate.
- Adjusted `GlassesCuePayload.evidenceSummary` to use `labelPresent` in evidence strings.

## Trial/Error Notes

- The seed stores `speakerLabel=null` by design. It proves projected cue state handoff, not real speaker identification.
- This does not close Meta DAT credentials, Ray-Ban Display proof, Android XR runtime proof, or glasses-side haptics blockers.
- The generated report must still avoid transcript, speaker label, raw PCM, embedding, and encrypted payload values.

## Verification

- `node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json`: passed with `"ok": true`.
- `node scripts/validate-physical-test-session.mjs data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack --json`: passed with expected missing-hardware warnings.
- `node --check scripts/create-physical-test-session.mjs`, `node --check scripts/validate-physical-test-session.mjs`, and `node --check scripts/validate-device-evidence.mjs`: passed.
- `aapt2 dump xmltree ... app-debug.apk --file AndroidManifest.xml | rg "GlassesCueSeedReceiver|DEBUG_GLASSES_CUE_SEED"`: passed.
- `./gradlew --no-daemon test assembleDebug`: passed.
- `./gradlew --no-daemon test assembleDebug bundleRelease`: passed.
- `node scripts/validate-release-artifact-readiness.mjs --json`: passed default mode with `uploadReady=false`.
- `scripts/android-device-smoke-test.sh --skip-build --write-evidence`: expected no-device exit code `2`.
