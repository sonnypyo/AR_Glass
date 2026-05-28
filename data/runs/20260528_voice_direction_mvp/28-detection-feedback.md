# Detection Feedback Stage

Date: 2026-05-28 KST

## Goal

Add a local feedback path so false positives, wrong directions, and wrong-speaker outcomes can be recorded during phone and glasses testing.

## Implemented

- Added `DetectionFeedback`, `DetectionFeedbackType`, and `DetectionFeedbackSummarizer`.
- Added repository support for upserting feedback by event id.
- Added local storage codec support for feedback records.
- Added encrypted local persistence for feedback through `PreferencesVoiceDirectionRepository`.
- Added UI controls in the event history for `정확`, `오탐`, `방향 오류`, and `화자 오류`.
- Added feedback summary counts to the event history card.
- Updated the device smoke evidence report and device evidence template with feedback checks.
- Updated release readiness evidence for the 30-minute false-positive run.

## Why This Matters

A detection app cannot be improved safely without knowing what went wrong. The original event history showed detection results, but it did not let testers label outcomes. This made the 30-minute false-positive gate weak. Feedback records provide a local, non-PII way to summarize wrong alerts and direction errors.

## Privacy Boundary

Feedback stores:

- Event id.
- Feedback type.
- Timestamp.

Feedback does not store:

- Corrected transcript.
- Corrected speaker name.
- Raw audio or PCM.
- Voice embeddings.

## Trial/Error Notes

- Feedback is stored separately from detection events so the original detection evidence remains unchanged.
- Upserting by event id keeps one current label per event, which is simpler for small physical test runs.
- The app still needs a real 30-minute room test; this stage only makes that test measurable.

## Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
node -e "const fs=require('fs'); for (const f of ['data/canonical/app-candidates/voice-direction-glass.json','data/canonical/voice-direction-glass.product-plan.json','data/canonical/voice-direction-glass.backend-contract.json','data/canonical/voice-direction-glass.qa-report.json','apps/voice-direction-glass/agent-output/implementation.lock.json']) { JSON.parse(fs.readFileSync(f,'utf8')); console.log('valid', f); }"
bash -n scripts/android-device-smoke-test.sh
scripts/android-device-smoke-test.sh --help
scripts/android-device-smoke-test.sh --skip-build --write-evidence
```

Result:

- Gradle test/build passed after adding feedback model, storage codec, repository, and UI wiring.
- Canonical JSON validation passed.
- Smoke script syntax/help passed.
- No-device smoke path exits with code `2`, as expected when no ADB device is attached.

## Next Work

1. Run a physical Android phone smoke test.
2. During a 30-minute false-positive pass, mark every actionable event and record feedback counts.
