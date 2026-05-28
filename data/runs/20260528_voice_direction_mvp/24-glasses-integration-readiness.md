# Glasses Integration Readiness Stage

Date: 2026-05-28 KST

## Goal

Make the Meta Ray-Ban Display and Android XR alpha gates visible in code and the host app before replacing the stub adapters.

## Implemented

- Added `GlassesIntegrationReadiness`.
- Added readiness items for Meta DAT credentials, real DAT adapter, Ray-Ban Display proof, Android XR runtime proof, real Android XR adapter, wearable direction evidence, and glasses haptics proof.
- Later update: added Ray-Ban and Android XR Bluetooth HFP fallback route proof rows after the host app gained a Bluetooth communication-device probe.
- Added unit tests that keep glasses alpha blocked while real adapters remain stubbed.
- Added a `글래스 연동 준비` card to the host app.

## Why This Matters

The app already emits phone notifications/vibration and stores a projected cue, but real glasses output is still behind stubs. The readiness model prevents treating the app as glasses-alpha-ready until Meta DAT and Android XR runtime evidence exists.

## Current Status

- Phone-hosted projected cue preview: present.
- Meta DAT: blocked by credentials/package access and stub adapter.
- Android XR: blocked by runtime proof and stub adapter.
- Wearable direction evidence: blocked.
- Glasses-side haptics: blocked.

## Privacy Boundary

This stage adds no new sensors, credentials, or SDK dependencies. It only records readiness state and displays it.

## Verification

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

- Gradle test/build passed.
- Canonical JSON validation passed.
- Smoke script syntax/help passed.
- No-device smoke path exits with code `2`, as expected when no ADB device is attached.

## Next Work

1. Add Meta DAT credentials outside source control.
2. Replace `MetaDatDisplayStubAdapter` with a real adapter.
3. Run Ray-Ban Display device proof.
4. Add Android XR projected dependencies and replace `AndroidXrDisplayStubAdapter`.
