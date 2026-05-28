# Hardware Test Promotion Validator

Date: 2026-05-28 KST

## Purpose

This document defines the validator that reads a generated hardware test operator pack and decides whether the pack is only workflow evidence or whether it satisfies a stricter promotion profile.

The validator does not collect hardware evidence. It checks the already generated operator pack, phone summary, glasses summary, support drill gate, and service gate assertion profile.

## Commands

Default workflow validation:

```bash
scripts/validate-hardware-test-promotion.mjs --profile workflow --json
```

Write a report under the operator pack:

```bash
scripts/validate-hardware-test-promotion.mjs \
  data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack \
  --profile workflow \
  --write-report \
  --report-dir data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/promotion-validation \
  --json
```

Strict profiles:

```bash
scripts/validate-hardware-test-promotion.mjs --profile current-safe --json
scripts/validate-hardware-test-promotion.mjs --profile phone-alpha --json
scripts/validate-hardware-test-promotion.mjs --profile glasses-alpha --json
scripts/validate-hardware-test-promotion.mjs --profile support-ready --json
scripts/validate-hardware-test-promotion.mjs --profile private-alpha --json
```

## Profiles

| Profile | Meaning |
| --- | --- |
| `workflow` | Operator pack structure, phone summary, glasses summary, and support draft validator pass, but no promotion claim is made. |
| `current-safe` | Same workflow checks plus `scripts/assert-service-gates.mjs --profile current-safe --json`. |
| `phone-alpha` | Requires strict phone runner summary and phone-alpha service gate. |
| `glasses-alpha` | Requires strict phone runner summary, strict glasses runner summary, and glasses-alpha service gate. |
| `support-ready` | Requires strict support drill evidence. |
| `private-alpha` | Requires phone alpha, glasses alpha, and support strict evidence. |

## Output

When `--write-report` is used, the validator writes:

- `promotion-validation.json`
- `promotion-validation.md`

Default operator-pack output:

```text
data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/promotion-validation/
```

## Current Result

The current no-hardware operator pack passes:

```bash
scripts/validate-hardware-test-promotion.mjs --profile workflow --json
scripts/validate-hardware-test-promotion.mjs --profile current-safe --json
```

The following strict profiles fail as expected:

```bash
scripts/validate-hardware-test-promotion.mjs --profile phone-alpha --json
scripts/validate-hardware-test-promotion.mjs --profile glasses-alpha --json
scripts/validate-hardware-test-promotion.mjs --profile support-ready --json
```

Current candidate state:

- `phonePrivateAlphaCandidate=false`
- `glassesHardwareEvidenceCandidate=false`
- `glassesPrivateAlphaCandidate=false`
- authorized or attached ADB device count: `0`
- Meta application id present: `false`
- GitHub token present: `false`

## Promotion Rule

Do not use `workflow` or `current-safe` as a release approval. They prove orchestration and safe non-promotion only.

Use `phone-alpha`, `glasses-alpha`, `support-ready`, or `private-alpha` only after the matching hardware or support evidence has been collected and reviewed.

Direction evidence summaries are a separate input. A promotion profile must not be treated as direction readiness unless `scripts/validate-direction-evidence-summary.mjs --require-production-direction-candidate --json`, `scripts/apply-direction-evidence-summary.mjs --write --json`, and `scripts/validate-direction-accuracy-evidence.mjs --require-production-direction-ready --json` also pass.

The phone runner also records `phoneDirectionManifestApplyDryRunOk` and `phoneDirectionManifestApplyReady` via its direction evidence section. These are visibility fields for test-day review; `phoneDirectionManifestApplyReady=false` is expected until strict production-direction evidence exists.

## Trial/Error Notes

- The first CLI parser treated `--profile workflow` as if `workflow` were the pack path. The script now skips option values when finding positional arguments.
- The validator writes only summarized non-PII status. It does not persist child command stdout, stderr, ADB identifiers, Bluetooth names, transcripts, audio, embeddings, or private alert text.
- A passing `workflow` profile is expected before hardware evidence exists. Strict profile failures are the correct result until real phone, glasses, and support evidence exists.

## Verification

From the repository root:

```bash
node --check scripts/validate-hardware-test-promotion.mjs
scripts/validate-hardware-test-promotion.mjs --profile workflow --json
scripts/validate-hardware-test-promotion.mjs --profile current-safe --json
scripts/validate-hardware-test-promotion.mjs --profile phone-alpha --json
scripts/validate-hardware-test-promotion.mjs --profile glasses-alpha --json
scripts/validate-hardware-test-promotion.mjs --profile support-ready --json
data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
```

Result:

- Syntax check passed.
- `workflow` and `current-safe` passed.
- `phone-alpha`, `glasses-alpha`, and `support-ready` failed as expected without real evidence.
- Operator pack default run wrote `promotion-validation/promotion-validation.json` and `.md`.
