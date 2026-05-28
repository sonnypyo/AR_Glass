# 53. Physical Test Session Pack

## Objective

Create a repeatable folder package for the first real phone, Meta Ray-Ban, and Android XR evidence session.

## Changes

- Added `scripts/create-physical-test-session.mjs`.
- Generated the current physical test session pack:

```text
data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack
```

## Generated Files

- `README.md`: session purpose, evidence files, and known gaps.
- `commands.sh`: ordered build, phone smoke, glasses preflight, validator, and readiness audit commands.
- `phone-manual-checklist.md`: phone alpha manual evidence rows.
- `meta-rayban-checklist.md`: Meta DAT, Ray-Ban Display, and Ray-Ban Meta Gen 1 fallback rows.
- `android-xr-checklist.md`: Android XR projected runtime and fallback rows.
- `privacy-redaction-rules.md`: evidence privacy rules.

## Current Limits

- This does not run physical tests by itself.
- `commands.sh` will stop at the phone smoke step until an ADB phone is attached.
- Meta DAT and Android XR rows remain blocked until credentials, dependencies, runtime proof, and hardware evidence exist.

## Privacy Shape

The generated files explicitly ban raw audio, transcripts, speaker names, profile labels, embedding values, encrypted payload values, Bluetooth owner names, private alert text, and location details from evidence.

## Verification

Checked on 2026-05-28T05:20:55+09:00.

- `node --check scripts/create-physical-test-session.mjs`: passed.
- `node scripts/create-physical-test-session.mjs --run-dir data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack --force --json`: passed and regenerated the session pack.
- `bash -n data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack/commands.sh`: passed.
- `node scripts/validate-physical-test-session.mjs data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack --json`: passed with expected warnings for not-yet-created hardware output files.
- Canonical JSON parse check: passed for candidate, product plan, backend contract, QA report, and implementation lock.
- `node scripts/audit-service-readiness.mjs --json`: passed and still reports only the internal prototype as ready.
- `node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json`: passed with no warnings.
- `./gradlew --no-daemon test assembleDebug`: passed.
