# Ray-Ban Gen 1 Fallback Evidence

Generated: 2026-05-28T07:50:41+09:00

Record only status, booleans, enum values, route counts, route type counts, command names, and workspace-relative file paths. Do not include Bluetooth owner/device names, MAC addresses, private speaker labels, transcripts, raw audio, PCM, embeddings, encrypted values, exact locations, or private alert text.

## Setup

- [ ] Ray-Ban Meta Gen 1 paired.
- [ ] Android `BLUETOOTH_CONNECT` permission granted where required.
- [ ] Debug Bluetooth route evidence broadcast available in debug APK.
- [ ] Phone notification/vibration/TTS channels are configured.

## Route Proof

- [ ] Bluetooth communication-device route probe run.
- [ ] Bluetooth input candidate visibility recorded as boolean.
- [ ] Route candidate counts recorded without product names.
- [ ] Route select/clear tested when candidate appears.
- [ ] Private route names redacted.

## Fallback Output Proof

- [ ] Display unavailable behavior documented.
- [ ] TTS direction cue heard, or documented unavailable.
- [ ] Phone vibration fallback observed, or documented unavailable.
- [ ] Evidence confirms no glasses display claim is made for Gen 1.

## Evidence Summary

- status: not_collected
- evidencePath: data/runs/20260528_voice_direction_mvp/77-glasses-hardware-session-pack/rayban-gen1-fallback-evidence.md
- routeProbeRun: false
- bluetoothInputCandidateVisible:
- routeSelectClearTested: false
- ttsDirectionCueHeard: false
- phoneVibrationFallbackObserved: false
- displayUnavailableDocumented: false
- privateRouteNamesRedacted: false
- validatorCommand: node scripts/validate-glasses-hardware-evidence.mjs --require-glasses-alpha-ready --json

## Outcome

- Gen 1 fallback result: blocked / passed / failed / documented_unavailable
- Blocking issue ids:
- Next run needed:
