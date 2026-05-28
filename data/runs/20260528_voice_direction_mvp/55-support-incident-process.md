# 55. Support Incident Process

## Objective

Define the support, deletion verification, and mistaken-alert incident process needed before external beta or production service.

## Changes

- Added `docs/14-support-incident-process.md`.
- Added `scripts/validate-support-incident-process.mjs`.
- Updated `ReleaseReadiness.kt` so `support-incident-process` is no longer a missing-process blocker. It is now `MANUAL_REQUIRED` because operational drills are still required.
- Updated release checklist tests to expect `support-incident-process` in manual production items.
- Regenerated the service readiness audit.

## Current Result

- Internal prototype: ready.
- Phone private alpha: still not ready because physical phone evidence is missing.
- Glasses private alpha: still blocked by phone evidence, Meta DAT credentials/proof, and Android XR proof.
- External beta: still blocked by production speaker model and tester/policy review.
- Production service: still blocked by front/back direction evidence and store/SDK policy clearance.
- Support/incident process: defined, but deletion verification and mistaken-alert incident drills have not been run.

## Privacy Shape

The process forbids support evidence from collecting raw audio, PCM, transcripts, speaker names, profile labels, embedding values, encrypted payload values, Bluetooth owner names, private alert text, and location details.

## Trial/Error Notes

- This process does not create a real support channel or SLA. Those remain operational tasks before external beta/production.
- It only moves the release gate from "not defined" to "defined but not rehearsed".

## Verification

Checked on 2026-05-28T05:28:31+09:00.

- `node --check scripts/validate-support-incident-process.mjs`: passed.
- `node scripts/validate-support-incident-process.mjs --json`: passed with no warnings.
- `node --check scripts/audit-service-readiness.mjs`: passed.
- `node scripts/audit-service-readiness.mjs --json`: passed and reports production service as not ready with `productionManual=13` and `productionBlocked=6`.
- `node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json`: passed with no warnings after updating production readiness counts.
- Canonical JSON parse check: passed for candidate, product plan, backend contract, QA report, and implementation lock.
- `node scripts/validate-physical-test-session.mjs data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack --json`: passed with expected missing-hardware-output warnings.
- `./gradlew --no-daemon test assembleDebug`: passed.
