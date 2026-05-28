# Android XR Projected Contract Validation

Generated: 2026-05-28T11:13:15+09:00
Mode: phone_preview_stub
Result: pass

## Decision

The local project is a phone-hosted projected preview with an Android XR stub adapter. This is valid workflow evidence only, not real Android XR runtime proof.

## Contract Checks

| Check | Status |
| --- | --- |
| Manifest declares GlassesProjectedActivity | pass |
| Manifest has android:requiredDisplayCategory="xr_projected" | pass |
| GlassesProjectedActivity renders cue screen | pass |
| Phone preview launch exists | pass |
| ProjectedContext.createProjectedActivityOptions used | not ready |
| ProjectedContext.createProjectedDeviceContext used | not ready |
| Jetpack XR dependency configured | not ready |
| Compose Glimmer dependency configured | not ready |
| Android XR stub adapter active | pass |
| Platform freshness summary ok | pass |

## Platform Source Basis

- Freshness report: `data/runs/20260528_voice_direction_mvp/82-platform-source-freshness/platform-source-freshness.json`
- Freshness generated: 2026-05-28T11:13:05+09:00
- Android XR latest source date: 2026-05-19
- Canonical first activity: https://developer.android.com/develop/xr/jetpack-xr-sdk/glasses/first-activity

## Strict Android XR Missing Items

- Jetpack XR dependency is not configured.
- Compose Glimmer dependency is not configured.
- ProjectedContext.createProjectedActivityOptions is not used by the app launch path.
- ProjectedContext.createProjectedDeviceContext is not used for projected-device hardware access.
- AndroidXrDisplayStubAdapter is still active in AndroidListeningEngineFactory.

## Warnings

- Current Android XR path is phone-hosted preview plus stub adapter; it is valid workflow evidence, not real XR runtime proof.
- Real projected launch must use ProjectedContext.createProjectedActivityOptions before Android XR alpha claims.
- Real glasses microphone/camera access must use ProjectedContext.createProjectedDeviceContext or a documented Bluetooth fallback before Android XR hardware claims.

## Errors

- None.

## Privacy Guardrail

This summary stores only booleans, paths, source ids, and dates. It must not include raw audio, transcripts, speaker names, Bluetooth names, MAC addresses, private alert text, embeddings, or projected display screenshots.
