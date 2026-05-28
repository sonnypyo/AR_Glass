# Direction Cue Output Contract

Date: 2026-05-28 KST

## Purpose

This document fixes the operator-facing contract for one detected direction cue before the first physical phone/glasses run. The app now has a `방향 큐 계약` card that shows the exact phone notification text, phone vibration pattern metadata, intended glasses haptics target, TTS text, and non-PII glasses evidence summary for the currently selected test direction.

## Source of Truth

- `apps/voice-direction-glass/app/src/main/kotlin/com/voicedirection/glass/alerts/DirectionCueOutputContract.kt`
- `apps/voice-direction-glass/app/src/main/kotlin/com/voicedirection/glass/alerts/GlassesHapticsIntent.kt`
- `apps/voice-direction-glass/app/src/main/kotlin/com/voicedirection/glass/ui/VoiceDirectionApp.kt`
- `apps/voice-direction-glass/app/src/test/kotlin/com/voicedirection/glass/alerts/DirectionCueOutputContractsTest.kt`

The contract reuses the same production-path helpers used by alert adapters and the direct output-test button:

- Phone vibration: `VibrationPatternMapper`.
- Glasses haptics intent: `GlassesHapticsIntents`.
- TTS: `TtsCueTextFormatter`.
- Glasses non-PII summary: `GlassesCuePayload`.

## Current Cue Contract

The UI uses the current simulator direction and confidence so testers can compare intended output with observed output before and after tapping `알림 출력 점검`.

| Output | Contract |
| --- | --- |
| Phone notification | Generic title plus direction/confidence body. |
| Phone vibration | Direction-specific timing signature, pulse count, total duration. |
| Phone side haptics | `phoneVibrationSideSpecific=false`; phone fallback does not prove left/right glasses haptics. |
| Glasses haptics intent | Left/right directions map to left/right target, front/back map to both, unknown maps to none. This is an intent contract only. |
| Glasses haptics proof | Directional haptics require official API/device proof before any service or store claim. |
| TTS | Direction-only Korean phrase; speaker labels are not spoken. |
| Meta/Android XR display evidence | Direction enum, confidence percent, and label-present flag only. |

## Manual Evidence Use

During the first attached-phone run:

1. Set the simulator direction.
2. Check the `방향 큐 계약` card.
3. Enable one alert channel or a small channel set.
4. Tap `알림 출력 점검`.
5. Record whether the observed notification, vibration, TTS, and projected display match the contract.

Do not treat this as direction-accuracy evidence. It proves output routing and output formatting only. Direction accuracy still requires the controlled evidence flow in `docs/22-direction-accuracy-evidence.md`.

## Generated Evidence Markers

`scripts/android-device-smoke-test.sh --write-evidence` runs the debug alert-output broadcast and stores non-PII cue contract markers in `device-evidence.md`:

- `cueContractDirection`
- `cueContractConfidencePercent`
- `cueContractNotificationDirection`
- `cueContractTtsDirectionOnly`
- `cueContractTtsSpeakerLabelIncluded`
- `cueContractGlassesHapticTarget`
- `cueContractGlassesHapticIntensity`
- `cueContractGlassesHapticPulseCount`
- `cueContractGlassesHapticRequiresApiProof`
- `cueContractGlassesHapticEvidence`
- `cueContractDisplayEvidence`

`scripts/validate-device-evidence.mjs` requires these markers. The report intentionally does not store full alert message text, raw audio, transcripts, speaker labels, or embeddings.

## Trial/Error Notes

- This card prevents testers from guessing what pattern they should feel on a real phone.
- It keeps the privacy boundary visible: the display may show a label, but generated adapter/evidence summaries must not store a speaker name.
- The debug evidence path stores contract metadata only; it does not store full notification or TTS strings.
- The glasses haptics intent keeps right/left vibration behavior in the design without claiming Meta DAT, Ray-Ban, or Android XR can already trigger per-side haptics.
- It does not close the Meta DAT, Android XR runtime, Ray-Ban Display, Ray-Ban Gen 1 fallback, or glasses haptics gates.

## Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

From the repository root:

```bash
node --check scripts/validate-device-evidence.mjs
bash -n scripts/android-device-smoke-test.sh
node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json
```

Result:

- Direction cue output contract unit tests passed.
- Compose host app compiled with the `방향 큐 계약` card.
- Debug APK assembled.
- Device evidence fixture validation returned `"ok": true` with cue contract and glasses haptics intent markers.
