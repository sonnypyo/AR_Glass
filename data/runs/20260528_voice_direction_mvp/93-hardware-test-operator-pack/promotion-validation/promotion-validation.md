# Hardware Test Promotion Validation

Generated: 2026-05-28T13:08:08+09:00
Profile: workflow
Result: pass
Pack: data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack

## Decision

This is workflow evidence only. It does not approve phone private alpha, glasses private alpha, support readiness, beta, or production.

## Candidates

- Phone private alpha candidate: false
- Phone direction summary validated: false
- Phone direction manifest apply dry-run: false
- Phone direction manifest apply ready: false
- Phone direction production candidate: false
- Glasses hardware evidence candidate: false
- Glasses private alpha candidate: false
- Support strict requested: false

## Hardware Readiness

- Authorized/attached ADB device count: 0
- Can run phone session: false
- Meta application id present: false
- GitHub token present: false
- Latest device evidence path: missing

## Checks

| Check | Status | Exit |
| --- | --- | --- |
| Validate operator pack | pass | 0 |
| Validate phone-private-alpha summary | pass | 0 |
| Validate glasses-private-alpha summary | pass | 0 |
| Validate support drill draft | pass | 0 |

## Errors

- None.

## Warnings

- Workflow evidence only: phone/glasses private alpha candidates are false.

## Privacy Guardrail

This validation report stores only candidate booleans, command labels, pass/fail statuses, exit codes, aggregate readiness counts, and workspace-relative paths. It must not include raw command output, raw audio, transcripts, speaker names, Bluetooth device names, MAC addresses, private alert text, embeddings, or encrypted payload values.
