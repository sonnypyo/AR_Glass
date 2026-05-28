# Phone Private Alpha Runner Validator

Date: 2026-05-28 KST

## Purpose

This document defines the validator for the phone-private-alpha evidence runner summary. The validator checks that the runner output remains useful evidence metadata without accidentally claiming phone alpha readiness or storing private command output.

## Command

```bash
scripts/validate-phone-private-alpha-evidence-runner.mjs
```

Validate a specific summary:

```bash
scripts/validate-phone-private-alpha-evidence-runner.mjs data/runs/<run>/phone-alpha-evidence-summary.json --json
```

Strict mode, only after a real phone run:

```bash
scripts/validate-phone-private-alpha-evidence-runner.mjs data/runs/<run>/phone-alpha-evidence-summary.json --require-phone-alpha-candidate --json
```

## What It Checks

- Summary JSON exists and parses.
- Workspace-relative paths stay inside the repository.
- ADB status is aggregate counts only.
- Command rows store labels/status/exit codes only.
- Every command row has `rawOutputPersisted=false`.
- Direction evidence summary fields exist and stay workspace-relative.
- Direction manifest apply dry-run fields exist and stay non-writing.
- When `device-evidence.md` exists, direction summary extraction and default direction summary validation must pass.
- When `device-evidence.md` exists, direction manifest apply dry-run must pass.
- No forbidden raw/private keys such as `stdout`, `stderr`, `logcat`, `deviceSerial`, `speakerName`, or `transcript` are present.
- No obvious private structured text such as MAC addresses, raw PCM fields, transcripts, speaker labels, embeddings, or encrypted payload values appears.
- No-device dry runs cannot set `phonePrivateAlphaCandidate=true`.
- A phone alpha candidate must have exactly one authorized ADB phone, existing device evidence, validator-passing device evidence, existing validator-passing direction evidence summary, `allowNoDevice=false`, and all command statuses passing.

Direction manifest apply dry-run fields are part of the summary shape:

- `directionEvidence.applyDryRunOk`
- `directionEvidence.applyReady`
- `directionEvidence.applyWroteManifest`
- `directionEvidence.applyWroteAggregateEvidence`

`applyWroteManifest` and `applyWroteAggregateEvidence` must stay `false` because the phone runner only records a dry-run.

## Current Expected State

The current local summary is a no-device dry run:

```text
data/runs/20260528_voice_direction_mvp/88-phone-private-alpha-evidence-runner/phone-alpha-evidence-summary.json
```

Default validation passes because the summary is structurally valid and non-PII. Strict validation fails because no physical phone evidence exists.

## Trial/Error Notes

- A validator-passing no-device summary is not a phone-private-alpha candidate.
- The strict mode is intentionally unavailable until real phone evidence exists.
- The validator does not inspect Android runtime behavior directly; it validates the runner summary and delegates `device-evidence.md` checks to `scripts/validate-device-evidence.mjs` when that file exists.
- Direction evidence summary validation is still not production direction proof. Strict direction candidate validation remains separate.

## Verification

```bash
node --check scripts/validate-phone-private-alpha-evidence-runner.mjs
scripts/validate-phone-private-alpha-evidence-runner.mjs --json
scripts/validate-phone-private-alpha-evidence-runner.mjs --require-phone-alpha-candidate --json
```

Expected result:

- Default validation returns `"ok": true`.
- Strict validation fails until a real phone run produces validator-passing `device-evidence.md`.
