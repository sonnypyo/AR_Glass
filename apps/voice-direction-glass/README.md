# Voice Direction Glass Android App

This is the first native Android scaffold for the glasses-linked voice direction MVP.

## Current Scope

- Android host app shell.
- Compose UI for session, enrollment placeholder, device state, and simulator controls.
- Local domain logic for phrase matching, simulated direction, event fusion, and alert routing.
- Stereo PCM rough left/right direction estimator in unit tests.
- AudioRecord microphone channel support probe without raw audio capture.
- Short in-memory AudioRecord stereo direction sample without PCM persistence.
- Android microphone inventory and active microphone metadata counts for direction evidence without audio persistence.
- Audio direction evidence classifier that labels samples before users treat them as product evidence.
- Latest audio direction evidence snapshot storage for generated physical phone reports, including microphone inventory and active microphone/channel-mapping counts.
- Direction validation trial recorder and per-direction matched/mismatched/unknown plus 20-per-direction target progress summary for expected-vs-observed front/back/left/right evidence without PCM persistence.
- Debug ADB direction-validation trial recorder for controlled expected-vs-observed evidence entry using only enums, status, confidence, optional sample counts, and allow-listed source labels.
- Bluetooth communication-device route probe plus guarded route select/clear controls for Ray-Ban/Android XR HFP microphone fallback checks.
- Local speaker profile and detection event persistence.
- AndroidKeyStore AES-GCM encrypted local string storage with legacy plaintext migration fallback.
- Local data deletion flow.
- Debug repository self-check path for direction-validation trial persistence on physical phone smoke tests.
- Debug alert output test broadcast for physical phone smoke tests, storing only channel/status counts, cue contract markers, glasses haptics intent markers, and `latestDeliverySource=TEST_CUE`.
- Debug direction sample test broadcast for physical phone smoke tests, storing only sample status, direction evidence label, and microphone metadata counts.
- Debug non-PII repository evidence snapshot for physical phone smoke reports, including enabled alert channel states, latest delivery source, and microphone disclosure acceptance state.
- Debug release readiness snapshot for physical phone smoke reports, including target counts and open checklist ids.
- Debug glasses readiness snapshot for physical phone smoke reports, including Meta DAT and Android XR open checklist ids.
- One-shot Android speech recognition that feeds the same detection/alert pipeline as the simulator.
- Visible foreground listening service with microphone service type, repeated speech recognition prototype, and a persistent stop control.
- Runtime microphone disclosure card that gates microphone-backed actions before OS permission/audio flow.
- Service-side prototype voice matching after trigger phrase detection, using short transient samples and stored prototype embedding refs.
- Service-side short stereo direction sampling after prototype voice matching, with fallback to the saved prototype direction when stereo sampling is unavailable.
- Detection processing latency metadata, UI summary, and non-PII evidence snapshot fields.
- Latest alert delivery channel/status persistence without alert message text.
- Persisted alert channel preferences for phone notification, vibration, TTS, Meta Display, and Android XR Display output isolation.
- Direct alert output test for enabled channels without creating a detection event.
- In-app direction cue output contract card for expected notification, vibration, TTS, and glasses evidence output.
- App-side glasses haptics intent contract for target side, intensity, pulse count, proof requirement, and phone fallback requirement without claiming physical glasses haptics support.
- Direction-specific phone vibration fallback pattern summaries for left, right, front, back, and unknown cues.
- Latest alert delivery source label in the output card and non-PII evidence snapshot.
- Android TextToSpeech direction-only cue fallback for displayless/audio glasses testing.
- Service automation diagnostic card showing the latest persisted voice/direction bridge result.
- Release readiness card showing internal, phone alpha, glasses alpha, beta, and production gate status plus first phone-alpha evidence states and next actions from the canonical checklist.
- Glasses integration readiness card for Meta DAT and Android XR alpha gates.
- Tester consent and limitation card covering stored data, non-stored data, prototype limits, and deletion.
- Explicit consent checkbox before saving a new speaker profile.
- Latest actionable glasses cue storage plus a projected cue screen.
- Shared glasses cue payload contract that separates user-facing display fields from non-PII adapter/evidence summaries.
- Stub adapters for Meta DAT and Android XR so hardware integration can be added without changing domain code.
- Glasses integration preflight script for Meta DAT and Android XR readiness evidence.
- Device evidence validator for required smoke rows and non-PII snapshot/log blocks.
- Phone-private-alpha evidence runner and summary validator for build/test, smoke evidence, validator, service-readiness audit, strict candidate checks, and non-PII summary output.
- Glasses-private-alpha evidence runner and summary validator for Ray-Ban Display, Ray-Ban Gen 1 fallback, Android XR projected, haptics/fallback proof, strict candidate checks, and non-PII summary output.
- Hardware test operator pack generator and validator for a single day-of-test phone/glasses/support control surface.
- Hardware test promotion validator for classifying operator-pack outputs as workflow-only, current-safe, phone alpha, glasses alpha, support-ready, or private-alpha evidence.
- Service gate assertion profiles for current-safe, internal prototype, phone alpha, glasses alpha, and production promotion checks.
- Service readiness audit that summarizes release gates, glasses gates, local artifacts, and latest evidence status.
- Physical test session generator for grouped phone, Ray-Ban, Android XR, direction accuracy, and privacy checklist files.
- Physical test session validator for required files, commands, direction checklist markers, and private structured-field scans.
- Support/incident process validator for deletion verification, mistaken alerts, and private evidence handling.
- Support drill evidence runbook, draft manifest, and validator for deletion verification and mistaken-alert operational rehearsal.
- Support drill session generator and validator for reusable deletion/mistaken-alert evidence packs.
- Glasses setup readiness doc, local properties template, and validator for Meta DAT/Android XR credential preparation.
- Glasses hardware evidence runbook, draft manifest, and validator for Ray-Ban Display, Ray-Ban Gen 1 fallback, Android XR projected runtime, and haptics/fallback proof.
- Glasses hardware session generator, validator, and apply automation for reusable Ray-Ban Display, Ray-Ban Gen 1 fallback, Android XR projected, and haptics/fallback evidence packs.
- Android XR projected contract validator for separating the current phone-hosted preview/stub state from future real ProjectedContext/Glimmer adapter proof.
- Glasses preflight integration for Android XR projected default/strict contract rows.
- Hardware test status dashboard for summarizing operator-pack and controlled direction-trial lane readiness while keeping no-hardware workflow passes separate from real phone/glasses/support/direction evidence.
- Hardware next-action reporter for turning the latest dashboard into an ordered non-PII real-test command brief.
- Hardware next-action executor for running only the first ready allow-listed action and writing a non-PII execution summary.
- Phone lane collection-readiness summary that separates pre-run blockers from post-run `device-evidence.md`, direction summary, and manifest-apply evidence gaps.
- Phone lane hardware runner that refreshes dashboard/next-action state and executes `RUN_PHONE=1` only when the refreshed phone action is ready.
- Phone lane post-run reviewer that checks phone summary, strict phone-alpha validation, promotion profiles, and privacy scan before any phone-alpha claim.
- Phone lane ready watcher that polls the guarded runner until an authorized phone is ready, then optionally executes and immediately reviews the lane.
- Device evidence redaction gate for generated phone reports, including redacted ADB serial/build fingerprint metadata and validator checks for private identifiers.
- Evidence privacy scanner for generated operator-pack, dashboard, audit, phone, glasses, support, and summary folders without printing matched private values.
- Operator-pack privacy scan integration so the generated hardware-day `commands.sh` scans the pack before promotion validation.
- Direction validation ADB recorder guide and helper script for repeatable controlled trial entry after a debug APK is installed.
- Controlled direction-trial session generator and validator for 20-per-direction front/back/left/right test plans, ADB command templates, aggregate summaries, app-visible remaining-row progress, and privacy rules.
- Private alpha rehearsal generator and validator for linking physical phone, support drill, and glasses hardware sessions before tester-facing claims.
- Private alpha hardware runner for coordinating phone, support, glasses, and top-level rehearsal commands while storing only non-PII command status summaries.
- Private alpha hardware readiness preflight for checking local toolchain, ADB device counts, credentials, session packs, latest evidence, and recommended runner flags.
- Platform source freshness checker for official Meta Wearables and Android XR URL availability, redirect, and canonical-reference drift.
- Policy clearance matrix and validator for Meta Wearables, Android XR, Google Play, recording, voice, and wearable distribution gates.
- Privacy policy and Play Data Safety draft plus validator for the current local-first build.
- Store review submission package draft plus validator for listing copy, app-content declarations, reviewer instructions, and submission blockers.
- Release artifact/signing runbook plus validator for release AAB, upload-key signing, Play App Signing, and private-key hygiene.
- Internal-testing release notes/versioning draft plus validator for Gradle version alignment, Play per-language note length, and unsupported-claim guardrails.
- Play screenshot/media runbook, draft manifest, capture script, and validator for phone screenshots, feature graphic, and Android XR preview assets.
- Production speaker model evaluation runbook, draft manifest, and validator for on-device model selection, thresholds, anti-spoofing, latency, and privacy evidence.
- Direction accuracy evidence runbook, draft manifest, and validator for controlled phone/glasses trials, microphone metadata, route proof, latency, and privacy evidence.
- Direction evidence extractor, summary validator, manifest apply gate, and phone-runner apply dry-run integration for converting generated `device-evidence.md` direction counts into non-PII summaries while refusing canonical manifest writes until strict evidence passes.
- Meta DAT application ID manifest placeholder plus analytics opt-out metadata.
- Release-readiness checklist that separates internal prototype, phone private alpha, glasses alpha, external beta, and production service gates.
- Phone private alpha release gate now includes debug glasses cue seed script-pass, debug Bluetooth route evidence script-pass, debug local delete self-check script-pass, debug alert output script-pass with cue contract and glasses haptics intent markers, debug direction sample script-pass, microphone metadata snapshot fields, `latestCuePresent=true`, and `latestDeliverySource=TEST_CUE` evidence.
- Detection feedback controls for accurate, false-positive, wrong-direction, and wrong-speaker outcomes.
- 30-minute false-positive test card with elapsed time, feedback summary, pass/fail verdict, and false-positive rate per hour.

## Build Prerequisites

- JDK 17.
- Android Studio / Android SDK with API 36.
- Gradle 9.4.1 or Android Studio managed Gradle sync.
- Android Gradle Plugin 9.2 uses built-in Kotlin support, so this project does not apply `org.jetbrains.kotlin.android`.

This workspace now has local command-line toolchains installed under the user profile:

- JDK: `/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home`
- Android SDK: `/Users/sonjunpyo/Library/Android/sdk`

## Verified Commands

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew test
./gradlew assembleDebug
./gradlew --no-daemon test assembleDebug bundleRelease
```

These commands passed on 2026-05-28 KST. The release AAB is structural only until upload signing is configured.

## Device Install

After `assembleDebug`, install on a connected Android device:

```bash
/Users/sonjunpyo/Library/Android/sdk/platform-tools/adb devices
/Users/sonjunpyo/Library/Android/sdk/platform-tools/adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Or run the repository smoke test from `/Users/sonjunpyo/Documents/Project/glass`:

```bash
scripts/android-device-smoke-test.sh
```

Validate a generated evidence report:

```bash
scripts/validate-device-evidence.mjs data/runs/<date>_android_phone_smoke/device-evidence.md
```

Generated phone evidence must show redacted device identifiers:

```text
Device serial: redacted-by-script
Build fingerprint: redacted-by-script
```

The default evidence folder is also redacted:

```text
data/runs/<timestamp>_android_phone_smoke/device-evidence.md
```

Extract and validate a generated direction evidence summary:

```bash
scripts/extract-direction-evidence-summary.mjs data/runs/<date>_android_phone_smoke/device-evidence.md --report-dir data/runs/<run>/direction-evidence-extractor --json
scripts/validate-direction-evidence-summary.mjs data/runs/<run>/direction-evidence-extractor/direction-evidence-summary.json --json
```

Record controlled direction validation trials on an installed debug APK:

```bash
scripts/record-direction-validation-trial.sh --clear
scripts/record-direction-validation-trial.sh --expected LEFT --observed UNKNOWN --source controlled-phone
scripts/record-direction-validation-trial.sh --expected RIGHT --observed RIGHT --confidence 0.75 --source bluetooth-route
```

Create and validate a controlled direction trial session:

```bash
scripts/create-controlled-direction-trial-session.mjs --run-dir data/runs/<run>/controlled-direction-trial-session --json
scripts/validate-controlled-direction-trial-session.mjs data/runs/<run>/controlled-direction-trial-session --json
```

Audit current service readiness:

```bash
node scripts/audit-service-readiness.mjs --write-report --report-dir data/runs/<run>/service-readiness-audit
```

Run the phone-private-alpha evidence path:

```bash
scripts/run-phone-private-alpha-evidence.mjs --evidence-dir data/runs/<run>/android-phone-smoke --report-dir data/runs/<run>/phone-alpha-runner --json
```

Validate a phone-private-alpha runner summary:

```bash
scripts/validate-phone-private-alpha-evidence-runner.mjs data/runs/<run>/phone-alpha-runner/phone-alpha-evidence-summary.json --json
```

Run the glasses-private-alpha evidence path:

```bash
scripts/run-glasses-private-alpha-evidence.mjs --session-dir data/runs/<run>/glasses-hardware-session --report-dir data/runs/<run>/glasses-alpha-runner --json
```

Validate a glasses-private-alpha runner summary:

```bash
scripts/validate-glasses-private-alpha-evidence-runner.mjs data/runs/<run>/glasses-alpha-runner/glasses-alpha-evidence-summary.json --json
```

Create, validate, and run the hardware test operator pack:

```bash
scripts/create-hardware-test-operator-pack.mjs --force --json
scripts/validate-hardware-test-operator-pack.mjs --json
data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
```

Validate the operator-pack promotion decision:

```bash
scripts/validate-hardware-test-promotion.mjs --profile workflow --json
scripts/validate-hardware-test-promotion.mjs --profile current-safe --json
```

Strict promotion profiles should fail until real evidence exists:

```bash
scripts/validate-hardware-test-promotion.mjs --profile phone-alpha --json
scripts/validate-hardware-test-promotion.mjs --profile glasses-alpha --json
scripts/validate-hardware-test-promotion.mjs --profile support-ready --json
```

Use hardware opt-in flags only when the matching evidence can be collected:

```bash
RUN_PHONE=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
RUN_GLASSES=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
RUN_SUPPORT=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
```

Summarize the current hardware test lane status:

```bash
scripts/summarize-hardware-test-status.mjs --write-report --json
```

In the generated dashboard, phone collection blockers live in `collectionReadiness.phoneCollectionBlockers`; post-run promotion gaps live in `collectionReadiness.phoneEvidenceGaps`.

Generate the ordered next-action brief from that dashboard:

```bash
scripts/recommend-hardware-next-actions.mjs --write-report --json
```

Dry-run or execute the first ready action from the brief:

```bash
scripts/run-hardware-next-action.mjs --write-report --json
scripts/run-hardware-next-action.mjs --execute --write-report --json
```

For the next Android phone pass, use the guarded phone-lane runner:

```bash
scripts/run-phone-lane-hardware.mjs --write-report --json
scripts/run-phone-lane-hardware.mjs --execute --write-report --json
```

After a phone-lane execution, review the generated evidence:

```bash
scripts/review-phone-lane-evidence.mjs --write-report --json
```

To wait for a phone and chain execution plus review from one guarded command:

```bash
scripts/run-phone-lane-when-ready.mjs --write-report --json
scripts/run-phone-lane-when-ready.mjs --execute --write-report --json
```

Scan generated evidence/report folders for private fields:

```bash
scripts/scan-evidence-privacy.mjs --write-report --json
scripts/scan-evidence-privacy.mjs data/runs/<run>/<evidence-or-report-dir> --write-report --report-dir data/runs/<run>/evidence-privacy-scan --json
```

The generated hardware operator pack also runs this scan automatically against the pack before promotion validation.

Assert service promotion gates:

```bash
scripts/assert-service-gates.mjs --profile current-safe --json
scripts/assert-service-gates.mjs --profile phone-alpha --json
```

Create a physical test session pack:

```bash
scripts/create-physical-test-session.mjs --run-dir data/runs/<run>/physical-test-session
```

Validate a physical test session pack:

```bash
scripts/validate-physical-test-session.mjs data/runs/<run>/physical-test-session --json
```

Validate the support and incident process:

```bash
scripts/validate-support-incident-process.mjs --json
```

Validate the support drill evidence package:

```bash
scripts/validate-support-drill-evidence.mjs --json
```

Create and validate a support drill session pack:

```bash
scripts/create-support-drill-session.mjs --run-dir data/runs/<run>/support-drill-session --json
scripts/validate-support-drill-session.mjs data/runs/<run>/support-drill-session --json
```

Strict support drill validation should fail until real drill evidence exists:

```bash
scripts/validate-support-drill-evidence.mjs --require-drills-ready --json
```

Validate the glasses setup template and current source references:

```bash
scripts/validate-glasses-setup-readiness.mjs --json
```

Strict glasses setup validation should fail until Meta credentials are configured locally:

```bash
scripts/validate-glasses-setup-readiness.mjs --require-credentials --json
```

Validate the glasses hardware evidence package:

```bash
scripts/validate-glasses-hardware-evidence.mjs --json
```

Strict glasses hardware validation should fail until real Ray-Ban and Android XR evidence exists:

```bash
scripts/validate-glasses-hardware-evidence.mjs --require-glasses-alpha-ready --json
```

Create and validate a glasses hardware session pack:

```bash
scripts/create-glasses-hardware-session.mjs --run-dir data/runs/<run>/glasses-hardware-session --json
scripts/validate-glasses-hardware-session.mjs data/runs/<run>/glasses-hardware-session --json
```

Dry-run a reviewed glasses hardware session before updating the canonical manifest:

```bash
scripts/apply-glasses-hardware-session.mjs data/runs/<run>/glasses-hardware-session --json
```

Create and validate a private alpha rehearsal pack:

```bash
scripts/create-private-alpha-rehearsal.mjs --run-dir data/runs/<run>/private-alpha-rehearsal --json
scripts/validate-private-alpha-rehearsal.mjs data/runs/<run>/private-alpha-rehearsal --json
```

Run the default private-alpha hardware-day rehearsal summary:

```bash
scripts/run-private-alpha-hardware-rehearsal.mjs --json
```

Check local readiness before adding hardware flags:

```bash
scripts/check-private-alpha-hardware-readiness.mjs --write-report --json
```

Check official platform source freshness:

```bash
scripts/check-platform-source-freshness.mjs --write-report --json
```

Validate the policy clearance matrix:

```bash
scripts/validate-policy-clearance-matrix.mjs --json
```

Validate the privacy policy and Play Data Safety draft:

```bash
scripts/validate-privacy-data-safety-draft.mjs --json
```

Validate the store review submission package draft:

```bash
scripts/validate-store-review-submission-package.mjs --json
```

Validate the release artifact and signing state:

```bash
scripts/validate-release-artifact-readiness.mjs --json
```

Strict upload-ready validation should fail until a real upload key and signed release AAB exist:

```bash
scripts/validate-release-artifact-readiness.mjs --require-upload-ready --json
```

Validate the release notes and Gradle versioning state:

```bash
scripts/validate-release-notes-versioning.mjs --json
```

Validate the Play screenshot/media package:

```bash
scripts/validate-play-screenshot-package.mjs --json
```

Strict screenshot validation should fail until real non-private assets are captured:

```bash
scripts/validate-play-screenshot-package.mjs --require-assets --json
```

Validate the production speaker model evaluation package:

```bash
scripts/validate-production-speaker-model-readiness.mjs --json
```

Strict model validation should fail until a real model and aggregate evaluation results exist:

```bash
scripts/validate-production-speaker-model-readiness.mjs --require-model-ready --json
```

Validate the direction accuracy evidence package:

```bash
scripts/validate-direction-accuracy-evidence.mjs --json
```

Strict direction validation should fail until controlled phone/glasses direction evidence exists:

```bash
scripts/validate-direction-accuracy-evidence.mjs --require-production-direction-ready --json
```

Before adding Meta DAT or Android XR dependencies, run:

```bash
scripts/glasses-integration-preflight.sh --write-evidence
```

The first phone test should verify microphone disclosure gating before permission/audio flow, microphone permission, `세션 시작`, the persistent foreground notification, automatic recognition/evaluation while the service is active, notification stop action, `음성 인식 1회 테스트`, automatic detection after recognition, explicit speaker consent gate behavior, prototype voice match behavior after accepted enrollment samples, detection processing latency metadata, persisted alert delivery channel statuses, alert channel preference filtering, debug glasses cue seed script-pass with `latestCuePresent=true`, debug Bluetooth route evidence script-pass with route support/count/type metadata only, debug local delete self-check script-pass with post-delete counts only, debug alert output test script-pass with cue contract markers, glasses haptics intent markers, and `latestDeliverySource=TEST_CUE`, debug direction sample test script-pass with status/evidence/microphone metadata counts, debug ADB direction trial recorder output when controlled trials are performed, `알림 출력 점검`, direction validation aggregate/per-direction outcome counts, 20-per-direction remaining-row progress in the UI and `DEBUG_EVIDENCE_SNAPSHOT`, debug repository self-check script-pass, non-PII repository evidence snapshot output, release readiness snapshot output, glasses readiness snapshot output, Bluetooth microphone route visibility and guarded route select/clear behavior, service-side direction sampling/fallback behavior, the direction-only TTS cue, the service automation diagnostic card, the release readiness card with phone-alpha evidence/next-action rows, the glasses integration readiness card, `호출 감지 시뮬레이션`, and the projected cue screen reading the latest actionable cue.

## Next Integration Steps

1. Install on a physical Android phone and validate the service-owned recognition loop.
2. Run the microphone channel probe and the in-memory direction sample on a physical phone.
3. Run Bluetooth microphone route probe and guarded route select/clear with Ray-Ban or Android XR glasses connected.
4. Validate the service-side stereo direction sample bridge on a physical phone.
5. Run `scripts/scan-evidence-privacy.mjs <new-evidence-or-report-dir> --write-report --json` after every real phone/glasses/support evidence folder is generated.
6. Run a 30-minute false-positive pass with the app test card and mark feedback for each actionable event.
6. Replace the post-recognition prototype voice sample bridge with a measured audio pipeline if device tests show unstable behavior.
7. Copy `local.properties.example`, configure Meta credentials outside source control, validate glasses setup readiness, then rerun the glasses preflight.
8. Add Meta DAT dependencies and replace the Meta stub only after preflight evidence improves.
9. Replace Android XR stub with `ProjectedContext` and Compose Glimmer implementation after preflight and dependency proof.
10. Prove encrypted local storage migration and app restart behavior on a physical phone before external beta.
11. Review tester consent, microphone disclosure, and limitation copy with real testers and policy criteria before external beta.
12. Run the device checklist in `/Users/sonjunpyo/Documents/Project/glass/docs/08-device-test-plan.md`.
13. Generate and validate a physical test session pack before the first hardware pass.
14. Generate a support drill session pack, run support/deletion and mistaken-alert drills before any production claim, then pass `scripts/validate-support-drill-evidence.mjs --require-drills-ready --json`.
15. Generate, validate, and dry-run apply a glasses hardware session pack before copying Ray-Ban or Android XR proof into the canonical glasses manifest.
16. Generate and validate a private alpha rehearsal pack before any tester-facing private-alpha claim.
17. Keep `docs/15-policy-clearance-matrix.md` valid, but keep production policy clearance blocked until external review evidence exists.
18. Keep `docs/16-privacy-policy-data-safety-draft.md` valid, replace TBD fields only after developer identity/contact are known, and do not treat it as Play submission or public hosting.
19. Keep `docs/17-store-review-submission-package-draft.md` valid, but do not treat it as release-track submission until phone evidence, public privacy URL, release AAB/signing, screenshots, and review approval exist.
20. Keep `docs/18-release-artifact-signing-runbook.md` valid, but do not treat a structural `bundleRelease` output as upload-ready until strict validation passes.
21. Keep `docs/19-release-notes-versioning.md` and `release-notes/internal-testing-v0.1.0.md` valid after every Gradle version or release-note change, and increment `versionCode` before every Play upload attempt.
22. Keep `docs/20-play-screenshot-media-runbook.md` and `store-assets/play-preview/manifest.json` valid, then run strict screenshot validation after real non-private capture.
23. Keep `docs/21-production-speaker-model-evaluation.md` and `model-assets/speaker-verifier/manifest.json` valid, then run strict model validation only after a real model candidate and aggregate metrics exist.
24. Keep `docs/22-direction-accuracy-evidence.md` and `direction-evidence/manifest.json` valid, then run strict direction validation only after controlled phone/glasses trials exist.
25. Keep `docs/50-direction-validation-adb-recorder.md` valid after every debug ADB direction-trial recorder change.
26. Keep `docs/51-controlled-direction-trial-session.md` valid after every controlled direction-trial session generator, validator, template, or privacy-shape change.
27. Rerun `scripts/summarize-hardware-test-status.mjs --write-report --json` after controlled direction observed rows are filled so the dashboard shows recorded-row progress without exposing private data.
28. Run `scripts/extract-direction-evidence-summary.mjs <device-evidence.md> --json` after a phone evidence report exists, then validate the generated summary.
29. Keep `docs/42-direction-evidence-extractor.md` valid after every direction summary or manifest-template change.
30. Keep `docs/23-support-drill-evidence.md` and `support-drills/manifest.json` valid, then run strict support drill validation only after operational drills exist.
31. Keep `docs/24-glasses-setup-readiness.md` and `local.properties.example` valid before any Meta DAT or Android XR credential/runtime change.
32. Keep `docs/25-glasses-hardware-evidence.md` and `glasses-evidence/manifest.json` valid before any glasses alpha claim.
33. Keep `docs/26-glasses-hardware-session-runbook.md` valid before any real hardware session.
34. Keep `docs/27-private-alpha-rehearsal-runbook.md` valid before any tester-facing private alpha claim.
35. Run `scripts/run-private-alpha-hardware-rehearsal.mjs --json` for the hardware-day summary, then add `--run-phone`, `--run-support`, or `--run-glasses` only when the matching real evidence can be collected.
36. Keep `docs/28-private-alpha-hardware-runner.md` valid as the hardware-day runner flow changes.
37. Run `scripts/check-private-alpha-hardware-readiness.mjs --write-report --json` before choosing hardware-day runner flags.
38. Keep `docs/29-private-alpha-hardware-readiness-preflight.md` valid as preflight checks change.
39. Run `scripts/check-platform-source-freshness.mjs --write-report --json` after every official source URL, SDK assumption, or platform doc change.
40. Keep `docs/30-platform-source-freshness.md` valid as platform source checks change.
41. Keep `docs/38-glasses-haptics-intent-contract.md` valid after any haptic target, intensity, pulse, fallback, or platform-claim change.
42. Run `scripts/run-glasses-private-alpha-evidence.mjs --json` after glasses hardware session updates, and add `--run-session` only when real glasses evidence can be collected.
43. Keep `docs/39-glasses-private-alpha-evidence-runner.md` valid as the glasses-lane evidence runner changes.
44. Generate and validate the hardware test operator pack before the real phone/glasses/support test day.
45. Run the operator pack once without flags, then add `RUN_PHONE=1`, `RUN_GLASSES=1`, or `RUN_SUPPORT=1` only when that evidence lane is ready.
46. Keep `docs/40-hardware-test-operator-pack.md` valid as the operator-pack flow changes.
47. Run `scripts/validate-hardware-test-promotion.mjs --profile workflow --json` after each operator-pack run, and strict profiles only after real evidence exists.
48. Keep `docs/41-hardware-test-promotion-validator.md` valid as promotion profiles change.
49. Run `scripts/validate-android-xr-projected-contract.mjs --json` after Android XR projected launch, dependency, Glimmer, or adapter changes; use `--require-real-android-xr` only when real ProjectedContext and device/emulator evidence should pass.
50. Keep `docs/44-android-xr-projected-contract.md` valid as Android XR projected contract checks change.
51. Keep `docs/45-android-xr-preflight-contract-integration.md` valid after Android XR projected contract rows change in the glasses preflight.
52. Regenerate `scripts/summarize-hardware-test-status.mjs --write-report --json` after every operator-pack, phone, glasses, support, Android XR, preflight, or controlled direction evidence change.
53. Keep `docs/46-hardware-test-status-dashboard.md` valid as hardware lane statuses, controlled direction row status, blockers, or privacy guardrails change.
51. Keep `docs/47-device-evidence-redaction.md` valid after generated phone evidence redaction or validator privacy-shape changes.
52. Run `node scripts/audit-service-readiness.mjs --write-report` after each phone/glasses/support evidence session.
53. Keep `/Users/sonjunpyo/Documents/Project/glass/docs/10-release-readiness.md` and `app/src/main/kotlin/com/voicedirection/glass/qa/ReleaseReadiness.kt` current as device evidence changes.
