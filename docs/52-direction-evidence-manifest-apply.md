# Direction Evidence Manifest Apply Gate

Date: 2026-05-28 KST

## Purpose

This document defines the safe apply step from an extracted direction evidence summary to the canonical direction manifest.

The apply gate exists so nobody copies `manifest-update-template.json` into `apps/voice-direction-glass/direction-evidence/manifest.json` by hand before strict production-direction evidence exists.

## Command

Dry-run the current summary:

```bash
scripts/apply-direction-evidence-summary.mjs \
  data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor/direction-evidence-summary.json \
  --json
```

Apply only after strict evidence is expected to pass:

```bash
scripts/apply-direction-evidence-summary.mjs \
  data/runs/<run>/direction-evidence/direction-evidence-summary.json \
  --write \
  --json
```

## Required Preconditions

`--write` is allowed only when all of these are true:

- `scripts/validate-direction-evidence-summary.mjs <summary.json> --json` passes.
- `scripts/validate-direction-evidence-summary.mjs <summary.json> --require-production-direction-candidate --json` passes.
- `fixtureEvidence=false`.
- `productionDirectionCandidate=true`.
- `manifestUpdateTemplate.status=DIRECTION_EVIDENCE_EVALUATED`.
- `manifestUpdateTemplate.currentAlgorithm.claimLevel=FOUR_DIRECTION_CONTROLLED_EVIDENCE`.
- `manifestUpdateTemplate.currentAlgorithm.frontBackClaim=supported_by_controlled_evidence`.
- `targetProgress.controlledTrialTargetComplete=true`.
- `targetProgress.missingTotalTrials=0`.
- No raw audio, PCM, transcript, speaker name, raw embedding, Bluetooth private field, device serial, logcat, or raw command output key is present.

## Write Behavior

When `--write` is allowed, the script writes:

- `apps/voice-direction-glass/direction-evidence/aggregate-direction-evidence-summary.json`
- `apps/voice-direction-glass/direction-evidence/manifest.json`

After writing, it immediately runs:

```bash
node scripts/validate-direction-accuracy-evidence.mjs apps/voice-direction-glass/direction-evidence --json
node scripts/validate-direction-accuracy-evidence.mjs apps/voice-direction-glass/direction-evidence --require-production-direction-ready --json
```

If either validation fails, the script restores the previous canonical manifest and aggregate evidence file.

## Current Fixture Result

The current fixture summary is not apply-ready:

- `fixtureEvidence=true`
- `productionDirectionCandidate=false`
- `targetProgress.missingTotalTrials=76`
- `targetProgress.controlledTrialTargetComplete=false`
- strict summary validation fails as expected

Therefore dry-run passes with `applyReady=false`, and `--write` fails without changing the canonical manifest.

## Trial/Error Notes

- Dry-run is allowed for workflow review even when strict direction evidence is missing.
- `--write` is deliberately stricter than default summary validation.
- This gate does not collect evidence. It only prevents premature manifest promotion after evidence extraction.
- A complete row-count target is still not enough; match-rate, latency, microphone metadata, route proof, wearable evidence, and privacy requirements must also pass strict validation.
