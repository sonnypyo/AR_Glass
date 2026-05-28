# Detection Latency Metadata

Date: 2026-05-28 KST

## Goal

Record privacy-safe detection processing latency so the app can later verify the product success metric of fast alerts without storing transcripts or raw audio.

## Implemented

- Added `processingLatencyMillis` to `DetectionEvent`.
- Added backward-compatible event decoding for legacy records without latency.
- Added `DetectionLatencySummarizer` for total, recorded, latest, average, and over-target latency counts.
- Added latency recording in the simulation and prototype voice session engines.
- Added latency fields to non-PII evidence snapshot output.
- Added latency display in the latest detection and event history cards.
- Added latency keys to the device evidence validator fixture.

## Privacy Boundary

Latency is metadata only. It does not store transcript text, raw audio, PCM, embeddings, or encrypted payload values in evidence output.

## Trial/Error Notes

- This measures app-side processing after the recognition callback enters the engine, not full acoustic wake-to-alert latency.
- Physical phone tests still need to record end-to-end behavior because Android `SpeechRecognizer`, Bluetooth routing, TTS output, and glasses rendering all add runtime delay outside unit tests.
- Legacy event rows decode with `processingLatencyMillis = null` so existing local data is not discarded.

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
- Latency summarizer, session-engine latency, prototype-engine latency, and legacy codec tests passed.

## Next Work

- Run the physical phone smoke test and confirm the generated evidence snapshot includes latency count fields.
- Compare physical report latency with the 1.5 second product target after real recognition and alert delivery are observed.
