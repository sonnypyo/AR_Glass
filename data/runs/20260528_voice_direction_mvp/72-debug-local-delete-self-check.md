# Debug Local Delete Self-Check

## Goal

Add automated evidence that local repository deletion clears stored app-data shapes without deleting tester data during smoke runs.

## Why

The service needs a credible data deletion path before real beta or production. The host app already exposes a local delete button, but running that from the default smoke script would destroy the tester's actual app state. A separate debug encrypted store lets the script verify deletion semantics safely.

## Changes

- Added `LocalDataDeleteSelfCheckReceiver` for `DEBUG_LOCAL_DELETE_SELF_CHECK`.
- The receiver seeds representative non-PII records in `voice_direction_delete_self_check`, calls `clearAll()`, and verifies counts/snapshots are cleared.
- Wired the ADB smoke script to run the self-check.
- Added required device evidence rows, output block, validator markers, fixture data, release gate, physical checklist, docs, README, wiki, QA, and final report updates.

## Trial/Error Notes

- This is not a substitute for manually tapping the real UI delete button during a controlled physical session.
- The self-check intentionally avoids the production preference file so test automation cannot remove tester evidence.
- Evidence includes only counts, booleans, and the pass/fail marker.

## Verification

- `node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json`: passed with `"ok": true`.
- `node scripts/validate-physical-test-session.mjs data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack --json`: passed with expected missing-hardware warnings.
- `bash -n scripts/android-device-smoke-test.sh`: passed.
- `node --check scripts/validate-device-evidence.mjs`, `node --check scripts/create-physical-test-session.mjs`, and `node --check scripts/validate-physical-test-session.mjs`: passed.
- `aapt2 dump xmltree ... app-debug.apk --file AndroidManifest.xml | rg "LocalDataDeleteSelfCheckReceiver|DEBUG_LOCAL_DELETE_SELF_CHECK"`: passed.
- `./gradlew --no-daemon test assembleDebug`: passed.
- `./gradlew --no-daemon test assembleDebug bundleRelease`: passed.
- `node scripts/validate-release-artifact-readiness.mjs --json`: passed default mode with `uploadReady=false`.
- `scripts/android-device-smoke-test.sh --skip-build --write-evidence`: expected no-device exit code `2`.
