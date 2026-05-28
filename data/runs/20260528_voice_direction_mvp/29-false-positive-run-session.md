# False-Positive Run Session Stage

Date: 2026-05-28 KST

## Goal

Make the 30-minute false-positive test measurable inside the app instead of relying on an external timer and notes.

## Implemented

- Added `FalsePositiveRun`.
- Added `FalsePositiveRunSummary` and `FalsePositiveRunSummarizer`.
- Added repository support for saving and clearing the current false-positive run.
- Added local storage codec support for false-positive run state.
- Added encrypted local persistence for the run state through `PreferencesVoiceDirectionRepository`.
- Added a `30분 오탐 테스트` card with start, stop, reset, elapsed time, target status, run-window feedback counts, pass/fail verdict, and false-positive rate per hour.
- Updated device test plan, evidence template, and smoke evidence checklist.

## Why This Matters

Phone private alpha is blocked by missing false-positive evidence. Event feedback made outcomes labelable, but testers still needed a clear test window. The run session gives each room test an explicit start/end interval and summarizes only feedback created inside that interval.

## Privacy Boundary

False-positive run state stores only:

- Run id.
- Start timestamp.
- End timestamp.
- Target duration.

It does not store transcripts, audio, PCM, speaker names, or corrected labels.

## Trial/Error Notes

- The run summary uses feedback timestamps. That means testers should mark events during or immediately after the run.
- The target is a default 30 minutes. The UI can still end early, but verdict will show `시간 부족` until the run reaches the target.
- A reached run fails if it contains any false-positive, wrong-speaker, or wrong-direction feedback. False-positive rate is normalized per hour so a 30-minute run with one false positive shows `2.00/hr`.
- This still does not close the phone alpha gate without a physical room test.

## Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

From the repository root:

```bash
node -e "const fs=require('fs'); for (const f of ['data/canonical/app-candidates/voice-direction-glass.json','data/canonical/voice-direction-glass.product-plan.json','data/canonical/voice-direction-glass.backend-contract.json','data/canonical/voice-direction-glass.qa-report.json','apps/voice-direction-glass/agent-output/implementation.lock.json']) { JSON.parse(fs.readFileSync(f,'utf8')); console.log('valid', f); }"
bash -n scripts/android-device-smoke-test.sh
scripts/android-device-smoke-test.sh --help
scripts/android-device-smoke-test.sh --skip-build --write-evidence
```

Result:

- Gradle test/build passed after adding false-positive run model, storage, codec, UI wiring, verdict, and false-positive-rate logic.
- Canonical JSON validation passed.
- Smoke script syntax/help passed.
- No-device smoke path exits with code `2`, as expected when no ADB device is attached.

## Next Work

1. Run a physical Android phone smoke test.
2. Start the app run card, complete a 30-minute room test, mark events, stop the run, and record summary counts, verdict, and false-positive rate.
