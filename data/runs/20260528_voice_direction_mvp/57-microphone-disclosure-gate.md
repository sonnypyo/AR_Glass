# 57. Microphone Disclosure Gate

## Objective

Move the app closer to real sensitive-permission service flow by adding an in-app microphone disclosure gate before OS microphone permission requests and audio capture actions.

## Changes

- Added `VoiceDirectionTesterConsent.microphoneDisclosure`.
- Added `microphoneDisclosureAccepted` and `microphoneDisclosureVersion` to app session state and persisted settings.
- Added the `마이크 사용 안내` card near the top of the host app.
- Gated session start, one-shot recognition, audio probe, direction sample, direction validation, Bluetooth route probe/select, enrollment sample capture, and prototype voice match behind disclosure acceptance.
- Added disclosure fields to the debug non-PII evidence snapshot.
- Updated `scripts/validate-device-evidence.mjs`, `scripts/android-device-smoke-test.sh`, the device evidence fixture, device test plan, evidence template, and physical test session generator/validator.

## Current Result

- The app compiles with a runtime disclosure gate.
- The OS permission request is still required and unchanged.
- Physical phone evidence is still required to prove the gate blocks real permission/audio flow.
- Google Play and legal/policy review are still not complete.

## Trial/Error Notes

- The gate intentionally stores only accepted/not-accepted and a disclosure version.
- This does not claim production policy clearance.
- The generated smoke report can now remind testers to record the disclosure row manually.

## Verification

Checked on 2026-05-28T05:44:36+09:00.

- `node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json`: passed with microphone disclosure snapshot fields.
- `node --check scripts/validate-device-evidence.mjs`: passed.
- `node --check scripts/create-physical-test-session.mjs`: passed.
- `node --check scripts/validate-physical-test-session.mjs`: passed.
- `bash -n scripts/android-device-smoke-test.sh`: passed.
- `node scripts/create-physical-test-session.mjs --run-dir data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack --force --json`: passed and regenerated the physical test pack.
- `node scripts/validate-physical-test-session.mjs data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack --json`: passed with expected missing-hardware-output warnings.
- `node scripts/validate-policy-clearance-matrix.mjs --json`: passed with no warnings.
- `node scripts/validate-support-incident-process.mjs --json`: passed with no warnings.
- Canonical JSON parse check: passed for candidate, backend contract, product plan, QA report, and implementation lock.
- `node scripts/audit-service-readiness.mjs --write-report --report-dir data/runs/20260528_voice_direction_mvp/52-service-readiness-audit`: passed and regenerated the readiness report.
- `scripts/android-device-smoke-test.sh --skip-build --write-evidence`: expected code `2` because no ADB device is attached.
- `scripts/glasses-integration-preflight.sh --write-evidence --evidence-dir data/runs/20260528_voice_direction_mvp/30-glasses-preflight-evidence`: passed and wrote blocked setup evidence.
- `./gradlew --no-daemon test assembleDebug`: passed.
