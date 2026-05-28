# Alert Delivery Persistence

Date: 2026-05-28 KST

## Goal

Persist the latest alert delivery result as non-PII metadata so phone, vibration, TTS, Meta Display, and Android XR output attempts can be inspected after service-owned detection or app restart.

## Implemented

- Added `AlertDeliverySnapshot` and `AlertDeliveryRecord`.
- Persisted the latest delivery snapshot from manual simulation and foreground service detection.
- Stored only channel and delivered status, not cue text or speaker/message content.
- Added codec and repository tests for delivery snapshot storage.
- Added the latest delivery snapshot to the host app output card.
- Added delivery status fields to the debug non-PII evidence snapshot.
- Extended the device evidence validator fixture with delivery status fields.

## Privacy Boundary

The persisted delivery snapshot does not store alert messages, spoken text, transcript text, raw audio, speaker embedding values, or encrypted payload values. It stores channel enum plus delivered/failed status only.

## Trial/Error Notes

- A delivered phone/TTS/vibration status still needs physical observation. The snapshot proves the app attempted and recorded the channel output.
- Meta Display and Android XR channels remain stubbed until real adapters and hardware evidence exist, so failure/missing states are expected before glasses integration.
- Service-owned detection can now be reviewed in the app without relying only on transient in-memory `lastDeliveries`.

## Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- Unit tests passed.
- Debug APK assembled.
- Delivery snapshot codec and repository tests passed.

## Next Work

- Run the physical phone smoke test and confirm the generated evidence snapshot includes latest delivery status fields.
- Confirm observed phone notification, vibration, and TTS behavior matches the persisted delivery statuses.
