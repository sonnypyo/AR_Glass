# Stage 89: Phone Private Alpha Runner Validator

Date: 2026-05-28 KST

## Decision

Add a validator for phone-private-alpha evidence runner summaries.

## Reasoning

Stage 88 created a phone-first runner, but the runner summary itself needs a contract. Without a validator, a no-device dry run could be mistaken for real evidence, or future changes could accidentally persist raw command output or private device identifiers. The validator makes the summary safe to use as a service-readiness artifact.

## Implemented

- `scripts/validate-phone-private-alpha-evidence-runner.mjs`.
- Default summary validation for `data/runs/20260528_voice_direction_mvp/88-phone-private-alpha-evidence-runner/phone-alpha-evidence-summary.json`.
- Strict `--require-phone-alpha-candidate` mode for real phone runs.
- `docs/36-phone-private-alpha-runner-validator.md`.

## Trial/Error Notes

- Default no-device summary validation passes because it is valid non-PII metadata.
- Strict validation fails until a real phone run creates validator-passing `device-evidence.md`.
- The validator rejects `phonePrivateAlphaCandidate=true` when `allowNoDevice=true`.
- The validator rejects raw/private fields such as stdout, stderr, logcat, device serials, transcripts, speaker names, embeddings, encrypted payload values, and MAC addresses.

## Verification

```bash
node --check scripts/validate-phone-private-alpha-evidence-runner.mjs
scripts/validate-phone-private-alpha-evidence-runner.mjs --json
scripts/validate-phone-private-alpha-evidence-runner.mjs --require-phone-alpha-candidate --json
```

Result:

- Syntax check passed.
- Default summary validation returned `"ok": true`.
- Strict candidate validation failed as expected because `phonePrivateAlphaCandidate=false`.
