# Stage 63 - Production Speaker Model Evaluation

Date: 2026-05-28 KST

Status: verified

## Goal

Turn the `production-speaker-model` blocker into a measurable model-selection and evaluation gate.

## Added

- `docs/21-production-speaker-model-evaluation.md`
- `apps/voice-direction-glass/model-assets/speaker-verifier/manifest.json`
- `scripts/validate-production-speaker-model-readiness.mjs`

## Current State

No production speaker model has been selected.

The current app still uses prototype acoustic feature matching for local pipeline testing only.

## Submission Meaning

This stage does not make speaker verification production-ready.

It defines the minimum evidence needed before external beta:

- selected on-device model/runtime
- model file hash and input contract
- same-speaker and different-speaker aggregate trials
- false accept/false reject operating point
- replay/spoof mitigation decision
- p95 latency on the lowest target phone
- local-only privacy proof

## Verification

From the repository root:

```bash
node --check scripts/validate-production-speaker-model-readiness.mjs
node scripts/validate-production-speaker-model-readiness.mjs --json
node scripts/validate-production-speaker-model-readiness.mjs --require-model-ready --json
node scripts/audit-service-readiness.mjs --write-report --report-dir data/runs/20260528_voice_direction_mvp/52-service-readiness-audit
```

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug bundleRelease
```

Result:

- Default production speaker model validation passed.
- Strict model-ready validation failed as expected because no model candidate or aggregate evaluation evidence exists.
- Service readiness audit was regenerated and now includes `docs/21-production-speaker-model-evaluation.md`.
- Gradle `test assembleDebug bundleRelease` passed after the release readiness text update.

## Remaining Gates

- Model file is missing.
- Evaluation metrics are not run.
- Anti-spoofing decision is not selected.
- Strict model-ready validation must fail until real evidence exists.
- `production-speaker-model` remains `BLOCKED`.

## Trial/Error Notes

- Prototype `embedding:v1:` references are intentionally excluded from production readiness.
- A speaker verifier without replay/synthetic risk review would be unsafe to market as identity recognition.
