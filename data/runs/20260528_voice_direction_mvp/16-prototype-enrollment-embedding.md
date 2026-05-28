# Prototype Enrollment Embedding Stage

Date: 2026-05-28 KST

## Goal

Turn accepted enrollment samples into a local embedding reference without storing raw PCM.

## Implemented

- `PrototypeVoiceEmbeddingExtractor` that computes an 11-value feature vector from in-memory PCM.
- `VoiceEnrollmentSampleResult.embedding`.
- `AndroidVoiceEnrollmentSampler` now emits a prototype embedding only for accepted samples.
- Profile enrollment updates now store a weighted-average `embedding:v1:` reference.
- `VoiceEmbedding.weightedAverage(...)` for incremental sample aggregation.
- Unit tests for extractor output and weighted averaging.

## Privacy Boundary

- Raw PCM is still discarded immediately.
- Stored data is limited to profile metadata and the prototype embedding reference.
- Diagnostic logs record whether an embedding was created, not embedding values.

## What This Proves

- The app can reduce a consented sample into a local representation.
- Accepted samples can incrementally update a profile embedding reference.
- The embedding verifier contract has an actual stored reference format to consume later.

## What This Does Not Prove Yet

- Production-grade speaker recognition accuracy.
- Live embedding extraction during foreground listening.
- `EmbeddingSpeakerVerifier` use in the active service path.
- Physical-device enrollment behavior.

## Verification

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test
```

Result: passed.

## Next Work

1. Validate enrollment capture and embedding creation on a physical phone.
2. Replace prototype features with a real on-device speaker embedding model.
3. Produce live embeddings inside a visible foreground session.
4. Route live embeddings into `EmbeddingSpeakerVerifier` only after accuracy testing.
