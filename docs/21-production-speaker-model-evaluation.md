# Production Speaker Model Evaluation

Date: 2026-05-28 KST

Model status: MODEL_NOT_SELECTED

Evaluation status: NOT_RUN

External submission: not performed

## Purpose

This document defines the minimum evidence needed before Voice Direction Glass can replace prototype acoustic matching with a production-grade on-device speaker verification path.

It is not a selected model, not a trained model, not an anti-spoofing guarantee, not biometric/legal approval, and not permission to claim speaker identity reliability.

## Official Source Snapshot

Checked on 2026-05-28 KST.

| Source | URL | Relevance |
| --- | --- | --- |
| NIST Speaker and Language Recognition | https://www.nist.gov/programs-projects/speaker-and-language-recognition | Speaker-recognition evaluation programs and measurement-science context. |
| NIST Speaker Recognition Evaluation | https://sre.nist.gov/ | Text-independent speaker recognition evaluation goals, task protocols, data, and metrics. |
| NIST 2024 Speaker Recognition Evaluation Plan | https://www.nist.gov/system/files/documents/2024/06/11/NIST_2024_Speaker_Recognition_Evaluation_Plan.pdf | Current-style SRE evaluation-plan structure, metrics, task/data protocol expectations. |
| ASVspoof | https://www.asvspoof.org/ | Spoofing, voice conversion, synthetic speech, replay, and countermeasure evaluation context. |
| TensorFlow Lite for Android | https://android.googlesource.com/platform/external/tensorflow/+/main/tensorflow/lite/g3doc/android/index.md | Android on-device inference requirements: runtime, model, input data, device performance constraints. |
| TensorFlow Lite metadata inference | https://android.googlesource.com/platform/external/tensorflow/+/HEAD/tensorflow/lite/g3doc/inference_with_metadata/overview.md | Model metadata and generated wrapper expectations for safer model integration. |
| TensorFlow Lite audio classifier task API | https://android.googlesource.com/platform/external/tensorflow/+/HEAD/tensorflow/lite/g3doc/android/tutorials/audio_classification.md | Android audio input and on-device audio inference pipeline reference. |

## Current App State

| Area | Current state | Release meaning |
| --- | --- | --- |
| Enrollment samples | App captures short consented samples and discards PCM. | Useful for pipeline tests only. |
| Stored voice reference | Prototype `embedding:v1:` reference can be stored locally. | Not a validated speaker model. |
| Live match | Prototype cosine comparison can run after trigger phrase detection. | Not production speaker verification. |
| Model runtime | No TFLite or equivalent production model is bundled. | External beta remains blocked. |
| Anti-spoofing | No replay/synthetic/voice-conversion countermeasure exists. | Public identity claims are blocked. |
| Thresholds | Prototype `0.80` similarity threshold exists. | Not calibrated and not acceptable for production claims. |

## Candidate Model Manifest

The current model manifest is:

```text
apps/voice-direction-glass/model-assets/speaker-verifier/manifest.json
```

It must stay in `DRAFT_MODEL_NOT_SELECTED` until a real model candidate, file hash, input contract, evaluation results, and review notes exist.

## Evaluation Protocol

Before moving `production-speaker-model` out of `BLOCKED`, run a local evaluation that records only aggregate metrics:

1. Use consented speakers only.
2. Keep raw audio outside repository unless a separate secure test-data policy exists.
3. Split enrollment and verification utterances so the model is not tested on the same sample it enrolled.
4. Include same-speaker trials.
5. Include different-speaker trials.
6. Include noisy room, phone-in-hand, pocket/near-body, and Bluetooth route cases when possible.
7. Include replay attempts from a second device.
8. Include synthetic or voice-converted audio only when legally sourced and documented.
9. Record false accept rate, false reject rate, equal error rate or operating-point equivalent, and no-match rate.
10. Record p50/p95 inference latency and memory footprint on the lowest target Android phone.
11. Record battery/thermal observation during a 30-minute false-positive room test.
12. Record all results as counts and percentages only, not voice content.

## Minimum Promotion Criteria

These are intentionally conservative gates. They can be tightened after real data exists, but they must not be loosened without a documented reason.

| Criterion | Required before external beta |
| --- | --- |
| Model file | On-device `.tflite` or equivalent local model file exists outside generated build output and has SHA-256 recorded. |
| Input contract | Sample rate, channel count, window length, normalization, and embedding dimension are documented. |
| Enrollment | Minimum enrolled sample count and quality threshold are documented. |
| Same-speaker trials | At least 100 aggregate same-speaker verification trials across consented speakers. |
| Different-speaker trials | At least 300 aggregate different-speaker trials across consented speakers. |
| False accept rate | Target operating point is <= 1.0% on the evaluation set before public beta. |
| False reject rate | Target operating point is <= 10.0% on the evaluation set before public beta. |
| Spoof/replay | Replay/synthetic/voice-conversion risk is tested or the app clearly disables identity claims and uses a second confirmation. |
| Latency | p95 model inference plus preprocessing is <= 500 ms on the lowest supported phone. |
| Privacy | No raw audio, PCM, transcripts, or raw embedding vectors are written to generated evidence. |
| Reviewer copy | Public text says "trusted voice cue" only if the measured limits are disclosed and reviewed. |

## Integration Contract

Production integration must provide:

- a local model asset or equivalent on-device runtime
- a stable input preprocessor
- a model-versioned embedding reference format, such as `speaker-model:<modelVersion>:<encodedRef>`
- calibrated thresholds for accept, reject, and no-match
- local-only persistence unless encrypted backup is explicitly designed
- a fallback path that emits no alert when model confidence is low
- device evidence for latency and false-positive behavior
- a migration path from prototype `embedding:v1:` refs that does not treat prototype refs as production-ready

## Validation Command

Default draft validation:

```bash
node scripts/validate-production-speaker-model-readiness.mjs --json
```

Strict validation after a model candidate and evaluation results exist:

```bash
node scripts/validate-production-speaker-model-readiness.mjs --require-model-ready --json
```

The strict mode must fail until model file, hash, thresholds, aggregate evaluation metrics, anti-spoofing decision, latency, and privacy notes are present.

## Release Gate

This document does not close the production speaker model gate.

- `production-speaker-model` remains `BLOCKED`.
- `privacy-consent-copy` remains `MANUAL_REQUIRED`.
- `store-and-sdk-policy-clearance` remains `BLOCKED`.
- `front-back-direction-evidence` remains `BLOCKED`.

## Trial/Error Notes

- Prototype embeddings are useful for app plumbing but cannot calibrate false accept/false reject risk.
- A model can perform well in same-speaker tests and still be unsafe against replay or synthetic audio.
- The threshold must be tied to a documented operating point; it must not be picked because it "feels right" in a small manual test.
- Speaker verification should be treated as a confidence gate for cueing, not as a legal identity assertion.
