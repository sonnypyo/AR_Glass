# Operator Pack Privacy Scan Integration

Date: 2026-05-28 KST

## Purpose

This document records the automation change that makes the hardware test operator pack run a pack-level privacy scan before promotion validation.

The goal is to reduce day-of-test operator error: after `RUN_PHONE=1`, `RUN_GLASSES=1`, or `RUN_SUPPORT=1`, the same `commands.sh` that gathers evidence also checks the generated folder for private device, voice, Bluetooth, token, and raw-audio fields.

## Implemented Flow

`data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh` now runs:

```bash
scripts/scan-evidence-privacy.mjs "$PACK_DIR" --write-report --report-dir "$PACK_DIR/evidence-privacy-scan" --json
```

It runs after:

- hardware readiness preflight
- current-safe service gate assertion
- phone-private-alpha workflow summary
- glasses-private-alpha workflow summary
- optional phone/glasses/support lanes
- pack service-readiness audit

It runs before:

- operator pack validation
- workflow promotion validation

## Generated Pack Artifacts

- `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/evidence-privacy-scan/evidence-privacy-scan.md`
- `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/evidence-privacy-scan/evidence-privacy-scan.json`

Current pack-scoped result:

- Result: pass.
- Files scanned: 16.
- Violations: 0.
- Warnings: 0.

## Dashboard Integration

`scripts/summarize-hardware-test-status.mjs` now runs the operator-pack privacy scan as part of the default lane check and reports:

- `evidencePrivacyScan.ok`
- scanned file count
- violation count
- warning count

The default no-hardware lane is not `ready` if the privacy scan fails.

## What This Proves

- The generated operator pack can execute the privacy scan automatically without attached hardware.
- The hardware status dashboard includes privacy-scan state when deciding whether the default workflow is safe.
- Promotion validation is no longer the next step after service audit unless the pack privacy scan passes first.

## What This Does Not Prove

- It does not prove that real phone, Ray-Ban, Android XR, or support evidence exists.
- It does not replace manual review of evidence before sharing.
- It does not approve phone alpha, glasses alpha, private alpha, beta, or production.

## Trial/Error Notes

- A separate default scanner remains useful for cross-run reports, but the operator pack needs a local scan because hardware-day artifacts are produced under the pack folder.
- The dashboard initially carried parsed child command output in its JSON. It now keeps only compact check labels/statuses and scanner counts to maintain the non-PII shape.
