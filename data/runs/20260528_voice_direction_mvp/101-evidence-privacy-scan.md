# Stage 101 - Evidence Privacy Scan

Date: 2026-05-28 KST

## Goal

Add a folder-level privacy guard for generated evidence and report artifacts before the first real hardware evidence runs.

## Implemented

- Added `scripts/scan-evidence-privacy.mjs`.
- Added default scan targets for the hardware test operator pack, hardware test status dashboard, service readiness audit, controlled direction-trial session, and device evidence validator fixture.
- Added Markdown and JSON report generation under `data/runs/20260528_voice_direction_mvp/101-evidence-privacy-scan`.
- Added checks for unredacted `Device serial`, unredacted `Build fingerprint`, legacy ADB-labeled evidence paths, MAC-like identifiers, private voice fields, Bluetooth private fields, token/application id fields, encrypted payload markers, PCM, and raw audio fields.
- Kept scanner output to file path, line number, and rule id only.
- Added `docs/48-evidence-privacy-scan.md`.

## Current Result

Default scan passed:

- Files scanned: 31.
- Violations: 0.
- Warnings: 0.
- Report: `data/runs/20260528_voice_direction_mvp/101-evidence-privacy-scan/evidence-privacy-scan.md`.
- JSON: `data/runs/20260528_voice_direction_mvp/101-evidence-privacy-scan/evidence-privacy-scan.json`.

## Verification

```bash
node --check scripts/scan-evidence-privacy.mjs
scripts/scan-evidence-privacy.mjs --write-report --json
scripts/scan-evidence-privacy.mjs <(printf '%s\n' 'speakerName=Alice') --json
```

The default scan passed. The private speaker field negative scan failed as expected without printing the private value.

A temporary legacy evidence directory shaped like `<timestamp>_<adb-device-label>_android_phone_smoke` also failed as expected with `legacy-adb-labeled-evidence-path`.

## Remaining

After every real phone/glasses/support evidence run, run:

```bash
scripts/scan-evidence-privacy.mjs <new-evidence-or-report-dir> --write-report --report-dir <scan-report-dir> --json
```

Then run the service readiness audit again before any promotion decision.
