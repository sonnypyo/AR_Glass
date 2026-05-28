# Hardware Test Operator Pack

Date: 2026-05-28 KST

## Purpose

This document defines the day-of-test operator pack for Voice Direction Glass. The pack ties together the phone evidence runner, glasses evidence runner, support drill session, hardware readiness preflight, and service gate assertions in one non-PII folder.

The pack is an execution control surface, not readiness evidence by itself. Default mode must remain safe without hardware, and hardware collection must be explicitly opted into with environment flags.

## Commands

Generate or refresh the pack:

```bash
scripts/create-hardware-test-operator-pack.mjs --force --json
```

Validate the pack structure, command syntax, linked sessions, and privacy guardrails:

```bash
scripts/validate-hardware-test-operator-pack.mjs --json
```

Run the default no-hardware workflow:

```bash
data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
```

Run one hardware lane only when the matching owner and device are ready:

```bash
RUN_PHONE=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
RUN_GLASSES=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
RUN_SUPPORT=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
```

## Output

Default generated folder:

- `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/README.md`
- `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/operator-checklist.md`
- `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/privacy-redaction-rules.md`
- `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/session-links.json`
- `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh`
- `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/hardware-readiness/`
- `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/phone-alpha-runner/`
- `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/glasses-alpha-runner/`
- `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/service-readiness-audit/`
- `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/promotion-validation/`

The default run keeps dry-run phone evidence under `android-phone-smoke-dry-run` inside the pack so generated summaries do not point back to older run folders.

The run also writes a pack-level privacy scan:

- `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/evidence-privacy-scan/evidence-privacy-scan.md`
- `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/evidence-privacy-scan/evidence-privacy-scan.json`

## Linked Sessions

- Physical phone session: `data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack`
- Support drill session: `data/runs/20260528_voice_direction_mvp/74-support-drill-session-pack`
- Glasses hardware session: `data/runs/20260528_voice_direction_mvp/77-glasses-hardware-session-pack`
- Private-alpha rehearsal session: `data/runs/20260528_voice_direction_mvp/79-private-alpha-rehearsal-pack`

## Promotion Rules

- `RUN_PHONE=1` requires exactly one authorized Android phone over ADB. It must produce validator-passing `device-evidence.md` before any phone-private-alpha claim.
- After `RUN_PHONE=1` produces `device-evidence.md`, run `scripts/extract-direction-evidence-summary.mjs <device-evidence.md> --json` and validate the generated direction summary before any direction manifest review.
- `RUN_GLASSES=1` requires real Ray-Ban Display, Ray-Ban Meta Gen 1 fallback, or Android XR evidence collection readiness. It must not be used to claim glasses private alpha unless strict hardware validation and the glasses-alpha service gate both pass.
- `RUN_SUPPORT=1` requires deletion and mistaken-alert drill owners to be ready. Strict support validation must fail until real drill evidence exists.
- After any lane runs, `commands.sh` automatically scans the full pack with `scripts/scan-evidence-privacy.mjs "$PACK_DIR" --write-report --report-dir "$PACK_DIR/evidence-privacy-scan" --json` before validating promotion.

## Privacy Guardrail

The pack and validator reject structured private evidence. Do not store raw audio, PCM, transcripts, speaker names, contact names, voice embeddings, encrypted payload values, Bluetooth owner/device/product names, MAC addresses, private alert text, or exact locations.

Summaries should contain only command labels, statuses, exit codes, aggregate counts, booleans, enums, and local artifact paths.

## Current No-Hardware Result

The current default run is valid workflow evidence only:

- hardware readiness preflight passed locally but reported zero authorized ADB devices and missing Meta credentials
- `current-safe` service gate passed
- phone-private-alpha runner summary passed with `phonePrivateAlphaCandidate=false`
- phone-private-alpha runner summary now records direction evidence summary paths, but no summary is generated in no-device mode
- glasses-private-alpha runner summary passed with `glassesPrivateAlphaCandidate=false`
- `RUN_PHONE`, `RUN_GLASSES`, and `RUN_SUPPORT` remained unset, so no real hardware or support evidence was collected
- operator pack validator passed after the run
- evidence privacy scan passed against the full pack with zero violations
- promotion validator passed in `workflow` profile and recorded that phone/glasses candidates are false

## Trial/Error Notes

- The first generated default command used the phone runner's default evidence directory, which pointed back to the older Stage 88 folder. The generator now passes `--evidence-dir "$PACK_DIR/android-phone-smoke-dry-run"` so the operator pack is self-contained.
- The default run intentionally treats missing phone and glasses evidence as non-ready summaries, not fatal operator-pack failures.
- The pack-level validator scans generated text, shell, and JSON files after the run so accidental private structured fields are caught before evidence is copied into canonical manifests.
- The generated `commands.sh` now runs the folder-level evidence privacy scanner before promotion validation, so a hardware-day operator does not have to remember the scan as a separate manual command.
- The promotion validator is a separate final check: `workflow` means orchestration only, while `phone-alpha`, `glasses-alpha`, `support-ready`, and `private-alpha` are strict profiles for real evidence.
- Direction evidence extraction is intentionally separate from the pack default run so fixture or dry-run output cannot be mistaken for a direction accuracy claim.
- In `RUN_PHONE=1` mode, the phone runner performs default direction evidence extraction after `device-evidence.md` is created.

## Verification

From the repository root:

```bash
node --check scripts/create-hardware-test-operator-pack.mjs
node --check scripts/validate-hardware-test-operator-pack.mjs
scripts/create-hardware-test-operator-pack.mjs --force --json
scripts/validate-hardware-test-operator-pack.mjs --json
data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
scripts/validate-hardware-test-operator-pack.mjs --json
scripts/scan-evidence-privacy.mjs data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack --json
scripts/validate-hardware-test-promotion.mjs --profile workflow --json
```

Result:

- Generator and validator syntax checks passed.
- Pack generation passed.
- Pack validation passed before and after the default run.
- Default no-hardware run passed while preserving phone/glasses private alpha as not-ready.
- Pack-level evidence privacy scan passed with zero violations.
- Workflow promotion validation passed and wrote `promotion-validation/promotion-validation.json` plus `.md`.
