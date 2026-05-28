# Speaker Consent Gate

Date: 2026-05-28 KST

## Goal

Require explicit consent confirmation before adding a saved speaker label, because the product stores voice-related profile metadata and can later collect enrollment samples.

## Implemented

- Added `newSpeakerConsentConfirmed` UI state.
- Added a consent checkbox in the saved-speaker card.
- Disabled speaker creation until both speaker name and consent confirmation are present.
- Added a defensive MainActivity guard that refuses speaker creation without consent.
- New profiles now store the current `VoiceDirectionTesterConsent.copy.version` as the profile consent version.
- The consent checkbox resets after profile creation or local data deletion.

## Privacy Boundary

The consent gate does not store any extra private text. It stores only the existing profile consent version and timestamp metadata when a profile is created.

## Trial/Error Notes

- This is still not legal/policy approval for external beta. It is an in-app control that prevents accidental local enrollment during prototype testing.
- Existing seeded/local profiles keep their previous consent version for migration compatibility.
- Physical tester evidence still needs to confirm the UI path before phone private alpha.

## Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- Unit tests passed.
- Debug APK assembled.
- Speaker consent gate compiles into the host app.

## Next Work

- On a physical phone, confirm the `동의받은 화자 라벨 저장` button remains disabled until the consent checkbox is selected.
- Record only pass/fail for the consent gate in device evidence.
