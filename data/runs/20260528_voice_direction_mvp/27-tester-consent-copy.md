# Tester Consent Copy Stage

Date: 2026-05-28 KST

## Goal

Make the external-beta privacy and limitation language visible in the app instead of leaving it only in engineering docs.

## Implemented

- Added `TesterConsentCopy`.
- Added `VoiceDirectionTesterConsent.copy` with Korean tester-facing copy.
- Added unit tests that verify the copy covers storage, non-storage, prototype limits, front/back limits, and deletion.
- Replaced the small privacy card with a `테스터 동의와 한계` card in the host app.
- Updated release readiness evidence for `privacy-consent-copy`: copy exists in code/UI, but tester/policy review remains manual.

## Why This Matters

The app handles voice-adjacent biometric data. Testers must see what is stored, what is not stored, what the prototype cannot guarantee, and how to delete local data before this can be considered for external beta.

## Privacy Boundary

The copy explicitly says:

- Original audio/PCM is not stored.
- Full recognized sentences are not stored.
- Contacts, location, and cloud upload data are not stored.
- Prototype voice matching is not a guaranteed identity model.
- Front/back direction is not verified.
- Glasses haptics and real Meta DAT/Android XR output remain behind hardware gates.

## Trial/Error Notes

- I kept this as a review-ready draft rather than marking the gate fully passed. Real tester/policy/legal review is still outside the current local build evidence.
- The UI copy is intentionally direct and short so it can be read in the app before running tests.

## Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- Gradle test/build passed after adding tester consent copy and host app card.
- Canonical JSON validation passed.
- Smoke script syntax/help passed.
- No-device smoke path exits with code `2`, as expected when no ADB device is attached.

## Next Work

1. Review the wording with real testers and policy/legal criteria.
2. Add any required jurisdiction-specific biometric/recording disclosure before external beta.
