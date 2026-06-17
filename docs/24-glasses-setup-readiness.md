# Glasses Setup Readiness

Date: 2026-05-28 KST

## Purpose

This document defines the secret-free setup gate before real Meta Ray-Ban Display, Ray-Ban Meta Gen 1 fallback, or Android XR audio/display glasses testing.

Glasses setup readiness status: DRAFT_CREDENTIALS_NOT_CONFIGURED.

The goal is to make the next hardware step repeatable without storing secrets in the repository.

## Official Source Snapshot

Checked on 2026-05-28 KST:

| Area | Source | Current implication |
| --- | --- | --- |
| Meta Wearables entry | https://wearables.developer.meta.com/docs/develop | Meta developer account and logged-in docs are required before live DAT work. |
| Meta display glasses developer blog | https://developers.meta.com/blog/build-for-display-glasses/ | Meta describes DAT native mobile and Web Apps as separate developer-preview build paths. |
| Meta Wearables Web App toolkit | https://github.com/facebookincubator/meta-wearables-webapp | Static HTML/CSS/JavaScript Web Apps can be tested in browser and deployed to glasses through a public HTTPS URL. |
| Meta DAT Android repository | https://github.com/facebook/meta-wearables-dat-android | DAT Android setup uses GitHub Packages and Meta application metadata. |
| Meta DAT iOS repository | https://github.com/facebook/meta-wearables-dat-ios | iOS DAT is available through Swift Package Manager and should be considered after MVP if the user keeps Ray-Ban devices paired to iPhone. |
| Android XR SDK | https://developer.android.com/develop/xr/jetpack-xr-sdk | Jetpack XR SDK APIs for audio/display glasses are still preview/developer-preview oriented. |
| Android XR first activity for audio/display glasses | https://developer.android.com/develop/xr/jetpack-xr-sdk/glasses/first-activity | Projected activity launch uses `ProjectedContext.createProjectedActivityOptions(...)`; docs also mention Compose Glimmer. |
| Android XR projected hardware access | https://developer.android.com/develop/xr/jetpack-xr-sdk/access-hardware-projected-context | Glasses microphone/hardware access requires projected context; Bluetooth recording remains a fallback. |
| Android XR support different glasses | https://developer.android.com/develop/xr/jetpack-xr-sdk/glasses/support-different-types | Projected context is the device-aware path for connected audio/display glasses hardware. |

## Secret-Free Template

The local template lives at:

```text
apps/voice-direction-glass/local.properties.example
```

Copy it locally when needed:

```bash
cp apps/voice-direction-glass/local.properties.example apps/voice-direction-glass/local.properties
```

Then fill values only in `local.properties` or environment variables:

- `META_WEARABLES_APPLICATION_ID` or `meta_wearables_application_id`
- `GITHUB_TOKEN` or `github_token`
- Optional upload signing values only when preparing Play upload signing.

Do not commit `local.properties`, tokens, application IDs tied to private accounts, keystore passwords, or signed release artifacts.

## Validation Command

Default validation checks the template, docs, and preflight source references:

```bash
node scripts/validate-glasses-setup-readiness.mjs --json
```

Strict validation requires local credential presence without printing values:

```bash
node scripts/validate-glasses-setup-readiness.mjs --require-credentials --json
```

Expected current result: default validation passes; strict validation fails until the Meta application ID and GitHub Packages token are configured locally.

## Web Apps Setup Order

This path can move without an attached Android phone:

1. Open `apps/meta-rayban-display-webapp/index.html` locally.
2. Verify `FRONT`, `BACK`, `LEFT`, `RIGHT`, and `UNKNOWN` render in a 600x600 browser viewport.
3. Keep the Web App display-only: no microphone, camera, Bluetooth, location, account, speaker names, transcripts, raw audio, or private alert text.
4. Host the folder at a public HTTPS URL only when Ray-Ban Display testing is ready.
5. Add the Web App URL in the Meta AI app Web Apps flow after logged-in documentation review.
6. Record only non-PII display evidence.

## Native DAT Hardware Setup Order

1. Copy `local.properties.example` to `local.properties`.
2. Fill Meta application ID and GitHub token locally or export environment variables.
3. Run `node scripts/validate-glasses-setup-readiness.mjs --json`.
4. Run `node scripts/validate-glasses-setup-readiness.mjs --require-credentials --json`.
5. Run `scripts/validate-android-xr-projected-contract.mjs --json` before changing Android XR projected launch, dependency, Glimmer, or adapter code.
6. Run `scripts/glasses-integration-preflight.sh --write-evidence`.
7. Connect a physical Android phone and run `scripts/android-device-smoke-test.sh --write-evidence`.
8. Use the generated physical test session pack before replacing any stub adapter.

## Release Gate

This setup gate does not prove glasses alpha readiness. It only proves that the local workspace has a secret-free setup template and can detect whether required local credentials are present.

Glasses private alpha still requires:

- Meta DAT package access.
- Real DAT adapter implementation.
- Ray-Ban Display Web App HTTPS deployment and display proof if the Web App lane is used.
- Ray-Ban Display cue proof.
- Ray-Ban Gen 1 Bluetooth route proof if used as fallback.
- Android XR projected runtime proof.
- Direction and haptics evidence before any direction/haptics product claim.

## Trial/Error Notes

- The Android XR first-activity docs now resolve to the `glasses/first-activity` URL. Older local references to `ai-glasses/first-activity` should not be used as the canonical source.
- Credentials should be checked by presence only. Scripts must not print token or application ID values.
- A valid template is not the same as configured credentials. Strict mode remains blocked until the local machine has real values.
