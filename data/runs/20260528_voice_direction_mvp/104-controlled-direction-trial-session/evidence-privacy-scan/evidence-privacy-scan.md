# Evidence Privacy Scan

Generated: 2026-05-28T12:17:37+09:00

## Purpose

This scan checks generated evidence and report folders for private device, voice, Bluetooth, account, and raw-audio fields before those artifacts are used in promotion review.

## Summary

- Result: pass
- Files scanned: 7
- Violations: 0
- Warnings: 0

## Targets

- data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session

## Violations

- none

## Warnings

- none

## Privacy Guardrail

Scanner output includes only file paths, line numbers, rule ids, counts, and missing-target warnings. It does not print matched private strings, transcripts, speaker names, embeddings, encrypted payloads, Bluetooth names, MAC addresses, tokens, or raw audio values.

## Trial/Error Notes

- The device evidence validator catches a single generated `device-evidence.md`; this scan catches copied identifiers or private fields that appear in surrounding operator, dashboard, audit, or summary folders.
- The report intentionally omits matched text so the privacy report cannot become a second copy of the private value.
