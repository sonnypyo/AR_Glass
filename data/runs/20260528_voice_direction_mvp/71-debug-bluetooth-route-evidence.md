# Debug Bluetooth Route Evidence

## Goal

Make Ray-Ban Gen 1 and Android XR Bluetooth fallback testing easier to record from ADB without exposing Bluetooth product names, owner names, MAC addresses, or audio.

## Why

The app already has UI controls for Bluetooth communication-device probing and guarded route selection/clear. For physical sessions, however, evidence should be generated consistently by the smoke script. A debug-only route evidence broadcast lets the report capture whether Android sees a Bluetooth SCO/BLE headset input candidate while keeping the report limited to counts, booleans, enum route types, and status values.

## Changes

- Added `BluetoothAudioRouteEvidenceFormatter`.
- Added `BluetoothRouteEvidenceReceiver` for `DEBUG_BLUETOOTH_ROUTE_EVIDENCE`.
- Wired the ADB smoke script to run the receiver in `probe` mode.
- Added required device-evidence rows, broadcast output block, validator markers, and fixture data.
- Updated phone session checklist, docs, README, wiki, canonical QA, and final report references.

## Trial/Error Notes

- Probe mode is intentionally non-invasive and does not select or clear routes.
- The debug receiver supports `mode=select` and `mode=clear` for observed sessions, but the smoke script avoids those modes by default.
- Bluetooth HFP/BLE route visibility is not direction evidence. It is fallback route evidence only; controlled direction trials remain required before any front/back or four-direction claim.

## Verification

- `node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json`: passed with `"ok": true`.
- `node scripts/validate-physical-test-session.mjs data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack --json`: passed with expected missing-hardware warnings.
- `bash -n scripts/android-device-smoke-test.sh`: passed.
- `node --check scripts/validate-device-evidence.mjs`, `node --check scripts/create-physical-test-session.mjs`, and `node --check scripts/validate-physical-test-session.mjs`: passed.
- `aapt2 dump xmltree ... app-debug.apk --file AndroidManifest.xml | rg "BluetoothRouteEvidenceReceiver|DEBUG_BLUETOOTH_ROUTE_EVIDENCE"`: passed.
- `./gradlew --no-daemon test assembleDebug`: passed.
- `./gradlew --no-daemon test assembleDebug bundleRelease`: passed.
- `node scripts/validate-release-artifact-readiness.mjs --json`: passed default mode with `uploadReady=false`.
- `scripts/android-device-smoke-test.sh --skip-build --write-evidence`: expected no-device exit code `2`.
