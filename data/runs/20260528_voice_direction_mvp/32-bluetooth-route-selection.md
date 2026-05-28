# Bluetooth Route Selection Stage

Date: 2026-05-28 KST

## Goal

Add guarded Bluetooth communication route selection and clear controls after the route probe reports a Ray-Ban or Android XR Bluetooth input candidate.

## Implemented

- Extended `BluetoothAudioRouteProbe` with `selectBluetoothInput()` and `clearSelectedRoute()`.
- Added `BluetoothAudioRouteSelectionResult` and status values for routed, cleared, no input, unsupported SDK, permission required, audio manager unavailable, and failed.
- Implemented Android route selection with `AudioManager.setCommunicationDevice(...)`.
- Implemented route clear with `AudioManager.clearCommunicationDevice()`.
- Added UI buttons: `블루투스 입력 선택` and `통신 경로 해제`.
- Added non-PII diagnostics:
  - `bluetooth_audio_route_selection_completed`
  - `bluetooth_audio_route_clear_completed`
- Updated smoke evidence and device test plan rows.

## Why This Matters

The route probe can show whether a Bluetooth microphone candidate exists, but service testing also needs a controlled way to ask Android to use that candidate as the communication route. This lets the next physical test compare phone mic, Ray-Ban HFP, and Android XR HFP behavior without changing the foreground recognition pipeline yet.

## Privacy Boundary

Route selection stores no audio, transcript, device owner name, or route history. The UI summary is transient in Activity state. Evidence reports should record only status such as routed, cleared, no input, or permission required.

## Trial/Error Notes

- Route selection is guarded by microphone and Bluetooth permissions.
- Android versions below 12 report unsupported because the current implementation uses communication-device APIs introduced for modern routing.
- Bluetooth HFP remains single-microphone. It can prove audio reachability, not reliable caller direction.
- A production path may later add an explicit route lock during a foreground session, but this stage keeps selection manual for observed tests.

## Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test
```

Result:

- Unit tests passed after adding selection/clear formatter coverage.

## Next Work

1. Pair Ray-Ban Meta Gen 1 or Ray-Ban Display to the Android phone.
2. Run `블루투스 마이크 경로 점검`.
3. If a candidate appears, run `블루투스 입력 선택`, then one short speech recognition or direction diagnostic, then `통신 경로 해제`.
4. Record only status-level evidence in `device-evidence.md`.
