# Encrypted Local Storage Stage

Date: 2026-05-28 KST

## Goal

Move sensitive local app strings away from plaintext preference values before any external beta path.

## Implemented

- Added `AndroidKeyStoreStringCipher` using app-local AES-GCM keys in Android Keystore.
- Added `SecureStoragePayloadCodec` with `enc:v1:` payload envelopes.
- Added `SecurePreferencesStringStore` so repository writes encrypted values while still reading legacy plaintext only when no encrypted value exists.
- Updated `PreferencesVoiceDirectionRepository` so profiles, settings, events, latest glasses cue snapshots, and service bridge snapshots are saved through the secure store.
- Added JVM unit tests for secure payload parsing and secure preference migration behavior.
- Updated release readiness from blocked to manual-required for encrypted storage because the code path exists but physical-device migration proof is still missing.

## Why This Matters

The app stores speaker labels, trigger phrases, prototype embedding references, and detection metadata. These are not raw audio, but they are still sensitive. External tester builds need encrypted local storage before real voice profiles are used.

## Trial/Error Notes

- I did not add a third-party security dependency. The implementation uses Android Keystore directly to avoid dependency churn while the project is still a native prototype.
- Legacy plaintext keys are not treated as valid if an encrypted value exists but cannot decrypt. Falling back in that case could revive stale plaintext after a key or payload failure.
- This does not prove runtime Keystore behavior yet. Android Keystore must still be verified on a real device by creating data, restarting the app, and confirming the encrypted values load.

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

- Gradle test/build passed after adding secure storage code and tests.
- Canonical JSON validation passed.
- Smoke script syntax/help passed.
- No-device smoke path exits with code `2`, as expected when no ADB device is attached.

## Next Work

1. Install on a physical Android phone.
2. Create a speaker profile, save settings, run a detection, restart the app, and verify data loads from encrypted values.
3. Confirm no legacy plaintext value remains for profile, settings, events, latest cue, or service bridge keys after a write.
4. Fill the encrypted storage rows in the generated `device-evidence.md`.
