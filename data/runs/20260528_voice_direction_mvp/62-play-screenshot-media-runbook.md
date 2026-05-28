# Stage 62 - Play Screenshot And Media Runbook

Date: 2026-05-28 KST

Status: verified

## Goal

Prepare the Google Play screenshot/media asset process before any internal-testing or review-track submission.

## Added

- `docs/20-play-screenshot-media-runbook.md`
- `apps/voice-direction-glass/store-assets/play-preview/manifest.json`
- `scripts/validate-play-screenshot-package.mjs`
- `scripts/capture-play-screenshots.sh`

## Current State

The package is a draft manifest and capture/validation automation only.

No real screenshots were captured in this workspace because no ADB device is attached.

## Submission Meaning

This stage does not publish anything and does not make the app ready for Play review.

It adds a guardrail so that future screenshots:

- are captured from a real reviewed build
- use non-private data only
- do not overclaim production speaker ID, front/back direction, Meta DAT, Android XR, or glasses haptics
- satisfy phone screenshot, feature graphic, and Android XR preview asset shape rules before submission

## Verification

From the repository root:

```bash
node --check scripts/validate-play-screenshot-package.mjs
bash -n scripts/capture-play-screenshots.sh
scripts/capture-play-screenshots.sh --skip-build --phone-only --output-dir apps/voice-direction-glass/store-assets/play-preview
node scripts/validate-play-screenshot-package.mjs --json
node scripts/validate-play-screenshot-package.mjs --require-assets --json
node scripts/audit-service-readiness.mjs --write-report --report-dir data/runs/20260528_voice_direction_mvp/52-service-readiness-audit
```

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug bundleRelease
./gradlew --no-daemon signingReport
```

Result:

- Script syntax checks passed.
- Capture script exited with code `2` as expected because no ADB device is attached.
- Default screenshot/media package validation passed.
- Strict asset validation failed as expected because phone screenshots and feature graphic files are missing.
- Service readiness audit was regenerated and now includes `docs/20-play-screenshot-media-runbook.md`.
- Gradle `test assembleDebug bundleRelease` passed.
- `signingReport` still shows release config `null`, so the release AAB remains structural only.

## Remaining Gates

- Physical phone screenshots are missing.
- Feature graphic is missing.
- Android XR screenshots are blocked until XR runtime proof exists.
- Public privacy-policy URL is still missing.
- Upload-signed AAB remains blocked.
- Play internal-testing upload has not been performed.

## Trial/Error Notes

- The validator has a default draft mode and strict modes because this workspace cannot honestly create store screenshots without a connected device.
- Android XR media stays separate from phone media because providing XR assets would imply a stronger platform claim.
