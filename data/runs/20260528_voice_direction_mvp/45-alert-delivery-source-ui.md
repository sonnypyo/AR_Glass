# Alert Delivery Source UI

## Goal

Show testers whether the latest alert delivery result came from `알림 출력 점검` or a real detection event.

## Implemented

- Added `AlertDeliverySource` to the alert delivery snapshot model.
- Source is derived from the internal id prefix without exposing the id:
  - `alert-test-*` -> `TEST_CUE`
  - `event-*` -> `DETECTION_EVENT`
  - anything else -> `UNKNOWN`
- Updated the debug evidence snapshot to use the shared model source.
- Added `최근 출처` to the `알림 출력` card.
- Added unit coverage for source derivation.

## Privacy Boundary

- The UI shows only coarse source labels: alert output test, detection event, or unknown.
- The debug evidence still exports only the source enum, not the internal event id.
- No transcript, speaker label, alert text, raw audio, PCM, or embedding values are exposed by this source field.

## Trial/Error

- The previous evidence source field was correct, but the app UI did not show the same distinction. That could confuse the physical-phone tester after using both direct output tests and real detection flows.
- Keeping the source logic in the model avoids duplicating prefix rules between UI and debug evidence.

## Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- Build and unit tests passed.

## Next Work

- On a physical phone, verify the `알림 출력` card shows `최근 출처: 알림 출력 점검` after the direct alert test.
- Then run a real detection and verify it changes to `최근 출처: 감지 이벤트`.
