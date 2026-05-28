# Stage 100 - Device Evidence Redaction

Date: 2026-05-28 KST

## Goal

Prepare the first real Android phone evidence run by preventing generated `device-evidence.md` reports from storing private device identifiers.

## Implemented

- Updated `scripts/android-device-smoke-test.sh` so generated reports write `Device serial: redacted-by-script`.
- Updated `scripts/android-device-smoke-test.sh` so generated reports write `Build fingerprint: redacted-by-script`.
- Updated `scripts/android-device-smoke-test.sh` so the default evidence directory no longer includes the ADB device label.
- Updated `scripts/validate-device-evidence.mjs` so unredacted serial/fingerprint metadata fails validation.
- Updated `scripts/validate-device-evidence.mjs` so legacy `<timestamp>_<adb-device-label>_android_phone_smoke` evidence paths fail validation.
- Updated the validator fixture and evidence template to include the redacted metadata shape.
- Added `docs/47-device-evidence-redaction.md`.

## Verification

```bash
node --check scripts/validate-device-evidence.mjs
bash -n scripts/android-device-smoke-test.sh
scripts/android-device-smoke-test.sh --help
node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json
```

All passed. The fixture validates with redacted metadata.

Negative validation also fails as expected when a fixture contains an unredacted device serial or is validated from a legacy ADB-labeled evidence directory.

## Remaining

The first real phone run is still pending. After connecting exactly one authorized Android phone, run:

```bash
RUN_PHONE=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
```

Then review the generated `device-evidence.md` before using it for any promotion decision.
