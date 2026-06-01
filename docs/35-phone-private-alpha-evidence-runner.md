# Phone Private Alpha Evidence Runner

Date: 2026-05-28 KST

## Purpose

This document defines the phone-private-alpha evidence runner. The runner wraps the current phone evidence path into one repeatable command:

1. Build and test the debug APK.
2. Run Android phone smoke evidence collection.
3. Validate the generated `device-evidence.md` when it exists.
4. Extract and validate a non-PII direction evidence summary when `device-evidence.md` exists.
5. Run the direction manifest apply gate in dry-run mode when a direction summary exists.
6. Regenerate the service readiness audit.
7. Write a non-PII phone-alpha summary.

## Command

```bash
scripts/run-phone-private-alpha-evidence.mjs
```

Useful options:

```bash
scripts/run-phone-private-alpha-evidence.mjs --json
scripts/run-phone-private-alpha-evidence.mjs --skip-build --json
scripts/run-phone-private-alpha-evidence.mjs --main-only --json
scripts/run-phone-private-alpha-evidence.mjs --evidence-dir data/runs/<run>/android-phone-smoke --report-dir data/runs/<run>/phone-alpha-runner --json
```

Local no-device check:

```bash
scripts/run-phone-private-alpha-evidence.mjs --skip-build --allow-no-device --json
```

`--allow-no-device` is only for local workflow verification. It must not be used as phone-private-alpha evidence.

Operator-pack phone lane for a real test day:

```bash
RUN_PHONE=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
```

## Outputs

Default output folder:

```text
data/runs/20260528_voice_direction_mvp/88-phone-private-alpha-evidence-runner
```

Expected files:

- `phone-alpha-evidence-summary.md`
- `phone-alpha-evidence-summary.json`
- `android-phone-smoke/device-evidence.md` when a phone is attached and the smoke script succeeds.
- `direction-evidence/direction-evidence-summary.json` when device evidence exists.
- `direction-evidence/direction-evidence-summary.md` when device evidence exists.
- `direction-evidence/manifest-update-template.json` when device evidence exists.
- `service-readiness-audit/service-readiness-audit.md`

## Evidence Rules

The runner summary stores only:

- Aggregate ADB counts.
- Command labels.
- Exit codes.
- Booleans.
- Timestamps.
- Workspace-relative paths.

It must not store:

- ADB serials.
- Bluetooth product names or MAC addresses.
- Raw audio, PCM, transcripts, speaker names, embeddings, encrypted payload values, private alert text, or exact locations.

## Promotion Rule

Phone private alpha is not ready just because this runner exists. It is ready only after:

- A physical Android phone run creates `device-evidence.md`.
- `scripts/validate-device-evidence.mjs <device-evidence.md> --json` passes.
- `scripts/extract-direction-evidence-summary.mjs <device-evidence.md> --json` writes a direction summary.
- `scripts/validate-direction-evidence-summary.mjs <direction-evidence-summary.json> --json` passes.
- `scripts/apply-direction-evidence-summary.mjs <direction-evidence-summary.json> --json` dry-run passes.
- Manual rows are filled with non-PII observations.
- `scripts/audit-service-readiness.mjs --write-report` is regenerated.
- Release readiness still has no open phone-private-alpha blockers.

Validate the runner summary after every run:

```bash
scripts/validate-phone-private-alpha-evidence-runner.mjs data/runs/<run>/phone-alpha-evidence-summary.json --json
```

Use strict mode only after a real phone evidence run:

```bash
scripts/validate-phone-private-alpha-evidence-runner.mjs data/runs/<run>/phone-alpha-evidence-summary.json --require-phone-alpha-candidate --json
```

## Trial/Error Notes

- The runner intentionally does not persist child command stdout/stderr because ADB and Android output can include private identifiers.
- No-device execution is useful for validating workflow shape, but it remains non-evidence.
- The runner does not replace the broader physical session pack; it is the final phone evidence command for the phone-alpha gate.
- The hardware test operator pack wraps this runner and keeps dry-run phone evidence inside the operator folder so day-of-test outputs stay grouped.
- Direction extraction is default validation only. It keeps `productionDirectionCandidate=false` until strict controlled phone and wearable direction evidence exists.
- Direction manifest apply is dry-run only inside the phone runner. It must never write the canonical direction manifest during phone evidence collection.

## Verification

```bash
node --check scripts/run-phone-private-alpha-evidence.mjs
node --check scripts/validate-phone-private-alpha-evidence-runner.mjs
scripts/run-phone-private-alpha-evidence.mjs --help
scripts/run-phone-private-alpha-evidence.mjs --skip-build --allow-no-device --json
scripts/validate-phone-private-alpha-evidence-runner.mjs --json
scripts/validate-phone-private-alpha-evidence-runner.mjs --require-phone-alpha-candidate --json
```

On a machine without an attached authorized phone, the no-device runner command should write a summary that says phone-private-alpha evidence is still missing, default summary validation should pass, and strict validation should fail.
