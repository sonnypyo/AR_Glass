# Phone Lane Collection Readiness

Date: 2026-05-28 KST

## Goal

Separate phone evidence collection readiness from post-run evidence and promotion gaps.

## Why

The phone lane is the next real hardware step. It should be blocked only by pre-run execution conditions, primarily exactly one authorized Android phone. Missing `device-evidence.md`, direction summary, and direction manifest apply readiness are expected before `RUN_PHONE=1`; they must remain visible but should not be treated as collection blockers.

## Implemented

- Updated `scripts/summarize-hardware-test-status.mjs`.
- Added `collectionReadiness.phoneCollectionBlockers`.
- Added `collectionReadiness.phoneEvidenceGaps`.
- Added per-lane `evidenceGaps`.
- Updated the generated dashboard Markdown with an `Evidence Gaps` section.
- Added `docs/55-phone-lane-collection-readiness.md`.

## Current Result

Current phone collection blocker:

```text
authorized ADB devices must be exactly 1, current=0
```

Current phone evidence gaps:

- real phone `device-evidence.md` not collected yet
- direction summary waits for real phone `device-evidence.md`
- direction manifest apply is not ready for canonical promotion
- phone private alpha candidate remains false until manual evidence rows pass

The next-action executor still refuses `run-phone-lane` because the phone lane is blocked in the current no-phone state.

## Verification

```bash
node --check scripts/summarize-hardware-test-status.mjs
scripts/summarize-hardware-test-status.mjs --write-report --json
scripts/recommend-hardware-next-actions.mjs --write-report --json
scripts/run-hardware-next-action.mjs --action run-phone-lane --write-report --json
```

Result:

- Dashboard generation passed.
- Next-action generation passed.
- Phone lane blocker list contains only the authorized ADB device count in the current no-phone state.
- `run-phone-lane` refusal remains correct until a phone is attached.

## Trial/Error Notes

- This is a workflow correction, not hardware evidence.
- It prevents post-run evidence gaps from making phone evidence collection unreachable.
- Phone alpha still requires real `device-evidence.md`, direction summary validation, manual observations, and strict promotion validation.
