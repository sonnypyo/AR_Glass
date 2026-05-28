# Private Alpha Rehearsal Checklist

Generated: 2026-05-28T08:01:28+09:00

Record only status, booleans, counts, enum values, checklist ids, and workspace-relative paths. Do not include transcripts, speaker names, raw audio, PCM, embeddings, encrypted values, Bluetooth owner labels, exact locations, or private alert text.

## Phone Private Alpha

- [ ] Physical Android phone attached.
- [ ] Physical session `commands.sh` run.
- [ ] Generated `device-evidence.md` exists.
- [ ] Generated `device-evidence.md` passes validator.
- [ ] Microphone disclosure gate manually verified.
- [ ] Foreground service runtime manually verified.
- [ ] Notification stop action manually verified.
- [ ] Prototype enrollment and live match manually verified.
- [ ] Debug glasses cue seed script-pass.
- [ ] Debug Bluetooth route evidence script-pass.
- [ ] Debug local delete self-check script-pass.
- [ ] Debug alert output script-pass.
- [ ] Debug direction sample script-pass.
- [ ] Latest evidence snapshot includes `latestCuePresent=true`.
- [ ] Latest evidence snapshot includes `latestDeliverySource=TEST_CUE`.
- [ ] 30-minute false-positive run completed.

## Glasses Private Alpha

- [ ] Phone private alpha evidence complete first.
- [ ] Meta DAT credentials configured outside source control.
- [ ] Ray-Ban Display evidence file filled.
- [ ] Ray-Ban Gen 1 fallback evidence file filled or documented unavailable.
- [ ] Android XR projected evidence file filled.
- [ ] Haptics/fallback evidence file filled.
- [ ] Glasses hardware session validator passes after filled evidence.
- [ ] Glasses hardware apply dry-run passes.
- [ ] Strict glasses hardware validator passes only after real evidence exists.

## Support And External Beta

- [ ] Support drill session evidence filled.
- [ ] Deletion verification drill run.
- [ ] Mistaken-alert incident drill run.
- [ ] Strict support drill validator passes.
- [ ] Privacy policy public URL ready.
- [ ] Data Safety answers reviewed.
- [ ] Store review package reviewed.
- [ ] Release signing ready.

## Outcome

- Phone private alpha candidate: no
- Glasses private alpha candidate: no
- External beta candidate: no
- Blocking issue ids:
- Next run needed:
