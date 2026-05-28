# Device Evidence Validator

Date: 2026-05-28 KST

## Goal

Add an automated check for generated `device-evidence.md` files so physical phone tests fail fast when required script evidence is missing or private voice data appears in evidence blocks.

## Implemented

- `scripts/validate-device-evidence.mjs` validates required report sections.
- The validator requires script-pass rows for ADB visibility, install state, encrypted storage self-check, repository self-check, debug alert output test, debug direction sample test, non-PII evidence snapshot, release readiness snapshot, and glasses readiness snapshot.
- The validator requires the processing-latency metrics row, the alert-delivery statuses row, the direction microphone metadata row, and checks snapshot output for required count/status/latency/delivery/direction/release/glasses-readiness keys.
- The validator rejects private field patterns such as transcript, speaker name, phrase, embedding, encrypted payload, PCM, and raw audio fields inside snapshot/log code blocks.
- `scripts/android-device-smoke-test.sh --write-evidence` now runs the validator automatically when Node.js is available.
- A labeled fixture report proves the validator path without claiming physical-device evidence.

## Trial/Error Notes

- The validator does not prove recognition accuracy, direction accuracy, or glasses rendering. It only proves that the evidence report has the required automation rows and privacy shape.
- The fixture is not a device result. It exists only to keep the validator behavior testable without an attached phone.
- Log evidence may still be manually summarized, but structured private fields are rejected from log code blocks.

## Verification

From the repository root:

```bash
node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md
node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json
scripts/android-device-smoke-test.sh --help
```

Expected result:

- Fixture validation passes.
- JSON output reports `"ok": true`.
- Smoke script help remains available.

## Next Work

- Run the smoke script with a connected Android phone and confirm the generated `device-evidence.md` passes this validator.
- Keep validator checks aligned with release-readiness gates as new physical-device rows are added.
