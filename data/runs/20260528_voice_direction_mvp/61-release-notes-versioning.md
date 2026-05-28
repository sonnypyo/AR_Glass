# Stage 61 - Release Notes And Versioning Readiness

Date: 2026-05-28 KST

Status: verified

## Goal

Prepare the internal-testing release-note and versioning gate before any Play Console upload attempt.

## Added

- `docs/19-release-notes-versioning.md`
- `apps/voice-direction-glass/release-notes/internal-testing-v0.1.0.md`
- `scripts/validate-release-notes-versioning.mjs`

## Current Version

| Field | Value |
| --- | --- |
| `applicationId` | `com.voicedirection.glass` |
| `versionCode` | `1` |
| `versionName` | `0.1.0` |

## Release Meaning

This stage does not publish anything and does not make the app ready for external testers.

It adds a guardrail so that any future internal-testing upload has release notes that:

- match the Gradle version
- stay under the Play release-note character limit
- avoid unsupported speaker-ID, front/back direction, Meta DAT, Android XR, glasses haptics, and production claims
- keep privacy-safe wording for reviewer and tester evidence

## Verification

From the repository root:

```bash
node --check scripts/validate-release-notes-versioning.mjs
node scripts/validate-release-notes-versioning.mjs --json
node scripts/validate-store-review-submission-package.mjs --json
node scripts/validate-release-artifact-readiness.mjs --json
node scripts/validate-release-artifact-readiness.mjs --require-upload-ready --json
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

- Release-note/versioning validation passed for `versionName=0.1.0`, `versionCode=1`, `en-US` length 350, and `ko-KR` length 212.
- Store review and release artifact validators still pass in draft/default mode.
- Strict upload-ready validation still fails as expected because signing env vars and signed AAB are missing.
- Service readiness audit was regenerated and now includes `docs/19-release-notes-versioning.md` as a local artifact.
- Gradle `test assembleDebug bundleRelease` passed.
- `signingReport` still shows release config `null`, so the release AAB remains structural only.

## Remaining Gates

- Physical phone evidence is still missing.
- Public privacy-policy URL is still missing.
- Play Data Safety submission is still draft-only.
- Upload-signed AAB remains blocked.
- Store screenshots are still missing.
- Meta DAT and Android XR runtime proof are still blocked.

## Trial/Error Notes

- Release notes are treated as a release artifact because they become user/reviewer-facing once uploaded.
- The current text deliberately describes a prototype and repeats limitations rather than marketing the long-term glasses vision.
