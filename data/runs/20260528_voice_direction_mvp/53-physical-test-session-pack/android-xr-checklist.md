# Android XR Checklist

Generated: 2026-05-28T12:17:16+09:00

Use this when Android XR emulator, developer kit, or glasses runtime is available.

## Preflight

- [ ] Android Studio / SDK preview tooling supports the target Android XR runtime.
- [ ] Jetpack XR projected dependencies resolve in this local toolchain.
- [ ] `glasses-preflight/glasses-preflight.md` has no Android XR dependency blocked rows.
- [ ] Android XR device/emulator is attached or available.

## Projected Cue

- [ ] `GlassesProjectedActivity` launches in projected context.
- [ ] Latest actionable cue is visible on projected display.
- [ ] Cue direction is readable at glasses distance.
- [ ] Empty/no-cue state is readable.
- [ ] Offline/failure state is documented.

## Audio And Fallback

- [ ] Projected-context microphone access tested.
- [ ] Available microphone channel count recorded as enum/count only.
- [ ] Bluetooth HFP/BLE fallback route probe run.
- [ ] Bluetooth route select/clear run when a candidate appears.
- [ ] TTS direction cue tested.

## Adapter Replacement

- [ ] `AndroidXrDisplayStubAdapter` replacement plan written.
- [ ] Real adapter emits display cue.
- [ ] Real adapter reports delivery status without private text.
- [ ] Readiness audit rerun after adapter proof.
