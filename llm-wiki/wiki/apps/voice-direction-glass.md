# Voice Direction Glass

Updated: 2026-05-28 KST

## 목적

저장한 사람의 목소리 또는 호출 문구를 감지하고, 가능한 경우 호출 방향을 추정해 Meta Ray-Ban Display, Ray-Ban Meta Gen 1 fallback, Android XR projected display, 휴대폰 알림, 휴대폰 진동으로 알려주는 Android-first 글래스 앱.

## 현재 상태

- Android native MVP scaffold exists in `apps/voice-direction-glass`.
- Internal prototype build/test passes.
- Phone private alpha is not ready because physical-device evidence is missing.
- Glasses private alpha is blocked because Meta DAT credentials, real DAT adapter, Android XR runtime proof, and wearable direction/haptics evidence are missing.
- Hardware-day private-alpha runner exists and passes in default no-hardware mode, but it proves orchestration only until run with real phone/support/glasses evidence flags.
- Hardware-day readiness preflight exists and currently recommends no hardware flags because no authorized ADB phone, Meta application id, or GitHub Packages token is present.
- Phone-private-alpha evidence runner exists and writes non-PII no-device summaries, but phone alpha remains not ready until it runs with exactly one authorized Android phone and produces validator-passing `device-evidence.md`.
- Phone-private-alpha runner summary validator exists and passes the current no-device summary while strict candidate mode fails as expected.
- Service gate assertion profiles exist; `current-safe` and `internal-prototype` pass, while `phone-alpha` fails until real phone evidence exists.
- Platform source freshness automation exists and confirms the current Android XR first-activity canonical path is `glasses/first-activity`.
- Glasses haptics intent contract exists for target/intensity/pulse mapping, but real glasses-side haptics remains blocked until official API and hardware proof exist.
- Glasses-private-alpha evidence runner exists and passes the current no-hardware summary while strict candidate mode fails as expected.
- Hardware test operator pack exists and passes the current no-hardware run while keeping phone/glasses/support hardware lanes opt-in only.
- Hardware test promotion validator exists; workflow/current-safe profiles pass, while phone-alpha, glasses-alpha, and support-ready profiles fail as expected without real evidence.
- Hardware test status dashboard exists; default no-hardware lane is ready, phone/glasses lanes are blocked, support lane is manual-required, and controlled direction trials are manual-required with observed rows incomplete.
- Device evidence redaction gate exists; generated phone reports and default evidence folder paths must redact ADB serial and build fingerprint before validation passes.
- Evidence privacy scan exists; generated operator-pack, dashboard, audit, fixture, and future evidence/report folders must pass without private voice/device/Bluetooth/token/raw-audio fields before promotion review.
- Operator-pack privacy scan integration exists; generated hardware-day `commands.sh` now runs the pack-scoped scan before promotion validation.
- Direction validation ADB recorder exists; controlled expected-vs-observed direction trial rows can be added through a debug broadcast/helper script without storing audio or private labels.
- Controlled direction-trial session automation exists; 20-per-direction front/back/left/right trial plans, ADB templates, aggregate summaries, and privacy rules can be generated before hardware testing.
- Direction evidence extractor exists; fixture summary validation passes, while strict production-direction candidate validation fails as expected without controlled phone/wearable evidence.
- Direction evidence summaries preserve controlled target progress: required total, missing total, per-direction missing rows, and target-complete status are validated across summary and manifest-template aggregate output.
- Direction evidence manifest apply gate exists; fixture dry-run reports `applyReady=false`, and write mode is refused until strict production-direction evidence exists.
- Phone-private-alpha runner records direction manifest apply dry-run status when direction evidence exists, without writing canonical direction files.
- Phone-private-alpha runner now records direction evidence summary status and will extract direction summaries automatically after real `device-evidence.md` exists.
- Hardware next-action reporter exists; current decision is `default_workflow_ready_attach_phone_next`, with default workflow ready, phone blocked at authorized ADB devices `0`, controlled direction rows `0/80`, glasses blocked, and support manual-required.
- Hardware next-action executor exists; it ran the current `refresh-default-workflow` action successfully in no-hardware mode and stores no raw command output.
- Phone lane collection readiness is separated from evidence gaps; current phone collection blocker is only authorized ADB devices `0`, while missing `device-evidence.md`, direction summary, and manifest apply readiness remain post-run promotion gaps.
- Phone lane hardware runner exists; current dry-run refreshes dashboard/next-action state and correctly refuses `RUN_PHONE=1` because authorized ADB devices are `0`.
- Phone lane post-run reviewer exists; current review is blocked because no real `device-evidence.md` or direction summary exists, while workflow validation and privacy scan pass.
- Phone lane ready watcher exists; current no-phone smoke result is `timed-out`, with no hardware execution and no post-run review attempt.

## 주요 문서

- `docs/00-project-charter.md`: 목표, MVP, 기술 스택.
- `docs/01-platform-research.md`: Meta Wearables와 Android XR 조사.
- `docs/02-product-plan.md`: 제품 범위와 비목표.
- `docs/03-technical-architecture.md`: 오디오, 화자, 방향, 글래스 adapter 구조.
- `docs/05-service-development-process.md`: 실제 서비스 개발 단계.
- `docs/06-experiment-log.md`: 시행착오와 결정 기록.
- `docs/08-device-test-plan.md`: 실제 기기 검증 계획.
- `docs/10-release-readiness.md`: release gate.
- `docs/12-service-readiness-audit.md`: release/glasses/evidence aggregate audit command.
- `docs/13-physical-test-session-runbook.md`: physical phone/Ray-Ban/Android XR evidence session workflow.
- `docs/28-private-alpha-hardware-runner.md`: hardware-day private-alpha runner workflow.
- `docs/29-private-alpha-hardware-readiness-preflight.md`: preflight for local toolchain, ADB device counts, credentials, session packs, and runner flags.
- `docs/30-platform-source-freshness.md`: official Meta Wearables and Android XR source freshness check.
- `docs/38-glasses-haptics-intent-contract.md`: app-side haptics intent contract and evidence markers.
- `docs/39-glasses-private-alpha-evidence-runner.md`: glasses-lane private-alpha evidence runner and strict candidate validation.
- `docs/40-hardware-test-operator-pack.md`: day-of-test operator pack for phone, glasses, support, readiness, and service-gate checks.
- `docs/41-hardware-test-promotion-validator.md`: promotion profiles for validating operator-pack outputs.
- `docs/42-direction-evidence-extractor.md`: device-evidence direction summary extraction and strict non-promotion validation.
- `docs/43-phone-runner-direction-evidence.md`: phone runner and operator-pack direction summary integration.
- `docs/44-android-xr-projected-contract.md`: Android XR projected contract validation for phone-preview/stub versus real ProjectedContext/Glimmer proof.
- `docs/45-android-xr-preflight-contract-integration.md`: glasses preflight integration for Android XR projected default/strict contract rows.
- `docs/46-hardware-test-status-dashboard.md`: hardware test lane status dashboard for operator-pack execution decisions.
- `docs/47-device-evidence-redaction.md`: generated phone evidence redaction gate for device identifiers and private fields.
- `docs/48-evidence-privacy-scan.md`: folder-level scanner for generated evidence/report artifacts.
- `docs/49-operator-pack-privacy-scan-integration.md`: operator-pack privacy scan integration before promotion validation.
- `docs/50-direction-validation-adb-recorder.md`: debug ADB recorder for controlled expected-vs-observed direction trials.
- `docs/51-controlled-direction-trial-session.md`: generated controlled direction-trial session workflow.
- `docs/52-direction-evidence-manifest-apply.md`: strict direction manifest promotion gate.
- `docs/53-hardware-next-actions.md`: ordered non-PII command brief for real hardware test days.
- `docs/54-hardware-next-action-executor.md`: safe executor for the first ready allow-listed hardware next action.
- `docs/55-phone-lane-collection-readiness.md`: phone collection blocker versus post-run evidence gap contract.
- `docs/56-phone-lane-hardware-runner.md`: one-command phone lane readiness refresh and guarded `RUN_PHONE=1` execution contract.
- `docs/57-phone-lane-post-run-review.md`: post-run phone evidence review before phone-alpha claims.
- `docs/58-phone-lane-ready-watcher.md`: polling watcher for phone-lane readiness and guarded execute/review chaining.
- `docs/15-policy-clearance-matrix.md`: Meta Wearables, Android XR, Google Play, recording, voice, and wearable distribution clearance tracking.
- `docs/16-privacy-policy-data-safety-draft.md`: local-first privacy policy and Google Play Data Safety draft.
- `docs/17-store-review-submission-package-draft.md`: Play/wearable review submission package draft.
- `docs/18-release-artifact-signing-runbook.md`: release AAB, upload-key signing, Play App Signing, and key-hygiene runbook.
- `data/runs/20260528_voice_direction_mvp/final-report.md`: 현재 통합 리포트.

## 구현된 기능

- Runtime microphone disclosure gate before OS permission/audio flow.
- Foreground microphone service with visible notification.
- Repeated Android `SpeechRecognizer` loop.
- Trigger phrase evaluation.
- Speaker profile states and prototype enrollment sample capture.
- Prototype voice embedding extraction and match diagnostic.
- Service-side prototype voice match bridge.
- Short stereo direction sample bridge.
- Audio direction evidence classifier for left/right usable, low-confidence, front/back-unproven, and unavailable sample labels.
- Latest audio direction evidence snapshot for generated physical phone reports, including microphone inventory and active microphone/channel-mapping counts.
- Detection processing latency metadata, UI summary, and non-PII evidence fields.
- Latest alert delivery channel/status persistence without alert message text.
- Direct alert output test for enabled channels without creating a detection event.
- Direction-coded phone vibration fallback pattern metadata for non-PII debug evidence.
- In-app direction cue output contract card for expected notification, vibration, TTS, and glasses evidence output.
- App-side glasses haptics intent mapping for left/right/both/none targets, intensity, pulse count, proof requirement, and non-PII debug evidence markers.
- Latest alert delivery source label in the output card and non-PII evidence snapshot.
- Direction validation trial recorder and per-direction matched/mismatched/unknown plus 20-per-direction target progress summary for expected-vs-observed front/back/left/right evidence.
- Direction target-progress fields in generated device evidence for 20-per-direction and remaining-row status.
- Direction evidence summary target-progress propagation for root summary, aggregate evaluation, and manifest update template.
- Direction evidence manifest apply gate for strict validation and rollback before canonical manifest promotion.
- Phone runner direction apply dry-run integration for non-writing manifest promotion readiness visibility.
- Debug ADB direction-validation trial recorder and helper script for controlled expected-vs-observed evidence entry.
- Bluetooth communication-device route probe and guarded route select/clear controls for Ray-Ban/Android XR HFP microphone fallback checks.
- Phone notification and vibration alert routing.
- Android TextToSpeech direction-only fallback alert routing.
- Latest glasses cue storage and projected cue activity.
- Shared glasses cue payload contract that separates user-facing display labels from non-PII adapter/evidence summaries.
- Release readiness card backed by the same checklist used by debug release readiness snapshots, including first phone-alpha evidence states and next actions.
- AndroidKeyStore AES-GCM encrypted local string storage with legacy plaintext migration fallback.
- Debug-only encrypted storage self-check automation in the ADB smoke script.
- Debug-only repository direction-validation self-check automation in the ADB smoke script.
- Debug-only alert output test broadcast in the ADB smoke script, storing channel/status counts, cue contract markers, glasses haptics intent markers, and marking `latestDeliverySource=TEST_CUE`.
- Debug-only glasses cue seed broadcast in the ADB smoke script, storing a generic latest projected cue before projected launch.
- Debug-only Bluetooth route evidence broadcast in the ADB smoke script, recording route support/count/type metadata without device names.
- Debug-only local delete self-check broadcast in the ADB smoke script, proving delete semantics on a separate encrypted debug store.
- Debug-only non-PII repository evidence snapshot in the ADB smoke script, including enabled alert channel states, latest delivery source, and microphone disclosure accepted/version fields.
- Debug-only release readiness snapshot in the ADB smoke script, including release target counts and open checklist ids.
- Debug-only glasses readiness snapshot in the ADB smoke script, including Meta DAT and Android XR counts and open checklist ids.
- Device evidence validator for generated physical-test reports.
- Phone-private-alpha evidence runner for build/test, Android phone smoke evidence, device-evidence validation, service-readiness audit, and non-PII summary output.
- Phone-private-alpha runner summary validator for privacy-shape and strict candidate checks.
- Glasses-private-alpha evidence runner for glasses hardware session validation, strict hardware/service gates, manifest apply dry-run, service audit, and non-PII summary output.
- Glasses-private-alpha runner summary validator for privacy-shape and strict candidate checks.
- Hardware test operator pack generator and validator for a self-contained phone/glasses/support test-day folder with no-hardware default mode and opt-in hardware lanes.
- Hardware test promotion validator for workflow, current-safe, phone-alpha, glasses-alpha, support-ready, and private-alpha profiles.
- Hardware test status dashboard for default/phone/glasses/support/controlled-direction lane readiness, blockers, next actions, and non-PII privacy guardrails.
- Hardware next-action reporter for ordering the default workflow, phone lane, controlled direction rows, glasses lane, and support lane from the latest dashboard without storing raw output or device identifiers.
- Hardware next-action executor for running only ready allow-listed actions and writing non-PII execution summaries.
- Phone lane collection-readiness split in the hardware dashboard, so `RUN_PHONE=1` becomes reachable after one authorized phone while post-run direction evidence gaps stay visible.
- Phone lane hardware runner for refreshing the dashboard/next-action brief and executing `RUN_PHONE=1` only when current state is ready.
- Phone lane post-run reviewer for checking generated phone evidence, strict phone-alpha validation, promotion profiles, and privacy scan.
- Phone lane ready watcher for polling the guarded runner until the phone lane is ready, then optionally executing and reviewing the lane.
- Device evidence redaction for ADB serial and build fingerprint rows and default folder paths in generated phone smoke reports.
- Evidence privacy scanner for generated evidence/report folders that outputs only file path, line number, and rule id for private-field violations.
- Operator-pack privacy scan integration that runs the scanner before workflow promotion validation.
- Direction validation ADB recorder that accepts only direction enums, statuses, confidence, optional sample counts, and allow-listed source labels.
- Controlled direction-trial session generator and validator for planned front/back/left/right hardware rows before strict direction evidence review.
- Direction evidence extractor and summary validator for non-PII direction trial counts, match rates, microphone metadata, route fields, and manifest update templates.
- Phone runner direction evidence integration for writing direction summary paths and candidate booleans into phone-alpha summaries.
- Android XR projected contract validator for default phone-preview/stub evidence and strict real ProjectedContext/Glimmer checks.
- Glasses preflight integration that records Android XR default projected contract pass and strict real projected contract manual-required rows.
- Service gate assertion command for current-safe, internal prototype, phone alpha, glasses alpha, and production promotion profiles.
- Release readiness checklist gate for debug glasses cue seed script-pass, debug Bluetooth route evidence script-pass, debug local delete self-check script-pass, debug alert output script-pass with cue contract and glasses haptics intent markers, debug direction sample script-pass, microphone metadata fields, `latestCuePresent=true`, and `latestDeliverySource=TEST_CUE` evidence.
- In-app tester consent and limitation copy.
- Detection feedback controls for accurate, false-positive, wrong-direction, and wrong-speaker outcomes.
- 30-minute false-positive test session with elapsed time, feedback summary, pass/fail verdict, and false-positive rate per hour.
- Glasses integration preflight automation for Meta DAT and Android XR setup evidence.
- Service readiness audit automation for release gate, glasses gate, and evidence-file aggregation.
- Physical test session generator for phone, Meta Ray-Ban, Android XR, direction accuracy, and privacy checklists.
- Physical test session validator for grouped evidence folder structure, direction accuracy checklist markers, and private structured-field checks.
- Support/deletion/mistaken-alert incident process and validator.
- Support drill evidence runbook, draft manifest, and validator for deletion verification and mistaken-alert operational rehearsal.
- Support drill session generator and validator for reusable deletion/mistaken-alert evidence packs.
- Glasses setup readiness doc, local properties template, and validator for Meta DAT/Android XR credential preparation.
- Glasses hardware evidence runbook, draft manifest, and validator for Ray-Ban Display, Ray-Ban Gen 1 fallback, Android XR projected runtime, and haptics/fallback proof.
- Glasses hardware session generator, validator, and apply automation for reusable Ray-Ban Display, Ray-Ban Gen 1 fallback, Android XR projected, and haptics/fallback evidence packs.
- Private alpha rehearsal generator and validator for linking physical phone, support drill, and glasses hardware sessions before tester-facing claims.
- Private alpha hardware runner for hardware-day orchestration and non-PII command status summaries.
- Private alpha hardware readiness preflight for local toolchain, ADB count, credentials, session-pack, and latest evidence checks.
- Platform source freshness checker for official source URL availability, redirect state, and local canonical-reference drift.
- Policy clearance matrix and validator; tracking exists but external clearance remains blocked.
- Privacy policy/Data Safety draft and validator; draft exists but public hosting, Play submission, and legal/policy review remain open.
- Store review submission package and validator; listing/reviewer copy exists but upload-signed release artifact, screenshots, Play submission, and wearable review remain open.
- Release artifact/signing runbook and validator; structural release AAB can be generated, but upload-key signing and strict upload-ready validation remain blocked.
- Release notes/versioning draft and validator; `0.1.0`/`1` internal-testing notes validate locally, but Play upload and tester availability remain open.
- Play screenshot/media runbook, draft manifest, capture script, and validator; default draft validation passes, but strict asset validation is blocked until real non-private screenshots and feature graphic exist.
- Production speaker model evaluation runbook, draft manifest, and validator; default draft validation passes, but strict model validation is blocked until real model file, thresholds, metrics, latency, and anti-spoofing evidence exist.
- Direction accuracy evidence runbook, draft manifest, and validator; default draft validation passes, but strict direction validation is blocked until controlled phone/glasses trials, microphone metadata, route proof, and latency evidence exist.
- Meta DAT application ID manifest placeholder and analytics opt-out metadata.
- Glasses integration readiness model and host UI card.
- Explicit consent checkbox before saving a new speaker profile.
- Persisted alert channel preferences for phone notification, vibration, TTS, Meta Display, and Android XR Display.
- Direction-specific phone vibration pattern summaries.
- Direction cue output contract helper and UI card.
- Non-PII diagnostics.

## 기술 스택

- Kotlin.
- Android Gradle Plugin.
- Jetpack Compose.
- Android `SpeechRecognizer`.
- Android `TextToSpeech`.
- Android foreground service.
- Android notification and vibration APIs.
- Android `AudioRecord` for transient capability/direction/enrollment samples.
- Direction validation trial storage and aggregate/per-direction outcome plus 20-per-direction target progress summary.
- Debug evidence snapshot fields for controlled direction required trials, missing rows, and target-complete status.
- In-app release readiness card for promotion gate visibility and phone-alpha operator next actions.
- Node phone-private-alpha evidence runner for phone-first private-alpha evidence collection.
- Node phone-private-alpha runner validator for strict candidate and privacy guardrail checks.
- Node glasses-private-alpha evidence runner and validator for Ray-Ban/Android XR evidence lane summaries.
- Node hardware test operator pack generator and validator for test-day orchestration.
- Node hardware test promotion validator over operator-pack summaries.
- Node hardware test status dashboard over operator-pack summaries, current-safe gate assertions, glasses preflight, Android XR contract state, and controlled direction-trial session readiness.
- Node hardware next-action reporter over dashboard lane statuses and blockers.
- Node hardware next-action executor over the first ready allow-listed action.
- Node collection-readiness summary over phone pre-run blockers and post-run evidence gaps.
- Node phone-lane hardware runner over the refreshed dashboard and next-action JSON.
- Node phone-lane post-run reviewer over operator-pack phone summary, promotion validation, and evidence privacy scan.
- Bash phone smoke script plus Node evidence validator with generated device identifier redaction checks.
- Node evidence privacy scanner over generated evidence/report folders.
- Generated hardware operator-pack command flow with pack-scoped privacy scan before promotion validation.
- Node direction evidence extractor and summary validator over generated `device-evidence.md`, including controlled target-progress consistency checks.
- Node direction evidence manifest apply script that refuses fixture writes and validates strict summary/direction readiness before canonical promotion.
- Node phone-private-alpha runner direction summary and apply dry-run integration.
- Node service gate assertion profiles over service-readiness audit JSON.
- Audio direction evidence classifier and summary formatter.
- Latest audio direction evidence snapshot storage and codec.
- Local storage abstraction with AndroidKeyStore AES-GCM encrypted string storage over app-private `SharedPreferences`.
- Meta DAT and Android XR adapter boundaries, currently stubbed.

## 검증

Latest verified command:

