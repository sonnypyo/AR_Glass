# 58. Privacy Policy And Data Safety Draft

## Objective

Create a draft privacy policy and Google Play Data Safety worksheet that match the current local-first app behavior without claiming external submission or approval.

## Changes

- Added `docs/16-privacy-policy-data-safety-draft.md`.
- Added `scripts/validate-privacy-data-safety-draft.mjs`.
- Captured official-source requirements from Google Play User Data, Data Safety, prominent disclosure, review-preparation, and SDK-safety guidance.
- Mapped current app data behavior: microphone access, no raw audio persistence, local speaker labels, prototype voice references, direction metadata, alert metadata, and planned Meta DAT/Android XR SDK review.

## Current Result

- Privacy policy and Data Safety draft exists.
- It intentionally uses `TBD` placeholders for developer identity, privacy contact, and hosted public URL.
- It does not submit anything to Google Play.
- It does not close external beta or production gates.

## Trial/Error Notes

- Current Data Safety draft says no data is collected/shared off device, but the privacy policy still has to disclose local microphone access and local sensitive storage.
- This answer must change if backend, analytics, crash reporting, cloud model, Meta DAT data export, Android XR SDK data export, or support uploads are added.
- A repository Markdown file is not a valid public Play privacy policy URL.

## Verification

Verified at 2026-05-28T05:52:07+09:00.

From the repository root:

```bash
node --check scripts/validate-privacy-data-safety-draft.mjs
node scripts/validate-privacy-data-safety-draft.mjs --json
node --check scripts/audit-service-readiness.mjs
node scripts/audit-service-readiness.mjs --json
node scripts/audit-service-readiness.mjs --write-report --report-dir data/runs/20260528_voice_direction_mvp/52-service-readiness-audit
node scripts/validate-policy-clearance-matrix.mjs --json
node scripts/validate-support-incident-process.mjs --json
node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json
node scripts/validate-physical-test-session.mjs data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack --json
node -e 'JSON.parse(...) for QA report and implementation lock'
scripts/glasses-integration-preflight.sh --write-evidence --evidence-dir data/runs/20260528_voice_direction_mvp/30-glasses-preflight-evidence
scripts/android-device-smoke-test.sh --skip-build --write-evidence
```

From `apps/voice-direction-glass`:

```bash
JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk ./gradlew --no-daemon test assembleDebug
```

Result:

- Privacy/Data Safety draft validation passed.
- Service readiness audit passed and now includes the privacy/Data Safety draft artifact.
- Policy clearance, support process, device evidence fixture, and physical session validators passed.
- JSON parse check passed.
- Glasses preflight wrote expected blocked evidence because Meta DAT credentials, Android XR dependencies/runtime proof, and hardware proof are still missing.
- Phone smoke script returned expected code `2` because no ADB device is attached.
- Gradle `test assembleDebug` passed.
