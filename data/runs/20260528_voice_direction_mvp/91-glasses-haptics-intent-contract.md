# Stage 91: Glasses Haptics Intent Contract

Date: 2026-05-28 KST

## Decision

Add an app-side glasses haptics intent contract without claiming actual glasses haptics support.

## Reasoning

The target service needs direction-specific feedback such as right-side vibration, but current evidence only proves phone vibration patterns and projected/display cue plumbing. Treating phone vibration as "glasses haptics" would overclaim the service. A separate intent contract keeps the desired Meta Ray-Ban/Android XR behavior explicit while preserving the official API and hardware evidence gate.

## Implemented

- Added `GlassesHapticsIntent.kt` with haptic target, intensity, pulse count, proof requirement, fallback requirement, and non-PII evidence summary.
- Extended `DirectionCueOutputContract.kt` so notification, phone vibration, TTS, display evidence, and glasses haptics intent are one shared contract.
- Updated the `방향 큐 계약` UI to show glasses haptic target, intensity, pulse count, and API proof requirement.
- Updated `AlertOutputTestReceiver` to emit non-PII haptic intent markers in the debug alert-output result.
- Updated `scripts/validate-device-evidence.mjs`, `docs/09-device-evidence-template.md`, and the validator fixture to require the new markers.
- Added `docs/38-glasses-haptics-intent-contract.md`.

## Trial/Error Notes

- Left/right directions now have a per-side haptic intent, but `requiresOfficialApiProof=true` keeps the implementation honest.
- Front/back directions map to both sides with different intensity/pulse semantics, but production front/back direction proof remains blocked.
- Unknown direction maps to no glasses haptic target to avoid misleading directional output.
- Phone vibration is still the only implemented haptic fallback until a real platform API and device session prove otherwise.

## Verification

From `apps/voice-direction-glass`:

```bash
JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk ./gradlew --no-daemon test
JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk ./gradlew --no-daemon test assembleDebug
```

From the repository root:

```bash
node --check scripts/validate-device-evidence.mjs
node --check scripts/audit-service-readiness.mjs
node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json
node scripts/audit-service-readiness.mjs --json
node scripts/audit-service-readiness.mjs --write-report --report-dir data/runs/20260528_voice_direction_mvp/52-service-readiness-audit
```

Result:

- Unit tests passed after adding the haptics intent mapping.
- Debug APK assembled.
- Device evidence validator syntax passed.
- Service readiness audit syntax passed.
- Device evidence fixture returned `"ok": true` with haptics intent markers.
- Service readiness audit includes `docs/38-glasses-haptics-intent-contract.md` as a local artifact.
