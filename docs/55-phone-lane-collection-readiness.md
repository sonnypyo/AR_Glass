# Phone Lane Collection Readiness

Date: 2026-05-28 KST

## Purpose

This document defines how the hardware dashboard separates phone evidence collection readiness from post-run evidence gaps.

The phone lane is a collection lane. It should become executable when exactly one authorized Android phone is attached and the local readiness preflight approves `RUN_PHONE=1`. It should not stay blocked just because `device-evidence.md`, direction summary, or manifest apply results have not been produced yet.

## Dashboard Contract

The dashboard now exposes two separate concepts:

- `collectionReadiness.phoneCollectionBlockers`: pre-run blockers that prevent executing `RUN_PHONE=1`.
- `collectionReadiness.phoneEvidenceGaps`: post-run evidence gaps that still prevent phone alpha, direction promotion, or production claims.

Current pre-run blocker:

```text
authorized ADB devices must be exactly 1, current=0
```

Current evidence gaps:

- real phone `device-evidence.md` not collected yet
- direction summary will be generated only after real phone `device-evidence.md` exists
- direction manifest apply is not ready for canonical promotion
- phone private alpha candidate remains false until manual device evidence rows pass

## Why This Matters

Before this split, the dashboard surfaced missing direction summary and manifest apply readiness as phone-lane blockers. Those are valid promotion gaps, but they are expected before the phone lane runs. Treating them as blockers could make a real operator think `RUN_PHONE=1` is never allowed.

With this split:

- no phone attached means the phone lane remains blocked
- exactly one authorized phone means the phone lane can become ready for evidence collection
- promotion still remains blocked until generated evidence, direction summary, manual observations, and strict validators pass

## Commands

Regenerate the dashboard and next-action brief:

```bash
scripts/summarize-hardware-test-status.mjs --write-report --json
scripts/recommend-hardware-next-actions.mjs --write-report --json
```

Confirm the executor still refuses the current no-phone state:

```bash
scripts/run-hardware-next-action.mjs --action run-phone-lane --write-report --json
```

For the next real phone pass, use the phone-lane runner so dashboard and next actions are refreshed before execution:

```bash
scripts/run-phone-lane-hardware.mjs --write-report --json
scripts/run-phone-lane-hardware.mjs --execute --write-report --json
```

## Trial/Error Notes

- The current no-phone state still correctly blocks `run-phone-lane`.
- The only current phone collection blocker is the authorized ADB device count.
- Evidence gaps remain visible in the dashboard JSON and Markdown, but they are not used as pre-run blockers.
- This does not prove phone evidence; it only makes the next real phone run reachable once the device is attached.
- `scripts/run-phone-lane-hardware.mjs` is the preferred operator command for the phone lane because it refreshes the dashboard before any execution attempt.
