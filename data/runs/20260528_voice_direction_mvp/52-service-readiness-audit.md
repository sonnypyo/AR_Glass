# 52. Service Readiness Audit

## Objective

Add a repeatable audit that summarizes whether the app is ready for internal prototype, phone private alpha, glasses private alpha, external beta, or production service.

## Changes

- Added `scripts/audit-service-readiness.mjs`.
- The script parses `ReleaseReadiness.kt` and `GlassesIntegrationReadiness.kt` as the current gate sources.
- The script checks key local artifacts, latest device evidence availability, device evidence validator result, and glasses preflight status.
- Added Markdown and JSON output modes.
- Generated the current audit report at:

```text
data/runs/20260528_voice_direction_mvp/52-service-readiness-audit/service-readiness-audit.md
```

## Current Audit Result

- Internal prototype: ready.
- Phone private alpha: not ready; eleven physical-phone evidence rows remain manual, including the debug direction sample evidence gate.
- Glasses private alpha: not ready; phone evidence plus Meta DAT and Android XR proof remain open.
- External beta: blocked by encrypted-storage device proof, production speaker model, and tester/policy review.
- Production service: blocked by front/back direction evidence, store/SDK policy clearance, and support/incident workflow.

## Privacy Shape

The audit reports checklist ids, counts, statuses, and file paths only. It does not include raw audio, transcripts, speaker names, embedding values, encrypted payload values, Bluetooth owner names, or alert text.

## Trial/Error Notes

- The first parser version also matched the Kotlin data class constructor. Filtering parsed call bodies by the presence of `id =` fixed the audit item extraction.
- Missing physical `device-evidence.md` is reported as `not-run`, because this workspace currently has no attached ADB device.

## Verification

Checked on 2026-05-28T05:16:52+09:00.

- `node --check scripts/audit-service-readiness.mjs`: passed.
- `scripts/audit-service-readiness.mjs --json`: passed and reported internal prototype ready, phone private alpha not ready, glasses private alpha not ready, external beta not ready, and production service not ready.
- `scripts/audit-service-readiness.mjs --write-report --report-dir data/runs/20260528_voice_direction_mvp/52-service-readiness-audit`: passed and regenerated `service-readiness-audit.md`.
- Canonical JSON parse check: passed for candidate, product plan, backend contract, QA report, and implementation lock.
- `node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json`: passed with no warnings.
- `./gradlew --no-daemon test assembleDebug`: passed.
