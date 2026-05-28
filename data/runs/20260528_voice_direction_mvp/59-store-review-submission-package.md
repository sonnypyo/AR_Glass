# 59. Store Review Submission Package Draft

## Objective

Create a draft store-review submission package for Voice Direction Glass so the project has a concrete path from prototype evidence to Google Play and wearable review materials without claiming any external submission.

## Changes

- Added `docs/17-store-review-submission-package-draft.md`.
- Added `scripts/validate-store-review-submission-package.mjs`.
- Captured official-source requirements for Play store listing fields, app content declarations, privacy policy, Data Safety, target audience, content rating, sensitive permissions, Meta Wearables review, and Android XR review.
- Drafted safe store listing copy that avoids unsupported front/back, production speaker identity, Meta DAT, Android XR, and glasses haptics claims.
- Drafted app-content declarations, reviewer instructions, screenshot/media plan, public copy guardrails, and submission blockers.

## Current Result

- Store review submission package exists as a repository draft.
- It intentionally remains `DRAFT_NOT_SUBMITTED` and `NOT_REQUESTED`.
- It does not close the external beta or production gates.

## Trial/Error Notes

- Store listing text can overstate the product even when code is gated correctly, so this draft keeps the public copy narrower than the long-term app vision.
- Reviewer instructions must use generic test data and must not ask reviewers to upload real speaker audio or private transcripts.
- Meta Ray-Ban and Android XR claims stay out of public copy until real SDK, runtime, and hardware evidence exists.
- A Play listing draft is not the same as a release AAB, Play Console declaration, public privacy URL, or review approval.

## Verification

Verified at 2026-05-28T05:57:55+09:00.

From the repository root:

```bash
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
JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk ./gradlew --no-daemon test assembleDebug
```

Result:

- Store review submission package validation passed.
- Privacy/Data Safety draft validation passed.
- Service readiness audit passed and now includes the store review submission package artifact.
- Policy clearance, support process, device evidence fixture, and physical session validators passed.
- JSON parse check passed.
- Glasses preflight wrote expected blocked evidence because Meta DAT credentials, Android XR dependencies/runtime proof, and hardware proof are still missing.
- Phone smoke script returned expected code `2` because no ADB device is attached.
- Gradle `test assembleDebug` passed.
