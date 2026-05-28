# Phone Runner Direction Apply Dry-Run Integration

Date: 2026-05-28 KST

## Goal

Connect the direction manifest apply gate to the phone-private-alpha runner and hardware-day status surfaces.

## Why

The phone runner already extracts and validates direction summaries after a real `device-evidence.md` exists. The next automation step is to record whether that summary could safely promote the canonical direction manifest, without actually writing the manifest during phone evidence collection.

## Implemented

- Updated `scripts/run-phone-private-alpha-evidence.mjs`.
- Updated `scripts/validate-phone-private-alpha-evidence-runner.mjs`.
- Updated `scripts/validate-hardware-test-promotion.mjs`.
- Updated `scripts/summarize-hardware-test-status.mjs`.
- Updated phone-runner direction evidence docs and service reports.

## Runner Behavior

When `device-evidence.md` exists, the phone runner now runs:

```bash
node scripts/apply-direction-evidence-summary.mjs <runner>/direction-evidence/direction-evidence-summary.json --json
```

It stores only non-PII booleans and paths:

- `directionEvidence.applyDryRunOk`
- `directionEvidence.applyDryRunExitCode`
- `directionEvidence.applyReady`
- `directionEvidence.applyWroteManifest`
- `directionEvidence.applyWroteAggregateEvidence`
- `directionEvidence.canonicalManifestPath`
- `directionEvidence.aggregateEvidencePath`

The phone runner never uses `--write`.

## Current Result

No-device runner mode records the apply dry-run step as skipped:

- `directionEvidence.exists=false`
- `directionEvidence.applyDryRunOk=false`
- `directionEvidence.applyReady=false`
- `directionEvidence.applyWroteManifest=false`
- `directionEvidence.applyWroteAggregateEvidence=false`

The runner validator passes default mode and strict phone-alpha mode fails as expected.

The operator-pack promotion validator and hardware dashboard now surface:

- `phoneDirectionManifestApplyDryRunOk`
- `phoneDirectionManifestApplyReady`

The current no-hardware operator pack records both as `false`.

## Verification

```bash
node --check scripts/run-phone-private-alpha-evidence.mjs
node --check scripts/validate-phone-private-alpha-evidence-runner.mjs
scripts/run-phone-private-alpha-evidence.mjs --skip-build --allow-no-device --evidence-dir data/runs/20260528_voice_direction_mvp/88-phone-private-alpha-evidence-runner/android-phone-smoke --report-dir data/runs/20260528_voice_direction_mvp/88-phone-private-alpha-evidence-runner --json
scripts/validate-phone-private-alpha-evidence-runner.mjs data/runs/20260528_voice_direction_mvp/88-phone-private-alpha-evidence-runner/phone-alpha-evidence-summary.json --json
scripts/validate-phone-private-alpha-evidence-runner.mjs data/runs/20260528_voice_direction_mvp/88-phone-private-alpha-evidence-runner/phone-alpha-evidence-summary.json --require-phone-alpha-candidate --json
data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
scripts/summarize-hardware-test-status.mjs --write-report --json
```

Result:

- Syntax checks passed.
- No-device runner passed in workflow mode.
- Runner summary validation passed.
- Strict phone-alpha validation failed as expected.
- Operator pack default workflow passed.
- Hardware dashboard reports direction manifest apply dry-run fields and keeps phone evidence blocked.

## Trial/Error Notes

- Apply dry-run output is parsed in memory. The runner summary stores only selected booleans and workspace-relative paths, not command stdout/stderr.
- `applyReady=true` is not required for phone private alpha. It is a stricter production-direction signal.
- `applyWroteManifest` and `applyWroteAggregateEvidence` must stay false in phone runner summaries.
