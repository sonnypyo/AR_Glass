# Device Storage Self-Check Automation Stage

Date: 2026-05-28 KST

## Goal

Reduce the amount of manual work needed to prove encrypted local storage on a physical Android phone.

## Implemented

- Added a debug-only `StorageSelfCheckReceiver`.
- Added a debug manifest entry for `com.voicedirection.glass.qa.DEBUG_STORAGE_SELF_CHECK`.
- The receiver uses non-PII sentinel data in a separate `voice_direction_storage_self_check` preferences file.
- The receiver can run `reset`, `write`, and `verify` phases.
- The smoke script now runs `reset`, `write`, force-stops the app, then runs `verify`.
- The generated `device-evidence.md` report now includes the self-check broadcast outputs and encrypted storage checklist rows.

## Why This Matters

The app stores sensitive voice-adjacent metadata. Unit tests can prove the storage wrapper behavior, but only a device run can prove Android Keystore works through install, process stop, and restart. This debug receiver gives the device smoke script an automated non-PII proof path without reading or printing user profile values.

## Privacy Boundary

- The self-check uses a fixed sentinel string, not speaker names, phrases, transcripts, PCM, or embeddings.
- It writes to a separate debug preference file, not the user profile store.
- Evidence output records only booleans and broadcast result status.

## Trial/Error Notes

- The receiver is placed under `src/debug`, so it is included in debug APK evidence builds but not intended as a production surface.
- The app data restart proof is still manual because the script should not create real speaker profiles or trigger phrases on behalf of the user.
- If the self-check fails on a connected phone, the smoke script fails instead of writing a misleading evidence report.

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

- Gradle test/build passed.
- Canonical JSON validation passed.
- Smoke script syntax/help passed.
- No-device smoke path exits with code `2`, as expected when no ADB device is attached.

## Next Work

1. Connect a physical Android phone.
2. Run `scripts/android-device-smoke-test.sh --write-evidence`.
3. Confirm the generated report shows encrypted storage self-check as `script-pass`.
4. Complete the manual app data restart rows for real profile/settings/event/cue data.
