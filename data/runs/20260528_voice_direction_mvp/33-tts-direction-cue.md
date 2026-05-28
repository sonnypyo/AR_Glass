# TTS Direction Cue Fallback

Date: 2026-05-28 KST

## Goal

Add a conservative audio cue path for displayless glasses, display-off states, and early phone testing where the visual glasses cue is not available yet.

## Implemented

- Added `AndroidTextToSpeechAlertAdapter` as an `AlertOutputAdapter` for the `TTS` channel.
- Added `TtsCueTextFormatter` for short Korean direction-only cue text.
- Wired the TTS adapter into `AndroidListeningEngineFactory`, so actionable detections now route through phone notification, phone vibration, TTS, Meta stub, and Android XR stub outputs.
- Added unit tests that verify the cue text contains direction wording and does not include the stored speaker label.
- Updated device evidence templates to require manual confirmation that the spoken cue is heard.

## Privacy Boundary

- The spoken text intentionally avoids speaker labels.
- The cue does not include transcripts.
- No audio, environment recording, or TTS output recording is stored by this path.
- Evidence should record only whether the direction-only cue was heard.

## Trial/Error Notes

- Glasses-side per-side vibration is still unconfirmed in official docs, so TTS is a better immediate fallback than pretending wearable haptics exists.
- TTS cannot prove direction accuracy; it only proves the alert output path.
- This path still needs real phone and Bluetooth route tests because desktop unit tests cannot prove audible behavior.

## Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test
```

Result:

- `test`: passed after adding the TTS direction cue formatter and adapter.

## Next Work

- Run the physical Android phone smoke test and record the TTS row in `device-evidence.md`.
- Connect Ray-Ban or Android XR glasses as a Bluetooth audio route and check whether the cue is audible through the expected output route.
- Keep TTS as fallback output even after real Meta DAT or Android XR display adapters are implemented.
