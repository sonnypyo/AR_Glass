# Android XR Projected Contract Validator

Date: 2026-05-28 KST

## What Changed

Added a local validator for the Android XR projected contract.

New files:

- `scripts/validate-android-xr-projected-contract.mjs`
- `docs/44-android-xr-projected-contract.md`
- `data/runs/20260528_voice_direction_mvp/97-android-xr-projected-contract`

## Current Result

The current app remains workflow-safe:

- `GlassesProjectedActivity` exists.
- `android:requiredDisplayCategory="xr_projected"` is declared.
- The screen renders the latest local cue through `GlassesCueScreen`.
- The app still uses `AndroidXrDisplayStubAdapter`.
- Jetpack XR and Compose Glimmer are not configured.
- `ProjectedContext.createProjectedActivityOptions` and `ProjectedContext.createProjectedDeviceContext` are not used yet.

Therefore:

```text
currentMode=phone_preview_stub
phonePreviewOnly=true
realAndroidXrCandidate=false
```

## Verification

Commands run:

```bash
node --check scripts/validate-android-xr-projected-contract.mjs
scripts/validate-android-xr-projected-contract.mjs --write-report --json
scripts/validate-android-xr-projected-contract.mjs --require-real-android-xr --json
```

Result:

- Syntax check passed.
- Default validation passed and wrote the non-PII report.
- Strict real Android XR validation failed as expected because the real ProjectedContext/Glimmer adapter path is not implemented.

## Next Step

Run the validator after every Android XR dependency, projected launch, Glimmer UI, or real adapter change. Only run strict validation as a promotion gate after real Android XR dependencies and hardware or emulator evidence exist.
