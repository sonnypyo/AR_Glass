# Implementation Stage

Date: 2026-05-28 KST

## What Was Added

Created `apps/voice-direction-glass`, a native Android scaffold for the first MVP.

## Implemented Components

- Android Gradle project structure.
- Jetpack Compose host UI.
- Runtime permission request shell.
- Simulated transcript, trigger phrase, and direction controls.
- Direction estimator abstraction.
- Speaker verifier abstraction.
- Alert router.
- Android phone notification adapter.
- Android phone vibration adapter.
- Meta DAT display stub adapter.
- Android XR display stub adapter.
- Projected glasses activity placeholder.
- Local speaker profile storage.
- Detection event history storage.
- Local data deletion flow.
- One-shot Android `SpeechRecognizer` controller connected to event fusion and alert routing.
- Android foreground listening service with microphone service type.
- Persistent listening notification with app-open and stop actions.
- Service-owned repeated speech recognition prototype.
- Persisted trigger phrase and simulated direction settings.
- Latest actionable glasses cue storage.
- Projected cue screen that renders the latest saved cue.
- Phone-side projected cue preview action.
- Stereo PCM rough left/right direction estimator.
- AudioRecord capability probe for mono/stereo support hints.
- In-memory AudioRecord stereo direction sample diagnostic.
- Android device smoke test script for install/activity launch checks.
- Unit-test files for simulator logic.

## Why Stubs Are Used For Glasses SDKs

Meta DAT and Android XR are preview-stage integrations and require local tooling, credentials, and hardware sessions. The current scaffold keeps these integrations behind adapter interfaces so implementation can proceed without blocking the core product flow.

## Verification Status

Build verified with local command-line tooling.

- `./gradlew --no-daemon test`: passed.
- `./gradlew --no-daemon assembleDebug`: passed.

The second verification pass after local storage and speech recognition changes also passed both commands.

The third verification pass after adding the foreground listening service also passed both `test` and `assembleDebug`.

The fourth verification pass after routing speech recognition into detection also passed both `test` and `assembleDebug`.

The fifth verification pass after adding service-owned repeated recognition and settings storage also passed both `test` and `assembleDebug`.

The sixth verification pass after adding latest glasses cue storage and projected cue screen wiring also passed both `test` and `assembleDebug`.

The seventh verification pass after adding the preview action and stereo PCM estimator also passed both `test` and `assembleDebug`.

The eighth verification pass after adding the AudioRecord capability probe also passed both `test` and `assembleDebug`.

The ninth verification pass after adding the in-memory audio direction sample also passed both `test` and `assembleDebug`.

The ADB smoke test script was syntax-checked and confirmed to fail clearly when no device is attached.

## Next Step

Install the refreshed APK on a physical Android phone and verify the service-owned recognition loop, then add Meta DAT dependencies and device session code after the Meta Wearables application ID and GitHub package token are available.
