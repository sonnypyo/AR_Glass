# 60. Release Artifact And Signing Readiness

## Objective

Prepare the project for the real Play release artifact step by documenting and validating Android App Bundle generation, upload-key signing, and key-hygiene requirements without creating or committing private signing material.

## Changes

- Added `docs/18-release-artifact-signing-runbook.md`.
- Added `scripts/validate-release-artifact-readiness.mjs`.
- Added conditional Gradle release signing configuration in `apps/voice-direction-glass/app/build.gradle.kts`.
- The Gradle release build reads upload signing values from environment variables or `local.properties`, while keeping private keys outside source control.

## Current Result

- The repository now has a release artifact/signing process.
- Upload-ready status intentionally remains blocked until an upload key, signed release AAB, Play App Signing setup, phone evidence, privacy URL, Data Safety, screenshots, and review evidence exist.
- The validator can run in default draft mode now and in strict upload-ready mode later with `--require-upload-ready`.

## Trial/Error Notes

- A generated `app-release.aab` is not enough for Play upload unless signed with the upload key.
- Debug APK evidence remains useful for physical QA, but it is not a Play release artifact.
- Private keystores and passwords must not be stored in this repository.

## Verification

Verified at 2026-05-28T06:05:13+09:00.

From the repository root:

```bash
node --check scripts/validate-release-artifact-readiness.mjs
node scripts/validate-release-artifact-readiness.mjs --json
node scripts/validate-release-artifact-readiness.mjs --require-upload-ready --json
node --check scripts/validate-store-review-submission-package.mjs
node scripts/validate-store-review-submission-package.mjs --json
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
JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk ./gradlew --no-daemon test assembleDebug bundleRelease
JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk ./gradlew --no-daemon signingReport
```

Result:

- Release artifact readiness default validation passed with `uploadReady=false`.
- Strict upload-ready validation failed as expected because upload-key environment variables and a signed release AAB are missing.
- Store review package, privacy/Data Safety, policy clearance, support process, device evidence fixture, and physical session validators passed.
- Service readiness audit passed and now includes the release artifact signing runbook artifact.
- JSON parse check passed.
- Glasses preflight wrote expected blocked evidence because Meta DAT credentials, Android XR dependencies/runtime proof, and hardware proof are still missing.
- Phone smoke script returned expected code `2` because no ADB device is attached.
- Gradle `test assembleDebug bundleRelease` passed.
- `signingReport` showed release config `null`, so the current structural AAB is not Play upload-ready.
