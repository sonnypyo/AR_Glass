# Stage 88: Phone Private Alpha Evidence Runner

Date: 2026-05-28 KST

## Decision

Add a phone-private-alpha evidence runner that wraps build, Android phone smoke evidence, device-evidence validation, service-readiness audit, and a non-PII summary.

## Reasoning

The current service audit shows internal prototype ready but phone private alpha blocked by missing physical Android phone evidence. The project already had a broad physical session pack and the low-level ADB smoke script, but the next operator action should be a single phone-first command that produces a clear evidence summary.

## Implemented

- `scripts/run-phone-private-alpha-evidence.mjs`.
- Default report folder: `data/runs/20260528_voice_direction_mvp/88-phone-private-alpha-evidence-runner`.
- Summary outputs:
  - `phone-alpha-evidence-summary.md`.
  - `phone-alpha-evidence-summary.json`.
- Optional `--allow-no-device` mode for local workflow verification only.
- `docs/35-phone-private-alpha-evidence-runner.md`.

## Trial/Error Notes

- The summary intentionally does not persist raw child command output.
- No-device mode can pass as a local dry run, but it does not create phone-private-alpha evidence.
- Actual phone alpha remains blocked until a physical phone creates a validator-passing `device-evidence.md`.

## Verification

```bash
node --check scripts/run-phone-private-alpha-evidence.mjs
scripts/run-phone-private-alpha-evidence.mjs --help
scripts/run-phone-private-alpha-evidence.mjs --skip-build --allow-no-device --json
```

No-device result:

- Summary files are written.
- `phonePrivateAlphaCandidate` remains `false`.
- Next actions say to connect exactly one authorized Android phone.
- Service readiness audit regenerated under `data/runs/20260528_voice_direction_mvp/88-phone-private-alpha-evidence-runner/service-readiness-audit`.
- Canonical service readiness audit regenerated under `data/runs/20260528_voice_direction_mvp/52-service-readiness-audit`.
