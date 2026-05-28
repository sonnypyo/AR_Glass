# 54. Physical Session Validator

## Objective

Add a validator for generated physical-test session folders so real phone, Meta Ray-Ban, and Android XR evidence sessions can fail fast when required files, commands, checklist sections, or privacy rules are missing.

## Changes

- Added `scripts/validate-physical-test-session.mjs`.
- The validator checks the generated session folder for:
  - `README.md`
  - `commands.sh`
  - `phone-manual-checklist.md`
  - `meta-rayban-checklist.md`
  - `android-xr-checklist.md`
  - `privacy-redaction-rules.md`
- It checks that `commands.sh` is executable, has valid shell syntax, and includes build, phone smoke, glasses preflight, evidence validation, and readiness audit commands.
- It checks required phone, Meta Ray-Ban, Android XR, and privacy checklist markers.
- It scans session text files for private structured fields.
- If `android-phone-smoke/device-evidence.md` exists, it runs `scripts/validate-device-evidence.mjs`.
- If glasses preflight or service readiness audit output exists, it checks their expected summary markers.

## Current Result

The current session pack passes structural validation:

```bash
scripts/validate-physical-test-session.mjs data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack --json
```

The validator reports expected warnings because no attached-phone run has created `android-phone-smoke/device-evidence.md`, `glasses-preflight/glasses-preflight.md`, or `service-readiness-audit/service-readiness-audit.md` inside that session folder yet.

## Trial/Error Notes

- The first validator version flagged `privacy-redaction-rules.md` because the rule file intentionally includes the forbidden example `enc:v1:`. The fix was to skip that rule file during private structured-field scanning while still requiring it to contain the privacy markers.
- Missing hardware output files are warnings, not errors, before the physical session is run.

## Privacy Shape

The validator looks for structured private fields such as transcript, speaker name, profile label, phrase, embedding, raw audio, PCM, audio bytes, and encrypted payload markers. It does not inspect or store any audio.

## Verification

Checked on 2026-05-28T05:24:33+09:00.

- `node --check scripts/validate-physical-test-session.mjs`: passed.
- `node --check scripts/create-physical-test-session.mjs`: passed.
- `node --check scripts/audit-service-readiness.mjs`: passed.
- `bash -n data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack/commands.sh`: passed.
- `node scripts/validate-physical-test-session.mjs data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack --json`: passed with expected missing-hardware-output warnings.
- Canonical JSON parse check: passed for candidate, product plan, backend contract, QA report, and implementation lock.
- `node scripts/audit-service-readiness.mjs --json`: passed and still reports only the internal prototype as ready.
- `node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json`: passed with no warnings.
- `./gradlew --no-daemon test assembleDebug`: passed.
