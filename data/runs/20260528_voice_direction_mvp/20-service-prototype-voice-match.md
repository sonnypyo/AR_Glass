# Service Prototype Voice Match Stage

Date: 2026-05-28 KST

## Goal

Move the service closer to the user's requested automation: when a saved person's voice is involved in a call event, the app should decide and alert without a manual diagnostic button.

## Implemented

- Added `PrototypeVoiceSessionEngine`.
- Added service-side gating: only capture a prototype live sample after the configured trigger phrase is recognized and at least one stored profile has an `embedding:v1:` reference.
- Added foreground-service connection to capture one short transient mono sample, extract a prototype embedding, compare it against stored prototype embeddings, persist a detection event, save the latest glasses cue when actionable, and emit phone/glasses alert adapters.
- Added non-PII diagnostics for prototype service sample and match status.
- Added unit tests for trigger-gated sample capture, matched alert delivery, low-confidence rejection, and no-trigger rejection.

## Why This Matters

Before this stage, accepted enrollment samples could be checked only from the manual `프로토타입 음성 매칭 점검` button. Now those samples can influence the automatic foreground service path during controlled tests.

## Privacy Boundary

- The service does not store raw PCM.
- The service logs sample status, match status, and similarity bucket only.
- The service does not log transcripts, speaker names, PCM, or embedding values.

## Limitations

- This is not production speaker recognition.
- The live sample is captured after the `SpeechRecognizer` result, so physical device testing must check whether the caller is still speaking long enough for useful matching.
- Direction is still the saved simulator direction until real device microphone evidence proves a stronger estimator.
- Real Meta DAT and Android XR display integrations remain stubbed.

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

1. Install on a physical phone.
2. Enroll at least one profile sample until an `embedding:v1:` reference exists.
3. Start the foreground service, say the trigger phrase, keep speaking through the post-recognition sample window, and record whether the prototype match creates an actionable event.
