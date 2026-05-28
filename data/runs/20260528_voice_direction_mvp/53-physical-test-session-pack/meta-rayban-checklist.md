# Meta Ray-Ban Checklist

Generated: 2026-05-28T12:17:16+09:00

Do not mark any row pass without physical Ray-Ban evidence or documented official-SDK limitation. Keep credentials outside source control.

## Preflight

- [ ] Meta Developer account access confirmed.
- [ ] Meta AI app Developer Mode confirmed.
- [ ] Meta Wearables application id configured outside source control.
- [ ] GitHub Packages token for Meta DAT configured outside source control.
- [ ] `glasses-preflight/glasses-preflight.md` has no Meta DAT blocked rows.

## Ray-Ban Display

- [ ] Real DAT adapter replaces `MetaDatDisplayStubAdapter`.
- [ ] SDK registration/session lifecycle observed.
- [ ] Latest actionable cue renders on Ray-Ban Display.
- [ ] Cue direction is visible without private speaker names in evidence.
- [ ] Failure/offline state is documented.

## Ray-Ban Meta Gen 1 Fallback

- [ ] Display unavailable behavior documented.
- [ ] Bluetooth microphone route probe run.
- [ ] Bluetooth route select/clear run when a candidate appears.
- [ ] TTS direction cue tested over available phone/Bluetooth route.
- [ ] Phone vibration fallback tested.

## Unknowns To Resolve

- [ ] Official API exposes useful microphone/channel metadata: yes / no / not available.
- [ ] Glasses-side haptics API available: yes / no / not available.
- [ ] Per-side haptics possible: yes / no / not available.
- [ ] Wearable direction-of-arrival evidence collected: yes / no.
