# Stage 66: Microphone Metadata Evidence

Date: 2026-05-28 KST

## What Changed

- Added non-PII microphone metadata summaries for Android microphone inventory and active `AudioRecord` microphones.
- Stored the latest direction sample with microphone inventory/query flags and active microphone/channel-mapping counts.
- Added the metadata fields to the debug non-PII evidence snapshot.
- Updated the device evidence validator fixture and required snapshot markers.

## Reasoning

Direction evidence needs more than a direction enum and confidence. The app now records whether microphone inventory and active microphone metadata were captured, plus counts only. This avoids storing audio while giving future hardware sessions enough context to decide whether front/back or wearable direction claims are supportable.

## Verification

```bash
node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json
cd apps/voice-direction-glass
JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk ./gradlew --no-daemon test
```

Result: passed.
