# Glasses Integration Preflight

Generated: 2026-05-28T07:50:52+0900

## Summary

- Overall status: blocked
- Pass: 10
- Manual required: 4
- Blocked: 5

## Checks

| Area | Check | Result | Notes |
| --- | --- | --- | --- |
| Workspace | Android app directory | pass | /Users/sonjunpyo/Documents/Project/glass/apps/voice-direction-glass |
| Workspace | Android manifest | pass | /Users/sonjunpyo/Documents/Project/glass/apps/voice-direction-glass/app/src/main/AndroidManifest.xml |
| Workspace | Debug APK built | pass | /Users/sonjunpyo/Documents/Project/glass/apps/voice-direction-glass/app/build/outputs/apk/debug/app-debug.apk |
| Device | ADB device attached | manual-required | No ADB device is attached. Connect Android phone, Ray-Ban host phone, or Android XR host. |
| Meta DAT | GitHub Packages token configured | blocked | Use GITHUB_TOKEN or app local.properties github_token; value is never printed. |
| Meta DAT | Meta Wearables application id configured | blocked | Use META_WEARABLES_APPLICATION_ID or app local.properties meta_wearables_application_id; value is never printed. |
| Meta DAT | Application ID manifest metadata | pass | Value is supplied through manifest placeholder and must not be hard-coded. |
| Meta DAT | Analytics opt-out manifest metadata | pass | Privacy-first default for DAT analytics. |
| Meta DAT | DAT Maven repository configured | blocked | Needed before replacing MetaDatDisplayStubAdapter. |
| Meta DAT | DAT dependency configured | blocked | Public setup lists com.meta.wearable artifacts; display cue API/module still needs account-doc confirmation. |
| Meta DAT | Stub adapter still active | manual-required | Replace only after credentials, package access, and a device session are available. |
| Android XR | Projected activity source exists | pass | /Users/sonjunpyo/Documents/Project/glass/apps/voice-direction-glass/app/src/main/kotlin/com/voicedirection/glass/app/GlassesProjectedActivity.kt |
| Android XR | Manifest declares projected display category | pass | Required for launching the cue screen as projected glasses UI. |
| Android XR | RECORD_AUDIO permission declared | pass | Needed for phone and projected-device microphone flows. |
| Android XR | BLUETOOTH_CONNECT permission declared | pass | Needed for Bluetooth HFP fallback testing. |
| Android XR | MODIFY_AUDIO_SETTINGS permission declared | pass | Needed before routing communication audio to Bluetooth HFP during device tests. |
| Android XR | Jetpack Projected dependency configured | blocked | Needed for ProjectedContext launch and projected-device hardware access. |
| Android XR | Compose Glimmer dependency configured | manual-required | Needed for production display-glasses UI; current preview uses standard Compose. |
| Android XR | Stub adapter still active | manual-required | Replace after Jetpack Projected runtime proof. |

## Source Basis

- Meta DAT Android SDK is developer preview and uses GitHub Packages token access: https://github.com/facebook/meta-wearables-dat-android
- Meta DAT session lifecycle must be observed before doing live work: https://wearables.developer.meta.com/docs/lifecycle-events
- Android XR Jetpack Projected is the phone-to-audio/display-glasses path: https://developer.android.com/develop/xr/jetpack-xr-sdk
- Android XR projected activities launch with ProjectedContext options: https://developer.android.com/develop/xr/jetpack-xr-sdk/ai-glasses/first-activity
- Android XR projected microphone access needs projected-device-scoped permissions and AudioRecord with projected context: https://developer.android.com/develop/xr/jetpack-xr-sdk/access-hardware-projected-context

## Next Actions

1. Add Meta credentials only in environment variables or `apps/voice-direction-glass/local.properties`.
2. Add DAT Maven/dependencies after credentials are available.
3. Add Jetpack Projected/Glimmer dependencies only when Android XR preview artifacts are available in this toolchain.
4. Run this preflight again, then run `scripts/android-device-smoke-test.sh --write-evidence` with a physical phone.
5. Do not mark glasses private alpha ready until a Ray-Ban Display or Android XR evidence file proves projected cue behavior.
