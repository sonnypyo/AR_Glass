# Phone Runner Direction Evidence Integration

Date: 2026-05-28 KST

## Purpose

This document defines how the phone-private-alpha evidence runner connects generated phone evidence to direction evidence summaries.

The integration exists so a real `RUN_PHONE=1` hardware pass automatically produces direction summary artifacts after `device-evidence.md` is created. It does not make the app phone-alpha ready by itself, and it does not make production direction claims.

## Runner Behavior

`scripts/run-phone-private-alpha-evidence.mjs` now performs these direction steps when `device-evidence.md` exists:

1. Run `scripts/extract-direction-evidence-summary.mjs <device-evidence.md> --report-dir <runner>/direction-evidence --json`.
2. Run `scripts/validate-direction-evidence-summary.mjs <runner>/direction-evidence/direction-evidence-summary.json --json`.
3. Run `scripts/apply-direction-evidence-summary.mjs <runner>/direction-evidence/direction-evidence-summary.json --json` as dry-run only.
4. Store direction summary paths, candidate booleans, and apply dry-run booleans inside `phone-alpha-evidence-summary.json`.

In no-device mode, the direction steps are recorded as skipped and the summary keeps:

```text
directionEvidence.exists=false
directionEvidence.validatorOk=false
directionEvidence.applyDryRunOk=false
directionEvidence.applyReady=false
directionEvidence.productionDirectionCandidate=false
phonePrivateAlphaCandidate=false
```

## Output Fields

The phone runner summary includes:

- `directionEvidence.exists`
- `directionEvidence.extractorOk`
- `directionEvidence.validatorOk`
- `directionEvidence.applyDryRunOk`
- `directionEvidence.applyReady`
- `directionEvidence.applyWroteManifest`
- `directionEvidence.applyWroteAggregateEvidence`
- `directionEvidence.productionDirectionCandidate`
- `directionEvidence.fixtureEvidence`
- `directionEvidence.totalTrials`
- `directionEvidence.reportDir`
- `directionEvidence.summaryPath`
- `directionEvidence.summaryMarkdownPath`
- `directionEvidence.manifestUpdateTemplatePath`
- `directionEvidence.canonicalManifestPath`
- `directionEvidence.aggregateEvidencePath`

These are non-PII workflow fields. They must not include raw command output, ADB serials, Bluetooth names, transcripts, speaker names, embeddings, PCM, raw audio, or private alert text.

## Operator Pack Behavior

The hardware test operator pack continues to run safely without hardware:

```bash
data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
```

Default no-hardware result:

- `phonePrivateAlphaCandidate=false`
- `directionEvidence.exists=false`
- `directionEvidence.productionDirectionCandidate=false`

When the operator uses a real phone:

```bash
RUN_PHONE=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
```

the phone runner writes direction evidence under:

```text
data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/phone-alpha-runner/direction-evidence/
```

## Promotion Rule

A phone-private-alpha candidate now requires:

- exactly one authorized ADB phone
- generated `device-evidence.md`
- passing `scripts/validate-device-evidence.mjs`
- generated direction evidence summary
- passing `scripts/validate-direction-evidence-summary.mjs`
- passing `scripts/apply-direction-evidence-summary.mjs <summary.json> --json` dry-run
- all phone runner command statuses passing
- `allowNoDevice=false`

This still does not prove production direction readiness. Production direction claims require:

```bash
scripts/validate-direction-evidence-summary.mjs <summary.json> --require-production-direction-candidate --json
scripts/apply-direction-evidence-summary.mjs <summary.json> --write --json
scripts/validate-direction-accuracy-evidence.mjs --require-production-direction-ready --json
```

## Verification

From the repository root:

```bash
node --check scripts/run-phone-private-alpha-evidence.mjs
node --check scripts/validate-phone-private-alpha-evidence-runner.mjs
scripts/run-phone-private-alpha-evidence.mjs --skip-build --allow-no-device --evidence-dir data/runs/20260528_voice_direction_mvp/88-phone-private-alpha-evidence-runner/android-phone-smoke --report-dir data/runs/20260528_voice_direction_mvp/88-phone-private-alpha-evidence-runner --json
scripts/validate-phone-private-alpha-evidence-runner.mjs data/runs/20260528_voice_direction_mvp/88-phone-private-alpha-evidence-runner/phone-alpha-evidence-summary.json --json
scripts/validate-phone-private-alpha-evidence-runner.mjs data/runs/20260528_voice_direction_mvp/88-phone-private-alpha-evidence-runner/phone-alpha-evidence-summary.json --require-phone-alpha-candidate --json
scripts/create-hardware-test-operator-pack.mjs --force --json
scripts/validate-hardware-test-operator-pack.mjs --json
data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
scripts/validate-hardware-test-promotion.mjs --profile workflow --write-report --report-dir data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/promotion-validation --json
scripts/validate-hardware-test-promotion.mjs --profile current-safe --json
scripts/validate-hardware-test-promotion.mjs --profile phone-alpha --json
scripts/validate-hardware-test-promotion.mjs --profile glasses-alpha --json
scripts/validate-hardware-test-promotion.mjs --profile support-ready --json
JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk ./gradlew --no-daemon test assembleDebug
```

The Gradle command is run from `apps/voice-direction-glass`.

Result:

- Syntax checks passed.
- No-device phone runner passed with `directionEvidence.exists=false`.
- No-device phone runner records direction manifest apply dry-run as skipped.
- Default phone runner validation passed.
- Strict phone-alpha validation failed as expected.
- Operator pack generation, validation, and default run passed.
- Promotion validator `workflow` and `current-safe` passed while `phoneDirectionSummaryValidated=false`.
- Strict promotion profiles failed as expected without real phone, glasses, or support evidence.
- Android unit tests and debug APK assembly passed.
