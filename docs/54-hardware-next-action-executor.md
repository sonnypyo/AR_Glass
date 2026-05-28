# Hardware Next Action Executor

Date: 2026-05-28 KST

## Purpose

This document defines the safe executor for the hardware next-action brief.

The next-action brief recommends an ordered command list. The executor takes that list, selects the first `ready` action by default, verifies that the command matches a strict allow-list, and records a non-PII execution summary.

## Command

Dry-run the next executable action:

```bash
scripts/run-hardware-next-action.mjs --write-report --json
```

Execute the first ready action:

```bash
scripts/run-hardware-next-action.mjs --execute --write-report --json
```

Default output:

```text
data/runs/20260528_voice_direction_mvp/112-hardware-next-action-executor/
```

Generated files:

- `hardware-next-action-execution.md`
- `hardware-next-action-execution.json`

## Current Behavior

Default selected action when no specific action is requested:

```text
refresh-default-workflow
```

This action runs the default no-hardware operator-pack workflow:

```bash
data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
```

The executor refuses actions that are not `ready`. With the current dashboard, this keeps the phone, glasses, controlled-direction, and support lanes from being treated as executable evidence lanes.

For the phone lane, the executor reads the lane status and blocker list only. Post-run evidence gaps such as missing `device-evidence.md`, missing direction summary, or manifest apply readiness remain visible in the dashboard, but they do not block collection once the phone lane itself becomes `ready`.

## Guardrails

- The action id must be present in the generated next-action JSON.
- The command must match the executor allow-list.
- `--execute` is allowed only when the selected action status is `ready`.
- The execution summary stores exit code, duration, action id, status, command recommendation, blockers, and workspace-relative paths only.
- Raw command output is not persisted in the execution summary.

## Current Result

The executor has two useful current checks:

- `--execute --write-report --json` ran `refresh-default-workflow` successfully in no-hardware mode.
- `--action run-phone-lane --write-report --json` correctly refused the phone lane because the current environment has zero authorized ADB phones.

The successful default action is workflow evidence only. The refused phone lane is collection-readiness evidence only. Neither proves Android phone evidence, Ray-Ban Display evidence, Ray-Ban Gen 1 fallback evidence, Android XR runtime evidence, controlled direction accuracy, support drills, or private alpha readiness.

## Trial/Error Notes

- Running the default action is useful because it refreshes readiness, no-device phone summary, glasses summary, service audit, pack privacy scan, operator-pack validation, and workflow promotion validation.
- The executor does not override blockers. If the next action is blocked or manual-required, it reports the reason instead of collecting evidence.
- Hardware-lane execution remains tied to the dashboard and promotion validators; strict profiles still require real device/support evidence.
- Phone collection readiness is based on pre-run blockers. Evidence gaps stay in `collectionReadiness.phoneEvidenceGaps` and remain promotion blockers after collection.
