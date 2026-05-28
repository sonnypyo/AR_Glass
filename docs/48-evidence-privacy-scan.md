# Evidence Privacy Scan

Date: 2026-05-28 KST

## Purpose

This document defines the folder-level privacy scan for generated evidence and report artifacts. `scripts/validate-device-evidence.mjs` validates one generated phone `device-evidence.md`; this scanner checks surrounding folders so copied ADB identifiers, Bluetooth names, transcripts, speaker fields, embeddings, encrypted payload values, tokens, or raw-audio fields do not leak into operator-pack, dashboard, audit, or summary outputs.

Run the default scan after every hardware operator-pack, phone runner, glasses runner, support drill, service audit, dashboard, or controlled direction-trial session refresh:

```bash
scripts/scan-evidence-privacy.mjs --write-report --json
```

The generated report is:

```text
data/runs/20260528_voice_direction_mvp/101-evidence-privacy-scan/evidence-privacy-scan.md
```

The hardware operator pack also runs a pack-scoped scan automatically:

```text
data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/evidence-privacy-scan/evidence-privacy-scan.md
```

## What It Reads

By default the scanner reads:

- `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack`
- `data/runs/20260528_voice_direction_mvp/99-hardware-test-status-dashboard`
- `data/runs/20260528_voice_direction_mvp/52-service-readiness-audit`
- `data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session`
- `data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md`

It scans text-like files only:

- Markdown
- JSON
- text logs
- shell scripts

## Rules

The scan fails when it finds:

- `Device serial` metadata that is not redacted, fixture, or unknown.
- `Build fingerprint` metadata that is not redacted, fixture, or unknown.
- legacy evidence paths shaped like `<timestamp>_<adb-device-label>_android_phone_smoke`.
- MAC-address-like identifiers.
- transcript, speaker, caller, profile, phrase, embedding, PCM, raw-audio, or audio-bytes fields with non-redacted values.
- Bluetooth product, device, owner, MAC, or address fields with non-redacted values.
- application id or token fields with non-redacted values.
- encrypted payload markers such as `enc:v1:`.

## Privacy Guardrail

The scanner output intentionally reports only:

- file path
- line number
- rule id
- counts
- missing-target warnings

It does not print the matched private value. A failed scan therefore points to where the operator should review locally without turning the scan report into a second copy of the secret or private speech data.

## Current Result

Current default scan result:

- Result: pass.
- Files scanned: 31.
- Violations: 0.
- Warnings: 0.

Current pack-scoped scan result:

- Result: pass.
- Files scanned: 16.
- Violations: 0.
- Warnings: 0.

Generated files:

- `data/runs/20260528_voice_direction_mvp/101-evidence-privacy-scan/evidence-privacy-scan.md`
- `data/runs/20260528_voice_direction_mvp/101-evidence-privacy-scan/evidence-privacy-scan.json`

## What This Proves

- The current generated operator-pack, status dashboard, service audit, controlled direction-trial session, and validator fixture do not contain scanner-detectable private fields.
- The scanner can be run as a post-generation guard before evidence folders are referenced by release, promotion, or final reports.
- The generated hardware operator pack now runs the scanner before promotion validation, so phone/glasses/support evidence folders are checked in the same operator workflow.
- Negative fixtures fail without echoing matched private text.

## What This Does Not Prove

- It does not prove physical phone, Ray-Ban, or Android XR behavior.
- It does not replace human review of generated artifacts before sharing.
- It does not classify app release readiness; it only validates privacy shape for generated evidence/report folders.

## Trial/Error Notes

- The first redaction gate covered generated phone `device-evidence.md`, but later automation also copies summaries into operator, dashboard, and audit folders. Those folders need their own post-generation scan.
- The scanner defaults to the current known evidence folders, but accepts explicit paths so a hardware-day operator can scan a newly generated session before it is promoted.
- The operator pack uses explicit pack-scoped scanning because test-day output may include phone, glasses, support, dashboard, and audit subfolders under one control folder.
- Process-substitution and legacy-path negative checks are used so test failures do not create permanent private fixtures in the repository.
