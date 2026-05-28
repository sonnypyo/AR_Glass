# Glasses Private Alpha Evidence Runner

Date: 2026-05-28 KST

## Purpose

This runner gives the Ray-Ban Display, Ray-Ban Meta Gen 1 fallback, and Android XR hardware path the same automation shape as the phone-private-alpha runner. It validates the current glasses hardware session, checks draft and strict hardware gates, dry-runs the manifest apply step, checks the glasses-alpha service gate, regenerates a service-readiness audit, and writes a non-PII summary.

It does not make glasses private alpha ready by itself. Default mode is expected to keep `glassesPrivateAlphaCandidate=false` until real phone evidence, Meta DAT credentials, Ray-Ban Display proof, Ray-Ban Gen 1 fallback proof, Android XR projected proof, and haptics/fallback evidence are collected and reviewed.

## Commands

Default no-hardware workflow:

```bash
scripts/run-glasses-private-alpha-evidence.mjs --json
```

Validate the generated summary:

```bash
scripts/validate-glasses-private-alpha-evidence-runner.mjs --json
```

Strict candidate validation, expected to fail until real evidence exists:

```bash
scripts/validate-glasses-private-alpha-evidence-runner.mjs --require-glasses-alpha-candidate --json
```

Hardware-day execution, only when the session can actually collect Ray-Ban/Android XR evidence:

```bash
scripts/run-glasses-private-alpha-evidence.mjs \
  --session-dir data/runs/<run>/glasses-hardware-session \
  --report-dir data/runs/<run>/glasses-alpha-runner \
  --run-session \
  --json
```

Operator-pack hardware-day execution:

```bash
RUN_GLASSES=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
```

## Output

Default report paths:

- `data/runs/20260528_voice_direction_mvp/92-glasses-private-alpha-evidence-runner/glasses-alpha-evidence-summary.md`
- `data/runs/20260528_voice_direction_mvp/92-glasses-private-alpha-evidence-runner/glasses-alpha-evidence-summary.json`
- `data/runs/20260528_voice_direction_mvp/92-glasses-private-alpha-evidence-runner/service-readiness-audit/service-readiness-audit.md`

The summary records:

- session directory
- whether session commands ran
- manifest readiness booleans
- strict hardware validation result
- glasses-alpha service gate result
- glasses hardware evidence candidate boolean
- glasses private alpha candidate boolean
- command labels, statuses, exit codes, and `rawOutputPersisted=false`
- next actions

## Privacy Guardrail

The runner summary must not include raw command output, raw audio, PCM, transcripts, speaker names, voice embeddings, encrypted payload values, Bluetooth product names, MAC addresses, private alert text, or exact locations.

The validator scans the summary for private structured fields and rejects summaries that persist command output previews.

## Current Result

The current no-hardware run is valid workflow evidence only:

- `glassesHardwareEvidenceCandidate=false`
- `glassesPrivateAlphaCandidate=false`
- strict glasses hardware validation is expected-fail
- glasses-alpha service gate is expected-fail
- no raw output is persisted

## Trial/Error Notes

- The existing `run-private-alpha-hardware-rehearsal.mjs` coordinates phone/support/glasses at the top level. This runner is narrower and focused on the glasses lane so hardware testers can rerun the Ray-Ban/Android XR path without running phone/support steps.
- The generated hardware operator pack wraps this runner for test-day use so glasses evidence can be executed beside phone/support readiness checks without copying raw output or private evidence.
- `--run-session` is intentionally explicit because the session command may build the app, regenerate preflight, and should only be used when hardware evidence can actually be collected or refreshed.
- Strict candidate validation must continue to fail until the strict hardware validator and `scripts/assert-service-gates.mjs --profile glasses-alpha --json` both pass.

## Verification

From the repository root:

```bash
node --check scripts/run-glasses-private-alpha-evidence.mjs
node --check scripts/validate-glasses-private-alpha-evidence-runner.mjs
scripts/run-glasses-private-alpha-evidence.mjs --json
scripts/validate-glasses-private-alpha-evidence-runner.mjs --json
scripts/validate-glasses-private-alpha-evidence-runner.mjs --require-glasses-alpha-candidate --json
```

Result:

- Syntax checks passed.
- Default runner summary passed with `glassesPrivateAlphaCandidate=false`.
- Strict candidate validation failed as expected because real glasses and phone alpha evidence are missing.
