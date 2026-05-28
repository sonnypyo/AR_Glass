# Android XR Preflight Contract Integration

Date: 2026-05-28 KST

## What Changed

Connected the Android XR projected-contract validator to the glasses integration preflight.

Changed files:

- `scripts/glasses-integration-preflight.sh`
- `docs/11-glasses-integration-preflight.md`
- `docs/24-glasses-setup-readiness.md`
- `docs/44-android-xr-projected-contract.md`
- `docs/45-android-xr-preflight-contract-integration.md`

Updated evidence:

- `data/runs/20260528_voice_direction_mvp/30-glasses-preflight-evidence/glasses-preflight.md`
- `data/runs/20260528_voice_direction_mvp/81-private-alpha-hardware-readiness/hardware-readiness-preflight.md`
- `data/runs/20260528_voice_direction_mvp/52-service-readiness-audit/service-readiness-audit.md`

## Current Result

The glasses preflight now records:

```text
Projected contract default validation = pass
Strict real projected contract = manual-required
```

The overall preflight remains blocked because no real phone/glasses hardware evidence, Meta credentials, DAT dependency setup, Jetpack Projected setup, or real adapters are available yet.

## Verification

Commands run:

```bash
bash -n scripts/glasses-integration-preflight.sh
scripts/glasses-integration-preflight.sh --write-evidence --evidence-dir data/runs/20260528_voice_direction_mvp/30-glasses-preflight-evidence
node scripts/check-private-alpha-hardware-readiness.mjs --write-report --json
node scripts/audit-service-readiness.mjs --write-report --report-dir data/runs/20260528_voice_direction_mvp/52-service-readiness-audit
scripts/validate-android-xr-projected-contract.mjs --json
scripts/validate-hardware-test-operator-pack.mjs --json
data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk ./gradlew --no-daemon test assembleDebug
```

Result:

- Bash syntax passed.
- Glasses preflight evidence regenerated with the two Android XR projected contract rows.
- Hardware readiness preflight passed as a workflow summary and now reports glasses preflight `pass=11`, `manual=5`, `blocked=5`.
- Service readiness audit regenerated and still keeps phone/glasses alpha blocked until real evidence exists.
- Android XR projected contract default validation passed.
- Operator pack validation and default no-hardware run passed as workflow-only evidence.
- Android unit tests and debug APK assembly passed.

## Next Step

Keep the default Android XR projected contract passing whenever the projected cue screen changes. Use strict Android XR validation only after Jetpack XR, Compose Glimmer, ProjectedContext launch/device context, real adapter replacement, and device/emulator evidence exist.
