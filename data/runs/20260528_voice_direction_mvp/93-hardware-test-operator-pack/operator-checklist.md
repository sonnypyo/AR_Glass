# Hardware Test Operator Checklist

Generated: 2026-05-28T11:52:15+09:00

## Before Running

- [ ] Android phone available and charged.
- [ ] Ray-Ban Display available and paired when testing display proof.
- [ ] Ray-Ban Meta Gen 1 available and paired when testing fallback proof.
- [ ] Android XR device/emulator available only if testing XR projected proof.
- [ ] Meta DAT credentials are configured outside source control when testing DAT proof.
- [ ] No private speaker names, transcripts, audio files, embeddings, Bluetooth names, MAC addresses, or exact locations will be recorded.

## Default No-Hardware Check

- [ ] Run `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh`.
- [ ] Confirm hardware readiness preflight report is written.
- [ ] Confirm phone runner summary remains non-PII.
- [ ] Confirm glasses runner summary remains non-PII.
- [ ] Confirm `current-safe` service gate passes.
- [ ] Confirm phone/glasses alpha gates remain not-ready until real evidence exists.

## Phone Evidence

- [ ] Attach exactly one authorized Android phone.
- [ ] Run `RUN_PHONE=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh`.
- [ ] Validate generated `phone-alpha-evidence-summary.json`.
- [ ] Validate generated `device-evidence.md`.
- [ ] Validate generated `direction-evidence/direction-evidence-summary.json`.
- [ ] Confirm `productionDirectionCandidate=false` unless strict controlled direction evidence exists.
- [ ] Fill manual phone rows in the physical session with aggregate pass/fail evidence only.

## Glasses Evidence

- [ ] Run Meta/Ray-Ban credential preflight.
- [ ] Run `RUN_GLASSES=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh` only when real glasses evidence can be collected.
- [ ] Fill Ray-Ban Display evidence.
- [ ] Fill Ray-Ban Gen 1 fallback evidence.
- [ ] Fill Android XR projected evidence when available.
- [ ] Fill haptics/fallback evidence without claiming glasses haptics unless official API proof exists.
- [ ] Dry-run manifest apply before any canonical manifest write.

## Support Evidence

- [ ] Run `RUN_SUPPORT=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh` only when support owners are ready.
- [ ] Fill deletion verification drill.
- [ ] Fill mistaken-alert incident drill.
- [ ] Validate strict support drill only after real evidence exists.

## After Running

- [ ] Regenerate service readiness audit.
- [ ] Confirm the pack-level evidence privacy scan passed with zero violations.
- [ ] Run `scripts/assert-service-gates.mjs --profile current-safe --json`.
- [ ] Run stricter promotion profiles only after matching evidence exists.
