# Direction Evidence Extractor

Date: 2026-05-28 KST

## What Changed

Added a direction evidence extraction and validation step for generated `device-evidence.md` files.

New files:

- `scripts/extract-direction-evidence-summary.mjs`
- `scripts/validate-direction-evidence-summary.mjs`
- `docs/42-direction-evidence-extractor.md`
- `data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor/direction-evidence-summary.json`
- `data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor/direction-evidence-summary.md`
- `data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor/manifest-update-template.json`

## Why

The project already had a direction accuracy manifest and strict validator, but hardware-day evidence still required manual interpretation. The new extractor converts non-PII device evidence into aggregate counts, match rates, microphone metadata, latency fields, and a manifest update template.

## Current Result

The current summary was generated from the validator fixture:

- `fixtureEvidence=true`
- `productionDirectionCandidate=false`
- total trials: `4`
- all-direction match rate: `0.5`
- front/back match rate: `0.5`
- left/right match rate: `0.5`
- p95 direction latency: `null`
- wearable controlled route: `null`

This is workflow evidence only. It must not be used for front/back, glasses, private-alpha, beta, or production direction claims.

## Verification

Commands run:

```bash
node --check scripts/extract-direction-evidence-summary.mjs
node --check scripts/validate-direction-evidence-summary.mjs
scripts/extract-direction-evidence-summary.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --report-dir data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor --json
scripts/validate-direction-evidence-summary.mjs data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor/direction-evidence-summary.json --json
scripts/validate-direction-evidence-summary.mjs data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor/direction-evidence-summary.json --require-production-direction-candidate --json
node scripts/audit-service-readiness.mjs --write-report --report-dir data/runs/20260528_voice_direction_mvp/52-service-readiness-audit
JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk ./gradlew --no-daemon test assembleDebug
```

The Gradle command was run from `apps/voice-direction-glass`.

Result:

- Syntax checks passed.
- Fixture extraction passed.
- Default summary validation passed.
- Strict production-candidate validation failed as expected.
- Service readiness audit was regenerated with the direction evidence extractor artifacts.
- Android unit tests and debug APK assembly passed.

## Next Step

After a real Android phone run, extract the generated `device-evidence.md`, validate the summary in default mode, then run strict validation only when controlled phone and wearable direction evidence exists.
