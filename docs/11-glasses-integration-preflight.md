# Glasses Integration Preflight

Date: 2026-05-28 KST

## Purpose

This document defines the preflight gate before replacing the Meta DAT and Android XR stub adapters with real glasses integrations.

Run:

```bash
scripts/glasses-integration-preflight.sh --write-evidence
```

The script checks local build artifacts, ADB availability, Meta DAT credential placeholders, DAT dependency setup, Android XR projected activity setup, Android permissions, Jetpack Projected dependency setup, Android XR projected contract status, and whether the app is still using stub adapters. It writes `glasses-preflight.md` under `data/runs/`.

## What It Proves

- The Android app, manifest, and debug APK exist.
- The projected cue Activity is declared with `android:requiredDisplayCategory="xr_projected"`.
- Microphone and Bluetooth permissions needed for phone/projected-device testing are declared.
- `MODIFY_AUDIO_SETTINGS` is declared for Bluetooth HFP communication-route testing.
- The default Android XR projected contract still passes while the app is in phone-preview/stub mode.
- Meta DAT application ID metadata is present and receives its value through a manifest placeholder.
- Meta DAT analytics opt-out metadata is present.
- Whether a physical ADB device is currently attached.

## What It Does Not Prove

- It does not authenticate with Meta.
- It does not download DAT packages.
- It does not run Ray-Ban Display, Ray-Ban Meta Gen 1, or Android XR hardware.
- It does not prove glasses haptics.
- It does not prove wearable microphone direction-of-arrival.

## Credential Rules

Keep credentials outside source control.

Supported local inputs:

- `GITHUB_TOKEN` environment variable, or `apps/voice-direction-glass/local.properties` key `github_token`.
- `META_WEARABLES_APPLICATION_ID` environment variable, or `apps/voice-direction-glass/local.properties` key `meta_wearables_application_id`.
- A secret-free example exists at `apps/voice-direction-glass/local.properties.example`.

Validate the template and current source references:

```bash
node scripts/validate-glasses-setup-readiness.mjs --json
```

Strict local credential validation:

```bash
node scripts/validate-glasses-setup-readiness.mjs --require-credentials --json
```

The preflight script checks whether these exist, but never prints their values.

## Current Result

The current generated evidence is:

```text
data/runs/20260528_voice_direction_mvp/30-glasses-preflight-evidence/glasses-preflight.md
```

Current status: blocked.

Reasons:

- No ADB device is attached.
- Meta DAT GitHub Packages token is not configured.
- Meta Wearables application ID is not configured.
- DAT Maven repository and dependencies are not configured.
- Jetpack Projected dependencies are not configured.
- Meta and Android XR adapters are still stubs.
- Strict real Android XR projected contract is not ready because Jetpack XR, Glimmer, ProjectedContext launch/device context, real adapter, and runtime evidence are missing.

## Source Basis

- Meta DAT Android SDK is Developer Preview and uses GitHub Packages token access: https://github.com/facebook/meta-wearables-dat-android
- Meta DAT session lifecycle must be observed before live work: https://wearables.developer.meta.com/docs/develop/dat/lifecycle-events/
- Android XR Jetpack XR SDK includes projected experiences for audio/display glasses: https://developer.android.com/develop/xr/jetpack-xr-sdk
- Android XR projected activities use projected launch options: https://developer.android.com/develop/xr/jetpack-xr-sdk/glasses/first-activity
- Android XR projected hardware access requires projected-device-scoped context/permissions: https://developer.android.com/develop/xr/jetpack-xr-sdk/access-hardware-projected-context
- Android XR projected context is the device-aware path for connected glasses: https://developer.android.com/develop/xr/jetpack-xr-sdk/glasses/support-different-types

## Next Work

1. Copy `apps/voice-direction-glass/local.properties.example` to `local.properties` or export environment variables.
2. Add Meta credentials outside source control.
3. Run `node scripts/validate-glasses-setup-readiness.mjs --json`.
4. Run `scripts/validate-android-xr-projected-contract.mjs --json`.
5. Run `scripts/glasses-integration-preflight.sh --write-evidence`.
6. Add DAT Maven/dependencies only after token access is available.
7. Add Jetpack Projected/Glimmer dependencies after the local Android toolchain can resolve them.
8. Replace one stub adapter at a time and record a new preflight/evidence file after each integration.
