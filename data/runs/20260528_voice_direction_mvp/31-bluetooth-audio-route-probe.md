# Bluetooth Audio Route Probe Stage

Date: 2026-05-28 KST

## Goal

Add a phone-side diagnostic for Ray-Ban and Android XR Bluetooth HFP microphone fallback before depending on projected-context or DAT audio APIs.

## Implemented

- Added `BluetoothAudioRouteProbe` domain types.
- Added `AndroidBluetoothAudioRouteProbe` using Android communication-device APIs on Android 12+.
- Added `BluetoothAudioRouteSummaryFormatter` and unit tests.
- Added `android.permission.MODIFY_AUDIO_SETTINGS` for future communication-route testing.
- Added `블루투스 마이크 경로 점검` to the host app microphone card.
- Added non-PII `bluetooth_audio_route_probe_completed` diagnostics.
- Added Ray-Ban and Android XR Bluetooth fallback proof rows to `GlassesIntegrationReadiness`.
- Updated device test plan, device evidence template, preflight script, privacy notes, and README.

## Why This Matters

Android XR documentation describes projected-context microphone access as the richer route and Bluetooth HFP as a single-microphone fallback. Ray-Ban Meta Gen 1 may also be useful as a Bluetooth audio route even when no display output exists. This probe lets physical testing record whether Android exposes the glasses as a communication input before building more complex routing or direction logic.

## Privacy Boundary

The probe reads communication-device metadata only. It does not start recording, does not read PCM, does not store raw audio, and does not save Bluetooth device names to local app storage.

## Trial/Error Notes

- On Android versions below 12, communication-device enumeration is not available through this API, so the report intentionally marks routing as unsupported.
- The app records whether Bluetooth SCO/BLE headset input is available or selected. It does not force-route audio yet, because that should be done only during an observed physical-device session.
- Bluetooth HFP is single-microphone fallback. It can help detect that glasses audio is reachable, but it cannot prove front/back/left/right direction.

## Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test
./gradlew --no-daemon test assembleDebug
/Users/sonjunpyo/Library/Android/sdk/build-tools/36.0.0/aapt2 dump xmltree app/build/outputs/apk/debug/app-debug.apk --file AndroidManifest.xml | rg -n "BLUETOOTH_CONNECT|MODIFY_AUDIO_SETTINGS"
```

Result:

- Unit tests passed after adding Bluetooth audio route formatter tests.
- Debug APK assembled.
- APK manifest inspection confirmed `BLUETOOTH_CONNECT` and `MODIFY_AUDIO_SETTINGS` are packaged.

## Next Work

1. Run `블루투스 마이크 경로 점검` with Ray-Ban Meta Gen 1 and Ray-Ban Display paired to the phone.
2. Record whether Bluetooth SCO or BLE headset input appears.
3. Use the later `32-bluetooth-route-selection.md` stage to select/clear the route during an observed test.
4. Keep direction claims conservative because HFP is single-mic.
