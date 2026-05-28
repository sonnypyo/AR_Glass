# Stage 73 - Support Drill Evidence Gate

Date: 2026-05-28 KST

## Goal

Make the remaining support/deletion/mistaken-alert drill blocker machine-checkable without claiming that drills have already run.

## Changes

- Added `docs/23-support-drill-evidence.md`.
- Added `apps/voice-direction-glass/support-drills/manifest.json`.
- Added `scripts/validate-support-drill-evidence.mjs`.
- Default validation checks the draft runbook and privacy guardrails.
- Strict validation stays blocked until a real support channel, deletion drill, mistaken-alert drill, evidence paths, and regenerated service readiness audit exist.

## Trial/Error Notes

- The existing support incident process validator proves the process document shape only.
- The debug local delete self-check is useful repository evidence, but it does not replace a user-facing deletion verification drill.
- The first manifest intentionally records `DRAFT_SUPPORT_DRILLS_NOT_RUN` so future production-readiness claims cannot pass strict validation accidentally.

## Verification

Passed:

```bash
node --check scripts/validate-support-drill-evidence.mjs
node scripts/validate-support-drill-evidence.mjs --json
node scripts/audit-service-readiness.mjs --write-report --report-dir data/runs/20260528_voice_direction_mvp/52-service-readiness-audit
node scripts/validate-support-incident-process.mjs --json
node scripts/validate-policy-clearance-matrix.mjs --json
node scripts/validate-privacy-data-safety-draft.mjs --json
cd apps/voice-direction-glass && ./gradlew --no-daemon test assembleDebug bundleRelease
```

Expected strict failure:

```bash
node scripts/validate-support-drill-evidence.mjs --require-drills-ready --json
```

Result: strict mode fails because support channel, deletion drill, mistaken-alert drill, evidence paths, and regenerated-audit marker are not completed in the manifest.
