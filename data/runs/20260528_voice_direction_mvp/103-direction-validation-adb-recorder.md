# Direction Validation ADB Recorder

Date: 2026-05-28 KST

## Goal

Add a repeatable debug ADB command path for controlled direction validation trials so a hardware operator can record expected-vs-observed direction rows without tapping the UI for every trial.

## Implemented

- Added `DirectionValidationTrialReceiver` under the debug source set.
- Registered `com.voicedirection.glass.qa.DEBUG_DIRECTION_VALIDATION_TRIAL` in the debug manifest.
- Added `scripts/record-direction-validation-trial.sh` with argument validation, `ANDROID_SERIAL` support, clear mode, and result-code checking.
- Added phone smoke report guidance and log-event markers for the recorder.
- Documented the recorder in `docs/50-direction-validation-adb-recorder.md` and linked it to the direction evidence snapshot contract.

## Evidence Boundary

The recorder stores direction enums, status, confidence, optional sample count/rate, and allow-listed source labels only. It does not store audio, transcripts, speaker names, raw embeddings, Bluetooth names, MAC addresses, or private alert text.

This is an evidence entry path, not an accuracy proof. Strict direction validation remains blocked until controlled phone/glasses trials, microphone metadata, route proof, latency evidence, and privacy evidence exist.

## Verification

Commands run locally:

```bash
bash -n scripts/record-direction-validation-trial.sh
scripts/record-direction-validation-trial.sh --help
bash -n scripts/android-device-smoke-test.sh
node scripts/create-physical-test-session.mjs --run-dir data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack --force --json
node scripts/validate-physical-test-session.mjs data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack --json
cd apps/voice-direction-glass
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- Script syntax/help passed.
- Physical-test session pack regenerated with ADB direction trial recorder checklist markers.
- Physical-test session validator passed with expected missing-hardware-output warnings.
- Gradle unit tests passed.
- Debug APK assembled.
- Physical ADB trial broadcast was not run because no Android phone is attached in this workspace.

## Next Hardware Step

After a phone is attached and the debug APK is installed:

```bash
scripts/record-direction-validation-trial.sh --clear
scripts/record-direction-validation-trial.sh --expected LEFT --observed UNKNOWN --source controlled-phone
scripts/record-direction-validation-trial.sh --expected RIGHT --observed RIGHT --confidence 0.75 --source bluetooth-route
```

Then generate a phone evidence report and extract/validate the direction summary before changing any release gate.
