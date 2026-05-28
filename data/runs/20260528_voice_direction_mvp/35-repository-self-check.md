# Repository Self-Check Automation

Date: 2026-05-28 KST

## Goal

Add a debug-only ADB proof that the real repository path can persist a direction validation trial through encrypted preferences and survive an app force-stop.

## Implemented

- Added `RepositorySelfCheckReceiver` under the debug source set.
- Added debug manifest action `com.voicedirection.glass.qa.DEBUG_REPOSITORY_SELF_CHECK`.
- Added isolated repository construction support in `PreferencesVoiceDirectionRepository`, so the debug self-check uses the same repository code path without touching real app data.
- Added `scripts/android-device-smoke-test.sh` repository self-check phases: reset, write, force-stop, verify.
- Added evidence report rows for repository direction-validation self-check output.

## Privacy Boundary

- The self-check writes only a fixed non-PII direction validation trial.
- It uses a separate debug-only preferences file.
- It does not read, write, clear, or export the user's real speaker profiles, trigger phrases, events, feedback, or latest cue.

## Trial/Error Notes

- This does not replace manual direction trials. It proves persistence and encryption for the trial data path.
- A physical phone is still required to turn the self-check from code-ready into device evidence.

## Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon testDebugUnitTest
```

From the repository root:

```bash
bash -n scripts/android-device-smoke-test.sh
scripts/android-device-smoke-test.sh --help
```

Result:

- `testDebugUnitTest`: passed.
- ADB smoke script syntax/help path passed.

## Next Work

- Run `scripts/android-device-smoke-test.sh --write-evidence` with a physical Android phone.
- Confirm `Repository direction-validation self-check: script-pass` appears in `device-evidence.md`.
