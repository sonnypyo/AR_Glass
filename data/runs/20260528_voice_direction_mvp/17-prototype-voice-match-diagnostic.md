# Prototype Voice Match Diagnostic Stage

Date: 2026-05-28 KST

## Goal

Let the app compare a fresh live voice sample against a stored prototype embedding reference without storing raw audio or triggering alerts.

## Implemented

- `PrototypeVoiceMatchChecker`.
- `PrototypeVoiceMatchSummaryFormatter`.
- Per-profile `프로토타입 음성 매칭 점검` UI action.
- Runtime flow that captures a fresh transient sample, extracts a live prototype embedding, and compares it to the target profile's stored embedding reference.
- `VoiceDirectionGlass` diagnostic event: `prototype_voice_match_completed`.

## Privacy Boundary

- Raw match PCM is discarded immediately.
- The app stores no match sample audio.
- The diagnostic logs only status and confidence bucket information.

## What This Proves

- Stored prototype embeddings can be compared to a live sample.
- The user can gather phone-level evidence before any production model is selected.
- Prototype matching is separated from alert delivery.

## What This Does Not Prove Yet

- Production-grade speaker identity.
- Foreground service live matching.
- Similar-voice false-positive behavior.
- Hardware behavior on a physical Android phone.

## Verification

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test
```

Result: passed.

## Next Work

1. Run enrollment capture and prototype match on a physical phone.
2. Record similarity results across same speaker, different speaker, and noisy room cases.
3. Use that evidence to decide whether the prototype extractor is useful enough for internal testing or should be replaced immediately.
