# Android XR Projected Evidence

Generated: 2026-05-28T07:50:41+09:00

Record only status, booleans, command names, dependency status, runtime type, cue visibility, fallback status, and workspace-relative file paths. Do not include private speaker labels, transcripts, raw audio, PCM, embeddings, encrypted values, Bluetooth owner labels, exact locations, or private alert text.

## Setup

- [ ] Android XR-compatible device, emulator, or dev kit available.
- [ ] Android Studio / SDK setup supports the current Android XR projected flow.
- [ ] Jetpack Projected dependencies resolve in the local toolchain.
- [ ] `GlassesProjectedActivity` remains declared for projected display.

## Projected Runtime Proof

- [ ] Android XR runtime available.
- [ ] Projected activity launched.
- [ ] Projected context used.
- [ ] Latest actionable cue visible on projected display.
- [ ] Empty/no-cue state visible.
- [ ] Failure/offline state documented.

## Audio And Fallback Proof

- [ ] Projected-context microphone access tested, or documented unavailable.
- [ ] Bluetooth fallback tested when projected microphone access is unavailable.
- [ ] TTS direction cue tested.
- [ ] No front/back or wearable direction claim added without strict direction evidence.

## Evidence Summary

- status: not_collected
- evidencePath: data/runs/20260528_voice_direction_mvp/77-glasses-hardware-session-pack/android-xr-projected-evidence.md
- adapterStatus: stub / real_adapter
- runtimeAvailable: false
- jetpackProjectedDependenciesResolved: false
- projectedActivityLaunched: false
- projectedContextUsed: false
- cueVisibleOnProjectedDisplay: false
- emptyStateVisible: false
- microphoneAccessTested: false
- bluetoothFallbackTested: false
- failureStateDocumented: false
- validatorCommand: node scripts/validate-glasses-hardware-evidence.mjs --require-glasses-alpha-ready --json

## Outcome

- Android XR projected result: blocked / passed / failed / documented_unavailable
- Blocking issue ids:
- Next run needed:
