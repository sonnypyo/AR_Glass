# Phone Manual Checklist

Generated: 2026-05-28T12:17:16+09:00

Use this after `commands.sh` creates `android-phone-smoke/device-evidence.md`. Record pass/fail/status only. Do not paste transcripts, speaker names, raw audio, PCM, embeddings, encrypted values, Bluetooth owner names, or private alert text.

## Setup

- [ ] ADB phone is visible.
- [ ] Debug APK installs.
- [ ] Microphone disclosure blocks microphone permission/audio flow until checked.
- [ ] Microphone permission granted.
- [ ] Notification permission granted where required.
- [ ] Bluetooth permission granted where required.
- [ ] `android-phone-smoke/device-evidence.md` exists.
- [ ] `validate-device-evidence.mjs` passes for the generated report.

## Core Runtime

- [ ] `마이크 사용 안내` accepted before any microphone action.
- [ ] `세션 시작` starts foreground service.
- [ ] Persistent foreground notification appears.
- [ ] Notification stop action stops service.
- [ ] One-shot speech recognition creates a detection result without storing transcript in evidence.
- [ ] Processing latency appears in latest event/evidence snapshot.
- [ ] Service diagnostic card updates after a foreground-service bridge run.

## Speaker And Consent

- [ ] New speaker profile cannot be created until explicit consent checkbox is selected.
- [ ] Enrollment sample quality capture accepts only usable samples.
- [ ] Same-speaker prototype match diagnostic recorded as bucket/status only.
- [ ] Different-speaker prototype match diagnostic recorded as bucket/status only.

## Direction And Alerts

- [ ] Microphone channel probe records mono/stereo support only.
- [ ] Direction sample records direction enum, confidence bucket, and evidence label only.
- [ ] Debug glasses cue seed broadcast is script-pass and latest evidence snapshot shows `latestCuePresent=true`.
- [ ] Debug direction sample broadcast is script-pass and records status/evidence/microphone metadata counts only.
- [ ] Optional ADB direction validation trial recorder tested with `scripts/record-direction-validation-trial.sh` during controlled positioning.
- [ ] Debug Bluetooth route evidence broadcast is script-pass and records route support/count/type metadata only.
- [ ] Debug local delete self-check broadcast is script-pass and records post-delete counts only.
- [ ] Left trial recorded.
- [ ] Right trial recorded.
- [ ] Front trial recorded as unproven/unknown unless strong hardware evidence exists.
- [ ] Back trial recorded as unproven/unknown unless strong hardware evidence exists.
- [ ] `direction-accuracy-checklist.md` is filled with aggregate counts only.
- [ ] Strict direction accuracy validation remains blocked unless controlled evidence has been added deliberately.
- [ ] Phone notification observed.
- [ ] Phone vibration pattern observed.
- [ ] TTS direction-only cue heard or documented as unavailable.
- [ ] Alert channel preferences filter outputs.
- [ ] `알림 출력 점검` creates a test delivery snapshot without detection event.
- [ ] Latest evidence snapshot shows `latestCuePresent=true` after scripted glasses cue seed.
- [ ] Latest evidence snapshot shows `latestDeliverySource=TEST_CUE` after scripted test cue.
- [ ] Bluetooth route evidence contains no product names, owner names, or MAC addresses.
- [ ] Latest evidence snapshot includes direction sample microphone metadata counts after scripted direction sample.

## False Positive And Storage

- [ ] Accurate feedback persists.
- [ ] False-positive feedback persists.
- [ ] Wrong-speaker feedback persists.
- [ ] Wrong-direction feedback persists.
- [ ] 30-minute false-positive test session started, ended, and summarized.
- [ ] Real app data survives force-stop/reopen.
- [ ] Local delete button tested.
- [ ] Debug local delete self-check uses only the separate debug store and does not delete tester app data.

## Outcome

- Phone private alpha candidate: yes / no
- Blocking issue ids:
- Next run needed:
