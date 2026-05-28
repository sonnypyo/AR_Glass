# Hardware Test Status Dashboard

Date: 2026-05-28 KST

## Purpose

This document defines the non-PII dashboard that summarizes whether the generated hardware test operator pack is safe to run, which evidence lanes are ready, and which lanes must stay blocked until real phone, glasses, or support evidence exists.

Run it after every operator-pack, phone-runner, glasses-runner, support-drill, Android XR contract, glasses-preflight, hardware-readiness, or controlled direction-trial session change:

```bash
scripts/summarize-hardware-test-status.mjs --write-report --json
```

Then regenerate the ordered operator brief:

```bash
scripts/recommend-hardware-next-actions.mjs --write-report --json
```

To execute only the first ready action from that brief:

```bash
scripts/run-hardware-next-action.mjs --execute --write-report --json
```

To inspect a non-default controlled direction session:

```bash
scripts/summarize-hardware-test-status.mjs --controlled-direction-session data/runs/<run>/controlled-direction-trial-session --write-report --json
```

The generated report is:

```text
data/runs/20260528_voice_direction_mvp/99-hardware-test-status-dashboard/hardware-test-status-dashboard.md
```

## What It Reads

- `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/hardware-readiness/hardware-readiness-preflight.json`
- `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/phone-alpha-runner/phone-alpha-evidence-summary.json`
- `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/glasses-alpha-runner/glasses-alpha-evidence-summary.json`
- `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/promotion-validation/promotion-validation.json`
- `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/evidence-privacy-scan/evidence-privacy-scan.json`
- `data/runs/20260528_voice_direction_mvp/97-android-xr-projected-contract/android-xr-projected-contract.json`
- `data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session/aggregate-summary-template.json`
- `data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session/trial-plan.csv`
- `scripts/validate-hardware-test-operator-pack.mjs --json`
- `scripts/validate-hardware-test-promotion.mjs --profile workflow --json`
- `scripts/assert-service-gates.mjs --profile current-safe --json`
- `scripts/scan-evidence-privacy.mjs <operator-pack-dir> --json`
- `scripts/validate-controlled-direction-trial-session.mjs <session-dir> --json`

## Lane Status Model

The dashboard reports five operator lanes:

- `Default no-hardware workflow`: expected to stay ready and safe to run before a test day.
- `Phone evidence`: blocked until exactly one authorized Android phone is attached and the readiness preflight approves `RUN_PHONE=1`; post-run evidence gaps are tracked separately.
- `Glasses evidence`: blocked until Meta credentials, glasses preflight blockers, real Ray-Ban/Android XR evidence, and strict glasses candidate checks are satisfied.
- `Support evidence`: manual-required until deletion and mistaken-alert drill evidence is reviewed.
- `Controlled direction trials`: manual-required while planned rows exist but real observed rows and reviewed aggregate direction counts are not complete.

The phone lane surfaces direction manifest apply dry-run state from the phone runner:

- `phoneDirectionManifestApplyDryRunOk`
- `phoneDirectionManifestApplyReady`

This makes it visible when a direction summary exists but canonical manifest promotion is still blocked.

The phone lane also separates collection blockers from promotion/evidence gaps:

- `collectionReadiness.phoneCollectionBlockers`
- `collectionReadiness.phoneEvidenceGaps`

This keeps `RUN_PHONE=1` reachable after exactly one authorized phone is attached, while still showing that phone alpha and direction promotion need generated evidence after the run.

The next-action brief in `docs/53-hardware-next-actions.md` reads this dashboard and converts the lane statuses into the current command order for a real hardware test day.

## Current Result

Current generated status:

- Current safe workflow: yes.
- Private alpha candidate: no.
- Authorized ADB devices: 0.
- Default no-hardware workflow: ready.
- Phone evidence: blocked.
- Phone collection blocker: authorized ADB devices must be exactly 1, current 0.
- Glasses evidence: blocked.
- Support evidence: manual-required.
- Controlled direction trials: manual-required.
- Controlled direction plan ready: yes.
- Controlled direction planned rows: 80.
- Controlled direction recorded rows: 0.
- Evidence privacy scan: pass, violations 0.
- Android XR contract mode: `phone_preview_stub`.
- Real Android XR candidate: no.

## Promotion Rule

This dashboard is an execution map, not a release approval. A `ready` default workflow only means the automation can run safely without hardware. Phone alpha, glasses alpha, support-ready, private alpha, beta, and production claims still require the strict promotion validators and matching real evidence.

## Privacy Guardrail

The dashboard stores only booleans, counts, statuses, command recommendations, and workspace-relative paths. It must not include raw command output, ADB serials, Bluetooth names, MAC addresses, raw audio, transcripts, speaker names, embeddings, private alert text, exact locations, tokens, or application id values.

## Trial/Error Notes

- The dashboard intentionally duplicates key candidate booleans from the promotion validator so a hardware-day operator can see blockers without opening several JSON files.
- It keeps the phone lane blocked when `authorizedAdbDevices !== 1`; a zero-device local run is valid workflow evidence, but not phone evidence.
- It does not treat missing `device-evidence.md`, direction summary, or manifest apply readiness as pre-run phone blockers; those are reported as evidence gaps.
- It keeps the glasses lane blocked while Android XR remains `phone_preview_stub`; default Android XR contract validation is not real ProjectedContext/Glimmer/runtime proof.
- It runs `current-safe` gate assertion as part of the summary so local workflow drift is caught before hardware flags are used.
- It runs the operator-pack privacy scan as part of the default lane check, so a `ready` default lane also means the current generated pack has no scanner-detected private fields.
- It now validates the controlled direction-trial session and reports `recordedRows/totalPlannedRows`, so a hardware-day operator can see that the 80-row plan exists but real direction observations are still missing.
- It surfaces phone direction manifest apply dry-run state so manifest promotion blockers are visible from the dashboard.
- It is the source for the hardware next-action brief; regenerate the brief after every dashboard update so command recommendations do not drift.
