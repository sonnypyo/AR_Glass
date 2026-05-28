# Glasses Integration Preflight Stage

Date: 2026-05-28 KST

## Goal

Add an automated preflight check for the Meta DAT and Android XR integration gate before changing the stub adapters.

## Implemented

- Added `scripts/glasses-integration-preflight.sh`.
- The script checks local Android app artifacts, ADB availability, Meta DAT credential placeholders, Meta DAT dependency setup, Android XR projected Activity setup, Android permissions, Jetpack Projected dependency setup, and whether stub adapters are still present.
- Added Meta DAT `APPLICATION_ID` manifest metadata using a build-time placeholder so the value can come from environment/local properties instead of source.
- Added deterministic evidence at `data/runs/20260528_voice_direction_mvp/30-glasses-preflight-evidence/glasses-preflight.md`.
- Added `docs/11-glasses-integration-preflight.md`.

## Why This Matters

The project is now beyond a build-only prototype. The next risk is accidentally treating a stubbed glasses integration as real hardware support. The preflight script makes that impossible to hide: it records which pieces are local-pass, manual-required, or blocked.

## Trial/Error Notes

- The script does not fail just because glasses integration is blocked. Its job is to produce evidence, not to pretend the workspace is ready.
- Credential checks only test for the existence of environment variables or ignored `local.properties` keys. Secret values are never printed.
- Android XR dependency checks remain blocked until Jetpack Projected/Glimmer artifacts are added and resolved in the local toolchain.

## Verification

From the repository root:

```bash
scripts/glasses-integration-preflight.sh --help
scripts/glasses-integration-preflight.sh
scripts/glasses-integration-preflight.sh --write-evidence --evidence-dir data/runs/20260528_voice_direction_mvp/30-glasses-preflight-evidence
/Users/sonjunpyo/Library/Android/sdk/build-tools/36.0.0/aapt2 dump xmltree apps/voice-direction-glass/app/build/outputs/apk/debug/app-debug.apk --file AndroidManifest.xml | rg -n "com.meta.wearable.mwdat.APPLICATION_ID|com.meta.wearable.mwdat.ANALYTICS_OPT_OUT|xr_projected"
```

Result:

- Help path passed.
- Preflight report generation passed.
- Evidence file generation passed.
- APK manifest inspection confirmed Meta DAT `APPLICATION_ID`, Meta DAT `ANALYTICS_OPT_OUT`, and `xr_projected` metadata are packaged.
- Current preflight status is `blocked`, as expected without Meta credentials, DAT dependencies, Jetpack Projected dependencies, and an attached device.
- Latest preflight evidence includes `MODIFY_AUDIO_SETTINGS` as pass for Bluetooth HFP route testing.

## Next Work

1. Add Meta DAT credentials outside source control.
2. Rerun the preflight and keep the generated evidence.
3. Add DAT dependencies after token/package access is available.
4. Add Jetpack Projected/Glimmer dependencies after confirming compatible Android XR artifacts.
5. Run the phone smoke test and then hardware-specific Ray-Ban Display/Android XR evidence tests.
