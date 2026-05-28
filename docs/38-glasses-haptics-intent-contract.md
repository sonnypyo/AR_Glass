# Glasses Haptics Intent Contract

Date: 2026-05-28 KST

## Purpose

The product goal includes directional feedback such as "right side vibrates when the caller is on the right." Current workspace evidence does not prove that Meta Ray-Ban Display, Ray-Ban Meta Gen 1, or Android XR glasses expose official per-side haptics. This document defines the app-side intent contract only, so the service can keep the desired behavior clear while still falling back to phone notification, phone vibration, TTS, and visual cues.

## Source of Truth

- `apps/voice-direction-glass/app/src/main/kotlin/com/voicedirection/glass/alerts/GlassesHapticsIntent.kt`
- `apps/voice-direction-glass/app/src/main/kotlin/com/voicedirection/glass/alerts/DirectionCueOutputContract.kt`
- `apps/voice-direction-glass/app/src/debug/kotlin/com/voicedirection/glass/qa/AlertOutputTestReceiver.kt`
- `apps/voice-direction-glass/app/src/test/kotlin/com/voicedirection/glass/alerts/DirectionCueOutputContractsTest.kt`

## Direction Mapping

| Direction | Glasses haptic target | Intensity | Pulse count | Service claim status |
| --- | --- | --- | ---: | --- |
| `LEFT` | `LEFT` | `MEDIUM` | 2 | Intent only; official API/device proof required. |
| `RIGHT` | `RIGHT` | `MEDIUM` | 2 | Intent only; official API/device proof required. |
| `FRONT` | `BOTH` | `LOW` | 3 | Intent only; front/back direction and haptics proof required. |
| `BACK` | `BOTH` | `HIGH` | 2 | Intent only; front/back direction and haptics proof required. |
| `UNKNOWN` | `NONE` | `NONE` | 0 | Use generic phone notification/vibration fallback. |

## Evidence Shape

Generated debug alert-output evidence now includes these non-PII markers:

- `cueContractGlassesHapticTarget`
- `cueContractGlassesHapticIntensity`
- `cueContractGlassesHapticPulseCount`
- `cueContractGlassesHapticRequiresApiProof`
- `cueContractGlassesHapticEvidence`

The evidence summary contains direction enum, haptic target, intensity, pulse count, per-side intent flag, API proof requirement, and phone fallback requirement. It must not contain speaker labels, transcripts, audio data, Bluetooth device names, MAC addresses, or private payload values.

## Service Boundary

- The app may show the intended haptic target in the internal test UI.
- Phone vibration remains the current implemented fallback.
- Store copy, tester copy, and release notes must not say glasses-side or per-side haptics are supported until official API proof and physical device evidence exist.
- `docs/25-glasses-hardware-evidence.md` remains the promotion gate for real glasses haptics or documented fallback proof.

## Trial/Error Notes

- Encoding haptics as an intent object prevents the phone vibration pattern from being mistaken for proven glasses haptics.
- `requiresOfficialApiProof=true` on directional haptic intents keeps right/left design behavior visible while preserving the current blocker.
- `UNKNOWN` has no glasses haptic target because a direction-specific vibration would be misleading when the estimator cannot determine direction.

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
node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json
```

Result:

- Direction cue output contract tests cover the haptic target/intensity/pulse mapping.
- Debug evidence fixture validation requires the haptics intent markers.
- The current implementation still does not claim physical glasses haptics support.
