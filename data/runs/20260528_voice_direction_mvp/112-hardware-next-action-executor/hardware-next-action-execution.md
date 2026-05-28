# Hardware Next Action Execution

Generated: 2026-05-28T13:20:56+09:00
Source next actions: data/runs/20260528_voice_direction_mvp/111-hardware-next-actions/hardware-next-actions.json

## Decision

- Mode: dry-run
- Requested action: run-phone-lane
- Selected action: run-phone-lane
- Selected status: blocked
- Execution allowed: false
- Executed: false
- Exit code: -

## Selected Action

- Title: Run Android phone evidence lane
- Command: `RUN_PHONE=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh`
- Blockers: authorized ADB devices must be exactly 1, current=0

## Privacy Guardrail

This report stores only action id, status, command recommendation, blocker text, exit code, duration, and workspace-relative paths. It does not persist raw command output, ADB serials, Bluetooth names, MAC addresses, raw audio, transcripts, speaker names, embeddings, private alert text, exact locations, tokens, or application id values.

## Errors

- Action is not ready: run-phone-lane status=blocked