```bash
cd apps/voice-direction-glass
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- Unit tests passed.
- Debug APK assembled at `apps/voice-direction-glass/app/build/outputs/apk/debug/app-debug.apk`.
- Detection latency metadata tests passed.
- Audio direction evidence classifier and formatter tests passed.
- Latest audio direction evidence snapshot codec and repository tests passed.
- Alert delivery snapshot persistence tests passed.
- Direction-specific phone vibration pattern summary tests passed.
- Glasses cue payload tests passed for display labels versus non-PII evidence summaries.
- Speaker consent gate compiles into the host app.
- Alert channel preference filtering and storage codec tests passed.
- Debug alert output test broadcast automation compiles into the debug APK and is wired into the ADB smoke report path.
- Debug direction sample test broadcast automation compiles into the debug APK and is wired into the ADB smoke report path before evidence snapshot collection.
- Debug direction validation trial receiver compiles into the debug APK, and `scripts/record-direction-validation-trial.sh` syntax/help passed.
- Direction validation target progress UI compiles into the debug APK; unit tests cover the 20-per-direction and 80-row target math.
- Device evidence validator fixture now requires controlled direction target-progress markers and passes.
- APK manifest inspection confirmed `DirectionValidationTrialReceiver` and `DEBUG_DIRECTION_VALIDATION_TRIAL`.
- Service readiness audit now tracks the direction validation ADB recorder doc, script, and receiver.
- Controlled direction-trial session generator and validator passed; generated session contains 80 planned rows and no-hardware `commands.sh` passed.
- Debug glasses cue seed automation compiles into the debug APK and is wired before projected cue Activity launch.
- Debug Bluetooth route evidence automation compiles into the debug APK and is wired into the ADB smoke report path.
- Debug local delete self-check automation compiles into the debug APK and is wired into the ADB smoke report path.
- Release readiness checklist unit tests cover the debug alert output phone-alpha gate.
- Release readiness snapshot automation compiles into the debug APK and is validated by the fixture.
- Glasses readiness snapshot automation compiles into the debug APK and is validated by the fixture.
- Canonical JSON validation passed.
- Device smoke script syntax/help passed.
- Device evidence validator fixture passed.
- Service readiness audit JSON and Markdown report generation passed; current audit says only internal prototype is ready.
- Hardware test operator pack generation, validation, default no-hardware run, and post-run validation passed for `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack`.
- Hardware test promotion validator passed `workflow` and `current-safe` profiles; strict phone/glasses/support profiles failed as expected without physical/support evidence.
- Hardware test status dashboard generation passed for `data/runs/20260528_voice_direction_mvp/99-hardware-test-status-dashboard`; it reports current-safe workflow true, private alpha candidate false, and controlled direction recorded rows `0/80`.
- Device evidence validator fixture passes with redacted `Device serial` and `Build fingerprint` metadata, legacy ADB-labeled evidence paths fail as expected, and the smoke script syntax/help path passes after redaction changes.
- Evidence privacy scan initially passed for `data/runs/20260528_voice_direction_mvp/101-evidence-privacy-scan`; the latest default scan covers 31 generated files with zero violations and zero warnings.
- Evidence privacy scan negative checks failed as expected for a private speaker field and a legacy ADB-labeled evidence path without printing matched private text.
- Operator-pack default run passed with pack-scoped evidence privacy scan enabled; pack scan covered 16 files with zero violations.
- Hardware test status dashboard now includes operator-pack privacy scan state; default lane remains ready while phone/glasses remain blocked and support remains manual-required.
- Hardware test status dashboard now validates the controlled direction-trial session and reports planned rows, recorded rows, TODO rows, and production direction candidate status.
- Hardware next-action report generation passed and currently recommends refreshing the default workflow before attaching exactly one authorized Android phone.
- Hardware next-action executor dry-run and execute mode passed; execute mode refreshed the no-hardware operator pack with exit code `0`.
- Phone lane collection readiness split passed; `run-phone-lane` is still refused in the current no-phone state, and the blocker list is only authorized ADB device count `0`.
- Phone lane hardware runner syntax/help passed; current dry-run report was written and blocked only on authorized ADB device count `0`.
- Phone lane post-run reviewer syntax/help passed; current review report is blocked because no real phone evidence exists and strict phone-alpha validation fails as expected.
- Phone lane ready watcher syntax/help passed; current zero-timeout no-phone smoke report is `timed-out` and does not run hardware collection.
- Default evidence privacy scan now covers 31 generated files with zero violations after adding the controlled direction-trial session target.
- Direction evidence extractor generated `data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor/direction-evidence-summary.json` from the validator fixture.
- Direction evidence summary validator passed default mode and failed strict production-candidate mode as expected with `productionDirectionCandidate=false`.
- Direction evidence summary target progress passed default validation with required total `80`, missing total `76`, missing `19` per direction, and `controlledTrialTargetComplete=false`.
- Direction evidence manifest apply dry-run passed with `applyReady=false`; write mode failed as expected without modifying the draft canonical manifest.
- Phone runner direction apply dry-run integration passed no-device workflow validation with apply dry-run skipped.
- Phone-private-alpha no-device runner summary passed with `directionEvidence.exists=false`; strict phone-alpha validation failed as expected.
- Operator pack default run passed after phone runner direction evidence integration, and promotion validator reports `phoneDirectionSummaryValidated=false`.
- Physical test session pack generation passed for `data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack`.
- Physical test session validator passed for the generated session pack, including direction accuracy checklist markers, with expected warnings for missing hardware output files.
- Support incident process validator passed; support process is defined but not rehearsed.
- Support drill evidence validator passes default draft mode; strict drill validation fails as expected until support channel and drill evidence exist.
- Support drill session generator and validator passed for `data/runs/20260528_voice_direction_mvp/74-support-drill-session-pack`.
- Glasses setup readiness validator passes default mode; strict credential mode fails as expected until Meta application ID and GitHub token are configured locally.
- Glasses hardware evidence validator passes default draft mode; strict glasses-alpha mode fails as expected until real Ray-Ban and Android XR evidence exists.
- Policy clearance matrix validator passed; policy work is tracked but not externally cleared.
- Privacy/Data Safety draft validator passed; policy text is drafted but not submitted, hosted, or approved.
- Store review submission package validator passed; store listing/reviewer package is drafted but not submitted or approved.
- Release artifact readiness validator passed in default mode; strict upload-ready mode remains blocked without upload key and signed AAB.
- Release notes/versioning validator passed for the current Gradle version and internal-testing release-note draft.
- Play screenshot/media package validator passed in default draft mode; strict asset mode fails as expected because screenshots and feature graphic are missing.
- Production speaker model readiness validator passed in default draft mode; strict model-ready mode fails as expected because model and evaluation evidence are missing.
- Direction accuracy evidence validator passed in default draft mode; strict production-direction mode fails as expected because controlled direction evidence is missing.
- Microphone metadata counts compile into the direction sample path and debug evidence snapshot without storing PCM.
- Microphone disclosure gate compiles into the host app and is persisted as versioned local settings.
- Physical ADB device test is not yet run.
- Debug non-PII evidence snapshot receiver compiles into the debug APK, but physical-device snapshot evidence is not yet recorded.
- Device evidence validator fixture requires debug glasses cue seed, debug Bluetooth route evidence, debug local delete self-check, debug alert output, and debug direction sample script-pass rows, vibration pattern markers, cue contract markers, glasses haptics intent markers, microphone metadata markers, `latestCuePresent=true`, and `latestDeliverySource=TEST_CUE` after the scripted test cue.

## 위험과 미해결 항목

- Prototype acoustic embedding is not a production speaker verification model.
- Front/back direction is unproven.
- Left/right direction needs real phone/glasses evidence.
- Direction validation aggregate/per-direction outcome counts need physical phone and glasses-route evidence.
- Direction validation ADB recorder needs a physical phone debug run before it counts as device evidence.
- Controlled direction-trial session needs real observed rows before it counts as direction evidence.
- Latest audio direction evidence snapshot needs physical phone evidence after a direction sample run.
- Processing latency metadata needs physical phone evidence and comparison with the 1.5 second target.
- Alert delivery status persistence needs physical observation to confirm status matches notification, vibration, TTS, and display behavior.
- Phone vibration pattern metadata needs physical observation to confirm the tester can distinguish the direction-coded fallback cue.
- Bluetooth HFP route visibility and selection/clear behavior need physical Ray-Ban/Android XR evidence.
- TTS direction cue audible behavior needs physical phone and Bluetooth glasses route evidence.
- Meta DAT real adapter is not implemented.
- Android XR real adapter is not implemented.
- Glasses preflight currently reports blocked rows for Meta credentials, DAT dependencies, Jetpack Projected dependencies, and attached device proof.
- Glasses-side haptics is not confirmed.
- Glasses haptics intent mapping exists, but it is not physical haptics proof and must not appear as a support claim.
- Encrypted storage code and debug self-check automation exist, but physical-device script-pass and real app data restart behavior are not yet proven.
- Repository direction-validation self-check exists, but physical-device script-pass is not yet recorded.
- Non-PII evidence snapshot exists, but physical-device script-pass and privacy-shape review are not yet recorded.
- Release readiness snapshot exists, but physical-device script-pass is not yet recorded.
- Glasses readiness snapshot exists, but physical-device script-pass is not yet recorded.
- Device evidence validator exists, but no physical-device report has passed it yet.
- Evidence privacy scanner exists, but every new real phone/glasses/support evidence folder still needs a fresh scan before promotion review.
- Service readiness audit exists, but it currently reports missing physical `device-evidence.md`.
- Physical test session pack exists, but its `commands.sh` still needs a connected phone to produce real evidence.
- Physical session validator exists, but it has not yet validated a post-hardware-run session with real `device-evidence.md`.
- Microphone disclosure gate exists, but physical-device evidence still needs to prove it blocks permission/audio flow before acceptance.
- Speaker consent gate needs physical phone UI evidence before phone private alpha.
- Alert channel preferences need physical phone observation to confirm delivery rows match enabled outputs.
- Debug alert output test broadcast exists, but physical-device script-pass and actual output observation are not yet recorded.
- Debug direction sample test broadcast exists, but physical-device script-pass and actual microphone metadata output are not yet recorded.
- Detection feedback exists, but a 30-minute false-positive room run is not yet recorded.
- False-positive run session exists, but physical room-test evidence is not yet recorded.
- Support/incident process is defined, and support drill evidence shape is now machine-checkable, but deletion and mistaken-alert drills are not done.
- Store/SDK policy clearance is not done. `docs/15-policy-clearance-matrix.md` tracks the work but Meta logged-in review, Google Play Console review, Android XR packaging review, voice/recording legal review, and store submission remain open.
- Privacy policy/Data Safety work is not externally complete. `docs/16-privacy-policy-data-safety-draft.md` is a repository draft with TBD identity/contact fields; public URL, Play Console form submission, and legal/policy review remain open.
- Store review submission work is not externally complete. `docs/17-store-review-submission-package-draft.md` is a repository draft; release AAB/signing, screenshots, Play app-content declarations, reviewer submission, Meta review, and Android XR review remain open.
- Release artifact work is not externally complete. `docs/18-release-artifact-signing-runbook.md` is a repository runbook; upload-key signing, Play App Signing setup, strict validation, and Play upload remain open.
- Release notes/versioning work is not externally complete. `docs/19-release-notes-versioning.md` and `apps/voice-direction-glass/release-notes/internal-testing-v0.1.0.md` are repository drafts; Play internal-testing upload, tester availability, and release-track evidence remain open.
- Play screenshot/media work is not externally complete. `docs/20-play-screenshot-media-runbook.md` and `apps/voice-direction-glass/store-assets/play-preview/manifest.json` are drafts; real screenshots, feature graphic, XR preview assets, and Play upload remain open.
- Production speaker model work is not externally complete. `docs/21-production-speaker-model-evaluation.md` and `apps/voice-direction-glass/model-assets/speaker-verifier/manifest.json` are drafts; real model, operating thresholds, aggregate trials, spoof/replay mitigation, and latency proof remain open.
- Direction accuracy work is not externally complete. `docs/22-direction-accuracy-evidence.md` and `apps/voice-direction-glass/direction-evidence/manifest.json` are drafts; controlled phone/glasses trials, microphone metadata, route proof, latency evidence, and strict validation remain open.
- Direction evidence summary work is automation-only so far. `docs/42-direction-evidence-extractor.md` and `data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor` use fixture evidence, not real phone/wearable proof.
- Phone runner direction integration is workflow-only so far. `docs/43-phone-runner-direction-evidence.md` and `data/runs/20260528_voice_direction_mvp/96-phone-runner-direction-evidence.md` still need a real `RUN_PHONE=1` pass.
- Android XR projected contract validation is workflow-only so far. `docs/44-android-xr-projected-contract.md` and `data/runs/20260528_voice_direction_mvp/97-android-xr-projected-contract` pass default preview/stub mode, while strict real Android XR validation must fail until Jetpack XR, Glimmer, ProjectedContext, real adapter, and runtime evidence exist.
- Android XR preflight contract integration exists at `docs/45-android-xr-preflight-contract-integration.md`; latest glasses preflight records default contract pass and strict real contract manual-required, but still does not prove runtime behavior.
- Glasses setup work is not externally complete. `docs/24-glasses-setup-readiness.md` and `apps/voice-direction-glass/local.properties.example` are present, but strict credential validation and real preflight closure require local Meta credentials.
- Glasses hardware proof is not complete. `docs/25-glasses-hardware-evidence.md` and `apps/voice-direction-glass/glasses-evidence/manifest.json` are drafts; Ray-Ban Display, Gen 1 fallback, Android XR projected runtime, and haptics/fallback evidence remain open.
- Glasses hardware session automation exists at `docs/26-glasses-hardware-session-runbook.md`, `scripts/apply-glasses-hardware-session.mjs`, and `data/runs/20260528_voice_direction_mvp/77-glasses-hardware-session-pack`, but the pack still needs real hardware observations before the canonical manifest can be updated.
- Private alpha rehearsal automation exists at `docs/27-private-alpha-rehearsal-runbook.md` and `data/runs/20260528_voice_direction_mvp/79-private-alpha-rehearsal-pack`, but it currently proves workflow only because phone/support/glasses evidence remains missing.
- Private alpha hardware runner exists at `docs/28-private-alpha-hardware-runner.md`, `scripts/run-private-alpha-hardware-rehearsal.mjs`, and `data/runs/20260528_voice_direction_mvp/80-private-alpha-hardware-runner`, but the default passing run proves orchestration only until real evidence flags are used.
- Private alpha hardware readiness preflight exists at `docs/29-private-alpha-hardware-readiness-preflight.md`, `scripts/check-private-alpha-hardware-readiness.mjs`, and `data/runs/20260528_voice_direction_mvp/81-private-alpha-hardware-readiness`, but it currently reports zero authorized ADB devices and missing Meta credentials.
- Platform source freshness exists at `docs/30-platform-source-freshness.md`, `scripts/check-platform-source-freshness.mjs`, and `data/runs/20260528_voice_direction_mvp/82-platform-source-freshness`; it validates source URLs but does not prove account approval or hardware behavior.
- Glasses-private-alpha evidence runner exists at `docs/39-glasses-private-alpha-evidence-runner.md`, `scripts/run-glasses-private-alpha-evidence.mjs`, and `data/runs/20260528_voice_direction_mvp/92-glasses-private-alpha-evidence-runner`; it currently proves workflow only because hardware evidence remains missing.
- Hardware test operator pack exists at `docs/40-hardware-test-operator-pack.md`, `scripts/create-hardware-test-operator-pack.mjs`, `scripts/validate-hardware-test-operator-pack.mjs`, and `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack`; default mode proves orchestration only until `RUN_PHONE=1`, `RUN_GLASSES=1`, or `RUN_SUPPORT=1` are used with real evidence.
- Hardware test promotion validator exists at `docs/41-hardware-test-promotion-validator.md` and `scripts/validate-hardware-test-promotion.mjs`; strict profiles still need real evidence.
- Hardware test status dashboard exists at `docs/46-hardware-test-status-dashboard.md`, `scripts/summarize-hardware-test-status.mjs`, and `data/runs/20260528_voice_direction_mvp/99-hardware-test-status-dashboard`; it summarizes lanes only and is not release approval.
- Hardware next-action brief exists at `docs/53-hardware-next-actions.md`, `scripts/recommend-hardware-next-actions.mjs`, and `data/runs/20260528_voice_direction_mvp/111-hardware-next-actions`; it recommends command order only and is not hardware evidence.
- Hardware next-action executor exists at `docs/54-hardware-next-action-executor.md`, `scripts/run-hardware-next-action.mjs`, and `data/runs/20260528_voice_direction_mvp/112-hardware-next-action-executor`; its current success is no-hardware workflow evidence only.
- Phone lane collection readiness exists at `docs/55-phone-lane-collection-readiness.md` and `data/runs/20260528_voice_direction_mvp/113-phone-lane-collection-readiness.md`; it fixes the operator flow but does not prove phone evidence.
- Phone lane hardware runner exists at `docs/56-phone-lane-hardware-runner.md`, `scripts/run-phone-lane-hardware.mjs`, and `data/runs/20260528_voice_direction_mvp/114-phone-lane-hardware-runner`; current blocked result is readiness automation only, not phone evidence.
- Phone lane post-run reviewer exists at `docs/57-phone-lane-post-run-review.md`, `scripts/review-phone-lane-evidence.mjs`, and `data/runs/20260528_voice_direction_mvp/115-phone-lane-post-run-review`; current blocked result is expected until real phone evidence exists.
- Phone lane ready watcher exists at `docs/58-phone-lane-ready-watcher.md`, `scripts/run-phone-lane-when-ready.mjs`, and `data/runs/20260528_voice_direction_mvp/116-phone-lane-ready-watcher`; current timeout result is expected until one authorized phone is attached.
- Device evidence redaction exists at `docs/47-device-evidence-redaction.md`; it reduces privacy risk for file contents and default paths, but still needs a real phone evidence file review.
- Tester consent and microphone disclosure copy exist in app/code, but review is not done.

## 다음 작업

1. Attach Android phone and run `scripts/run-phone-private-alpha-evidence.mjs` without `--allow-no-device`.
2. Run `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh` once without flags, then use `RUN_PHONE=1`, `RUN_GLASSES=1`, or `RUN_SUPPORT=1` only for the evidence lane being tested.
3. Run `scripts/validate-hardware-test-promotion.mjs --profile workflow --json` after every operator-pack run, and strict profiles only after real evidence exists.
4. Run `scripts/summarize-hardware-test-status.mjs --write-report --json` after every operator-pack, phone, glasses, support, Android XR, or preflight evidence change.
5. Run `scripts/recommend-hardware-next-actions.mjs --write-report --json` after every dashboard update, then follow only lanes whose blockers are closed.
6. Use `scripts/run-phone-lane-hardware.mjs --write-report --json` for the next phone pass, then add `--execute` only when it reports the phone lane ready.
7. For unattended phone setup, use `scripts/run-phone-lane-when-ready.mjs --write-report --json`; add `--execute` only when the connected phone is the intended test device.
8. After phone-lane execution, run `scripts/review-phone-lane-evidence.mjs --write-report --json` before any phone-alpha claim.
9. Use `scripts/run-hardware-next-action.mjs --execute --write-report --json` only for the selected `ready` action.
7. Confirm generated phone `device-evidence.md` contains redacted `Device serial` and `Build fingerprint` rows and that the evidence folder path does not include an ADB device label.
6. Use `data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack/commands.sh` for the first grouped hardware pass when working outside the operator pack.
7. Run `scripts/validate-physical-test-session.mjs data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack --json` before and after the hardware pass.
4. Confirm the microphone disclosure gate blocks permission/audio flow before acceptance.
5. Collect same-speaker and different-speaker prototype match evidence.
6. Confirm the speaker consent gate blocks unchecked profile creation.
7. Confirm `알림 출력 점검` emits only enabled channels without creating a detection event.
8. Verify the generated report marks debug glasses cue seed as script-pass and the snapshot shows `latestCuePresent=true`.
9. Verify the generated report marks debug Bluetooth route evidence as script-pass and contains no product names or MAC addresses.
10. Verify the generated report marks debug local delete self-check as script-pass and post-delete counts are zero.
11. Verify the generated report marks debug alert output test as script-pass and the snapshot source as `TEST_CUE`.
12. Confirm debug alert output includes vibration pattern direction, signature, pulse count, total duration, `phoneVibrationSideSpecific=false`, cue contract markers, and glasses haptics intent markers.
13. Verify the generated report marks debug direction sample test as script-pass and contains status/evidence/microphone metadata counts only.
14. Confirm alert channel preference filtering with manual simulation and foreground service runs.
15. Confirm processing latency appears in the generated evidence snapshot.
16. Confirm alert delivery statuses appear in the generated evidence snapshot.
14. Generate a controlled direction-trial session, then record aggregate/per-direction outcome counts for left/right/front/back using the app UI or `scripts/record-direction-validation-trial.sh` during real controlled trials.
15. Verify latest audio direction evidence fields appear in the generated non-PII snapshot after a direction sample run.
16. Verify repository direction-validation self-check is script-pass in generated evidence.
17. Verify non-PII repository evidence snapshot is script-pass and contains only counts/status/booleans/enums plus latency, delivery, microphone disclosure, per-direction validation outcomes, and direction evidence metrics.
18. Verify the release readiness card shows phone/glasses/beta/production as not-ready or blocked until matching evidence exists and shows phone-alpha evidence/next-action rows.
18. Verify release readiness snapshot is script-pass and keeps phone private alpha open until manual rows are filled.
19. Verify glasses readiness snapshot is script-pass and lists Meta DAT/Android XR open checklist ids.
20. Run `scripts/validate-device-evidence.mjs` on the generated report.
21. Run `scripts/extract-direction-evidence-summary.mjs <device-evidence.md> --json` and validate the generated summary before reviewing any direction manifest update.
22. In the operator pack phone lane, verify `phone-alpha-runner/direction-evidence/direction-evidence-summary.json` is generated after `RUN_PHONE=1`.
23. Run `scripts/audit-service-readiness.mjs --write-report` after phone/glasses evidence changes.
24. Run 30-minute false-positive test.
25. Generate a support drill session pack, run support deletion verification and mistaken-alert incident drills, then pass strict support drill validation.
26. Keep `scripts/validate-policy-clearance-matrix.mjs --json` passing while leaving production policy clearance blocked until real external review.
27. Run Bluetooth microphone route probe and route select/clear with Ray-Ban or Android XR glasses connected.
28. Verify the direction-only TTS cue through phone speaker and Bluetooth glasses route.
29. Add Meta DAT credentials outside source control.
30. Run `scripts/glasses-integration-preflight.sh --write-evidence`.
31. Keep `docs/19-release-notes-versioning.md` and `release-notes/internal-testing-v0.1.0.md` valid before any internal-testing upload.
32. Keep `docs/20-play-screenshot-media-runbook.md` and `store-assets/play-preview/manifest.json` valid before any store listing upload.
33. Keep `docs/21-production-speaker-model-evaluation.md` and `model-assets/speaker-verifier/manifest.json` valid before any external beta.
34. Keep `docs/22-direction-accuracy-evidence.md` and `direction-evidence/manifest.json` valid before any front/back or four-direction claim.
35. Keep `docs/42-direction-evidence-extractor.md` valid after every summary-shape or manifest-template change.
36. Keep `docs/43-phone-runner-direction-evidence.md` valid after every phone runner direction integration change.
37. Run `scripts/validate-android-xr-projected-contract.mjs --json` after Android XR projected launch, dependency, Glimmer, or adapter changes.
38. Keep `docs/44-android-xr-projected-contract.md` valid after Android XR projected contract changes.
39. Keep `docs/45-android-xr-preflight-contract-integration.md` valid after Android XR projected rows in glasses preflight change.
40. Keep `docs/46-hardware-test-status-dashboard.md` valid after hardware lane status, blocker, or privacy-shape changes.
41. Keep `docs/47-device-evidence-redaction.md` valid after generated phone evidence redaction or private-field validator changes.
42. Keep `docs/24-glasses-setup-readiness.md` and `local.properties.example` valid before any Meta DAT or Android XR credential/runtime change.
41. Keep `docs/25-glasses-hardware-evidence.md` and `glasses-evidence/manifest.json` valid before any glasses alpha claim.
42. Use `data/runs/20260528_voice_direction_mvp/77-glasses-hardware-session-pack/commands.sh` before copying hardware proof into the canonical glasses manifest.
43. Dry-run reviewed hardware evidence with `scripts/apply-glasses-hardware-session.mjs <session-dir> --json` before using write mode.
41. Keep `docs/26-glasses-hardware-session-runbook.md` valid before any real hardware session.
42. Run `data/runs/20260528_voice_direction_mvp/79-private-alpha-rehearsal-pack/commands.sh` before any tester-facing private alpha claim.
43. Keep `docs/27-private-alpha-rehearsal-runbook.md` valid as phone/support/glasses evidence changes.
44. Run `scripts/run-private-alpha-hardware-rehearsal.mjs --json` for the hardware-day summary, then add `--run-phone`, `--run-support`, or `--run-glasses` only when matching real evidence can be collected.
45. Keep `docs/28-private-alpha-hardware-runner.md` valid as the hardware-day runner flow changes.
46. Run `scripts/check-private-alpha-hardware-readiness.mjs --write-report --json` before choosing hardware-day runner flags.
47. Keep `docs/29-private-alpha-hardware-readiness-preflight.md` valid as local readiness checks change.
48. Run `scripts/check-platform-source-freshness.mjs --write-report --json` after every official source URL, SDK assumption, or platform doc change.
49. Keep `docs/35-phone-private-alpha-evidence-runner.md` valid as the phone-first evidence runner changes.
50. Run `scripts/validate-phone-private-alpha-evidence-runner.mjs --json` after every phone-alpha runner summary, and use strict mode only after a real phone run.
51. Run `scripts/assert-service-gates.mjs --profile current-safe --json` after readiness-affecting changes, and run stricter profiles only when matching evidence exists.
52. Run `scripts/run-glasses-private-alpha-evidence.mjs --json` after glasses hardware session updates, and add `--run-session` only when real glasses evidence can be collected.
53. Run `scripts/validate-glasses-private-alpha-evidence-runner.mjs --json` after every glasses-alpha runner summary, and use strict mode only after real glasses and phone evidence exists.
54. Keep `docs/30-platform-source-freshness.md` valid as platform source checks change.
55. Replace stub glasses adapters with real Meta DAT and Android XR integrations after credentials/runtime proof.
