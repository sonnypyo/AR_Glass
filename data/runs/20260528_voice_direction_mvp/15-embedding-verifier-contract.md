# Embedding Verifier Contract Stage

Date: 2026-05-28 KST

## Goal

Prepare the speaker verification layer for real on-device voice embeddings instead of keeping it transcript-only.

## Implemented

- `VoiceEmbedding` value object.
- `VoiceEmbeddingRefCodec` for local `embedding:v1:` references.
- `SpeakerVerificationInput` with transcript plus optional live embedding.
- `EmbeddingSpeakerVerifier` using cosine similarity.
- Guardrails so only `ON_DEVICE_EMBEDDING` and `MODEL_READY` profiles can be matched by embedding.
- Updated session engine to call the new verifier input contract.

## What This Proves

- The app now has a tested matching component for future local voice embeddings.
- Transcript simulation and embedding verification are distinct paths.
- Profiles with enrollment samples but no generated model are not treated as verified.

## What This Does Not Prove Yet

- Live embedding extraction from microphone audio.
- Embedding generation from accepted enrollment samples.
- Foreground service use of `EmbeddingSpeakerVerifier`.
- Real-device false-positive behavior.

## Verification

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test
```

Result: passed.

## Next Work

1. Choose or implement an on-device speaker embedding extractor.
2. Convert accepted enrollment samples into local `embedding:v1:` references without storing PCM by default.
3. Produce live embeddings during a visible foreground session.
4. Switch `AndroidListeningEngineFactory` to an embedding-capable verifier when a live embedding is available.
