# Device Test Plan

## Purpose

This checklist defines how to move the current prototype from command-line build success to real device evidence on phone, Meta Ray-Ban hardware, and Android XR glasses.

## Current Testable Build

APK path after `assembleDebug`:

```text
apps/voice-direction-glass/app/build/outputs/apk/debug/app-debug.apk
```

Build commands:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test
./gradlew --no-daemon assembleDebug
```

## Phone Baseline Test

For the actual test day, create and run the top-level operator pack first:

```bash
scripts/create-hardware-test-operator-pack.mjs --force --json
scripts/validate-hardware-test-operator-pack.mjs --json
data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
```

Use `RUN_PHONE=1`, `RUN_GLASSES=1`, or `RUN_SUPPORT=1` with that pack only when the matching hardware or owner is ready.

For a new hardware pass, create a physical-test session folder first:

```bash
scripts/create-physical-test-session.mjs --run-dir data/runs/<run>/physical-test-session
```

For a controlled front/back/left/right direction pass, create a dedicated direction-trial session too:

```bash
scripts/create-controlled-direction-trial-session.mjs --run-dir data/runs/<run>/controlled-direction-trial-session --json
scripts/validate-controlled-direction-trial-session.mjs data/runs/<run>/controlled-direction-trial-session --json
```

1. Connect an Android phone with USB debugging enabled.
2. Confirm the device is visible:

```bash
/Users/sonjunpyo/Library/Android/sdk/platform-tools/adb devices
```

3. Run the smoke test script:

```bash
scripts/android-device-smoke-test.sh --write-evidence
```

This script builds the debug APK, installs it, grants available runtime permissions, runs the debug-only encrypted storage self-check, runs the debug-only repository direction-validation self-check, launches the main Activity, attempts to launch the projected cue Activity, runs a debug-only alert output test through enabled channels with non-PII phone vibration pattern metadata and glasses haptics intent metadata, runs a debug-only direction sample test that stores only status/evidence/count metadata, collects a non-PII repository evidence snapshot, collects release/glasses readiness snapshots, writes a redacted `device-evidence.md` report under `data/runs/<timestamp>_android_phone_smoke/`, and validates the report with `scripts/validate-device-evidence.mjs` when Node.js is available. If multiple devices are connected, set `ANDROID_SERIAL`; the generated report and path must still redact the device serial and build fingerprint.

For the phone-private-alpha gate, prefer the wrapper below because it also regenerates the service-readiness audit and writes a non-PII summary:

```bash
scripts/run-phone-private-alpha-evidence.mjs
```

Use `--allow-no-device` only to verify the workflow shape on a development machine without an attached phone. It does not count as evidence.

The script also prints recent `VoiceDirectionGlass` logcat lines. These logs are intentionally non-PII: they include session/service lifecycle, permission status, whether detection was actionable, confidence buckets, direction enums, delivery count, cue-save status, audio probe status, and projected cue load status. They must not include transcripts, raw audio, or speaker names.

4. Install the APK manually if you are not using the script:

```bash
/Users/sonjunpyo/Library/Android/sdk/platform-tools/adb install -r apps/voice-direction-glass/app/build/outputs/apk/debug/app-debug.apk
```

5. Open `Voice Direction Glass`.
6. Leave `마이크 사용 안내` unchecked and confirm `세션 시작`, `음성 인식 1회 테스트`, and sample/probe actions do not request microphone permission or start audio flow.
7. Check `마이크 사용 안내`, then grant microphone permission when the OS prompt appears.
8. Tap `세션 시작`.
9. Verify a persistent `Voice Direction Glass 실행 중` foreground notification appears.
10. Keep the app open and say a phrase containing the trigger word and an enrolled speaker label.
11. Confirm the foreground notification changes from waiting state to a detection result or a documented non-match state.
12. Stop the session.
13. Tap `음성 인식 1회 테스트`, say a phrase containing the trigger word, and confirm the transcript fills the simulator field and immediately creates a detection result.
14. Select direction and tap `호출 감지 시뮬레이션`.
15. Confirm phone notification, TTS direction cue, and vibration behavior.
16. Confirm the `알림 출력` card records channel statuses for phone notification, vibration, TTS, Meta Display, and Android XR without storing alert message text.
17. Toggle each `알림 채널` option off/on, confirm at least one channel remains enabled, and verify the next simulation/service result only emits enabled delivery rows.
18. Tap `알림 출력 점검` after toggling channels and confirm it writes a delivery snapshot without creating a detection event. The `알림 출력` card should show `최근 출처: 알림 출력 점검`.
19. Open the projected cue Activity path on a compatible projected display, or launch `GlassesProjectedActivity` manually during development, and confirm it shows the latest actionable speaker/direction cue.
20. Tap `글래스 큐 미리보기` on the phone app and confirm the same latest cue appears without requiring XR hardware.
21. Verify a new speaker label cannot be saved until the explicit consent checkbox is selected.
22. Stop the session, tap `음성 샘플 품질 수집` for a test profile, speak the consented enrollment phrase, and confirm the profile sample count increases only for accepted quality.
23. After at least one accepted sample, tap `프로토타입 음성 매칭 점검` for the same profile and record only pass/low/no-embedding status plus similarity bucket.
24. Tap `마이크 채널 점검`, and record whether stereo appears in the supported combinations.
25. If stereo appears, tap `방향 샘플 점검` and record the reported direction/confidence plus the `판정` label while speaking near the left and right side of the phone.
26. In `방향 검증 기록`, choose each expected direction and tap `현재 방향 기록`. Confirm the panel shows the 20-per-direction target, 80-row total target, and remaining front/back/left/right rows. Record only total and per-direction matched, mismatched, unknown/unusable, and remaining-row counts.
    If the tester is positioning the phone/glasses manually and wants a repeatable ADB entry point, use the debug helper after the APK is installed:

```bash
scripts/record-direction-validation-trial.sh --clear
scripts/record-direction-validation-trial.sh --expected LEFT --observed UNKNOWN --source controlled-phone
scripts/record-direction-validation-trial.sh --expected RIGHT --observed RIGHT --confidence 0.75 --source bluetooth-route
```

    The helper writes only direction enums, status, confidence bucket, sample counts, and an allow-listed source label through `DirectionValidationTrialReceiver`. It does not sample audio by itself and must not be treated as direction accuracy proof unless the surrounding controlled trial notes are real.
27. Tap `블루투스 마이크 경로 점검` with Ray-Ban or Android XR glasses connected and record whether Bluetooth SCO/BLE headset input appears. Do not paste private device-owner names.
28. If a Bluetooth input candidate appears, tap `블루투스 입력 선택`, run one short speech/direction diagnostic, then tap `통신 경로 해제`. Record only routed/cleared/no-input status.
29. Start the foreground service again after an accepted enrollment sample exists, say the trigger phrase, keep speaking through the post-recognition sample window, and verify `service_prototype_voice_match_completed` appears in logcat.
30. During the same service run, verify the direction bridge logs `audioDirectionStatus` and `usedAudioDirection`; record whether it used a sampled stereo direction or fell back to the saved prototype direction.
31. Reopen the host app and verify the `서비스 자동화 진단` card shows the latest service bridge statuses.
32. Verify the latest detection and event history show processing latency. Record only latest/average latency buckets from the evidence snapshot.
33. For left/right trials, treat `UNKNOWN` as valid when confidence is weak. Do not overwrite a sampled `UNKNOWN` with a guessed direction.
34. Start the `30분 오탐 테스트` card before the room test.
35. Mark event feedback as accurate, false-positive, wrong-direction, or wrong-speaker and verify the feedback summary updates.
36. End the `30분 오탐 테스트` card after the room test and record elapsed time, target status, verdict, false-positive rate per hour, total events, false-positive count, wrong-speaker count, and wrong-direction count only.
37. Verify the generated report marks the debug encrypted storage self-check as script-pass. This only uses non-PII sentinel data in a separate debug preference file.
38. Verify the generated report marks the debug repository direction-validation self-check as script-pass. This only uses a non-PII trial in a separate debug preference file.
39. Verify the generated report marks the debug glasses cue seed as script-pass before projected launch and includes only direction, confidence, `labelPresent=false`, and non-PII payload evidence.
40. Verify the generated report marks the debug Bluetooth route evidence probe as script-pass and includes only communication-routing support, permission booleans, device count, Bluetooth input candidate count, selected type, and route type counts.
41. Verify the generated report marks the debug local delete self-check as script-pass and includes only seeded-before, before-count, after-count, snapshot-cleared, and settings-reset markers from the separate debug store.
42. Verify the generated report marks the debug alert output test as script-pass and includes its broadcast output with `latestDeliverySource=TEST_CUE`, `vibrationPatternDirection`, `vibrationPatternSignature`, pulse count, total duration, and `phoneVibrationSideSpecific=false`.
43. Verify the generated report marks the debug direction sample test as script-pass and includes status, evidence label, direction enum, confidence bucket, sample count, and microphone metadata counts only.
44. Verify the generated report includes a non-PII repository evidence snapshot with only counts, statuses, booleans, enum values, microphone disclosure state, latency metrics, channel delivery statuses, latest cue presence/direction, latest audio direction evidence fields, microphone metadata counts, per-direction validation outcome counts, controlled direction target/remaining-row counts, and `latestDeliverySource=TEST_CUE` immediately after the scripted alert and direction tests.
45. Verify the generated report marks the release readiness snapshot as script-pass and shows `phoneReady=false` until physical-device manual rows are completed.
46. Verify the generated report marks the glasses readiness snapshot as script-pass and lists Meta DAT plus Android XR open checklist ids.
47. Confirm `scripts/validate-device-evidence.mjs <generated-device-evidence.md>` passes.
48. Run `scripts/extract-direction-evidence-summary.mjs <generated-device-evidence.md> --json`, then validate the generated summary with `scripts/validate-direction-evidence-summary.mjs <summary.json> --json`.
49. Do not run `scripts/validate-direction-evidence-summary.mjs <summary.json> --require-production-direction-candidate --json` unless controlled phone and wearable direction evidence is expected to pass.
50. Dry-run `scripts/apply-direction-evidence-summary.mjs <summary.json> --json`; use `--write` only when strict production-direction validation is expected to pass.
51. Create real app data, force-stop/reopen the app, and verify profiles/settings/events/latest cue still load. Record only pass/fail, not stored values.
52. Use the notification stop action and confirm the service stops.
53. Open the generated `device-evidence.md` report and fill in the manual checks that the script cannot observe.

Useful manual log command while the app is running:

```bash
/Users/sonjunpyo/Library/Android/sdk/platform-tools/adb logcat -s VoiceDirectionGlass
```

## Meta Ray-Ban Test Gate

Do not start this until Meta DAT credentials are available.

Before adding DAT dependencies or replacing the stub adapter, run:

```bash
scripts/create-hardware-test-operator-pack.mjs --force --json
scripts/validate-hardware-test-operator-pack.mjs --json
node scripts/create-glasses-hardware-session.mjs --run-dir data/runs/<run>/glasses-hardware-session
scripts/glasses-integration-preflight.sh --write-evidence
node scripts/validate-glasses-hardware-evidence.mjs --json
```

Required before implementation:

- Meta Developer account access.
- Meta Wearables app ID.
- GitHub token with package read access for DAT dependencies.
- Device pairing and Developer Mode confirmed in the Meta AI app.

First proof:

- Replace `MetaDatDisplayStubAdapter` with a real DAT adapter.
- Confirm SDK registration and lifecycle events.
- Confirm Display cue rendering on Ray-Ban Display.
- Confirm Ray-Ban Meta Gen 1 fallback behavior when no display cue exists.
- Record whether any official API exposes audio data useful for direction estimation.
- Update `apps/voice-direction-glass/glasses-evidence/manifest.json`.
- Validate the filled session folder with `node scripts/validate-glasses-hardware-session.mjs data/runs/<run>/glasses-hardware-session --json`.
- Dry-run the canonical manifest update with `node scripts/apply-glasses-hardware-session.mjs data/runs/<run>/glasses-hardware-session --json`.
- Keep strict hardware validation blocked until the evidence paths and pass fields are real:

```bash
node scripts/validate-glasses-hardware-evidence.mjs --require-glasses-alpha-ready --json
```

## Android XR Test Gate

Before adding Jetpack Projected dependencies or replacing the stub adapter, run:

```bash
scripts/create-hardware-test-operator-pack.mjs --force --json
scripts/validate-hardware-test-operator-pack.mjs --json
node scripts/create-glasses-hardware-session.mjs --run-dir data/runs/<run>/glasses-hardware-session
scripts/glasses-integration-preflight.sh --write-evidence
node scripts/validate-glasses-hardware-evidence.mjs --json
```

Required before implementation:

- Android XR-compatible emulator, device, or dev kit.
- Android Studio setup that supports current Android XR preview tooling.
- Jetpack XR dependency integration.

First proof:

- Launch the projected activity on the glasses display.
- Replace the Android XR stub adapter with projected cue rendering.
- Confirm `GlassesProjectedActivity` shows the latest locally stored actionable cue.
- Test TTS fallback.
- Check whether projected context hardware access exposes enough microphone metadata for direction detection.
- Update `apps/voice-direction-glass/glasses-evidence/manifest.json`.
- Validate the filled session folder with `node scripts/validate-glasses-hardware-session.mjs data/runs/<run>/glasses-hardware-session --json`.
- Dry-run the canonical manifest update with `node scripts/apply-glasses-hardware-session.mjs data/runs/<run>/glasses-hardware-session --json`.
- Keep strict hardware validation blocked until the evidence paths and pass fields are real.

## Direction Detection Evidence Matrix

Every direction algorithm must be tested with controlled samples before being shown as reliable:

| Scenario | Required Evidence |
| --- | --- |
| Front caller | Correct direction with confidence, quiet room |
| Back caller | Correct direction with confidence, quiet room |
| Left caller | Correct direction with confidence, quiet room |
| Right caller | Correct direction with confidence, quiet room |
| Stereo PCM left | `StereoPcmDirectionEstimator` classifies `LEFT` from controlled two-channel samples |
| Stereo PCM right | `StereoPcmDirectionEstimator` classifies `RIGHT` from controlled two-channel samples |
| Mono microphone | Estimator returns `UNKNOWN` instead of inventing a direction |
| Channel probe | App reports mono/stereo support combinations without saving audio |
| Direction sample | App reads one transient in-memory stereo buffer and reports direction/confidence without saving PCM |
| Direction evidence label | App labels each direction sample as left/right usable, low confidence, front/back unproven, or unavailable |
| Latest direction evidence snapshot | Debug evidence snapshot reports latest direction sample status, evidence level, direction enum, confidence bucket, sample rate, sample count, microphone inventory captured flag, available microphone counts, active microphone captured flag, active microphone count, and channel-mapping count without PCM |
| Debug direction sample test broadcast | Debug APK broadcast runs one direction sample before evidence snapshot collection and reports status, evidence label, direction enum, confidence bucket, sample count, and microphone metadata counts only |
| Direction validation trials | App stores expected direction, observed direction, status, confidence bucket, aggregate/per-direction outcome counts, and 20-per-direction target progress without saving PCM |
| ADB direction validation trial recorder | Debug APK broadcast and `scripts/record-direction-validation-trial.sh` append expected-vs-observed trial rows using only enums, status, confidence, optional sample counts, and allow-listed source labels |
| Controlled direction trial session | Generator creates 20-per-direction front/back/left/right trial rows, ADB command templates, aggregate summary template, and privacy rules before a hardware test day |
| Direction accuracy gate | Draft package validates with `scripts/validate-direction-accuracy-evidence.mjs --json`; strict mode fails until controlled phone/glasses trials, microphone metadata, route proof, and latency evidence exist |
| Direction evidence extractor/apply gate | Generated `device-evidence.md` can be converted into `direction-evidence-summary.json`, `direction-evidence-summary.md`, and `manifest-update-template.json`; canonical manifest writes stay blocked until `scripts/apply-direction-evidence-summary.mjs --write` passes |
| Bluetooth microphone route | App reports Android communication-device routing support and whether Bluetooth SCO/BLE headset input is visible without saving audio |
| Bluetooth route selection | App can select and clear a visible Bluetooth input candidate during an observed device session |
| TTS direction cue | App queues a short direction-only spoken cue for displayless/audio glasses fallback |
| Phone vibration direction cue | App maps each direction enum to a distinct short phone vibration fallback pattern and reports non-PII pattern metadata in debug alert output evidence |
| Service voice bridge | Foreground service records prototype voice match status after trigger phrase without saving PCM |
| Service direction bridge | Foreground service records `audioDirectionStatus`, `usedAudioDirection`, direction enum, and confidence bucket |
| Service diagnostic card | Host app shows latest service bridge statuses after returning from the foreground service |
| Detection latency metadata | Host app stores processing latency on detection events and summarizes latest/average latency without storing audio or transcript content |
| Alert delivery persistence | Host app stores latest channel/delivered statuses without alert message text |
| Alert channel preferences | Host app persists enabled alert channels and the router emits only enabled channels |
| Alert output test | Host app can emit a direction-only test cue through enabled channels without creating a detection event |
| Debug alert output test broadcast | Debug APK broadcast emits the same direction-only test cue through enabled channels, stores channel/status counts, phone vibration pattern metadata, glasses haptics intent metadata, and non-PII cue contract markers only, and marks the latest delivery source as `TEST_CUE` before evidence snapshot collection |
| Detection feedback | Host app stores accurate, false-positive, wrong-direction, or wrong-speaker feedback for each event |
| Debug glasses cue seed broadcast | Debug APK broadcast stores a generic latest glasses cue before projected launch so generated evidence proves the projected screen handoff has a cue to render |
| Debug Bluetooth route evidence broadcast | Debug APK broadcast records communication route support, Bluetooth input candidate counts, selected type, and route type counts without Bluetooth product names or owners |
| Debug local delete self-check broadcast | Debug APK broadcast seeds and clears a separate encrypted debug store, then records post-delete counts and snapshot-cleared booleans only |
| False-positive run session | Host app stores start/end/target state for a 30-minute false-positive run |
| False-positive summary | Host app shows elapsed time, target status, verdict, false-positive rate per hour, and feedback counts usable during a 30-minute false-positive run |
| Encrypted storage self-check | Debug APK broadcast proves AndroidKeyStore encrypted sentinel survives force-stop with plaintext removed |
| Repository direction-validation self-check | Debug APK broadcast proves a non-PII direction validation trial survives force-stop in encrypted repository storage |
| Non-PII repository evidence snapshot | Debug APK broadcast summarizes profile/event/feedback/direction counts, enabled alert channel states, latest delivery source, latency metrics, and delivery statuses without speaker labels, transcripts, raw audio, or embeddings |
| Release readiness snapshot | Debug APK broadcast summarizes release target counts, readiness booleans, and open checklist ids without private app data |
| Glasses readiness snapshot | Debug APK broadcast summarizes Meta DAT and Android XR counts, readiness booleans, and open checklist ids without private app data |
| Device evidence validator | Script checks generated evidence for required automation rows, debug glasses cue seed pass, debug Bluetooth route evidence pass, debug local delete self-check pass, debug alert output test pass, vibration pattern metadata, cue contract markers, glasses haptics intent markers, debug direction sample test pass, release readiness snapshot, microphone metadata markers, per-direction validation outcome and target-progress markers, `latestDeliverySource=TEST_CUE`, `latestCuePresent=true`, and rejects private structured fields in snapshot/log blocks |
| Encrypted app data restart | Real profile/settings/event/cue data survives force-stop/reopen without pasting values |
| Microphone disclosure gate | App does not request microphone permission or start audio flow until `마이크 사용 안내` is selected |
| Enrollment sample | App reads one transient in-memory mono buffer, stores sample count only, and rejects quiet/clipped samples |
| Speaker consent gate | App does not create a new speaker profile until explicit consent confirmation is selected |
| Prototype voice match | App compares live transient embedding with stored prototype embedding and stores no match PCM |
| No enrolled speaker | No actionable alert |
| Trigger phrase absent | No actionable alert |
| Noisy room | Confidence degrades or returns `UNKNOWN` |
| Phone in pocket | Confidence degrades or returns `UNKNOWN` |

## Pass Criteria For Private Alpha

- App installs on at least one Android phone.
- Foreground listening notification appears during active session.
- User can stop listening from app UI and notification.
- Registered speaker label and detection history persist locally.
- Microphone disclosure gate blocks microphone permission/audio flow until selected, and the evidence snapshot reports disclosure state.
- Privacy/Data Safety draft remains consistent with the tested local-only data flow and is not treated as a public privacy URL or Play submission.
- New speaker profile creation requires explicit consent confirmation.
- Enabled alert channel preferences persist and observed delivery rows match the selected channels.
- `알림 출력 점검` can isolate selected channels without adding a false detection event.
- Debug alert output test broadcast is script-pass in generated evidence, includes cue contract and glasses haptics intent markers, and the following snapshot shows `latestDeliverySource=TEST_CUE`.
- Debug direction sample test broadcast is script-pass in generated evidence and the following snapshot includes direction status/evidence plus microphone metadata counts without PCM.
- Release readiness snapshot is script-pass and still shows phone private alpha as not ready until physical manual rows are closed.
- Glasses readiness snapshot is script-pass and still shows Meta DAT/Android XR as not glasses-alpha ready until credentials, adapters, and hardware proof are complete.
- Debug encrypted storage self-check and repository direction-validation self-check pass, and real app data survives app restart.
- Generated `device-evidence.md` passes `scripts/validate-device-evidence.mjs`.
- Generated `device-evidence.md` contains `Device serial: redacted-by-script` and `Build fingerprint: redacted-by-script`.
- Alert delivery statuses are persisted without message text and match manual observation.
- Raw audio is not stored.
- False positives are documented from at least 30 minutes of indoor testing.
- Processing latency is recorded in generated evidence and reviewed against the 1.5 second target.
- Detection feedback summary is filled for the test run.
- Glasses integration has either a working display cue or a documented device/API limitation.
- Four-direction or front/back production claims stay blocked until `scripts/validate-direction-accuracy-evidence.mjs --require-production-direction-ready --json` passes.

The canonical promotion gate is maintained in `docs/10-release-readiness.md` and mirrored in `apps/voice-direction-glass/app/src/main/kotlin/com/voicedirection/glass/qa/ReleaseReadiness.kt`. At the current stage, phone private alpha is not ready until the physical-phone evidence rows above are completed.
