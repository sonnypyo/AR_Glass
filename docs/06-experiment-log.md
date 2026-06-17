# Experiment Log

## 2026-05-28 KST: Initial Project Baseline

### Decision

Start with documentation and architecture before coding because the project depends on preview SDKs and uncertain hardware capabilities.

### Reasoning

Meta DAT and Android XR both expose promising glasses development paths, but public docs do not yet prove the hardest requirement: reliable caller direction from raw multi-microphone data. A direct build without documenting that risk would create false confidence.

### Findings

- The workspace is nearly empty and is not a Git repository.
- Local Java runtime is missing.
- Gradle is missing.
- Android Studio was not found in `/Applications`.
- Xcode 26.5 is installed.
- Meta DAT Android is available on GitHub and is Developer Preview.
- Android XR is on Developer Preview 4 as of 2026-05-19.
- Android XR supports projected phone-to-glasses experiences for audio/display glasses.

### Assumptions

- Android native is the first implementation path.
- Meta Ray-Ban Display can be tested by the user after environment setup.
- Android XR hardware may be acquired later, so Android XR code should be adapter-based.

### Risks

- Direction detection may need hardware/API access not available in public SDKs.
- Side-specific glasses vibration is not confirmed.
- Background listening needs careful OS permission and privacy handling.
- Meta docs behind login may include constraints not visible from public pages.

### Next Experiments

1. Install Android Studio and JDK, then create native Android skeleton.
2. Confirm Meta Developer account, app ID, Developer Mode, and DAT package access.
3. Build simulator mode before real audio.
4. Test whether Meta DAT exposes any audio/mic stream relevant to direction.
5. Test Android XR projected microphone access once hardware/emulator is available.

## 2026-05-28 KST: Direction Accuracy Evidence Gate

### Decision

Add a dedicated direction accuracy gate before any production front/back or four-direction claim.

### Reasoning

The core user value depends on the app telling the wearer where a trusted caller is. The current stereo energy prototype can support plumbing and left/right diagnostics, but it cannot justify front/back claims. The evidence gate makes that limitation machine-checkable instead of leaving it as a loose note.

### Implemented

- `docs/22-direction-accuracy-evidence.md`.
- `apps/voice-direction-glass/direction-evidence/manifest.json`.
- `scripts/validate-direction-accuracy-evidence.mjs`.
- Release readiness, audit, policy, store review, device test, README, and wiki references for the new gate.

### Trial/Error Notes

- Default validation intentionally passes while evidence is missing so documentation stays lintable during prototype work.
- Strict validation intentionally fails until controlled phone/glasses trials, microphone metadata, route proof, latency evidence, and privacy evidence exist.

### Current Result

- `front-back-direction-evidence` remains blocked.
- Public copy and screenshots must not imply front/back or four-direction support until strict direction validation passes.

## 2026-05-28 KST: Service Readiness Audit Automation

### Decision

Add a local service-readiness audit script instead of relying only on the human-readable release checklist.

### Reasoning

The project now has several evidence sources: Android build output, phone smoke evidence, non-PII snapshot validation, release readiness snapshots, glasses readiness snapshots, and glasses preflight output. A real service process needs one repeatable command that shows whether the current state is only an internal prototype, a phone alpha candidate, a glasses alpha candidate, or still blocked.

### Implemented

- `scripts/audit-service-readiness.mjs`.
- Markdown report output under `data/runs/20260528_voice_direction_mvp/52-service-readiness-audit/service-readiness-audit.md`.
- JSON output for automation.
- `docs/12-service-readiness-audit.md`.

### Trial/Error Notes

- The first parser matched the Kotlin `data class ReleaseReadinessItem(...)` declaration as if it were an actual checklist row. The fix was to filter parsed constructor bodies to items that contain an explicit `id =`.
- Missing physical `device-evidence.md` is reported as `not-run`, not a fatal local script failure, because the current environment has no attached ADB phone.

### Current Result

- Internal prototype: ready.
- Phone private alpha: not ready; physical phone evidence is still missing.
- Glasses private alpha and later stages: blocked until Meta DAT/Android XR credentials, runtime proof, and policy/model/support gates are closed.

## 2026-05-28 KST: Physical Test Session Pack

### Decision

Add a generator for physical-test session folders before actual hardware is attached.

### Reasoning

The next project gate depends on evidence from a real Android phone, Ray-Ban hardware, and later Android XR. Those runs need more than one command: build, phone smoke evidence, glasses preflight, validator, readiness audit, privacy redaction, and manual observations. A generated folder keeps all of that together and reduces the chance of mixing private data into evidence.

### Implemented

- `scripts/create-physical-test-session.mjs`.
- `docs/13-physical-test-session-runbook.md`.
- Current session pack at `data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack`.

### Trial/Error Notes

- The generated `commands.sh` intentionally stops when the phone smoke test fails. That is correct for the real hardware session because downstream evidence would be misleading without the phone report.
- Meta Ray-Ban and Android XR checklists are generated even while blocked, so missing credentials/runtime proof stays visible.

## 2026-05-28 KST: Physical Session Validator

### Decision

Add a validator for physical-test session folders.

### Reasoning

Once a real phone or glasses session starts, the evidence folder becomes the operational source of truth. It needs a quick structural and privacy-shape check before and after hardware runs, separate from the generated `device-evidence.md` validator.

### Implemented

- `scripts/validate-physical-test-session.mjs`.
- Stage record: `data/runs/20260528_voice_direction_mvp/54-physical-session-validator.md`.

### Trial/Error Notes

- The first scan flagged `privacy-redaction-rules.md` because the rule file intentionally contains an encrypted-envelope forbidden example. The validator now skips the rule file during private-field scanning while still checking that the privacy rule markers are present.
- Missing hardware output files are warnings before a run, not errors.

## 2026-05-28 KST: Direction Validation ADB Recorder

### Decision

Add a debug-only ADB recorder for controlled expected-vs-observed direction validation trials.

### Reasoning

The app UI can already store direction validation trials, but repeated hardware positioning tests are easier to run from a terminal while the tester moves around the phone or glasses route. A dedicated broadcast keeps the trial input repeatable and avoids adding raw audio, speaker names, Bluetooth names, or private notes to evidence.

### Implemented

- `apps/voice-direction-glass/app/src/debug/kotlin/com/voicedirection/glass/qa/DirectionValidationTrialReceiver.kt`.
- `scripts/record-direction-validation-trial.sh`.
- `docs/50-direction-validation-adb-recorder.md`.
- Stage record: `data/runs/20260528_voice_direction_mvp/103-direction-validation-adb-recorder.md`.

### Trial/Error Notes

- The recorder deliberately accepts only direction enums, status enums, confidence, optional sample counts, and allow-listed source labels.
- The helper is not run automatically by the smoke script because the smoke script cannot know the caller's real position.
- This improves evidence entry, but it does not close the front/back or production direction gate without real controlled trials.

## 2026-05-28 KST: Controlled Direction Trial Session

### Decision

Add a generated session folder for controlled front/back/left/right direction trial planning.

### Reasoning

The production direction gate requires at least 20 trials for each direction, but the previous workflow only described that in prose. A generated session gives the hardware operator a concrete run sheet, CSV, ADB command templates, aggregate summary template, and privacy rules before the test starts.

### Implemented

- `scripts/create-controlled-direction-trial-session.mjs`.
- `scripts/validate-controlled-direction-trial-session.mjs`.
- `docs/51-controlled-direction-trial-session.md`.
- Generated session at `data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session`.

### Trial/Error Notes

- The first generated `commands.sh` resolved the repository root one directory too shallow from `data/runs/...`; the generator now uses the correct four-level path back to the workspace root.
- The validator intentionally accepts `TODO` observed values in the pre-run sheet, because only a physical trial can produce real observed directions.
- The session starts with `productionDirectionCandidate=false` and must not update the canonical direction manifest directly.

### Verification

From the repository root:

```bash
node --check scripts/create-controlled-direction-trial-session.mjs
node --check scripts/validate-controlled-direction-trial-session.mjs
scripts/create-controlled-direction-trial-session.mjs --run-dir data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session --force --json
scripts/validate-controlled-direction-trial-session.mjs data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session --json
data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session/commands.sh
scripts/scan-evidence-privacy.mjs --write-report --json
```

Result:

- Generator and validator syntax passed.
- The generated session contains 80 planned rows: 20 each for front, back, left, and right.
- The generated no-hardware `commands.sh` passed through Gradle test/assembleDebug, draft direction evidence validation, session validation, and session-scoped service audit generation.
- The default evidence privacy scan now includes the controlled direction-trial session target and passed across 31 generated files with zero violations.

## 2026-05-28 KST: Hardware Dashboard Controlled Direction Session

### Decision

Surface controlled direction-trial readiness inside the hardware test status dashboard.

### Reasoning

The 80-row direction session exists, but the test-day dashboard previously showed only phone, glasses, support, Android XR, and promotion lanes. Direction accuracy is one of the highest-risk claims, so the dashboard should expose whether the plan is ready and whether real observed rows are still missing.

### Implemented

- Updated `scripts/summarize-hardware-test-status.mjs`.
- Added `--controlled-direction-session`.
- Added `controlledDirection` JSON fields.
- Added a `Controlled direction trials` lane.
- Added stage record `data/runs/20260528_voice_direction_mvp/105-hardware-dashboard-controlled-direction-session.md`.

### Trial/Error Notes

- A valid controlled session is planning evidence only. The dashboard uses `manual-required` while observed rows are incomplete.
- The current generated session is valid but has `recordedRows=0` and `todoRows=80`.
- `productionDirectionCandidate=false` remains correct until aggregate direction evidence is reviewed.

### Verification

From the repository root:

```bash
node --check scripts/summarize-hardware-test-status.mjs
scripts/summarize-hardware-test-status.mjs --json
scripts/summarize-hardware-test-status.mjs --write-report --json
```

Result:

- Script syntax passed.
- Dashboard JSON includes controlled direction session status.
- The controlled direction lane is `manual-required`, with observed rows incomplete at `0/80`.
- Default no-hardware workflow remains ready; phone/glasses lanes remain blocked without real evidence.

## 2026-05-28 KST: Phone Lane Collection Readiness Split

### Decision

Separate phone evidence collection blockers from post-run evidence and promotion gaps in the hardware dashboard.

### Reasoning

The next real hardware step is `RUN_PHONE=1`, but direction summary and manifest apply output cannot exist until a real `device-evidence.md` has been collected. Treating those missing post-run artifacts as pre-run blockers made the phone lane look unreachable even after a phone could be attached.

### Implemented

- Updated `scripts/summarize-hardware-test-status.mjs`.
- Added `collectionReadiness.phoneCollectionBlockers`.
- Added `collectionReadiness.phoneEvidenceGaps`.
- Added per-lane `evidenceGaps` in the generated dashboard.
- Added `docs/55-phone-lane-collection-readiness.md`.
- Added stage record `data/runs/20260528_voice_direction_mvp/113-phone-lane-collection-readiness.md`.

### Trial/Error Notes

- The current no-phone run still blocks `run-phone-lane`, but the blocker is now only the authorized ADB device count.
- Missing phone `device-evidence.md`, direction summary, and direction manifest apply readiness remain visible as evidence gaps and promotion blockers.
- This is workflow correctness, not phone evidence.

### Verification

From the repository root:

```bash
node --check scripts/summarize-hardware-test-status.mjs
scripts/summarize-hardware-test-status.mjs --write-report --json
scripts/recommend-hardware-next-actions.mjs --write-report --json
scripts/run-hardware-next-action.mjs --action run-phone-lane --write-report --json
```

Result:

- Dashboard generation passed.
- Phone lane `blockers` contains only `authorized ADB devices must be exactly 1, current=0` in the current no-phone state.
- Phone evidence gaps are listed separately under `collectionReadiness.phoneEvidenceGaps`.
- `run-phone-lane` refusal remains correct until exactly one authorized Android phone is attached.

## 2026-05-28 KST: Phone Lane Hardware Runner

### Decision

Add a dedicated runner for the next Android phone evidence lane.

### Reasoning

The existing dashboard, next-action brief, and executor are safe, but the operator still has to run them in the right order. The phone lane is the next real hardware step, so it should have one command that refreshes state first, checks the current phone action, and only then allows `RUN_PHONE=1`.

### Implemented

- `scripts/run-phone-lane-hardware.mjs`.
- `docs/56-phone-lane-hardware-runner.md`.
- Stage record `data/runs/20260528_voice_direction_mvp/114-phone-lane-hardware-runner.md`.
- Generated report folder `data/runs/20260528_voice_direction_mvp/114-phone-lane-hardware-runner`.

### Trial/Error Notes

- The runner exits non-zero when the phone lane is blocked. In the current environment, that is correct because no authorized ADB phone is attached.
- It suppresses raw child command output when executing the operator pack, so the summary remains non-PII.
- A future passing `--execute` run still does not approve phone alpha; generated evidence and strict validators must pass first.

### Verification

```bash
node --check scripts/run-phone-lane-hardware.mjs
scripts/run-phone-lane-hardware.mjs --help
scripts/run-phone-lane-hardware.mjs --write-report --json
```

Result:

- Syntax and help passed.
- The no-phone dry run wrote a report.
- Dashboard and next-action refresh steps passed.
- Execution was refused with only the authorized ADB device-count blocker.

## 2026-05-28 KST: Phone Lane Post-Run Reviewer

### Decision

Add a post-run reviewer for the Android phone evidence lane.

### Reasoning

After `RUN_PHONE=1`, the project needs a single non-PII checkpoint that decides whether the produced phone artifacts are ready for phone-alpha review. The phone lane can produce several files, and promotion should not depend on manually remembering each validator.

### Implemented

- `scripts/review-phone-lane-evidence.mjs`.
- `docs/57-phone-lane-post-run-review.md`.
- Stage record `data/runs/20260528_voice_direction_mvp/115-phone-lane-post-run-review.md`.
- Generated report folder `data/runs/20260528_voice_direction_mvp/115-phone-lane-post-run-review`.

### Trial/Error Notes

- The reviewer does not run hardware commands.
- It exits non-zero while phone alpha is blocked.
- In the current no-phone state, default phone summary validation and workflow promotion pass, but strict phone summary and phone-alpha promotion fail as expected.
- The privacy scan passes with zero violations.

### Verification

```bash
node --check scripts/review-phone-lane-evidence.mjs
scripts/review-phone-lane-evidence.mjs --help
scripts/review-phone-lane-evidence.mjs --write-report --json
```

Result:

- Syntax and help passed.
- Post-run review report was written.
- Review status is `blocked` because no real `device-evidence.md` exists.
- Raw child command output was not persisted.

## 2026-05-28 KST: Direction Validation Target Progress UI

### Decision

Show the controlled direction target inside the app's `방향 검증 기록` panel.

### Reasoning

The generated session and dashboard already know the evidence plan is 20 rows each for front, back, left, and right. During physical testing, the operator also needs that target inside the app where rows are recorded, otherwise they must switch between the app and generated session files to know how many rows remain.

### Implemented

- Added 20-per-direction target math to `DirectionValidationSummary`.
- Added `DirectionValidationSummarizer.CONTROLLED_TRIALS_PER_DIRECTION`.
- Updated `방향 검증 기록` to show target, current progress, total remaining rows, and remaining front/back/left/right rows.
- Added `DirectionValidationSummarizerTest` coverage for incomplete and complete target progress.
- Added stage record `data/runs/20260528_voice_direction_mvp/106-direction-validation-target-progress-ui.md`.

### Trial/Error Notes

- Target progress counts expected-direction rows, not direction accuracy.
- A complete target does not change strict production direction readiness by itself.
- The panel still persists only direction enums, status, confidence, sample metadata, source label, and timestamp.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- Unit tests passed.
- Debug APK assembled.
- Direction validation target math is covered by unit tests.

## 2026-05-28 KST: Direction Target Progress Evidence Snapshot

### Decision

Add controlled direction target-progress fields to the debug non-PII evidence snapshot.

### Reasoning

The UI can now show 20-per-direction target progress, but real phone evidence also needs to capture that progress without private data. The generated `device-evidence.md` should therefore contain the same row-count milestones that the operator sees in the app.

### Implemented

- Updated `EvidenceSnapshotReceiver`.
- Updated `scripts/validate-device-evidence.mjs`.
- Updated `data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md`.
- Updated device-evidence and direction-validation docs.
- Added stage record `data/runs/20260528_voice_direction_mvp/107-direction-target-progress-evidence-snapshot.md`.

### Trial/Error Notes

- The new fields are all counts or booleans.
- `directionControlledTrialTargetComplete` is a row-count milestone, not accuracy proof.
- Strict direction validation remains blocked until real controlled trials, microphone metadata, route proof, latency evidence, and privacy proof exist.

### Verification

From the repository root:

```bash
node --check scripts/validate-device-evidence.mjs
node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json
bash -n scripts/android-device-smoke-test.sh
```

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- Fixture validation passed.
- Smoke script syntax passed.
- Unit tests passed.
- Debug APK assembled.

## 2026-05-28 KST: Direction Evidence Summary Target Progress

### Decision

Propagate controlled direction target-progress fields into the extracted direction summary and summary validator.

### Reasoning

Generated `device-evidence.md` now records 20-per-direction target progress, but the direction summary is what phone-runner and promotion review flows consume. If that summary drops missing-row counts, a downstream reviewer could see direction match rates without seeing that the controlled 80-row target is incomplete.

### Implemented

- Added `targetProgress` to `direction-evidence-summary.json`.
- Mirrored the same object into `aggregateEvaluation.targetProgress`.
- Mirrored the same object into `manifestUpdateTemplate.aggregateEvaluation.targetProgress`.
- Added `thresholds.controlledTargetProgressMet`.
- Updated summary validation to require target-progress numeric consistency and aggregate mirroring.
- Added stage record `data/runs/20260528_voice_direction_mvp/108-direction-evidence-summary-target-progress.md`.

### Trial/Error Notes

- The first validator run caught that `targetProgress` existed at the summary root and manifest template but not inside `aggregateEvaluation`.
- The fixture now reports required total `80`, missing total `76`, and per-direction missing `19` each.
- Strict production-candidate validation still fails as expected because the fixture is not real controlled phone/wearable direction evidence.

### Verification

From the repository root:

```bash
node --check scripts/extract-direction-evidence-summary.mjs
node --check scripts/validate-direction-evidence-summary.mjs
scripts/extract-direction-evidence-summary.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --report-dir data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor --json
scripts/validate-direction-evidence-summary.mjs data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor/direction-evidence-summary.json --json
scripts/validate-direction-evidence-summary.mjs data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor/direction-evidence-summary.json --require-production-direction-candidate --json
```

Result:

- Extractor and validator syntax passed.
- Fixture extraction passed.
- Default summary validation passed.
- Strict production-candidate validation failed as expected with `productionDirectionCandidate=false`.

## 2026-05-28 KST: Direction Evidence Manifest Apply Gate

### Decision

Add a strict apply gate for promoting direction evidence summaries into the canonical direction manifest.

### Reasoning

The extractor writes a manifest update template, but manual copying would make it too easy to promote fixture or incomplete controlled direction evidence. The canonical `direction-evidence/manifest.json` should change only after default summary validation, strict production-candidate summary validation, target-progress completion, privacy checks, and strict direction accuracy validation all pass.

### Implemented

- Added `scripts/apply-direction-evidence-summary.mjs`.
- Added `docs/52-direction-evidence-manifest-apply.md`.
- Added stage record `data/runs/20260528_voice_direction_mvp/109-direction-evidence-manifest-apply.md`.
- Updated service process, extractor docs, service readiness audit, and docs index.

### Trial/Error Notes

- The first execution attempt failed because the new script file did not have executable permission; this was corrected with executable mode.
- Current fixture dry-run passes with `applyReady=false`.
- Current fixture `--write` fails as expected and does not change the canonical manifest.

### Verification

From the repository root:

```bash
node --check scripts/apply-direction-evidence-summary.mjs
scripts/apply-direction-evidence-summary.mjs data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor/direction-evidence-summary.json --json
scripts/apply-direction-evidence-summary.mjs data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor/direction-evidence-summary.json --write --json
node scripts/validate-direction-accuracy-evidence.mjs --json
```

Result:

- Apply script syntax passed.
- Dry-run reported `applyReady=false`.
- Write failed as expected because `productionDirectionCandidate=false` and target progress is incomplete.
- Default direction accuracy validation still passed with the draft canonical manifest.

## 2026-05-28 KST: Phone Runner Direction Apply Dry-Run Integration

### Decision

Run the direction manifest apply gate in dry-run mode from the phone-private-alpha runner after direction summary validation.

### Reasoning

Real phone evidence should produce more than a direction summary. The test-day summary also needs to show whether that summary is safe to promote into the canonical direction manifest. The phone runner should record that readiness without ever writing canonical direction files.

### Implemented

- Updated `scripts/run-phone-private-alpha-evidence.mjs`.
- Updated `scripts/validate-phone-private-alpha-evidence-runner.mjs`.
- Updated `scripts/validate-hardware-test-promotion.mjs`.
- Updated `scripts/summarize-hardware-test-status.mjs`.
- Added stage record `data/runs/20260528_voice_direction_mvp/110-phone-runner-direction-apply-dry-run.md`.

### Trial/Error Notes

- The runner parses apply dry-run JSON in memory and stores only booleans and workspace-relative paths.
- No-device mode records the apply dry-run step as skipped.
- `applyReady=true` is a stricter production-direction signal, not a phone-private-alpha requirement.

### Verification

From the repository root:

```bash
node --check scripts/run-phone-private-alpha-evidence.mjs
node --check scripts/validate-phone-private-alpha-evidence-runner.mjs
scripts/run-phone-private-alpha-evidence.mjs --skip-build --allow-no-device --evidence-dir data/runs/20260528_voice_direction_mvp/88-phone-private-alpha-evidence-runner/android-phone-smoke --report-dir data/runs/20260528_voice_direction_mvp/88-phone-private-alpha-evidence-runner --json
scripts/validate-phone-private-alpha-evidence-runner.mjs data/runs/20260528_voice_direction_mvp/88-phone-private-alpha-evidence-runner/phone-alpha-evidence-summary.json --json
scripts/validate-phone-private-alpha-evidence-runner.mjs data/runs/20260528_voice_direction_mvp/88-phone-private-alpha-evidence-runner/phone-alpha-evidence-summary.json --require-phone-alpha-candidate --json
```

Result:

- Syntax checks passed.
- No-device runner passed in workflow mode with apply dry-run skipped.
- Runner summary validation passed.
- Strict phone-alpha validation failed as expected.

## 2026-05-28 KST: Support Incident Process

### Decision

Define the support, deletion verification, and mistaken-alert incident process now, before external testers exist.

### Reasoning

The app deals with voice identity, direction cues, and potentially distracting outputs. Even as a prototype, it needs a documented way to handle false positives, wrong-speaker alerts, wrong-direction alerts, deletion requests, and unsafe distraction reports without collecting private audio or transcripts.

### Implemented

- `docs/14-support-incident-process.md`.
- `scripts/validate-support-incident-process.mjs`.
- Release readiness update: `support-incident-process` is now manual-required rather than blocked because the process is defined but not rehearsed.

### Trial/Error Notes

- This does not make production ready. It removes the "no process exists" gap, but a real support channel, deletion verification drill, and mistaken-alert drill are still required.

## 2026-05-28 KST: Support Drill Evidence Gate

### Decision

Add a support drill runbook, draft manifest, and validator.

### Reasoning

The previous support process validator proved that the process document existed, but it did not prove operational rehearsal. Production needs a separate gate that fails until a support channel, deletion verification drill, mistaken-alert incident drill, evidence paths, and regenerated readiness audit exist.

### Implemented

- `docs/23-support-drill-evidence.md`.
- `apps/voice-direction-glass/support-drills/manifest.json`.
- `scripts/validate-support-drill-evidence.mjs`.
- Service readiness audit now tracks the support drill evidence document and manifest.
- Release readiness now points `support-incident-process` to the strict support drill validator.

### Trial/Error Notes

- The draft manifest intentionally uses `DRAFT_SUPPORT_DRILLS_NOT_RUN` so default validation can pass while strict validation fails.
- The debug local delete self-check remains useful technical evidence, but it is not a substitute for a user-facing support deletion drill.
- Evidence fields are limited to counts, statuses, booleans, enums, command names, and file paths.

## 2026-05-28 KST: Support Drill Session Automation

### Decision

Add a generator and validator for support drill session folders.

### Reasoning

The support drill manifest defines the final gate, but an operator still needs a concrete folder with commands, checklists, evidence templates, and redaction rules before running the rehearsal. This mirrors the physical-device session pack pattern and keeps support evidence reproducible.

### Implemented

- `scripts/create-support-drill-session.mjs`.
- `scripts/validate-support-drill-session.mjs`.
- `data/runs/20260528_voice_direction_mvp/74-support-drill-session-pack`.
- `data/runs/20260528_voice_direction_mvp/74-support-drill-session-automation.md`.

### Trial/Error Notes

- The generator intentionally does not write into the canonical manifest. Copying evidence into `apps/voice-direction-glass/support-drills/manifest.json` must remain a deliberate post-review action.
- The generated `commands.sh` confirms strict support validation is blocked before evidence, then writes a service readiness audit into the session folder.
- The validator scans generated Markdown/JSON files for private structured fields while allowing the redaction rule file to contain forbidden examples.

## 2026-05-28 KST: Glasses Setup Readiness

### Decision

Add a secret-free Meta DAT and Android XR setup readiness gate.

### Reasoning

The project cannot move to Ray-Ban Display or Android XR proof until local credentials and current projected-source assumptions are explicit. A template and validator make the missing application ID/GitHub token visible without storing or printing secrets.

### Implemented

- `docs/24-glasses-setup-readiness.md`.
- `apps/voice-direction-glass/local.properties.example`.
- `scripts/validate-glasses-setup-readiness.mjs`.
- Updated Android XR first-activity references at this stage; Stage 82 later corrected the canonical path after the official URL redirected again.
- Regenerated glasses preflight evidence.

### Trial/Error Notes

- Default validation passes with no credentials because it validates the template and source references.
- Strict validation fails until `META_WEARABLES_APPLICATION_ID` or `meta_wearables_application_id`, and `GITHUB_TOKEN` or `github_token`, are configured locally.
- The validator checks credential presence only and does not print values.

## 2026-05-28 KST: Glasses Hardware Evidence Gate

### Decision

Add a glasses hardware evidence runbook, draft manifest, and validator.

### Reasoning

Glasses private alpha needs more than credentials or a phone-hosted preview. The project needs a single evidence gate for Ray-Ban Display cue rendering, Ray-Ban Gen 1 Bluetooth fallback behavior, Android XR projected runtime, and haptics/fallback status.

### Implemented

- `docs/25-glasses-hardware-evidence.md`.
- `apps/voice-direction-glass/glasses-evidence/manifest.json`.
- `scripts/validate-glasses-hardware-evidence.mjs`.
- `GlassesIntegrationReadiness` now points physical display/fallback/runtime rows toward the strict hardware evidence gate.
- Service readiness audit now tracks the glasses hardware evidence document, manifest, and validator.

### Trial/Error Notes

- The first validator version treated the phrase "before glasses private alpha" as a completed readiness claim. The prohibited phrase check was tightened to avoid that false positive while still rejecting actual ready claims.
- Default validation passes with draft `not_collected` statuses.
- Strict validation fails until real evidence paths and passed hardware fields exist.

## 2026-05-28 KST: Glasses Hardware Session Automation

### Decision

Add a generator and validator for glasses hardware evidence session folders.

### Reasoning

The strict glasses hardware manifest is the final gate, but hardware testing needs a separate working folder before the canonical manifest is updated. A generated session pack keeps Ray-Ban Display, Ray-Ban Gen 1 fallback, Android XR projected, and haptics/fallback evidence separated from private data and makes the review step explicit.

### Implemented

- `docs/26-glasses-hardware-session-runbook.md`.
- `scripts/create-glasses-hardware-session.mjs`.
- `scripts/validate-glasses-hardware-session.mjs`.
- `data/runs/20260528_voice_direction_mvp/77-glasses-hardware-session-pack`.
- `data/runs/20260528_voice_direction_mvp/77-glasses-hardware-session-automation.md`.

### Trial/Error Notes

- The generated `commands.sh` wraps strict hardware validation so the session can continue while real proof is still missing.
- The generator does not update `apps/voice-direction-glass/glasses-evidence/manifest.json`; copying reviewed aggregate values into the canonical manifest remains a deliberate step.
- The validator checks generated Markdown and JSON files for private structured fields while allowing the redaction rule file to contain forbidden examples.

### Current Result

- Session generation and validation passed.
- The session command wrote glasses preflight evidence and a service-readiness audit into the session folder.
- Strict glasses hardware validation remains blocked until real Ray-Ban Display, Ray-Ban Gen 1 fallback, Android XR projected, and haptics/fallback evidence is collected.

## 2026-05-28 KST: Glasses Hardware Session Apply Automation

### Decision

Add a guarded apply script for moving reviewed session evidence into the canonical glasses hardware manifest.

### Reasoning

The generated hardware session pack now has a `manifest-update-template.json`, but copying it by hand is risky. A safe service path needs dry-run validation, private-field scanning, and rollback behavior before `apps/voice-direction-glass/glasses-evidence/manifest.json` changes.

### Implemented

- `scripts/apply-glasses-hardware-session.mjs`.
- `docs/26-glasses-hardware-session-runbook.md` dry-run/write workflow update.
- `data/runs/20260528_voice_direction_mvp/78-glasses-hardware-session-apply.md`.

### Trial/Error Notes

- The current session pack is still draft. Dry-run passes, but `--write` correctly refuses to update the canonical manifest without `--allow-draft`.
- The apply script reruns the session validator and private structured-field scan instead of trusting the generated files.
- If a ready manifest write fails default or strict hardware validation, the script restores the previous canonical manifest.

### Current Result

- The real hardware promotion path is now generate session, fill reviewed evidence, dry-run apply, write apply, strict hardware validation, then regenerate service audit.

## 2026-05-28 KST: Private Alpha Rehearsal Automation

### Decision

Add a top-level private alpha rehearsal generator and validator.

### Reasoning

The project now has separate evidence packs for phone hardware, support drills, and glasses hardware. Before real testers or a private alpha claim, the operator needs one command path that validates all child sessions, confirms strict gates remain blocked until evidence exists, and writes service-readiness audit output in one folder.

### Implemented

- `docs/27-private-alpha-rehearsal-runbook.md`.
- `scripts/create-private-alpha-rehearsal.mjs`.
- `scripts/validate-private-alpha-rehearsal.mjs`.
- `data/runs/20260528_voice_direction_mvp/79-private-alpha-rehearsal-pack`.
- `data/runs/20260528_voice_direction_mvp/79-private-alpha-rehearsal.md`.

### Trial/Error Notes

- The rehearsal command intentionally continues after expected strict support/glasses failures so it can still produce audit output.
- The physical test session currently validates with warnings because no attached phone has produced `device-evidence.md`.
- The rehearsal validates workflow readiness, not phone private alpha or glasses private alpha readiness.

### Current Result

- Rehearsal generation and validation passed.
- The rehearsal command ran Gradle `test assembleDebug`, validated linked sessions, dry-ran glasses hardware apply, wrote service-readiness audit, and finished with no rehearsal validation warnings.

## 2026-05-28 KST: Android Scaffold Created

### Decision

Create a native Android scaffold even though the local Android build environment is not installed yet.

### Reasoning

The objective is to progress toward a real service, not stop at planning. A scaffold with pure domain boundaries makes the next build step concrete and prevents SDK-specific code from leaking into detection logic.

### Implemented

- `apps/voice-direction-glass` Android project files.
- AGP 9.2.0, Compose BOM 2026.05.00, Kotlin/Compose compiler 2.3.21 setup.
- AGP 9 built-in Kotlin configuration; no `org.jetbrains.kotlin.android` plugin.
- Host `MainActivity`.
- Projected `GlassesProjectedActivity` placeholder.
- Trigger phrase detector.
- Simulated speaker verifier.
- Simulated direction estimator.
- Phone notification and vibration adapters.
- Meta DAT and Android XR display stub adapters.
- Unit-test files for core simulator logic.

### Trial/Error Notes

- Initial Gradle draft used the old `org.jetbrains.kotlin.android` plugin pattern. Official AGP 9 docs say built-in Kotlin is enabled by default and the Kotlin Android plugin should be removed, so the scaffold was adjusted.
- Compose with Kotlin 2.x requires the Compose compiler Gradle plugin. The scaffold applies `org.jetbrains.kotlin.plugin.compose`.
- Direction chips were put in a horizontally scrollable row to avoid cramped mobile overflow.

### Remaining Blockers

- Actual Meta DAT dependencies require a GitHub package token and Meta Wearables app ID.
- Android XR projected APIs require Android XR-capable tooling/device setup.

## 2026-05-28 KST: Local Android Toolchain And Build Verification

### Decision

Install command-line Android build tooling in the user's local profile rather than waiting for full Android Studio installation.

### Implemented

- JDK 17 installed at `/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home`.
- Android command-line tools installed under `/Users/sonjunpyo/Library/Android/sdk`.
- SDK packages installed: `platform-tools`, `platforms;android-36`, `build-tools;36.0.0`.
- Gradle 9.4.1 installed at `/Users/sonjunpyo/.codex/toolchains/gradle-9.4.1`.
- Gradle wrapper generated in `apps/voice-direction-glass`.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test
./gradlew --no-daemon assembleDebug
```

Results:

- `test`: passed.
- `assembleDebug`: passed.

### Notes

- `assembleDebug` emitted a non-fatal message that `libandroidx.graphics.path.so` could not be stripped and was packaged as-is. The build still succeeded.
- Android Studio is still useful for emulator/device workflows and visual debugging, but it is no longer required just to build this scaffold from the command line.

## 2026-05-28 KST: Local Data And Speech Recognition Skeleton

### Decision

Add local profile/event persistence and a one-shot Android speech recognition controller before integrating Meta DAT or Android XR hardware.

### Reasoning

The product must behave like a real service flow: save consented speaker profiles, keep a local event history, delete local data on request, and accept live recognized speech as input. These pieces can be built and tested without waiting for glasses credentials.

### Implemented

- `VoiceDirectionRepository` interface.
- `PreferencesVoiceDirectionRepository` for app-private local storage.
- `InMemoryVoiceDirectionRepository` for unit tests.
- Local codecs for speaker profiles and detection events.
- UI controls for adding a consented speaker label.
- Event history list.
- Local data delete action.
- `AndroidSpeechRecognitionController` using Android `SpeechRecognizer`.
- `음성 인식 1회` button wired into the simulator transcript.

### Privacy Note

The current Android repository uses app-private `SharedPreferences` as a development store. It does not store raw audio, but it is not the final encrypted storage layer promised for production. Before external beta with real voice profiles, replace it with encrypted local storage.

Superseded note: this was true at this stage. The later `Encrypted Local Storage` entry adds AndroidKeyStore AES-GCM encrypted writes, with physical-device migration proof still pending.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test
./gradlew --no-daemon assembleDebug
```

Results:

- `test`: passed.
- `assembleDebug`: passed.

## 2026-05-28 KST: Foreground Listening Service Shell

### Decision

Add an Android foreground service before attempting continuous capture or glasses SDK integration.

### Reasoning

The app's core behavior is an always-ready voice alert. On Android, a microphone session that can continue beyond a single button tap must be explicit to the user and represented by a visible foreground notification. Building the lifecycle shell first keeps the next audio work aligned with OS policy and with the privacy promise in this project.

### Implemented

- `ListeningForegroundService` with `foregroundServiceType="microphone"`.
- Notification channel for the active listening session.
- Persistent foreground notification with app-open and stop controls.
- `ListeningControlReceiver` for the notification stop action.
- `MainActivity` start/stop wiring.
- Runtime gate so the service starts only after `RECORD_AUDIO` is granted.
- Activity resume sync against the process-local service running flag.

### Trial/Error Notes

- The first service notification action used the older integer-icon `Notification.Action.Builder` constructor. It compiled with a deprecation warning, so the action was changed to the `Icon.createWithResource(...)` constructor.
- At this stage the service intentionally did not run repeated `SpeechRecognizer` yet. Android speech recognition callbacks and long-running audio capture needed separate tests because OEM behavior can vary and false background-listening behavior would be a privacy problem.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test
./gradlew --no-daemon assembleDebug
```

Result:

- `test`: passed after adding the service shell.
- `assembleDebug`: passed after adding the service shell.

### Device Check

```bash
/Users/sonjunpyo/Library/Android/sdk/platform-tools/adb devices
```

Result:

- ADB daemon started successfully.
- No Android devices were attached, so on-device install and foreground-notification interaction were not verified in this pass.

## 2026-05-28 KST: Speech Recognition Routed To Detection

### Decision

Connect one-shot Android speech recognition results directly to the existing detection and alert pipeline.

### Reasoning

The prior flow required two user actions: recognize speech, then manually run the simulation. A real assistant-like service should evaluate a recognized phrase immediately. The app still does not store the transcript by default; it uses the recognized text as transient session input and persists only detection metadata.

### Implemented

- Extracted `MainActivity.evaluateAndPersist(...)`.
- Reused the same evaluator for manual simulation and speech recognition callbacks.
- Speech recognition results now update the transient transcript field and immediately create a detection event plus alert deliveries when conditions are met.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test
./gradlew --no-daemon assembleDebug
```

Result:

- `test`: passed after routing speech recognition to detection.
- `assembleDebug`: passed after routing speech recognition to detection.

## 2026-05-28 KST: Service-Owned Recognition Loop

### Decision

Move the active listening prototype into `ListeningForegroundService` instead of leaving recognition only inside `MainActivity`.

### Reasoning

The product goal is automation: when an enrolled person calls the user, the app should react without the user pressing a second button. A foreground service is the right lifecycle owner for that prototype because the OS and the user can see that microphone work is active.

### Implemented

- `VoiceDirectionSettings` for persisted trigger phrase and simulated direction settings.
- Repository support for saving and restoring settings.
- `ListeningForegroundService` now owns `AndroidSpeechRecognitionController`.
- The service starts a repeated listen/evaluate/backoff loop while active.
- The service loads saved speaker profiles and settings, evaluates recognized text, appends detection metadata, emits alert outputs, and updates the foreground notification.
- The manual `음성 인식 1회 테스트` button is disabled while the service is active to avoid competing Android speech recognizers.

### Trial/Error Notes

- This is still a `SpeechRecognizer` prototype, not raw continuous audio capture. It can prove lifecycle, permission, event fusion, and alert routing, but it cannot prove robust all-day listening or direction estimation.
- Direction still comes from the saved simulated direction setting. Real front/back/left/right requires phone/glasses microphone evidence or another sensor path.
- At this stage, the app still stored settings and metadata in app-private plaintext `SharedPreferences`. This was superseded by the later AndroidKeyStore AES-GCM storage stage; physical-device migration proof remains required before external beta.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test
./gradlew --no-daemon assembleDebug
```

Result:

- `test`: passed after adding the service-owned recognition loop and settings storage.
- `assembleDebug`: passed after adding the service-owned recognition loop and settings storage.

### Device Check

```bash
/Users/sonjunpyo/Library/Android/sdk/platform-tools/adb devices
```

Result:

- No Android devices were attached, so the service loop is build-verified but not device-interaction-verified yet.

## 2026-05-28 KST: Latest Glasses Cue Store And Projected Screen

### Decision

Persist the latest actionable direction cue and have the projected glasses Activity render it.

### Reasoning

The product is not only a phone notification app. The user needs the glasses surface to show who called and where the call came from. Full Meta DAT and Android XR hardware integration still requires credentials/devices, but the app can already prove the state handoff from detection to a projected cue screen without storing raw audio or transcripts.

### Implemented

- `GlassesCueSnapshot` for latest actionable cue metadata.
- Codec support for storing/restoring the latest cue.
- Repository support for `latestGlassesCue`.
- Activity-owned and service-owned detection flows save the latest cue when an event is actionable.
- `GlassesProjectedActivity` loads the latest cue on create/resume.
- `GlassesCueScreen` now shows status, speaker label, direction, and confidence.

### Trial/Error Notes

- The cue store intentionally contains only speaker label, direction, confidence, and timestamp. It does not store raw audio or the recognized sentence.
- The projected screen currently refreshes on create/resume. Live updating while already displayed on hardware will need a device-tested transport or lifecycle callback once Android XR/Meta integration is active.
- This does not prove actual glasses display behavior. It proves the app-level data path that the real glasses adapter will consume.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test
./gradlew --no-daemon assembleDebug
```

Result:

- `test`: passed after adding latest glasses cue storage and projected screen wiring.
- `assembleDebug`: passed after adding latest glasses cue storage and projected screen wiring.

### Device Check

```bash
/Users/sonjunpyo/Library/Android/sdk/platform-tools/adb devices
```

Result:

- No Android devices were attached, so projected cue behavior is build-verified but not device-interaction-verified yet.

## 2026-05-28 KST: Glasses Preview Button And Stereo Direction Estimator

### Decision

Add a phone-side projected cue preview and a pure stereo PCM left/right estimator.

### Reasoning

The user needs a way to inspect the glasses-facing cue without waiting for Android XR or Meta display hardware setup. The hardest product claim is direction; a simulator-only direction path is not enough, so the next safe step is a deterministic estimator that works only when real two-channel PCM is available and returns `UNKNOWN` otherwise.

### Implemented

- `글래스 큐 미리보기` button in the host app.
- `MainActivity` opens `GlassesProjectedActivity` directly for local preview.
- `StereoPcmFrame` and `StereoPcmDirectionEstimator`.
- Unit tests for right-heavy stereo, left-heavy stereo, balanced stereo, and mono input.

### Trial/Error Notes

- The estimator intentionally supports rough left/right only. It does not infer front/back.
- The estimator is not wired into the foreground service yet because Android device microphone channel count must be measured first.
- If a phone or glasses API exposes only mono PCM, the estimator returns `UNKNOWN` rather than inventing a direction.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test
./gradlew --no-daemon assembleDebug
```

Result:

- `test`: passed after adding the preview button and stereo PCM estimator.
- `assembleDebug`: passed after adding the preview button and stereo PCM estimator.

### Device Check

```bash
/Users/sonjunpyo/Library/Android/sdk/platform-tools/adb devices
```

Result:

- No Android devices were attached, so the preview button and stereo estimator are build-verified but not device-interaction-verified yet.

## 2026-05-28 KST: AudioRecord Capability Probe

### Decision

Add a microphone channel capability probe before wiring stereo direction estimation to live audio.

### Reasoning

The stereo estimator is only useful if the target Android phone or glasses path exposes two-channel PCM. Guessing this from desktop builds would be misleading. The probe checks Android-reported support for mono/stereo PCM combinations and reports the result in the app without reading or storing raw audio samples.

### Implemented

- `AudioCapabilityProbe` domain interface.
- `AndroidAudioCapabilityProbe` using `AudioRecord.getMinBufferSize(...)`.
- `AudioProbeSummaryFormatter`.
- Host app `마이크 채널 점검` button.
- Unit tests for the summary formatter.

### Trial/Error Notes

- The probe is disabled while the listening service is active to avoid competing microphone workflows.
- The probe result is a capability hint, not proof of usable directional audio. Physical device testing must still confirm actual channel behavior.
- No PCM buffers are read or persisted in this step.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test
./gradlew --no-daemon assembleDebug
```

Result:

- `test`: passed after adding the AudioRecord capability probe.
- `assembleDebug`: passed after adding the AudioRecord capability probe.

### Device Check

```bash
/Users/sonjunpyo/Library/Android/sdk/platform-tools/adb devices
```

Result:

- No Android devices were attached, so the capability probe is build-verified but not device-result-verified yet.

## 2026-05-28 KST: In-Memory Audio Direction Sample

### Decision

Add a short in-memory stereo `AudioRecord` direction sample path, but keep it out of the always-on foreground service until physical device behavior is measured.

### Reasoning

The project needs to move beyond simulator-only direction. A full continuous audio pipeline would be premature without proof that the phone or glasses can provide usable stereo input. A single transient sample gives a practical next test: if Android reports stereo support, read one short buffer, immediately reduce it to left/right confidence, and discard the PCM.

### Implemented

- `AudioDirectionSampler` interface.
- `AndroidStereoDirectionSampler` using `AudioRecord.Builder`.
- `AudioDirectionSampleSummaryFormatter`.
- Host app `방향 샘플 점검` button.
- Unit tests for direction sample summary formatting.

### Trial/Error Notes

- The sampler only tries stereo input. If no stereo combination is reported, it returns `NO_STEREO_INPUT`.
- The sampler does not store PCM, does not append events, and does not update the glasses cue. It is a diagnostic step before service integration.
- The foreground service remains on `SpeechRecognizer` until device evidence supports replacing or augmenting it with `AudioRecord`.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test
./gradlew --no-daemon assembleDebug
```

Result:

- `test`: passed after adding the in-memory direction sample path.
- `assembleDebug`: passed after adding the in-memory direction sample path.

### Device Check

```bash
/Users/sonjunpyo/Library/Android/sdk/platform-tools/adb devices
```

Result:

- No Android devices were attached, so the in-memory direction sample is build-verified but not device-result-verified yet.

## 2026-05-28 KST: Android Device Smoke Test Script

### Decision

Add a repository-level ADB smoke test script for the first physical phone run.

### Reasoning

The app has reached the point where the next useful evidence comes from a physical Android phone. Repeating manual ADB commands is error-prone, especially when testing build/install/activity launch loops. A script makes the device setup repeatable and documents exactly what the first smoke pass does.

### Implemented

- `scripts/android-device-smoke-test.sh`.
- Builds the debug APK unless `--skip-build` is passed.
- Detects attached ADB devices and requires `ANDROID_SERIAL` when multiple devices are connected.
- Installs the APK.
- Grants runtime permissions where the device allows it.
- Launches `MainActivity`.
- Attempts to launch `GlassesProjectedActivity`.
- Prints recent relevant logcat lines.

### Trial/Error Notes

- The first script version used `mapfile`, which is not available in the default macOS bash. It was replaced with a portable `while read` loop.
- With no device attached, the script exits with code `2` and prints the current `adb devices` output. That is the expected local result in this workspace.

### Verification

From the project root:

```bash
scripts/android-device-smoke-test.sh --skip-build
```

Result:

- Script ran and correctly reported that no ADB devices are attached.

## 2026-05-28 KST: Non-PII Device Diagnostics

### Decision

Add a dedicated `VoiceDirectionGlass` logcat tag before the first physical-device smoke test.

### Reasoning

The next meaningful failures will probably happen on device: foreground service lifecycle, Android speech recognition callbacks, microphone channel probing, projected display launch, or notification/vibration output. Without structured logs, the first hardware run would only show UI symptoms. The logs must be useful for debugging while still avoiding transcripts, speaker names, raw audio, and exact voice content.

### Implemented

- `DiagnosticsLogger` wrapper around Android `Log`.
- Main Activity logs for permission results, manual recognition, simulation, local delete, session start/stop, audio probe, direction sample, and evaluation output.
- Foreground service logs for creation, foreground start, stop action, recognition loop start, listen attempts, recognition errors, evaluation output, and service destroy.
- Projected cue Activity logs for launch and latest cue load status.
- ADB smoke script now prints recent `VoiceDirectionGlass` logcat lines.

### Trial/Error Notes

- Logs were kept out of pure domain classes so JVM unit tests do not call Android `Log` stubs.
- Evaluation logs use booleans, enum names, confidence buckets, delivery counts, and cue-save state. They intentionally do not print transcript text or speaker labels.
- The logcat path is now ready, but real signal quality still depends on a physical Android phone.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- `test`: passed after adding diagnostics.
- `assembleDebug`: passed after adding diagnostics.

From the project root:

```bash
bash -n scripts/android-device-smoke-test.sh
scripts/android-device-smoke-test.sh --skip-build
```

Result:

- Script syntax check passed.
- Script still exits with code `2` when no ADB device is attached, which is the expected local state.

## 2026-05-28 KST: Speaker Profile Verification States

### Decision

Add explicit speaker verification and enrollment states before building real voice embedding capture.

### Reasoning

The product goal says a saved person's voice should be recognized. The current prototype can only match a stored label in recognized text, which is useful for UI/service testing but not a real voiceprint. The code now makes that limitation explicit so later on-device speaker embedding work can be added without confusing simulator matches with biometric matches.

### Implemented

- `SpeakerVerificationMode` with `TRANSCRIPT_LABEL_SIMULATION` and `ON_DEVICE_EMBEDDING`.
- `SpeakerEnrollmentStatus` with `LABEL_ONLY`, `SAMPLE_CAPTURE_REQUIRED`, and `MODEL_READY`.
- `SpeakerProfile` now stores verification mode, enrollment status, and sample count.
- Existing locally stored 5-field profiles are still decoded as label-simulation profiles.
- `SimulatedSpeakerVerifier` only matches profiles in `TRANSCRIPT_LABEL_SIMULATION` mode.
- UI profile rows now show verification mode, enrollment status, and sample count.

### Trial/Error Notes

- The profile schema was extended with default fields at the end so existing constructor calls and older stored rows keep working.
- The codec accepts both old and new profile formats. That prevents local development data from being lost during the next app install.
- No real voice embedding is claimed yet. A profile marked `ON_DEVICE_EMBEDDING` will not be matched by the simulator unless a real verifier is added.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test
```

Result:

- `test`: passed after adding profile verification states and verifier guard tests.

## 2026-05-28 KST: Enrollment Sample Quality Capture

### Decision

Add a consented per-profile enrollment sample quality check without storing raw audio.

### Reasoning

The project needs to move from label-only speaker profiles toward real saved voices. The next safe step is not yet a speaker embedding model; it is a capture path that proves the app can request a profile-specific voice sample, reject unusable audio, and persist only the sample count/enrollment state.

### Implemented

- `VoiceEnrollmentSampleAnalyzer` computes RMS, peak, clipping ratio, and duration from in-memory PCM.
- `AndroidVoiceEnrollmentSampler` captures a short mono `AudioRecord` buffer and discards the raw samples after analysis.
- `VoiceEnrollmentSampleSummaryFormatter` shows accepted/retry status.
- Profile UI has an `음성 샘플 품질 수집` action while the foreground listening service is stopped.
- Accepted samples increment `SpeakerProfile.sampleCount`.
- Profile status moves to `SAMPLE_CAPTURE_REQUIRED` for partial samples and `SAMPLES_CAPTURED_MODEL_PENDING` after three accepted samples.
- Non-PII diagnostics log `enrollment_sample_completed` with status, accepted flag, sample count, and quality buckets.

### Trial/Error Notes

- The sample capture does not create or store embeddings yet, so it does not make real speaker verification work by itself.
- The simulator mode remains active for app testing. A separate real verifier still has to consume future `MODEL_READY` profiles.
- The capture button is disabled while the foreground service is active to avoid microphone contention.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test
./gradlew --no-daemon assembleDebug
```

Result:

- `test`: passed after adding enrollment sample analyzer, formatter, Android sampler compile path, UI wiring, and profile update logic.
- `assembleDebug`: passed after adding enrollment sample capture.

From the project root:

```bash
scripts/android-device-smoke-test.sh --skip-build
```

Result:

- Script still exits with code `2` when no ADB device is attached, which is the expected local state.

## 2026-05-28 KST: Embedding Speaker Verifier Contract

### Decision

Change speaker verification input from transcript-only to a structure that can carry a future live voice embedding, and add a tested cosine-similarity verifier for model-ready profiles.

### Reasoning

The service still uses Android `SpeechRecognizer`, so it currently has transcript text but no live voice embedding. If the verifier API stays transcript-only, real speaker verification will require another refactor later. Adding `SpeakerVerificationInput` now lets the simulator and future embedding verifier share one contract.

### Implemented

- `VoiceEmbedding` value object with cosine similarity.
- `VoiceEmbeddingRefCodec` using local prototype embedding reference prefixes.
- `SpeakerVerificationInput` with transcript text and optional live prototype vector input.
- `EmbeddingSpeakerVerifier` that matches only `ON_DEVICE_EMBEDDING` plus `MODEL_READY` profiles.
- Existing `SimulatedSpeakerVerifier` now reads the transcript from `SpeakerVerificationInput`.
- `ListeningSessionEngine` calls the new verifier contract.
- Unit tests for embedding codec, cosine similarity, model-ready matches, missing live embeddings, low similarity, and non-ready profiles.

### Trial/Error Notes

- This does not generate embeddings from accepted enrollment samples yet.
- The default Android engine still uses `SimulatedSpeakerVerifier` because no live embedding extractor exists in the foreground service.
- `EmbeddingSpeakerVerifier` deliberately ignores profiles that have samples but are still `SAMPLES_CAPTURED_MODEL_PENDING`.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test
```

Result:

- `test`: passed after adding embedding verifier contract and tests.

## 2026-05-28 KST: Prototype Enrollment Embedding

### Decision

Generate a prototype embedding reference from accepted enrollment PCM in memory, while keeping raw audio non-persistent.

### Reasoning

The previous enrollment step only counted accepted samples. To move closer to real saved-voice verification, accepted samples should produce a local representation that a verifier can later compare. This implementation is intentionally a simple feature extractor, not a production speaker model. It proves the data path from microphone sample to stored embedding reference without claiming robust speaker identity.

### Implemented

- `PrototypeVoiceEmbeddingExtractor` reduces in-memory PCM to an 11-value feature vector.
- `VoiceEnrollmentSampleResult` now carries an optional `VoiceEmbedding`.
- `AndroidVoiceEnrollmentSampler` creates an embedding only when sample quality passes.
- Accepted samples update a weighted average prototype embedding reference on the profile.
- Raw PCM is still discarded after analysis.
- Enrollment diagnostics now include whether an embedding was created, not the embedding values.

### Trial/Error Notes

- The generated vector is a prototype acoustic feature embedding. It is not a validated speaker recognition model.
- Profiles remain in transcript-simulation mode until a production-grade extractor and live embedding flow are available.
- `EmbeddingSpeakerVerifier` is still not wired into the foreground service by default.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test
```

Result:

- `test`: passed after adding prototype embedding extraction and weighted embedding reference updates.

## 2026-05-28 KST: Prototype Voice Match Diagnostic

### Decision

Add a profile-level diagnostic that compares a fresh live prototype embedding with the stored prototype embedding reference.

### Reasoning

Enrollment now stores a prototype embedding reference, but there was no user-visible way to test whether a new voice sample resembles that saved profile. This diagnostic closes that loop without claiming production identity verification or routing alerts from prototype similarity.

### Implemented

- `PrototypeVoiceMatchChecker` compares a live embedding to a target profile's stored prototype reference.
- `PrototypeVoiceMatchSummaryFormatter` displays match, low-confidence, no-enrolled-embedding, or no-live-embedding outcomes.
- The host app adds a per-profile `프로토타입 음성 매칭 점검` action after at least one accepted sample.
- The action captures a fresh transient mono sample, creates a live prototype embedding, compares locally, and stores no PCM.
- Non-PII diagnostics log `prototype_voice_match_completed` with sample status, match status, similarity bucket, and target-profile presence.

### Trial/Error Notes

- This diagnostic is not wired to notification delivery. It is evidence-gathering for the voice model path.
- Similarity is based on the prototype feature vector, so device/noise behavior must be measured before using it for real alerts.
- The foreground service still uses transcript simulation until live embedding extraction is validated.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test
```

Result:

- `test`: passed after adding prototype match checker, formatter, UI wiring, and diagnostics.

## 2026-05-28 KST: Automatic Device Evidence Report

### Decision

Extend the Android smoke script so a physical-phone run can create a starter `device-evidence.md` report automatically.

### Reasoning

The project is now blocked mostly on physical-device evidence. Manual evidence files are easy to forget or make inconsistent, so the first ADB run should capture the device model, Android version, APK path, permission state, Activity launch state, and recent non-PII `VoiceDirectionGlass` logcat lines in one repeatable report.

### Implemented

- `scripts/android-device-smoke-test.sh --write-evidence`.
- `scripts/android-device-smoke-test.sh --evidence-dir DIR`.
- Generated report path now defaults to `data/runs/<timestamp>_android_phone_smoke/device-evidence.md`; earlier ADB-labeled folder names are rejected by the device evidence validator.
- Report includes setup checks, script-observable functional rows, recent logcat lines, and manual follow-up fields.
- `docs/08-device-test-plan.md` now uses `--write-evidence` as the default physical-phone command.

### Trial/Error Notes

- The report intentionally marks UI observations as manual because ADB cannot prove that a notification was seen, a vibration was felt, or glasses rendered the cue.
- No report is generated when no ADB device is attached because the script exits before it has authoritative device metadata.
- The log section uses the existing `VoiceDirectionGlass` non-PII tag path and does not include transcripts or raw audio.

### Verification

From the project root:

```bash
bash -n scripts/android-device-smoke-test.sh
scripts/android-device-smoke-test.sh --help
scripts/android-device-smoke-test.sh --skip-build --write-evidence
```

Result:

- Script syntax check passed.
- Help text printed the new options.
- With no ADB device attached, the script still exits with code `2`, which is the expected local state.

## 2026-05-28 KST: Release Readiness Checklist

### Decision

Add a code-level and document-level release readiness checklist before adding more hardware-specific features.

### Reasoning

The app now has enough prototype pieces that it is easy to blur the line between build-passing, phone-testable, glasses-testable, beta-ready, and production-ready. A promotion checklist keeps the next work honest: phone private alpha needs manual device evidence, while glasses alpha and production need dependencies that are not available in this workspace yet.

### Implemented

- `ReleaseReadiness.kt` with targets for internal prototype, phone private alpha, glasses private alpha, external beta, and production service.
- `VoiceDirectionReleaseChecklistTest` for uniqueness and target-specific open items.
- `docs/10-release-readiness.md` for the human-readable promotion gates.
- `data/runs/20260528_voice_direction_mvp/19-release-readiness-checklist.md` for this run stage.

### Trial/Error Notes

- `MANUAL_REQUIRED` and `BLOCKED` are intentionally separate. A phone smoke test is manual because a connected phone can close it; Meta DAT package access is blocked because credentials and SDK setup are missing.
- The checklist does not make the app more capable on hardware. It makes the service-development process safer by preventing accidental promotion language.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

From the project root:

```bash
node -e "const fs=require('fs'); for (const f of ['data/canonical/app-candidates/voice-direction-glass.json','data/canonical/voice-direction-glass.product-plan.json','data/canonical/voice-direction-glass.backend-contract.json','data/canonical/voice-direction-glass.qa-report.json','apps/voice-direction-glass/agent-output/implementation.lock.json']) { JSON.parse(fs.readFileSync(f,'utf8')); console.log('valid', f); }"
bash -n scripts/android-device-smoke-test.sh
scripts/android-device-smoke-test.sh --help
scripts/android-device-smoke-test.sh --skip-build --write-evidence
```

Result:

- Gradle `test assembleDebug`: passed.

## 2026-05-28 KST: Service Bridge UI Snapshot

### Decision

Persist the latest service automation bridge result and expose it in the host app UI.

### Reasoning

The new automation path was visible in logcat and generated evidence templates, but a tester holding the phone still had to infer the result from logs. A compact local snapshot makes the service-side voice/direction bridge easier to inspect without storing sensitive content.

### Implemented

- `ServiceAutomationBridgeSnapshot`.
- Local storage codec and repository support.
- Service persistence after prototype voice and direction bridge evaluation.
- `ListeningSessionState.latestServiceAutomationBridge`.
- `서비스 자동화 진단` Compose card.
- Activity restore/resume sync for the latest snapshot.

### Trial/Error Notes

- The snapshot intentionally excludes transcripts, speaker names, raw PCM, and embedding values.
- The UI card is a physical-test aid, not a production analytics dashboard.
- The card updates on Activity restore/resume, which is enough for the current device test workflow.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- `test assembleDebug`: passed after adding service bridge snapshot storage and UI.
- Canonical JSON validation passed.
- Smoke script syntax/help passed.
- With no ADB device attached, `--skip-build --write-evidence` exits with code `2`, which is still the expected local state.
- Canonical JSON parse check: passed.
- Smoke script syntax and help: passed.
- With no ADB device attached, `--skip-build --write-evidence` exits with code `2`, which is the expected local state.

## 2026-05-28 KST: Service Prototype Voice Match Bridge

### Decision

Connect stored prototype voice embeddings to the foreground service path after trigger phrase detection.

### Reasoning

The app already allowed a user to collect accepted enrollment samples and run a manual prototype voice match diagnostic. That proved the local data path, but it did not yet serve the automation goal. The next practical step is to let the service use those saved prototype embeddings during controlled tests while keeping the limitations explicit.

### Implemented

- `PrototypeVoiceSessionEngine` for phrase-gated live prototype embedding matching.
- `AndroidListeningEngineFactory.createPrototypeVoiceSessionEngine(...)`.
- Foreground service logic that captures a short transient mono sample only after the trigger phrase is recognized and a stored profile has a prototype embedding reference.
- Service persistence/alert routing for prototype voice matches.
- Non-PII diagnostics for service prototype sample status and match status.
- Unit tests for matched alert, low-confidence rejection, no-trigger rejection, and sample-capture gating.

### Trial/Error Notes

- The sample is intentionally trigger-gated to reduce unnecessary microphone reads and avoid turning every recognition result into a voice-identification attempt.
- This is a bridge, not a final architecture. The sample happens after `SpeechRecognizer` returns, so real devices must prove whether that window is useful.
- Direction remains simulator-backed in this service path until real microphone/channel evidence is recorded.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- `test assembleDebug`: passed after adding the service prototype voice match bridge.
- Canonical JSON validation passed.
- Smoke script syntax/help passed.
- With no ADB device attached, `--skip-build --write-evidence` exits with code `2`, which is still the expected local state.

## 2026-05-28 KST: Device Evidence Bridge Checklist

### Decision

Update the physical-device evidence workflow for the new service-side prototype voice and direction bridges.

### Reasoning

The implementation now has more than one path to verify: manual diagnostic buttons, service-side prototype voice matching, and service-side direction sampling/fallback. The generated evidence report must ask for the right proof, otherwise a phone test could pass the old checklist while missing the actual automation path.

### Implemented

- Added generated report rows for service-side prototype voice matching.
- Added generated report rows for service-side direction bridge behavior.
- Added `Service Automation Bridge Checks` to the script-generated Markdown.
- Added direction bridge notes with `audioDirectionStatus` and `usedAudioDirection`.
- Updated the reusable evidence template and device test plan.

### Trial/Error Notes

- Script-observable checks remain separate from human checks. ADB can launch and collect logs, but it cannot prove vibration feel, UI text, or what the tester heard.
- `UNKNOWN` is preserved as an acceptable result when hardware evidence is weak.
- The evidence format still excludes transcripts, speaker names, raw PCM, and embedding values.

### Verification

From the project root:

```bash
bash -n scripts/android-device-smoke-test.sh
scripts/android-device-smoke-test.sh --help
scripts/android-device-smoke-test.sh --skip-build --write-evidence
node -e "const fs=require('fs'); for (const f of ['data/canonical/app-candidates/voice-direction-glass.json','data/canonical/voice-direction-glass.product-plan.json','data/canonical/voice-direction-glass.backend-contract.json','data/canonical/voice-direction-glass.qa-report.json','apps/voice-direction-glass/agent-output/implementation.lock.json']) { JSON.parse(fs.readFileSync(f,'utf8')); console.log('valid', f); }"
```

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- Script syntax/help passed.
- With no ADB device attached, `--skip-build --write-evidence` exits with code `2`, which is still the expected local state.
- Canonical JSON validation passed.
- Gradle `test assembleDebug`: passed.

## 2026-05-28 KST: Service Direction Sample Bridge

### Decision

Add a short service-side stereo direction sample after prototype voice matching.

### Reasoning

The user's core service idea needs two decisions: saved voice identity and caller direction. The service could already use stored prototype voice embeddings, but direction still came from the saved simulator setting. A short stereo sample bridge is the next useful step because it lets real phone hardware influence the alert direction when available, while keeping fallback behavior explicit.

### Implemented

- `ServiceDirectionResolver` samples `AudioDirectionSampler` and falls back to `SimulatedDirectionEstimator` only when stereo sampling is unavailable or fails.
- `ListeningForegroundService` now owns `AndroidStereoDirectionSampler(AndroidAudioCapabilityProbe(...))`.
- `PrototypeVoiceSessionEngine` can accept a pre-resolved `DirectionEstimate`.
- Service diagnostics include audio direction status and whether the sampled estimate was used.
- Unit tests cover sampled direction, sampled `UNKNOWN`, unavailable stereo fallback, and service-resolved estimate injection.

### Trial/Error Notes

- If stereo sampling succeeds and returns `UNKNOWN`, the service keeps `UNKNOWN`. Falling back to the saved direction after a real unknown result would create false precision.
- This is still a short post-recognition bridge. It is useful for physical-device evidence, not a replacement for a measured continuous audio/model pipeline.
- Front/back remains unproven.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- `test assembleDebug`: passed after adding the service direction sample bridge.
- Canonical JSON validation passed.
- Smoke script syntax/help passed.
- With no ADB device attached, `--skip-build --write-evidence` exits with code `2`, which is still the expected local state.

## 2026-05-28 KST: Glasses Integration Readiness

### Decision

Add a code-level glasses integration readiness model and show it in the host app.

### Reasoning

The app has phone notifications, vibration, projected cue storage, and stub adapters, but the user's target includes Meta Ray-Ban Display and Android XR. The app should make it obvious that real glasses output is still gated by credentials, real adapters, hardware proof, wearable direction evidence, and haptics proof.

### Implemented

- `GlassesIntegrationReadiness`.
- `GlassesIntegrationReadinessTest`.
- `글래스 연동 준비` Compose card.
- Docs updated for Meta DAT and Android XR gates.

### Trial/Error Notes

- No Meta DAT or Android XR SDK dependency was added in this step because the project still lacks credentials and runtime proof. Keeping the stub build stable is better than adding unconfigured preview dependencies.
- Phone-hosted projected preview is marked as present but does not close Android XR runtime proof.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- `test assembleDebug`: passed after adding glasses integration readiness model and UI.
- Canonical JSON validation passed.
- Smoke script syntax/help passed.
- With no ADB device attached, `--skip-build --write-evidence` exits with code `2`, which is still the expected local state.

## 2026-05-28 KST: Encrypted Local Storage

### Decision

Add an Android Keystore-backed encrypted string store and route repository writes through it.

### Reasoning

The project no longer stores raw audio, but profiles, trigger phrases, prototype embedding refs, latest cue snapshots, and detection metadata are still sensitive. External beta should not depend on plaintext preference values. This is one of the few blocked release gates that can move forward without Meta DAT credentials or Android XR hardware.

### Implemented

- `AndroidKeyStoreStringCipher` for AES-GCM encryption/decryption through Android Keystore.
- `SecureStoragePayloadCodec` with versioned encrypted envelopes.
- `SecurePreferencesStringStore` with legacy plaintext read fallback only when no encrypted value exists.
- `PreferencesVoiceDirectionRepository` now writes profiles, settings, events, latest glasses cue, and latest service bridge snapshot through the secure store.
- Unit tests for secure payload parsing and secure preference migration behavior.
- Release readiness now treats encrypted storage as manual-required instead of blocked.

### Trial/Error Notes

- The first secure preference test used a malformed value that still decoded as Base64 in the fake cipher. I changed the test fixture to an invalid envelope so it actually exercises the decrypt-failure path.
- Direct Android Keystore runtime behavior is not proven by JVM tests. A physical phone restart/migration check is still required before external beta.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- `test assembleDebug`: passed after adding encrypted storage code and tests.
- Canonical JSON validation passed.
- Smoke script syntax/help passed.
- With no ADB device attached, `--skip-build --write-evidence` exits with code `2`, which is still the expected local state.

## 2026-05-28 KST: Device Storage Self-Check Automation

### Decision

Add a debug-only broadcast receiver so the ADB smoke script can prove encrypted storage behavior with non-PII sentinel data.

### Reasoning

The encrypted storage code moved a release gate forward, but the next proof needs an Android device because Android Keystore is runtime/device-backed. The smoke script should collect as much evidence as possible automatically while still avoiding real profile values.

### Implemented

- `StorageSelfCheckReceiver` under `src/debug`.
- Debug manifest action `com.voicedirection.glass.qa.DEBUG_STORAGE_SELF_CHECK`.
- Smoke script phases: `reset`, `write`, `force-stop`, `verify`.
- Generated evidence report section for encrypted storage checks.
- Device test plan and evidence template updated.

### Trial/Error Notes

- The self-check writes only a fixed sentinel to a separate debug preference file. It does not touch enrolled speakers or trigger phrases.
- Real app data restart remains a manual evidence row because the script should not synthesize user profile data in the production store.
- The receiver is debug-only to avoid creating a production broadcast surface.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- `test assembleDebug`: passed after adding the debug receiver and script integration.
- Canonical JSON validation passed.
- Smoke script syntax/help passed.
- With no ADB device attached, `--skip-build --write-evidence` exits with code `2`, which is still the expected local state.

## 2026-05-28 KST: Tester Consent Copy

### Decision

Add tester-facing consent and limitation copy to the app.

### Reasoning

The engineering privacy rules existed, but a tester should not need to read repository docs to understand what the prototype stores, what it does not store, and what it cannot guarantee. This moves the external beta privacy-copy gate from missing copy to review-required copy.

### Implemented

- `TesterConsentCopy`.
- `VoiceDirectionTesterConsent.copy`.
- Unit tests for storage/non-storage/prototype-limit/deletion coverage.
- `테스터 동의와 한계` card in the host app.
- Release readiness evidence updated for `privacy-consent-copy`.

### Trial/Error Notes

- I did not mark the external beta copy gate as passed because real tester/policy/legal review still has to happen.
- The copy explicitly avoids claiming production identity matching, front/back direction, or glasses haptics readiness.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- `test assembleDebug`: passed after adding tester consent copy and host app card.
- Canonical JSON validation passed.
- Smoke script syntax/help passed.
- With no ADB device attached, `--skip-build --write-evidence` exits with code `2`, which is still the expected local state.

## 2026-05-28 KST: Detection Feedback

### Decision

Add per-event feedback for accurate, false-positive, wrong-direction, and wrong-speaker outcomes.

### Reasoning

The app needs a 30-minute false-positive run before phone private alpha, but raw event history alone cannot distinguish true alerts from wrong alerts. A local feedback path gives testers a non-PII way to label outcomes and summarize false positives without storing transcripts or audio.

### Implemented

- `DetectionFeedback`, `DetectionFeedbackType`, and `DetectionFeedbackSummarizer`.
- Repository and local codec support for feedback records.
- Encrypted feedback persistence in `PreferencesVoiceDirectionRepository`.
- Event-history feedback buttons and summary counts.
- Device evidence checklist rows for feedback and false-positive summaries.

### Trial/Error Notes

- Feedback is kept separate from `DetectionEvent` so original detection metadata remains stable.
- One current feedback label per event is enough for the first controlled tests. If we later need audit history, this can become append-only.
- This does not prove the false-positive gate by itself; it makes the real room test measurable.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- `test assembleDebug`: passed after adding detection feedback model, storage, and UI wiring.
- Canonical JSON validation passed.
- Smoke script syntax/help passed.
- With no ADB device attached, `--skip-build --write-evidence` exits with code `2`, which is still the expected local state.

## 2026-05-28 KST: False-Positive Run Session

### Decision

Add an app-managed 30-minute false-positive test session.

### Reasoning

Feedback labels are useful only if the test interval is clear. A run session lets the app store start/end/target state and compute feedback counts within the test window. That makes the phone private alpha false-positive gate easier to prove with a generated device report.

### Implemented

- `FalsePositiveRun`.
- `FalsePositiveRunSummarizer`.
- Repository and local codec support for run state.
- Encrypted persistence for the run state.
- `30분 오탐 테스트` card with start/stop/reset, elapsed time, target status, pass/fail verdict, false-positive rate per hour, and windowed feedback summary.
- Device evidence checklist updates.

### Trial/Error Notes

- The summary uses feedback timestamps rather than detection timestamps, so testers should mark feedback during or immediately after the run.
- The app still needs a physical 30-minute room test; this stage only makes the test bounded and easier to record.
- The first verdict rule is deliberately strict: unfinished runs show `시간 부족`, reached runs fail on any false-positive, wrong-speaker, or wrong-direction feedback, and a clean reached run passes.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- `test assembleDebug`: passed after adding false-positive run session model, storage, codec, UI wiring, verdict, and false-positive-rate logic.
- Canonical JSON validation passed.
- Smoke script syntax/help passed.
- With no ADB device attached, `--skip-build --write-evidence` exits with code `2`, which is still the expected local state.

## 2026-05-28 KST: Glasses Integration Preflight

### Decision

Add an automated preflight report before replacing Meta DAT or Android XR stub adapters.

### Reasoning

The app already has a projected cue screen and readiness gates, but the next integration steps depend on credentials, SDK artifacts, and attached hardware. A preflight script makes the missing pieces explicit and prevents treating stub adapters as real glasses support.

### Implemented

- `scripts/glasses-integration-preflight.sh`.
- Evidence report generation under `data/runs/`.
- `docs/11-glasses-integration-preflight.md`.
- Deterministic current evidence at `data/runs/20260528_voice_direction_mvp/30-glasses-preflight-evidence/glasses-preflight.md`.

### Trial/Error Notes

- The script exits successfully while reporting `blocked`; that is intentional because its job is evidence capture.
- Credential values are never printed. The script only checks whether expected environment variables or ignored `local.properties` keys exist.
- Current local status remains blocked because Meta DAT credentials/dependencies, Jetpack Projected dependencies, and attached hardware are missing.

### Verification

From the repository root:

```bash
scripts/glasses-integration-preflight.sh --help
scripts/glasses-integration-preflight.sh
scripts/glasses-integration-preflight.sh --write-evidence --evidence-dir data/runs/20260528_voice_direction_mvp/30-glasses-preflight-evidence
```

Result:

- Help path passed.
- Report generation passed.
- Evidence generation passed.

## 2026-05-28 KST: Bluetooth Audio Route Probe

### Decision

Add a Bluetooth communication-device route diagnostic to the host app.

### Reasoning

Android XR projected context is the better path for multiple microphones, but Bluetooth HFP is the immediate fallback route for audio/display glasses and Ray-Ban Gen 1-style testing. Before routing live recognition through glasses, the app should show whether Android can even see a Bluetooth SCO or BLE headset input.

### Implemented

- `BluetoothAudioRouteProbe` and Android implementation.
- Summary formatter and unit tests.
- `MODIFY_AUDIO_SETTINGS` permission.
- `블루투스 마이크 경로 점검` button in the microphone card.
- Device evidence and preflight checklist updates.

### Trial/Error Notes

- The probe does not force-route audio yet. Route switching should wait for a physical test session.
- Bluetooth HFP is single-microphone, so it is not enough for reliable direction-of-arrival.
- The diagnostic logs route availability and device count only; no audio or transcripts are stored.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test
```

Result:

- `test`: passed after adding the Bluetooth audio route probe.

## 2026-05-28 KST: Bluetooth Route Selection

### Decision

Add guarded route selection and clear controls for Bluetooth communication input candidates.

### Reasoning

The probe tells us whether Ray-Ban or Android XR glasses appear as Bluetooth input. The next physical test also needs a controlled way to select that input, run one short diagnostic, and then clear the route without altering the always-on service path.

### Implemented

- `selectBluetoothInput()` and `clearSelectedRoute()` on the Bluetooth route interface.
- Android implementation using communication-device APIs.
- `블루투스 입력 선택` and `통신 경로 해제` buttons.
- Selection/clear summary formatter tests.
- Device evidence rows and log event requirements.

### Trial/Error Notes

- The app still does not force route selection during the foreground service. Manual route selection is safer until physical behavior is known.
- Selection is status-only evidence: routed, cleared, no input, unsupported, permission required, or failed.
- HFP route selection cannot prove direction; it only proves reachable audio input.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test
```

Result:

- `test`: passed after adding Bluetooth route selection.

## 2026-05-28 KST: TTS Direction Cue Fallback

### Decision

Add Android TextToSpeech as a direction-only fallback alert output.

### Reasoning

Meta DAT display output and Android XR projected display still need device/runtime proof, and glasses-side haptics is not confirmed. Android XR's TTS guidance makes Android `TextToSpeech` a practical built-in fallback for displayless or display-off glasses states, so the app should be able to speak a short direction cue without waiting for real glasses adapters.

### Implemented

- `TtsCueTextFormatter` for short Korean direction-only text.
- `AndroidTextToSpeechAlertAdapter` for one-shot TTS output on actionable alerts.
- Alert router wiring through `AndroidListeningEngineFactory`.
- Unit tests proving direction text is produced and speaker labels are not spoken.
- Device evidence rows for manual audible TTS confirmation.

### Trial/Error Notes

- The cue intentionally avoids stored speaker labels to reduce bystander/privacy leakage.
- TTS output does not prove direction accuracy; it only proves alert delivery.
- Physical phone and Bluetooth glasses route testing is still required because unit tests cannot hear audio output.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test
```

Result:

- `test`: passed after adding the TTS direction cue fallback.

## 2026-05-28 KST: Direction Validation Trials

### Decision

Add a structured expected-vs-observed direction evidence recorder inside the app.

### Reasoning

The project cannot honestly claim front/back/left/right behavior from a one-off sample. Physical tests need repeatable counts for expected direction, observed direction, confidence, mismatch, and unknown/unusable outcomes. Storing only metadata keeps the privacy boundary intact while making later Ray-Ban and Android XR tests more useful.

### Implemented

- `DirectionValidationTrial`, `DirectionValidationStatus`, and `DirectionValidationSummarizer`.
- Encrypted repository persistence for validation trials.
- `방향 검증 기록` UI in the microphone card.
- Manual evidence rows and log requirement for `direction_validation_trial_recorded`.
- Unit tests for summary, codec round-trip, and repository clear behavior.

### Trial/Error Notes

- The recorder can store front/back attempts, but front/back remains unproven until stronger hardware evidence exists.
- `UNKNOWN` is preserved as evidence. It should not be replaced with a guessed direction.
- The app stores counts and status metadata, not audio, transcripts, or speaker labels.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon testDebugUnitTest
```

Result:

- `testDebugUnitTest`: passed after adding direction validation trials.

## 2026-05-28 KST: Repository Self-Check Automation

### Decision

Add a debug-only repository self-check broadcast for direction validation trial persistence.

### Reasoning

The encrypted storage self-check proves the low-level secure string wrapper, but the new direction validation feature also needs a repository-level proof path. A debug receiver can write a non-PII trial through the same repository code, force-stop the app from the smoke script, and verify that encrypted repository storage still decodes it.

### Implemented

- `RepositorySelfCheckReceiver` in the debug source set.
- Debug action `com.voicedirection.glass.qa.DEBUG_REPOSITORY_SELF_CHECK`.
- Isolated repository constructor parameters for debug-only preferences/cipher usage.
- Smoke script reset/write/verify phases for repository self-check.
- Evidence rows for repository direction-validation self-check.

### Trial/Error Notes

- The receiver uses separate debug preferences so it does not clear or modify real app data.
- The proof is about persistence and encryption, not direction accuracy.
- Physical device execution is still required before this becomes release evidence.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon testDebugUnitTest
```

From the repository root:

```bash
bash -n scripts/android-device-smoke-test.sh
scripts/android-device-smoke-test.sh --help
```

Result:

- `testDebugUnitTest`: passed.
- Smoke script syntax/help path passed.

## 2026-05-28 KST: Non-PII Evidence Snapshot

### Decision

Add a debug-only evidence snapshot broadcast for physical phone smoke reports.

### Reasoning

The device report needs a quick way to show that repository-backed flows are creating state without copying private content into logs. A receiver can summarize real app repository state as counts, statuses, booleans, and enums, while keeping speaker labels, transcripts, embeddings, raw audio, and encrypted preference payloads out of the evidence file.

### Implemented

- `EvidenceSnapshotReceiver` in the debug source set.
- Debug action `com.voicedirection.glass.qa.DEBUG_EVIDENCE_SNAPSHOT`.
- Smoke script collection step and `device-evidence.md` section.
- Release-readiness gate for physical-phone evidence snapshot proof.

### Trial/Error Notes

- This receiver reads the real app repository, unlike the isolated repository self-check. That is why the output must remain strictly non-PII.
- Snapshot success proves evidence collection and privacy shape, not voice recognition accuracy or direction accuracy.
- ADB device execution is still required before this becomes release evidence.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

From the repository root:

```bash
bash -n scripts/android-device-smoke-test.sh
scripts/android-device-smoke-test.sh --help
```

Result:

- `test assembleDebug`: passed.

## 2026-05-28 KST: Debug Direction Sample Broadcast

### Decision

Add a debug-only ADB broadcast that runs one direction sample before the generated phone smoke evidence snapshot.

### Reasoning

Before hardware sessions, the tester had to tap `방향 샘플 점검` manually if they wanted the evidence snapshot to contain fresh microphone metadata. The smoke script should exercise this path automatically so the first physical phone report captures direction status, evidence level, sample counts, and microphone metadata counts without storing PCM.

### Implemented

- `DirectionSampleTestReceiver` in the debug source set.
- `DEBUG_DIRECTION_SAMPLE_TEST` manifest wiring.
- Smoke script execution after the debug alert output test and before the non-PII evidence snapshot.
- Device evidence validator requirements for the setup row, functional row, broadcast output block, and microphone metadata markers.
- Fixture, device template, phone checklist, and release-readiness docs updated to require the new automation.

### Trial/Error Notes

- `NO_STEREO_INPUT` remains a script-pass result because it proves the current route limitation without private audio data.
- `NO_PERMISSION` and unexpected receiver errors remain failures.
- This is still a smoke/evidence-shape test, not controlled direction accuracy proof.

### Verification

From the repository root:

```bash
node --check scripts/validate-device-evidence.mjs
bash -n scripts/android-device-smoke-test.sh
node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json
```

Result:

- Static validator checks passed.
- Fixture validation returned `"ok": true`.
- Physical session validator passed with expected missing-hardware warnings.
- `test assembleDebug` passed.
- `test assembleDebug bundleRelease` passed.
- No-device smoke test still exits with expected code `2` because no ADB device is attached.

## 2026-05-28 KST: Phone Vibration Pattern Evidence

### Decision

Expose direction-specific phone vibration pattern metadata in debug alert-output evidence.

### Reasoning

The target product wants directional cues, including vibration-style feedback. Real glasses-side per-side haptics is not proven, but phone vibration is already implemented. The next useful step is to make the phone fallback explicit: each direction has a distinct short pattern, and ADB evidence records the non-PII pattern shape so testers can compare what the app intended with what they felt.

### Implemented

- `VibrationPatternSummary` with direction, timing signature, pulse count, total duration, and `phoneSideSpecific=false`.
- Shared summary use in phone vibration adapters.
- Unit tests proving every direction maps to a distinct short one-shot fallback pattern.
- Debug alert-output broadcast fields for vibration pattern metadata.
- Device evidence validator and fixture markers for the new output.

### Trial/Error Notes

- Phone vibration can encode direction by pattern, but it cannot vibrate only the right or left side.
- `phoneVibrationSideSpecific=false` prevents the evidence report from implying glasses haptics proof.
- Real glasses haptics remains blocked until official API support and device evidence exist.

### Verification

From the repository root:

```bash
node --check scripts/validate-device-evidence.mjs
node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json
```

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- Validator syntax passed.
- Fixture validation returned `"ok": true`.
- Physical session validator passed with expected missing-hardware warnings.
- `test assembleDebug` passed.
- `test assembleDebug bundleRelease` passed.
- No-device smoke test still exits with expected code `2` because no ADB device is attached.

## 2026-05-28 KST: Glasses Cue Payload Contract

### Decision

Create a shared glasses cue payload that separates display content from non-PII evidence summaries.

### Reasoning

Real Meta DAT and Android XR adapters will eventually need to show a trusted speaker label and direction on the glasses. The previous stub adapters echoed `cue.title` and `cue.body` in delivery messages, which is a poor pattern for future log/evidence paths because those strings can contain a speaker label. The display contract should allow the UI to show the useful cue while keeping adapter messages safe for generated evidence.

### Implemented

- `GlassesCuePayload` with display title, direction label, confidence label, and internal `speakerLabelPresent`.
- `evidenceSummary` with direction, confidence percent, and label-present only.
- Meta DAT and Android XR stub adapters now emit non-PII delivery messages.
- `GlassesProjectedActivity` and `GlassesCueScreen` render through the shared payload.
- Unit tests verify the display label can exist while evidence summaries and stub messages omit the actual speaker label.

### Trial/Error Notes

- This does not implement the real DAT or Android XR SDK path.
- It prevents the stub adapter contract from becoming a future privacy leak.
- Real display proof is still manual/blocked until credentials, runtime proof, and hardware evidence exist.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- Fixture evidence validation returned `"ok": true`.
- Smoke script syntax passed.
- `test assembleDebug` passed.
- `test assembleDebug bundleRelease` passed.
- Release artifact validation passed default mode with `uploadReady=false`.

## 2026-05-28 KST: Debug Glasses Cue Seed Evidence

### Decision

Add a debug-only broadcast that seeds the latest glasses cue before the ADB smoke script launches the projected cue Activity.

### Reasoning

The projected screen reads only `latestGlassesCue`. Before this change, the smoke script could launch `GlassesProjectedActivity` before any actionable cue had been saved, so a physical test report could show a successful Activity launch while the projected screen still had no cue to render. Seeding a generic non-PII cue makes the handoff evidence deterministic without pretending that Meta DAT or Android XR hardware rendering is already solved.

### Implemented

- `GlassesCueSeedReceiver` for `DEBUG_GLASSES_CUE_SEED`.
- Smoke script execution before `GlassesProjectedActivity` launch.
- Device evidence rows, broadcast output block, validator checks, and release checklist item for the seed path.
- `GlassesCuePayload.evidenceSummary` now uses `labelPresent` instead of a speaker-specific key in generated evidence strings.

### Trial/Error Notes

- The seeded cue deliberately uses an empty speaker label; real display UI can still show a label after actual consented detection.
- This proves app-state persistence and projected preview setup only. Real glasses display, per-side haptics, and XR runtime proof remain blocked/manual.

### Verification

- Device evidence fixture validation returned `"ok": true`.
- Physical session validator passed with expected missing-hardware warnings.
- Node syntax checks passed for the updated physical-session and device-evidence validators.
- APK manifest contains `GlassesCueSeedReceiver` and `DEBUG_GLASSES_CUE_SEED`.
- `test assembleDebug` passed.
- `test assembleDebug bundleRelease` passed.
- Release artifact validation passed default mode with `uploadReady=false`.
- No-device smoke test still exits with expected code `2` because no ADB device is attached.

## 2026-05-28 KST: Debug Bluetooth Route Evidence Broadcast

### Decision

Add a debug-only Bluetooth route evidence broadcast and non-PII route evidence formatter.

### Reasoning

Ray-Ban Gen 1 and some Android XR glasses may only be usable as Bluetooth audio routes before a real display/projected SDK integration is ready. The host app already had manual route probe and select/clear controls, but generated device evidence still depended on a human copying UI state. ADB should be able to capture route support, candidate counts, and selected type automatically without exposing product names, owner names, MAC addresses, or audio.

### Implemented

- `BluetoothAudioRouteEvidenceFormatter` with probe and select/clear evidence strings.
- `BluetoothRouteEvidenceReceiver` for `DEBUG_BLUETOOTH_ROUTE_EVIDENCE`.
- Smoke script execution in probe mode before repository snapshot collection.
- Device evidence setup row, functional row, output block, validator markers, and fixture coverage.
- Physical phone checklist marker requiring route evidence to avoid product names and MAC addresses.

### Trial/Error Notes

- Probe evidence can pass even when no Bluetooth input candidate exists; the value is in proving whether the route is visible.
- HFP/BLE route visibility does not prove direction accuracy because these routes are typically single-microphone.
- Select/clear support exists in the debug receiver through `mode=select` and `mode=clear`, but the smoke script uses probe mode only to avoid changing routes unexpectedly.

### Verification

- Device evidence fixture validation returned `"ok": true`.
- Physical session validator passed with expected missing-hardware warnings.
- Node and shell syntax checks passed for the updated scripts.
- APK manifest contains `BluetoothRouteEvidenceReceiver` and `DEBUG_BLUETOOTH_ROUTE_EVIDENCE`.
- `test assembleDebug` passed.
- `test assembleDebug bundleRelease` passed.
- Release artifact validation passed default mode with `uploadReady=false`.
- No-device smoke test still exits with expected code `2` because no ADB device is attached.

## 2026-05-28 KST: Debug Local Delete Self-Check

### Decision

Add a debug-only local delete self-check that uses a separate encrypted debug store.

### Reasoning

External beta and production need a credible deletion workflow. The app already has a user-facing local data delete action, but physical smoke evidence should be able to prove the repository clear behavior without deleting a tester's real app state during automated runs. A separate debug store lets the smoke script seed representative non-PII records, call `clearAll()`, and verify counts/snapshots are cleared.

### Implemented

- `LocalDataDeleteSelfCheckReceiver` for `DEBUG_LOCAL_DELETE_SELF_CHECK`.
- Smoke script execution after Bluetooth route evidence and before repository snapshot collection.
- Device evidence setup row, functional row, output block, validator markers, and fixture coverage.
- Release checklist item for physical-device script-pass evidence.
- Physical session checklist markers clarifying that the self-check must not delete tester app data.

### Trial/Error Notes

- This proves repository deletion semantics on a separate debug store, not the real UI tap path.
- The real UI delete button remains a manual physical-device row because it intentionally deletes tester app data.
- Evidence contains counts and booleans only; it does not include labels, transcripts, embeddings, encrypted payloads, or alert text.

### Verification

- Device evidence fixture validation returned `"ok": true`.
- Physical session validator passed with expected missing-hardware warnings.
- Node and shell syntax checks passed for the updated scripts.
- APK manifest contains `LocalDataDeleteSelfCheckReceiver` and `DEBUG_LOCAL_DELETE_SELF_CHECK`.
- `test assembleDebug` passed.
- `test assembleDebug bundleRelease` passed.
- Release artifact validation passed default mode with `uploadReady=false`.
- No-device smoke test still exits with expected code `2` because no ADB device is attached.

## 2026-05-28 KST: Policy Clearance Matrix

### Decision

Create a policy clearance matrix for Meta Wearables, Android XR, Google Play, microphone recording, speaker-profile handling, and wearable distribution before attempting any external submission.

### Reasoning

The app can keep progressing as a local prototype, but public service readiness depends on external platform terms, store review, voice/recording disclosure, production model review, and hardware evidence. A matrix makes those dependencies explicit without pretending they are cleared.

### Implemented

- `docs/15-policy-clearance-matrix.md`.
- `scripts/validate-policy-clearance-matrix.mjs`.
- `ReleaseReadiness.kt` now points `store-and-sdk-policy-clearance` to the matrix while keeping that item `BLOCKED`.
- Service readiness audit now treats the matrix as a required local artifact.

### Trial/Error Notes

- Meta Wearables developer docs and terms require login, so the matrix records a required logged-in review instead of inventing unavailable details.
- Google Play and Android policy documents are public enough to define engineering guardrails, but they are not a substitute for actual Play Console review.
- The matrix validates tracking quality only; it does not change production readiness.

### Verification

From the repository root:

```bash
node --check scripts/validate-policy-clearance-matrix.mjs
node scripts/validate-policy-clearance-matrix.mjs --json
```

Result:

- Policy clearance matrix validation passed.

## 2026-05-28 KST: Microphone Disclosure Gate

### Decision

Add an in-app microphone disclosure gate before any microphone-backed action requests OS permission or starts audio flow.

### Reasoning

The app needs microphone access for foreground listening, enrollment sampling, prototype matching, direction sampling, and Bluetooth route checks. Google Play policy work requires a user-facing explanation in the actual flow, not only a privacy document. A gate in the app makes the behavior testable before physical phone alpha.

### Implemented

- `VoiceDirectionTesterConsent.microphoneDisclosure`.
- `microphoneDisclosureAccepted` and `microphoneDisclosureVersion` in session state and persisted settings.
- `마이크 사용 안내` card near the top of the host app.
- Microphone-backed actions now require accepted disclosure before requesting OS permission or starting audio flow.
- Non-PII evidence snapshot now exports disclosure accepted/version fields.
- Device evidence template, smoke report, physical session checklist, and validator fixture now include microphone disclosure evidence.

### Trial/Error Notes

- This is an engineering disclosure gate, not legal approval.
- It does not replace Android runtime permission or Google Play review.
- It stores only boolean acceptance and the disclosure version, not a signed consent document.

### Verification

From the repository root and app folder:

```bash
node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json
bash -n scripts/android-device-smoke-test.sh
cd apps/voice-direction-glass
./gradlew --no-daemon test assembleDebug
```

Result:

- Device evidence fixture validation passed.
- Smoke script syntax passed.
- `test assembleDebug`: passed.

## 2026-05-28 KST: Privacy Policy And Data Safety Draft

### Decision

Create a repository draft for the privacy policy and Google Play Data Safety worksheet, plus a validator that keeps it in draft-only status.

### Reasoning

The app is local-first, but it still accesses microphone data and stores speaker labels/prototype voice references locally. Google Play review will need privacy policy text, Data Safety answers, sensitive-permission disclosure consistency, SDK data-practice review, and a public privacy URL before any external release. Capturing the draft now prevents the project from treating policy work as an afterthought.

### Implemented

- `docs/16-privacy-policy-data-safety-draft.md`.
- `scripts/validate-privacy-data-safety-draft.mjs`.
- Service readiness audit now treats the draft as a required local artifact.
- Release readiness evidence now links tester consent, microphone disclosure, and the privacy/Data Safety draft while keeping external beta and production gates open.

### Trial/Error Notes

- A local-only build can still need a privacy policy because microphone access and local voice-profile storage are sensitive to users and reviewers.
- The current Data Safety draft says no off-device collection/sharing only for the current build; any backend, analytics, crash SDK, cloud model, support upload, Meta DAT export, or Android XR SDK data path can change that answer.
- The draft is not a public privacy policy URL and not Play Console or legal approval.

### Verification

From the repository root:

```bash
node --check scripts/validate-privacy-data-safety-draft.mjs
node scripts/validate-privacy-data-safety-draft.mjs --json
```

Result:

- Privacy/Data Safety draft validation passed.

## 2026-05-28 KST: Store Review Submission Package Draft

### Decision

Create a draft Play/wearable review submission package and validator before any external release-track work.

### Reasoning

The codebase already has release gates and privacy drafts, but a real service process also needs safe store listing copy, app-content declarations, reviewer instructions, screenshot/media requirements, and submission blockers. The package keeps public claims narrower than the product vision until phone, glasses, SDK, and policy evidence exists.

### Implemented

- `docs/17-store-review-submission-package-draft.md`.
- `scripts/validate-store-review-submission-package.mjs`.
- Service readiness audit now treats the store review package as a required local artifact.
- Release readiness evidence now points to the store package while keeping `store-and-sdk-policy-clearance` blocked.

### Trial/Error Notes

- Store listing text can accidentally claim unsupported behavior, so the validator checks Play field lengths and limitation text.
- Reviewer instructions must not ask for real speaker audio, transcripts, or private names.
- Meta Ray-Ban Display, Android XR, glasses haptics, front/back direction, and production speaker identity stay out of public claims until real evidence exists.

### Verification

From the repository root:

```bash
node --check scripts/validate-store-review-submission-package.mjs
node scripts/validate-store-review-submission-package.mjs --json
```

Result:

- Store review submission package validation passed.

## 2026-05-28 KST: Release Artifact And Signing Readiness

### Decision

Add a release AAB/signing runbook, Gradle signing hook, and validator for upload-ready checks.

### Reasoning

A real service path needs more than debug APKs. Play release requires an app bundle signed with an upload key and Play App Signing context, while private signing material must stay out of the repository. The project needs to prove it can generate a structural release bundle now, but keep upload-ready status blocked until real signing inputs exist.

### Implemented

- `docs/18-release-artifact-signing-runbook.md`.
- `scripts/validate-release-artifact-readiness.mjs`.
- Conditional Gradle release signing config using `VOICE_DIRECTION_RELEASE_STORE_FILE`, `VOICE_DIRECTION_RELEASE_STORE_PASSWORD`, `VOICE_DIRECTION_RELEASE_KEY_ALIAS`, and `VOICE_DIRECTION_RELEASE_KEY_PASSWORD`.
- Default validator mode that passes with `uploadReady=false`.
- Strict validator mode that fails until signing environment variables and a signed release AAB exist.

### Trial/Error Notes

- `bundleRelease` can create a structural `app-release.aab`, but the current `signingReport` release config is `null`.
- The validator originally treated a zero `jarsigner` exit status as signed even when output said `jar is unsigned`; it now rejects unsigned output text.
- The script now finds the bundled JDK jarsigner when `JAVA_HOME` is not set.

### Verification

From the repository root and app folder:

```bash
node --check scripts/validate-release-artifact-readiness.mjs
node scripts/validate-release-artifact-readiness.mjs --json
node scripts/validate-release-artifact-readiness.mjs --require-upload-ready --json
cd apps/voice-direction-glass
./gradlew --no-daemon bundleRelease
./gradlew --no-daemon signingReport
```

Result:

- Default release artifact validation passed with `uploadReady=false`.
- Strict upload-ready validation failed as expected because upload-key env vars and a signed release AAB are missing.
- `bundleRelease` passed and produced a structural release AAB.
- `signingReport` showed release config `null`, so the current AAB is not Play upload-ready.

## 2026-05-28 KST: Debug Alert Output Broadcast

### Decision

Add a debug-only ADB broadcast that runs the same generic alert-output cue as the UI `알림 출력 점검` path.

### Reasoning

The UI button is useful for a tester, but the generated phone evidence report needs at least one automated proof that the alert router can emit through the currently enabled channel set and persist channel/status counts before the evidence snapshot is collected.

### Implemented

- `AlertOutputTestReceiver` in the debug source set.
- `DEBUG_ALERT_OUTPUT_TEST` manifest action.
- Smoke script execution before `DEBUG_EVIDENCE_SNAPSHOT`.
- Evidence report rows for the debug alert output test.
- Validator checks for script-pass, `latestDeliverySource=TEST_CUE`, and private-field rejection in the alert output block.

### Trial/Error Notes

- This deliberately uses a generic direction cue, not a real detection event.
- The output proves routing and bookkeeping only. Physical TTS audibility, vibration feel, and display visibility still require manual observation.
- The broadcast stores no alert body, transcript, speaker label, raw audio, PCM, or embedding values.

### Verification

- Gradle `test assembleDebug`: passed.

## 2026-05-28 KST: Release Notes And Versioning Readiness

### Decision

Add an internal-testing release-note/versioning document, locale release-note draft, and validator.

### Reasoning

The service path now has privacy, store submission, and release signing drafts, but a Play internal-testing upload also needs release notes that match the exact Gradle version and avoid unsupported production claims. This is small compared with code, but it becomes tester/reviewer-facing once uploaded.

### Implemented

- `docs/19-release-notes-versioning.md`.
- `apps/voice-direction-glass/release-notes/internal-testing-v0.1.0.md`.
- `scripts/validate-release-notes-versioning.mjs`.
- Service readiness audit artifact tracking for the new release-note/versioning draft.
- Release readiness/store/release runbooks now reference the release-note gate.

### Trial/Error Notes

- The validator initially treated unsupported-claim examples inside the guardrail document as positive claims. The check now validates the actual locale release-note blocks instead.
- Current `versionCode=1` is valid for the first internal prototype upload only; it must be incremented before any later Play upload attempt.
- The release note intentionally describes a prototype and repeats limitations rather than marketing Meta DAT, Android XR, glasses haptics, front/back direction, or production speaker identification.

### Verification

From the repository root:

```bash
node --check scripts/validate-release-notes-versioning.mjs
node scripts/validate-release-notes-versioning.mjs --json
```

Result:

- Release-note/versioning validation passed for `versionName=0.1.0`, `versionCode=1`, `en-US` length 350, and `ko-KR` length 212.

## 2026-05-28 KST: Play Screenshot And Media Runbook

### Decision

Add a Play screenshot/media runbook, draft asset manifest, ADB capture script, and validator with default and strict modes.

### Reasoning

The store submission package listed screenshots as a blocker, but there was no concrete way to capture or validate them. Preview assets can also overclaim product behavior, especially for Meta DAT, Android XR, front/back direction, and haptics. The project needs a non-private capture path and a validator that refuses to treat missing assets as submit-ready.

### Implemented

- `docs/20-play-screenshot-media-runbook.md`.
- `apps/voice-direction-glass/store-assets/play-preview/manifest.json`.
- `scripts/capture-play-screenshots.sh`.
- `scripts/validate-play-screenshot-package.mjs`.
- Service readiness audit artifact tracking for the screenshot/media runbook.
- Store, release, README, final report, and wiki references to strict screenshot validation.

### Trial/Error Notes

- The first manifest validator was too broad and rejected guardrail phrases such as “No production Meta DAT” as if they were positive claims. The prohibited positive-claim check now avoids those negated guardrail examples.
- Default mode validates the plan and manifest only; strict mode fails until real screenshots and a feature graphic exist.
- Android XR screenshots are separated behind `--require-xr-assets` because uploading XR media should wait for actual XR runtime proof.

### Verification

From the repository root:

```bash
node --check scripts/validate-play-screenshot-package.mjs
bash -n scripts/capture-play-screenshots.sh
node scripts/validate-play-screenshot-package.mjs --json
node scripts/validate-play-screenshot-package.mjs --require-assets --json
```

Result:

- Default screenshot/media validation passed.
- Strict asset validation failed as expected because phone screenshots and feature graphic files are missing.

## 2026-05-28 KST: Production Speaker Model Evaluation

### Decision

Add a production speaker model evaluation runbook, draft manifest, and validator.

### Reasoning

The app already proves a local prototype voice-matching path, but external beta needs a real on-device model with calibrated thresholds, aggregate trial results, latency evidence, and replay/synthetic risk handling. Without this gate, the project could accidentally treat prototype embedding similarity as production speaker identity.

### Implemented

- `docs/21-production-speaker-model-evaluation.md`.
- `apps/voice-direction-glass/model-assets/speaker-verifier/manifest.json`.
- `scripts/validate-production-speaker-model-readiness.mjs`.
- Release readiness now points `production-speaker-model` to the model evaluation gate while keeping it `BLOCKED`.
- Service readiness audit now tracks the production speaker model evaluation artifact.

### Trial/Error Notes

- NIST SRE-style evaluation is about protocol and measured operating points, not a magic threshold.
- ASVspoof-style risk means replay/synthetic voice handling cannot be deferred if public copy suggests trusted voice identity.
- The validator intentionally has a strict mode that fails until the model file, SHA-256, input contract, false accept/false reject metrics, anti-spoofing decision, and latency evidence exist.

### Verification

From the repository root:

```bash
node --check scripts/validate-production-speaker-model-readiness.mjs
node scripts/validate-production-speaker-model-readiness.mjs --json
node scripts/validate-production-speaker-model-readiness.mjs --require-model-ready --json
```

Result:

- Default production speaker model validation passed.
- Strict model-ready validation failed as expected because no model candidate or aggregate evaluation evidence exists.
- Validator fixture with debug alert output block and `latestDeliverySource=TEST_CUE`: passed.
- APK manifest contains `AlertOutputTestReceiver` and `DEBUG_ALERT_OUTPUT_TEST`.
- Smoke script no-device path still exits with expected code `2` when no ADB device is attached.

## 2026-05-28 KST: Release Gate Debug Alert Output

### Decision

Add the debug alert output device evidence requirement to the app-side release readiness checklist.

### Reasoning

The human release document already required debug alert output script-pass and a following `latestDeliverySource=TEST_CUE` snapshot before phone private alpha. The in-app checklist now mirrors that gate so the code model, unit tests, and docs do not drift.

### Implemented

- `debug-alert-output-device-qa` release checklist item.
- Phone private alpha manual gate count updated from nine to ten items.
- Release readiness test coverage for the new item.

## 2026-05-28 KST: Release Readiness Snapshot Automation

### Decision

Add a debug-only release readiness snapshot broadcast and include it in generated device evidence reports.

### Reasoning

The user asked for the real service process to be documented and automated. A physical evidence report should therefore show not only what the device did, but also which release gates remain open after that run.

### Implemented

- `ReleaseReadinessSnapshotReceiver`.
- `DEBUG_RELEASE_READINESS_SNAPSHOT` manifest action.
- Smoke script collection and `Release Readiness Snapshot` report section.
- Validator requirements for release target counts, `phoneReady=false`, and `debug-alert-output-device-qa`.

### Trial/Error Notes

- This snapshot intentionally keeps phone private alpha open until manual hardware evidence is filled.
- It records checklist ids and counts only; no private app data is included.

## 2026-05-28 KST: Glasses Readiness Snapshot Automation

### Decision

Add a debug-only glasses readiness snapshot broadcast and include it in generated device evidence reports.

### Reasoning

The product goal explicitly targets Meta Ray-Ban Display/Gen 1 and Android XR glasses. The phone smoke report should therefore keep the glasses-alpha blockers visible even when the current run only uses a phone.

### Implemented

- `GlassesReadinessSnapshotReceiver`.
- `DEBUG_GLASSES_READINESS_SNAPSHOT` manifest action.
- Smoke script collection and `Glasses Readiness Snapshot` report section.
- Validator requirements for Meta DAT and Android XR open checklist ids.

### Trial/Error Notes

- This does not replace `scripts/glasses-integration-preflight.sh`.
- It records platform gate ids and counts only; no Bluetooth owner/device names or voice data are included.

## 2026-05-28 KST: Audio Direction Evidence Classifier

### Decision

Add an evidence classifier to the direction sample summary.

### Reasoning

The app needs to help test direction, but it must not imply proven front/back behavior from a simple stereo energy sample. A classification label makes the safe interpretation visible every time a sample is run.

### Implemented

- `AudioDirectionEvidenceClassifier`.
- `판정` and `지침` lines in direction sample summaries.
- Unit tests for left/right usable, low confidence, front/back unproven, and unavailable cases.

### Trial/Error Notes

- This is a product-safety guard, not a better estimator.
- `UNKNOWN` is still useful evidence and should be recorded instead of replaced with a guessed direction.

## 2026-05-28 KST: Latest Audio Direction Evidence Snapshot

### Decision

Persist the latest direction sample evidence metadata and expose it through the debug evidence snapshot.

### Reasoning

The UI now labels whether a direction sample is usable, weak, unproven, or unavailable. Physical-device evidence should capture the same label so the test report can show what the latest direction sample actually meant.

### Implemented

- `AudioDirectionSampleSnapshot`.
- Repository save/load path and secure storage codec.
- Save path after direction sample and direction validation trial actions.
- Non-PII evidence snapshot fields for status, evidence level, direction enum, confidence bucket, sample rate, and sample count.

### Trial/Error Notes

- PCM is still not stored.
- The smoke script does not automatically run the microphone direction sample; a tester must run the sample before evidence collection if they want these fields populated with real hardware data.

## 2026-05-28 KST: Alert Channel Preferences

### Decision

Persist enabled alert channels and filter alert output adapters before emitting a cue.

### Reasoning

The service goal includes phone notification, vibration, TTS, Meta display, and Android XR display paths. Before physical glasses testing, the app needs a user-visible control to isolate channels so a device run can prove which output path caused an observed alert.

### Implemented

- `enabledAlertChannels` in `VoiceDirectionSettings` and `ListeningSessionState`.
- Local storage codec for alert channel sets.
- `AlertRouter` filtering by enabled channel set.
- Host-app UI card for toggling each alert channel.
- Foreground service and manual simulation both read the persisted channel settings.

### Trial/Error Notes

- The foreground service notification remains visible even if the phone notification alert channel is disabled; that notification is the Android microphone transparency surface, not the directional alert output.
- The UI prevents disabling every alert channel to avoid a silent detection configuration.
- Meta Display and Android XR Display remain stub output paths until real SDK/runtime integration is unlocked.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- `test assembleDebug`: passed.

## 2026-05-28 KST: Alert Channel Evidence Snapshot

### Decision

Add enabled alert channel state to the non-PII device evidence snapshot.

### Reasoning

The app can now filter alert outputs by channel, but a physical smoke report needs to prove the configuration used during the run. Delivery rows alone are ambiguous because a missing channel can mean either disabled-by-user or failed-to-deliver.

### Implemented

- `EvidenceSnapshotReceiver` now reports enabled alert channel count and booleans for phone notification, phone vibration, TTS, Meta Display, and Android XR Display.
- `scripts/validate-device-evidence.mjs` requires those fields in generated reports.
- The validator fixture includes the new fields.

### Trial/Error Notes

- The snapshot still contains only counts, booleans, statuses, and enum values.
- Physical-device observation is still needed to prove that a channel was actually felt, heard, or seen.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

From the repository root:

```bash
node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json
```

Result:

- `test assembleDebug`: passed.
- Fixture validation returned `"ok": true`.

## 2026-05-28 KST: Alert Output Test

### Decision

Add a direct alert-output diagnostic button that does not depend on voice recognition.

### Reasoning

The first physical phone and glasses sessions need to prove output routing before debugging speech recognition, speaker matching, or direction estimation. A direct button can isolate notification, vibration, TTS, Meta Display, and Android XR Display paths using the same alert router and enabled-channel settings.

### Implemented

- `AndroidListeningEngineFactory.createAlertRouter` is exposed for diagnostics.
- `MainActivity.runAlertOutputTest` emits a generic direction cue through the enabled alert channels.
- `알림 출력 점검` button is added to the alert-channel card.
- The diagnostic persists the latest alert delivery snapshot with an `alert-test-*` id and does not append a detection event.
- Non-PII log event `alert_output_test_completed` records direction enum and delivery counts only.

### Trial/Error Notes

- This does not prove voice detection, speaker verification, or direction accuracy.
- It is useful because vibration/TTS/display output can be validated before live detection is reliable.
- The Meta and Android XR rows still use stub adapters until real SDK/runtime integration is available.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- `test assembleDebug`: passed.

## 2026-05-28 KST: Alert Delivery Source Snapshot

### Decision

Add a source enum for the latest alert delivery snapshot.

### Reasoning

After adding `알림 출력 점검`, the latest delivery snapshot can come from either a direct test cue or a real detection event. The physical evidence report should distinguish those paths without exposing internal event ids or private alert text.

### Implemented

- `latestDeliverySource` in the debug non-PII snapshot.
- `TEST_CUE` for `alert-test-*` delivery snapshots.
- `DETECTION_EVENT` for `event-*` delivery snapshots.
- Validator requirement for `latestDeliverySource=`.
- Fixture coverage with `latestDeliverySource=TEST_CUE`.

### Trial/Error Notes

- This proves evidence provenance, not alert correctness.
- The source enum helps keep direct output tests separate from detection accuracy tests.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

From the repository root:

```bash
node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json
```

Result:

- `test assembleDebug`: passed.
- Fixture validation returned `"ok": true`.

## 2026-05-28 KST: Alert Delivery Source UI

### Decision

Show the latest alert delivery source in the host app.

### Reasoning

The evidence snapshot can distinguish `TEST_CUE` from `DETECTION_EVENT`, but testers also need to see that distinction in the app after switching between `알림 출력 점검` and real detection flows.

### Implemented

- `AlertDeliverySource` model derived from delivery snapshot id prefix.
- `EvidenceSnapshotReceiver` now uses the shared source model.
- `알림 출력` card shows `최근 출처`.
- Unit coverage for `TEST_CUE`, `DETECTION_EVENT`, and `UNKNOWN` source derivation.

### Trial/Error Notes

- The UI does not show internal ids.
- This is evidence provenance only; it does not prove physical alert output or detection accuracy.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- `test assembleDebug`: passed.

## 2026-05-28 KST: Speaker Consent Gate

### Decision

Require an explicit consent checkbox before saving a speaker profile.

### Reasoning

The project goal depends on saved voices from trusted people. A consent version stored on a profile is useful, but the app also needs to prevent accidental profile creation before the tester confirms that the person has agreed to local enrollment.

### Implemented

- `newSpeakerConsentConfirmed` in `ListeningSessionState`.
- Consent checkbox in the saved-speaker UI.
- Button disablement and MainActivity guard before profile creation.
- New profiles now store `VoiceDirectionTesterConsent.copy.version`.

### Trial/Error Notes

- This is a prototype gate, not external legal approval.
- It stores consent version metadata, not a signed consent document.
- Existing seeded profiles keep their legacy consent version.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- `test assembleDebug`: passed.

## 2026-05-28 KST: Alert Delivery Persistence

### Decision

Persist the latest alert delivery result as non-PII metadata.

### Reasoning

The app emitted phone notification, vibration, TTS, and glasses adapter delivery results, but those results lived only in transient UI state or logcat. Service-owned detections need a restart-safe evidence trail showing which output channels were attempted and whether each adapter reported delivery, without storing alert text.

### Implemented

- `AlertDeliverySnapshot` and `AlertDeliveryRecord`.
- Repository persistence for the latest delivery snapshot.
- Manual simulation and foreground service persistence hooks.
- Delivery status display in the host app.
- Debug evidence snapshot fields for channel delivery status.
- Codec/repository tests and validator fixture updates.

### Trial/Error Notes

- Persisted delivery status is not the same as a physical human-observed vibration or spoken cue.
- Alert messages are intentionally excluded from persistence because they can include speaker labels.
- Meta Display and Android XR delivery statuses will remain failed/missing until real adapters replace the stubs.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- `test assembleDebug`: passed.
- Smoke script syntax/help path passed.

## 2026-05-28 KST: Device Evidence Validator

### Decision

Add a validator for generated physical-device evidence reports.

### Reasoning

The smoke script can create `device-evidence.md`, but a generated file is not useful if it silently misses required script rows or includes private structured fields. The next practical automation step is to make the report fail fast when encrypted storage, repository self-check, non-PII snapshot, or privacy-shape checks are missing.

### Implemented

- `scripts/validate-device-evidence.mjs`.
- Automatic validator call from `scripts/android-device-smoke-test.sh --write-evidence` when Node.js is available.
- Required checks for setup script-pass rows and `Main Activity launches`.
- Snapshot key checks for counts, statuses, booleans, and enums.
- Rejection of transcript, speaker name, phrase, embedding, encrypted payload, PCM, and raw audio field patterns in snapshot/log code blocks.
- A fixture report labeled as validator-only evidence.

### Trial/Error Notes

- The validator does not prove speech recognition quality, speaker verification quality, direction accuracy, or glasses rendering.
- The fixture is intentionally not a physical-device result.
- This keeps phone alpha evidence stricter without requiring hardware to test the validator itself.

### Verification

From the repository root:

```bash
node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md
node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json
scripts/android-device-smoke-test.sh --help
```

Result:

- Fixture validation passed.
- JSON output returned `"ok": true`.
- Smoke script help path passed.

## 2026-05-28 KST: Detection Latency Metadata

### Decision

Store detection processing latency as privacy-safe event metadata.

### Reasoning

The product plan includes a fast-alert success metric, but the app previously had no evidence field for latency. Recording a millisecond duration on `DetectionEvent` gives the phone and glasses test plan a measurable signal without storing raw audio or transcript content.

### Implemented

- `processingLatencyMillis` on `DetectionEvent`.
- Backward-compatible event codec decoding for legacy rows without latency.
- `DetectionLatencySummarizer`.
- Latency recording in simulation and prototype voice session engines.
- Latency rows in the host UI and non-PII evidence snapshot.
- Validator fixture updated with latency fields.

### Trial/Error Notes

- The value is app-side processing latency after the recognition callback enters the engine, not complete acoustic wake-to-alert latency.
- Physical-device tests still need to measure real service behavior and output timing.
- Legacy records remain valid and simply show latency as unrecorded.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- `test assembleDebug`: passed.

## 2026-05-28 KST: Private Alpha Hardware Runner

### Decision

Add a single hardware-day runner for private-alpha rehearsal instead of relying on memory to run the phone, support, glasses, and rehearsal packs in the right order.

### Reasoning

The project now has separate evidence packs for physical phone tests, support drills, glasses hardware proof, and the top-level private-alpha rehearsal. The missing step was an operator-safe runner that can be used on hardware day, records only non-PII command status, and still exits non-zero when a selected hardware command fails.

### Implemented

- `scripts/run-private-alpha-hardware-rehearsal.mjs`.
- `docs/28-private-alpha-hardware-runner.md`.
- `data/runs/20260528_voice_direction_mvp/80-private-alpha-hardware-runner/hardware-run-summary.md`.
- `data/runs/20260528_voice_direction_mvp/80-private-alpha-hardware-runner/hardware-run-summary.json`.
- Runner-scoped service-readiness audit output.

### Trial/Error Notes

- A passing default runner does not mean phone or glasses private alpha is ready; it proves orchestration only.
- Raw child command output is intentionally not persisted because hardware sessions can expose private local state in terminal logs.
- `--run-phone` should fail on machines without an attached ADB phone, but the runner still writes its summary before exiting non-zero.

### Verification

From the repository root:

```bash
node --check scripts/run-private-alpha-hardware-rehearsal.mjs
node scripts/run-private-alpha-hardware-rehearsal.mjs --json
```

Result:

- Script syntax passed.
- Default runner passed.
- Physical/support/glasses session validators passed.
- Glasses hardware session apply dry-run passed.
- Top-level private-alpha rehearsal commands passed.
- Runner service-readiness audit was written.

## 2026-05-28 KST: Private Alpha Hardware Readiness Preflight

### Decision

Add a preflight before using private-alpha hardware runner flags.

### Reasoning

The hardware runner can execute phone, support, and glasses session commands, but choosing the wrong flags on a no-device machine creates avoidable failures and unclear evidence. The project needs an operator-safe readiness check that says whether `--run-phone` is reasonable, whether Meta credentials are present, and whether session packs still validate, while keeping device identifiers private.

### Implemented

- `scripts/check-private-alpha-hardware-readiness.mjs`.
- `docs/29-private-alpha-hardware-readiness-preflight.md`.
- `data/runs/20260528_voice_direction_mvp/81-private-alpha-hardware-readiness/hardware-readiness-preflight.md`.
- `data/runs/20260528_voice_direction_mvp/81-private-alpha-hardware-readiness/hardware-readiness-preflight.json`.

### Trial/Error Notes

- The preflight intentionally stores ADB state counts only, not serial numbers.
- A passing preflight means local orchestration is inspectable; it does not mean physical phone or glasses evidence exists.
- With zero authorized ADB devices, the recommended runner command remains the default no-hardware runner.
- Meta credentials are checked as booleans only; values must never appear in reports.

### Verification

From the repository root:

```bash
node --check scripts/check-private-alpha-hardware-readiness.mjs
node scripts/check-private-alpha-hardware-readiness.mjs --write-report --json
```

Result:

- Script syntax passed.
- Preflight report was written.
- JDK, Android SDK, debug APK, and ADB executable are present.
- Authorized ADB device count is 0.
- Session pack validators passed.
- Meta application id and GitHub Packages token are not configured.

## 2026-05-28 KST: Platform Source Freshness

### Decision

Add a network-backed freshness check for the official Meta Wearables and Android XR source URLs.

### Reasoning

The Android XR first-activity page changed canonical shape again: the old `ai-glasses/first-activity` alias redirects to `glasses/first-activity`. Because this project depends on current platform docs, source URL drift needs a machine-checkable report rather than a manual note hidden in research docs.

### Implemented

- `scripts/check-platform-source-freshness.mjs`.
- `docs/30-platform-source-freshness.md`.
- `data/runs/20260528_voice_direction_mvp/82-platform-source-freshness/platform-source-freshness.md`.
- `data/runs/20260528_voice_direction_mvp/82-platform-source-freshness/platform-source-freshness.json`.
- Updated Android XR first-activity references to `https://developer.android.com/develop/xr/jetpack-xr-sdk/glasses/first-activity`.
- Updated Meta DAT lifecycle references to `https://wearables.developer.meta.com/docs/develop/dat/lifecycle-events/`.

### Trial/Error Notes

- Android Developers can append locale query parameters to final URLs. The freshness script normalizes `hl` parameters when checking canonical final URLs.
- The deprecated Android XR alias is still checked, but it is treated as an alias only; local source files must use the canonical `glasses/first-activity` URL.
- The report stores status, redirect, final URL, title, and Last updated date only. It does not store source page bodies.

### Verification

From the repository root:

```bash
node --check scripts/check-platform-source-freshness.mjs
node scripts/check-platform-source-freshness.mjs --write-report --json
scripts/glasses-integration-preflight.sh --write-evidence --evidence-dir data/runs/20260528_voice_direction_mvp/30-glasses-preflight-evidence
```

Result:

- Script syntax passed.
- Source freshness report passed.
- Android XR pages returned HTTP 200 and Last updated `2026-05-19 UTC`.
- Deprecated `ai-glasses/first-activity` redirects to canonical `glasses/first-activity`.
- Latest glasses preflight evidence regenerated with canonical URLs.

## 2026-05-28 KST: Direction Cue Output Contract

### Decision

Add a visible in-app contract for the selected direction cue output.

### Reasoning

The app could already emit notification, vibration, TTS, Meta display stub, and Android XR display stub deliveries. For physical testing, the tester needs a clear expected-output surface before tapping `알림 출력 점검`, otherwise a failed or confusing vibration/TTS/display observation is hard to diagnose.

### Implemented

- `DirectionCueOutputContract.kt` combines notification text, vibration metadata, TTS text, and glasses evidence summary for a direction.
- `VoiceDirectionApp.kt` now includes a `방향 큐 계약` card.
- `DirectionCueOutputContractsTest.kt` verifies the output contract and privacy shape.
- `docs/31-direction-cue-output-contract.md`.
- Service-readiness audit artifact tracking for the cue contract document.

### Trial/Error Notes

- The contract reuses existing adapter helpers rather than copying expected values into the UI.
- It proves local formatting and UI surfacing only.
- It does not prove physical vibration feel, TTS audibility, display visibility, glasses haptics, or direction accuracy.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- Unit tests passed.
- Debug APK assembled.

## 2026-05-28 KST: Device Evidence Redaction Gate

### Decision

Generated phone `device-evidence.md` reports must redact ADB serials and build fingerprints before they can validate.

### Reasoning

The first real phone test will create a persistent Markdown evidence file. Device model and Android SDK version are useful for compatibility debugging, but ADB serials and build fingerprints are private device identifiers and should not become project artifacts. This needed to be enforced by the script and validator, not just by tester memory.

### Implemented

- `scripts/android-device-smoke-test.sh` now writes `Device serial: redacted-by-script`.
- `scripts/android-device-smoke-test.sh` now writes `Build fingerprint: redacted-by-script`.
- `scripts/validate-device-evidence.mjs` fails unredacted serial/fingerprint metadata.
- `scripts/validate-device-evidence.mjs` also rejects MAC-like identifiers and Bluetooth private fields in the log evidence block.
- `docs/47-device-evidence-redaction.md`.
- `data/runs/20260528_voice_direction_mvp/100-device-evidence-redaction.md`.

### Trial/Error Notes

- The earlier generated report shape could persist raw device identifiers. That was useful locally but too risky for a shareable evidence trail.
- The validator fixture now includes a redacted build fingerprint row so the required metadata shape stays testable without a real phone.
- This does not remove the need for human review of generated reports before promotion decisions.

### Verification

From the repository root:

```bash
node --check scripts/validate-device-evidence.mjs
bash -n scripts/android-device-smoke-test.sh
scripts/android-device-smoke-test.sh --help
node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json
```

Result:

- Validator syntax passed.
- Smoke script syntax/help passed.
- Fixture validation returned `"ok": true`.

## 2026-05-28 KST: Android XR Projected Contract Validator

### Decision

Add a validator that explicitly classifies the Android XR path as either current `phone_preview_stub` workflow evidence or future `real_projected_candidate` evidence.

### Reasoning

The official Android XR docs now make the projected path concrete: the activity needs `android:requiredDisplayCategory="xr_projected"`, real projected launch should use `ProjectedContext.createProjectedActivityOptions`, and hardware access should use `ProjectedContext.createProjectedDeviceContext` or a documented fallback. The app already has a projected cue activity, but it still opens as a local preview and uses `AndroidXrDisplayStubAdapter`. Without a machine-checkable contract, that preview could be mistaken for real Android XR hardware support.

### Implemented

- `scripts/validate-android-xr-projected-contract.mjs`.
- `docs/44-android-xr-projected-contract.md`.
- `data/runs/20260528_voice_direction_mvp/97-android-xr-projected-contract.md`.
- Generated non-PII report under `data/runs/20260528_voice_direction_mvp/97-android-xr-projected-contract`.
- Service-readiness audit now lists the Android XR projected contract artifacts.

### Trial/Error Notes

- Default validation passing means the local preview/stub path is explicit and source-backed.
- Strict validation must fail until Jetpack XR, Compose Glimmer, ProjectedContext launch/device context, real adapter replacement, and runtime evidence exist.
- The validator stores only booleans, source dates, and workspace-relative paths.

### Verification

From the repository root:

```bash
node --check scripts/validate-android-xr-projected-contract.mjs
scripts/validate-android-xr-projected-contract.mjs --write-report --json
scripts/validate-android-xr-projected-contract.mjs --require-real-android-xr --json
```

Result:

- Syntax check passed.
- Default validation passed with `currentMode=phone_preview_stub`.
- Strict real Android XR validation failed as expected.

## 2026-05-28 KST: Android XR Contract Rows in Glasses Preflight

### Decision

Wire the Android XR projected-contract validator into `scripts/glasses-integration-preflight.sh`.

### Reasoning

The standalone validator is useful, but hardware-day operators usually start with the glasses preflight. If that preflight only checks manifest/dependencies, it can miss the distinction between a valid phone preview and a real Android XR runtime path. The preflight now makes that distinction visible in the same report that already tracks Meta credentials, DAT dependencies, ADB state, and Android XR dependencies.

### Implemented

- Added `Projected contract default validation` row.
- Added `Strict real projected contract` row.
- Updated `docs/11-glasses-integration-preflight.md`.
- Updated `docs/24-glasses-setup-readiness.md`.
- Updated `docs/44-android-xr-projected-contract.md`.
- Added `docs/45-android-xr-preflight-contract-integration.md`.
- Added `data/runs/20260528_voice_direction_mvp/98-android-xr-preflight-contract-integration.md`.

### Trial/Error Notes

- Default contract pass means the current preview/stub path is still coherent.
- Strict contract manual-required means real Android XR remains unproven.
- The preflight continues to avoid printing or storing Meta application id, GitHub token, ADB serials, Bluetooth names, raw audio, transcripts, or private alert content.

### Verification

From the repository root:

```bash
bash -n scripts/glasses-integration-preflight.sh
scripts/glasses-integration-preflight.sh --write-evidence --evidence-dir data/runs/20260528_voice_direction_mvp/30-glasses-preflight-evidence
node scripts/check-private-alpha-hardware-readiness.mjs --write-report --json
node scripts/audit-service-readiness.mjs --write-report --report-dir data/runs/20260528_voice_direction_mvp/52-service-readiness-audit
```

Result:

- Bash syntax passed.
- Glasses preflight evidence now records default Android XR contract as pass and strict real Android XR contract as manual-required.
- Hardware readiness summary reports `pass=11`, `manual=5`, `blocked=5` for the latest glasses preflight.
- Service readiness audit regenerated.

## 2026-05-28 KST: Direction Evidence Extractor

### Decision

Add an extractor and validator for generated direction evidence summaries before any canonical direction manifest update.

### Reasoning

The direction accuracy gate already defined strict production criteria, but a real hardware run still left the operator with a long `device-evidence.md` file. The new extractor turns the non-PII broadcast snapshot into aggregate counts, match rates, microphone metadata, latency fields, and a manifest update template while keeping fixture or incomplete evidence out of production claims.

### Implemented

- `scripts/extract-direction-evidence-summary.mjs`.
- `scripts/validate-direction-evidence-summary.mjs`.
- `docs/42-direction-evidence-extractor.md`.
- Stage output under `data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor`.

### Trial/Error Notes

- The extractor treats the generated repository snapshot as the authoritative automation source when it disagrees with a human-readable table.
- The generated manifest update template is review input only; it is not copied into the canonical manifest.
- Fixture evidence can pass default summary validation, but strict production-candidate validation must fail.

### Verification

From the repository root:

```bash
node --check scripts/extract-direction-evidence-summary.mjs
node --check scripts/validate-direction-evidence-summary.mjs
scripts/extract-direction-evidence-summary.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --report-dir data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor --json
scripts/validate-direction-evidence-summary.mjs data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor/direction-evidence-summary.json --json
scripts/validate-direction-evidence-summary.mjs data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor/direction-evidence-summary.json --require-production-direction-candidate --json
node scripts/audit-service-readiness.mjs --write-report --report-dir data/runs/20260528_voice_direction_mvp/52-service-readiness-audit
```

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- Syntax checks passed.
- Fixture extraction passed.
- Default summary validation passed.
- Strict production-candidate validation failed as expected because controlled phone and wearable direction evidence is missing.
- Service readiness audit was regenerated with the new artifacts.
- Unit tests passed.
- Debug APK assembled.

## 2026-05-28 KST: Hardware Test Operator Pack

### Decision

Add a generated operator pack for the actual phone, glasses, and support test day.

### Reasoning

Separate session packs are useful, but a real test day needs one safe entry point. The operator should be able to run a no-hardware sanity pass, confirm the service gates still reject unsupported promotion claims, then opt into phone, glasses, or support lanes only when the matching device and evidence owner are ready.

### Implemented

- `scripts/create-hardware-test-operator-pack.mjs`.
- `scripts/validate-hardware-test-operator-pack.mjs`.
- `docs/40-hardware-test-operator-pack.md`.
- Generated pack at `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack`.

### Trial/Error Notes

- The first default phone-runner command pointed at the phone runner's default dry-run evidence path. The generator now passes an explicit `android-phone-smoke-dry-run` path inside the operator pack so outputs remain grouped.
- Default mode intentionally proves workflow only. It must keep `phonePrivateAlphaCandidate=false` and `glassesPrivateAlphaCandidate=false` while no physical evidence exists.
- Hardware flags are environment variables (`RUN_PHONE`, `RUN_GLASSES`, `RUN_SUPPORT`) so the operator can run one lane at a time.

### Verification

From the repository root:

```bash
node --check scripts/create-hardware-test-operator-pack.mjs
node --check scripts/validate-hardware-test-operator-pack.mjs
scripts/create-hardware-test-operator-pack.mjs --force --json
scripts/validate-hardware-test-operator-pack.mjs --json
data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
scripts/validate-hardware-test-operator-pack.mjs --json
```

Result:

- Syntax checks passed.
- Pack generation passed.
- Pack validation passed before and after the default run.
- Default no-hardware run passed and preserved phone/glasses alpha as not-ready.

## 2026-05-28 KST: Hardware Test Promotion Validator

### Decision

Add a promotion validator for generated operator-pack outputs.

### Reasoning

The operator pack can pass in no-hardware mode, which is useful but easy to misread. A separate profile-based validator makes the distinction explicit: workflow/current-safe can pass now, while phone-alpha, glasses-alpha, support-ready, and private-alpha profiles must fail until real evidence exists.

### Implemented

- `scripts/validate-hardware-test-promotion.mjs`.
- `docs/41-hardware-test-promotion-validator.md`.
- Operator pack default command now writes `promotion-validation/promotion-validation.json` and `.md`.

### Trial/Error Notes

- The first CLI parser treated `--profile workflow` as a pack path. The parser now skips option values when collecting positional arguments.
- The validator stores candidate booleans, statuses, exit codes, aggregate readiness values, and paths only. It does not persist raw child command output.
- Strict failures are expected in the current environment because there is no attached phone, no Meta credential proof, no glasses hardware evidence, and no support drill evidence.

### Verification

From the repository root:

```bash
node --check scripts/validate-hardware-test-promotion.mjs
scripts/validate-hardware-test-promotion.mjs --profile workflow --json
scripts/validate-hardware-test-promotion.mjs --profile current-safe --json
scripts/validate-hardware-test-promotion.mjs --profile phone-alpha --json
scripts/validate-hardware-test-promotion.mjs --profile glasses-alpha --json
scripts/validate-hardware-test-promotion.mjs --profile support-ready --json
data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
```

Result:

- Syntax check passed.
- `workflow` and `current-safe` passed.
- `phone-alpha`, `glasses-alpha`, and `support-ready` failed as expected.
- Operator pack default run wrote promotion validation reports.

## 2026-05-28 KST: Glasses Haptics Intent Contract

### Decision

Add a separate app-side contract for future glasses haptics target, intensity, and pulse count.

### Reasoning

The user wants direction feedback such as right-side vibration when someone calls from the right. The app already had phone vibration patterns, but using those as the haptics model could imply real glasses-side haptics support. A separate intent object keeps the desired Ray-Ban/Android XR behavior in the code while still requiring official API and hardware evidence.

### Implemented

- `GlassesHapticsIntent.kt` maps directions to haptic target, intensity, pulse count, proof requirement, fallback requirement, and non-PII evidence summary.
- `DirectionCueOutputContract.kt` now includes glasses haptics intent fields.
- The `방향 큐 계약` card shows haptic target, intensity, pulse count, and API proof requirement.
- `AlertOutputTestReceiver` emits haptic intent markers for generated device evidence.
- `scripts/validate-device-evidence.mjs`, the evidence fixture, and `docs/09-device-evidence-template.md` now require the haptics intent markers.
- `docs/38-glasses-haptics-intent-contract.md`.
- `data/runs/20260528_voice_direction_mvp/91-glasses-haptics-intent-contract.md`.

### Trial/Error Notes

- Left/right direction has a per-side intent, but `requiresOfficialApiProof=true` prevents a support claim.
- Front/back maps to both sides with different pulse/intensity semantics, but front/back direction remains unproven for production.
- Unknown direction maps to no haptic target because a direction-specific haptic would be misleading.

### Verification

From `apps/voice-direction-glass`:

```bash
JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk ./gradlew --no-daemon test
```

Result:

- Unit tests passed after the contract was added.

## 2026-05-28 KST: Glasses Private Alpha Evidence Runner

### Decision

Add a dedicated runner for the glasses evidence lane.

### Reasoning

The project already had a glasses hardware session pack and a top-level private-alpha hardware runner. The next useful automation is a narrower command that answers whether the current Ray-Ban Display, Ray-Ban Gen 1 fallback, Android XR projected, and haptics/fallback evidence makes the glasses lane a private-alpha candidate. That keeps the user's hardware testing workflow focused while still preserving strict release gates.

### Implemented

- `scripts/run-glasses-private-alpha-evidence.mjs`.
- `scripts/validate-glasses-private-alpha-evidence-runner.mjs`.
- Default summary under `data/runs/20260528_voice_direction_mvp/92-glasses-private-alpha-evidence-runner/`.
- `docs/39-glasses-private-alpha-evidence-runner.md`.
- Service-readiness audit tracking for the runner doc and scripts.

### Trial/Error Notes

- Default mode does not run hardware session commands; it validates the current session and records candidate booleans.
- `--run-session` is explicit because it should only run when Ray-Ban/Android XR evidence can actually be collected or refreshed.
- Strict summary validation fails as expected until real glasses hardware evidence and the glasses-alpha service gate pass.
- The runner stores no raw command output.

### Verification

```bash
node --check scripts/run-glasses-private-alpha-evidence.mjs
node --check scripts/validate-glasses-private-alpha-evidence-runner.mjs
scripts/run-glasses-private-alpha-evidence.mjs --json
scripts/validate-glasses-private-alpha-evidence-runner.mjs --json
scripts/validate-glasses-private-alpha-evidence-runner.mjs --require-glasses-alpha-candidate --json
```

Result:

- Syntax checks passed.
- Default runner summary passed with `glassesPrivateAlphaCandidate=false`.
- Strict runner validation failed as expected because real phone/glasses evidence is missing.

## 2026-05-28 KST: Service Gate Assertions

### Decision

Add a service promotion assertion command.

### Reasoning

The project has many evidence paths, and the risk is now accidental promotion claims. A command that asserts the current safe profile and fails stricter profiles keeps phone alpha, glasses alpha, beta, and production claims tied to actual evidence.

### Implemented

- `scripts/assert-service-gates.mjs`.
- `current-safe`, `internal-prototype`, `phone-alpha`, `glasses-alpha`, and `production` profiles.
- `docs/37-service-gate-assertions.md`.
- `data/runs/20260528_voice_direction_mvp/90-service-gate-assertions.md`.

### Trial/Error Notes

- `current-safe` passes with a warning that device evidence is missing.
- `phone-alpha` fails as expected because physical phone evidence is missing and phone-private-alpha open ids remain.
- Assertion profiles do not generate evidence; they only prevent unsupported claims.

### Verification

```bash
node --check scripts/assert-service-gates.mjs
scripts/assert-service-gates.mjs --profile current-safe --json
scripts/assert-service-gates.mjs --profile internal-prototype --json
scripts/assert-service-gates.mjs --profile phone-alpha --json
```

## 2026-05-28 KST: Phone Private Alpha Runner Validator

### Decision

Add a validator for phone-private-alpha runner summaries.

### Reasoning

The phone evidence runner creates a non-PII summary, but that summary needs a contract too. A no-device dry run should be valid workflow metadata while still failing strict phone-alpha candidate requirements. The validator also guards against future changes that might persist raw command output or private identifiers.

### Implemented

- `scripts/validate-phone-private-alpha-evidence-runner.mjs`.
- Strict `--require-phone-alpha-candidate` mode.
- `docs/36-phone-private-alpha-runner-validator.md`.
- `data/runs/20260528_voice_direction_mvp/89-phone-private-alpha-runner-validator.md`.

### Trial/Error Notes

- Default validation passes for the current no-device summary.
- Strict candidate validation fails as expected until real phone evidence exists.
- The validator rejects raw/private keys and obvious private structured text.

### Verification

```bash
node --check scripts/validate-phone-private-alpha-evidence-runner.mjs
scripts/validate-phone-private-alpha-evidence-runner.mjs --json
scripts/validate-phone-private-alpha-evidence-runner.mjs --require-phone-alpha-candidate --json
```

## 2026-05-28 KST: Phone Private Alpha Evidence Runner

### Decision

Add a phone-first evidence runner for the next private-alpha gate.

### Reasoning

The audit still reports no physical `device-evidence.md`. The broad physical session pack is useful, but the next actual promotion step is narrower: connect one Android phone, run the smoke evidence script, validate the report, and regenerate service readiness. A dedicated runner reduces the chance that the operator skips validation or forgets the audit step.

### Implemented

- `scripts/run-phone-private-alpha-evidence.mjs`.
- `docs/35-phone-private-alpha-evidence-runner.md`.
- `data/runs/20260528_voice_direction_mvp/88-phone-private-alpha-evidence-runner.md`.
- Audit tracking for the runner doc and script.

### Trial/Error Notes

- The runner writes summary Markdown/JSON but does not persist raw child command output.
- `--allow-no-device` is only for local workflow verification; it must not be counted as phone alpha evidence.
- The runner keeps `phonePrivateAlphaCandidate=false` until a physical phone run creates validator-passing `device-evidence.md`.

### Verification

```bash
node --check scripts/run-phone-private-alpha-evidence.mjs
scripts/run-phone-private-alpha-evidence.mjs --help
scripts/run-phone-private-alpha-evidence.mjs --skip-build --allow-no-device --json
```

## 2026-05-28 KST: Release Readiness Next Actions

### Decision

Show actionable phone-private-alpha evidence details in the app release readiness card.

### Reasoning

The release readiness card showed target status and the first open phone-alpha ids, but ids alone are too terse during hardware testing. The next bottleneck is a physical Android phone run, so the operator should see the evidence state and exact next action without leaving the app.

### Implemented

- `ReleaseReadinessOpenItemRow` now shows title, evidence, next action, and id.
- The phone-alpha section shows visible/total open blocker count.
- `VoiceDirectionReleaseChecklistTest` now verifies open phone-alpha blockers have non-empty title/evidence/next-action fields.
- `docs/34-release-readiness-next-actions.md`.

### Trial/Error Notes

- The card remains read-only.
- The list is limited to the first three open phone-alpha blockers to keep the main screen manageable.
- This does not change any checklist status; physical `device-evidence.md` is still required.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

## 2026-05-28 KST: Cue Contract Device Evidence

### Decision

Add non-PII cue contract markers to the debug alert-output evidence path.

### Reasoning

The `방향 큐 계약` card makes the expected output visible in the app, but the generated physical phone report also needs to prove which expected cue shape was active when the debug alert-output test ran. Without that, a tester would have to reconcile UI state and report state manually.

### Implemented

- `DirectionCueOutputContracts.cueForDirection(...)` now creates the shared generic output-test cue.
- `MainActivity.runAlertOutputTest` and `AlertOutputTestReceiver` use the shared cue helper.
- `AlertOutputTestReceiver` reports cue contract direction, confidence percent, notification direction, TTS direction-only flag, TTS speaker-label flag, and display evidence summary.
- `scripts/validate-device-evidence.mjs` requires the cue contract markers.
- The device evidence validator fixture was updated with the new marker set.

### Trial/Error Notes

- Full notification and TTS strings are still not stored in generated reports.
- The display evidence summary remains direction/confidence/label-present metadata only.
- This does not prove physical output; it only proves that the generated report captured the intended output contract for the test cue.

### Verification

From the repository root:

```bash
node --check scripts/validate-device-evidence.mjs
bash -n scripts/android-device-smoke-test.sh
node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json
```

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- Validator syntax passed.
- Smoke script syntax passed.
- Fixture validation returned `"ok": true`.
- Unit tests passed.
- Debug APK assembled.

## 2026-05-28 KST: Direction Validation Evidence Snapshot

### Decision

Add per-direction matched, mismatched, and unknown/unusable counts to the direction validation summary and non-PII evidence snapshot.

### Reasoning

Direction trial totals alone are too weak for the product goal. A report could show 20 front trials while hiding that every front trial was unknown. The app needs direction-specific outcome counts so physical phone/glasses runs can show exactly which axis is working, failing, or unavailable before any front/back claim.

### Implemented

- `DirectionValidationDirectionStats`.
- Front/back/left/right stats in `DirectionValidationSummary`.
- Direction validation UI rows for per-direction outcome counts.
- `EvidenceSnapshotReceiver` fields for per-direction matched/mismatched/unknown counts.
- `scripts/validate-device-evidence.mjs` required markers for those fields.
- Updated device evidence fixture and documentation.

### Trial/Error Notes

- This improves evidence shape only. It does not make front/back reliable.
- Generated reports remain aggregate-only and must not contain raw PCM, transcripts, speaker names, or private room notes.
- Strict direction validation remains blocked until controlled phone/glasses trials exist.

### Verification

From the repository root:

```bash
node --check scripts/validate-device-evidence.mjs
node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json
```

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- Validator syntax passed.
- Fixture validation returned `"ok": true`.
- Unit tests passed.
- Debug APK assembled.

## 2026-05-28 KST: Release Readiness UI

### Decision

Expose release readiness status in the app UI.

### Reasoning

The project already had a checklist and debug release-readiness snapshot, but a tester looking at the app could not immediately see whether the build was ready for internal prototype, phone alpha, glasses alpha, external beta, or production. Since promotion is evidence-gated, the app should show those gates next to the operational diagnostics.

### Implemented

- `릴리스 준비` card in `VoiceDirectionApp`.
- Target rows for internal prototype, phone private alpha, glasses private alpha, external beta, and production.
- Pass/manual/blocked counts for each target.
- The first three open phone-private-alpha evidence ids.
- `docs/33-release-readiness-ui.md`.

### Trial/Error Notes

- The card is read-only and cannot mark evidence complete.
- It reuses `VoiceDirectionReleaseChecklist`, so it stays aligned with release-readiness snapshot automation.
- Current phone/glasses/beta/production statuses remain not-ready or blocked until real evidence exists.

### Verification

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- Unit tests passed.
- Debug APK assembled.

## 2026-05-28 KST: Evidence Privacy Scan

### Decision

Add a folder-level privacy scan for generated evidence and report artifacts.

### Reasoning

The device evidence validator protects a single generated phone `device-evidence.md`, but the real test-day workflow also produces operator-pack summaries, dashboard outputs, service audits, and future phone/glasses/support folders. Those artifacts need a separate scan so copied ADB identifiers, Bluetooth names, transcripts, speaker fields, embeddings, encrypted payload values, token fields, or raw-audio fields do not enter promotion reports.

### Implemented

- `scripts/scan-evidence-privacy.mjs`.
- Default targets for the hardware test operator pack, hardware test status dashboard, service readiness audit, and device evidence validator fixture.
- Markdown and JSON report generation under `data/runs/20260528_voice_direction_mvp/101-evidence-privacy-scan`.
- `docs/48-evidence-privacy-scan.md`.

### Trial/Error Notes

- The scan report intentionally does not print matched private text. It only records file path, line number, and rule id.
- The default scan passed across 20 current evidence/report files.
- A process-substitution negative check with a private speaker field failed as expected without leaving a permanent fixture in the repository.
- A temporary legacy `<timestamp>_<adb-device-label>_android_phone_smoke` path failed as expected and was removed after the check.

### Verification

From the repository root:

```bash
node --check scripts/scan-evidence-privacy.mjs
scripts/scan-evidence-privacy.mjs --write-report --json
# private speaker-field process-substitution negative scan
```

Result:

- Script syntax passed.
- Default scan returned `"ok": true`, files scanned `20`, violations `0`, warnings `0`.
- Private speaker field negative scan returned `"ok": false` with rule id `private-speaker-field`.

## 2026-05-28 KST: Operator Pack Privacy Scan Integration

### Decision

Run the evidence privacy scanner inside the generated hardware operator pack before promotion validation.

### Reasoning

The scanner existed, but a real hardware-day operator still had to remember it as a separate command. Since `RUN_PHONE=1`, `RUN_GLASSES=1`, and `RUN_SUPPORT=1` all write outputs under the operator pack, the pack should scan itself before any promotion validator output is treated as review input.

### Implemented

- Updated `scripts/create-hardware-test-operator-pack.mjs` so generated `commands.sh` runs `scripts/scan-evidence-privacy.mjs "$PACK_DIR" --write-report --report-dir "$PACK_DIR/evidence-privacy-scan" --json`.
- Updated `scripts/validate-hardware-test-operator-pack.mjs` so generated packs must include the scan command.
- Updated `scripts/summarize-hardware-test-status.mjs` so the default lane includes the operator-pack privacy scan result.
- Added `docs/49-operator-pack-privacy-scan-integration.md`.
- Added `data/runs/20260528_voice_direction_mvp/102-operator-pack-privacy-scan-integration.md`.

### Trial/Error Notes

- The dashboard initially included parsed child-command JSON in its output after adding the scanner check. That was too verbose for a non-PII status dashboard, so the check list now stores only labels, status, exit code, and parsed-ok booleans.
- The pack-scoped scan is separate from the default cross-run scan. The pack scan protects the hardware-day control folder; the default scan protects the broader current evidence/report set.

### Verification

From the repository root:

```bash
node --check scripts/create-hardware-test-operator-pack.mjs
node --check scripts/validate-hardware-test-operator-pack.mjs
node --check scripts/summarize-hardware-test-status.mjs
scripts/create-hardware-test-operator-pack.mjs --force --json
data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
scripts/summarize-hardware-test-status.mjs --write-report --json
scripts/scan-evidence-privacy.mjs --write-report --json
```

Result:

- Operator pack generation passed.
- Default no-hardware operator pack run passed.
- Pack-scoped evidence privacy scan returned `"ok": true`, files scanned `16`, violations `0`, warnings `0`.
- Hardware dashboard returned `"evidencePrivacyScan.ok": true` and kept default lane ready.
- Default cross-run scan returned `"ok": true`, files scanned `22`, violations `0`, warnings `0`.

## 2026-05-28 KST: Hardware Next Actions

### Decision

Add a non-PII next-action reporter that turns the hardware status dashboard into an ordered command list for the next real hardware test step.

### Reasoning

The dashboard reports lane status, but the operator still has to decide whether to refresh the default workflow, attach a phone, run controlled direction rows, collect glasses proof, or run support drills. A separate brief keeps that decision explicit without changing any release gate or writing hardware evidence.

### Implemented

- `scripts/recommend-hardware-next-actions.mjs`.
- `docs/53-hardware-next-actions.md`.
- `data/runs/20260528_voice_direction_mvp/111-hardware-next-actions.md`.
- `data/runs/20260528_voice_direction_mvp/111-hardware-next-actions/hardware-next-actions.md`.
- `data/runs/20260528_voice_direction_mvp/111-hardware-next-actions/hardware-next-actions.json`.

### Trial/Error Notes

- The current decision is `default_workflow_ready_attach_phone_next`.
- The default workflow is ready, but it is still no-hardware workflow evidence only.
- The phone lane remains blocked because authorized ADB devices are `0`.
- Controlled direction evidence remains manual-required with `0/80` observed rows.
- Glasses and support lanes remain blocked/manual-required until their real evidence conditions are met.

### Verification

From the repository root:

```bash
node --check scripts/recommend-hardware-next-actions.mjs
scripts/recommend-hardware-next-actions.mjs --write-report --json
```

Result:

- Syntax check passed.
- Report generation passed.
- The generated report stores only booleans, counts, statuses, command recommendations, blockers, and workspace-relative paths.

## 2026-05-28 KST: Hardware Next Action Executor

### Decision

Add a safe executor for the hardware next-action brief.

### Reasoning

The next-action brief reduces decision ambiguity, but the test-day operator still has to copy a command manually. The executor closes that automation gap while preserving blockers: it selects the first `ready` action, checks the command against an allow-list, and refuses blocked/manual-required actions.

### Implemented

- `scripts/run-hardware-next-action.mjs`.
- `docs/54-hardware-next-action-executor.md`.
- `data/runs/20260528_voice_direction_mvp/112-hardware-next-action-executor.md`.
- `data/runs/20260528_voice_direction_mvp/112-hardware-next-action-executor/hardware-next-action-execution.md`.
- `data/runs/20260528_voice_direction_mvp/112-hardware-next-action-executor/hardware-next-action-execution.json`.

### Trial/Error Notes

- The current selected action is `refresh-default-workflow`.
- Execute mode ran the default no-hardware operator pack and exited `0`.
- This refreshed workflow summaries, service audit, pack privacy scan, operator-pack validation, and workflow promotion validation.
- The execution summary intentionally stores no raw command output.
- The result is not phone/glasses/support evidence and does not change private-alpha readiness.

### Verification

From the repository root:

```bash
node --check scripts/run-hardware-next-action.mjs
scripts/run-hardware-next-action.mjs --write-report --json
scripts/run-hardware-next-action.mjs --execute --write-report --json
```

Result:

- Syntax check passed.
- Dry-run selected `refresh-default-workflow`.
- Execute mode completed with exit code `0`.
- Pack-scoped privacy scan passed with zero violations.

## 2026-05-28 KST: Phone Lane Ready Watcher

### Decision

Add a phone-lane watcher that polls the guarded runner until the physical phone lane is ready, then optionally executes the phone lane and immediately runs the post-run reviewer.

### Reasoning

The phone lane runner and post-run reviewer made the real phone path safer, but the operator still had to rerun commands after attaching a phone. The watcher keeps the same safety gates while reducing the next test-day action to one guarded command.

### Implemented

- `scripts/run-phone-lane-when-ready.mjs`.
- `docs/58-phone-lane-ready-watcher.md`.
- `data/runs/20260528_voice_direction_mvp/116-phone-lane-ready-watcher.md`.
- `data/runs/20260528_voice_direction_mvp/116-phone-lane-ready-watcher/phone-lane-ready-watcher.md`.
- `data/runs/20260528_voice_direction_mvp/116-phone-lane-ready-watcher/phone-lane-ready-watcher.json`.

### Trial/Error Notes

- The watcher uses the existing `scripts/run-phone-lane-hardware.mjs --json` as the poll source so readiness is not duplicated in a second script.
- Hardware collection still requires explicit `--execute`.
- A no-phone smoke run with `--timeout-ms 0` produces a fast `timed-out` report and does not run hardware collection.
- If a future execution succeeds but strict evidence is incomplete, the watcher reports `executed-review-blocked` instead of treating collection as phone-alpha readiness.
- The report stores parsed aggregate child summaries only, not raw child command output.

### Verification

From the repository root:

```bash
node --check scripts/run-phone-lane-when-ready.mjs
scripts/run-phone-lane-when-ready.mjs --help
scripts/run-phone-lane-when-ready.mjs --timeout-ms 0 --interval-ms 250 --write-report --json
```

Result:

- Syntax check passed.
- Help output passed.
- Current no-phone smoke result is `timed-out`, with `authorizedAdbDevices=0`, `collectionBlockerCount=1`, and `evidenceGapCount=4`.

## 2026-06-01 KST: Phone Lane Deferred Until Pre-Phone Gates Are Current

### Decision

Keep direct Android phone integration as the final hardware step. Finish the no-hardware workflow, controlled direction planning, glasses preflight, support preparation, service audit, and privacy scans before running the phone evidence lane.

### Reasoning

The user asked to reduce token and work waste by avoiding early phone-integration loops. The project can still make useful progress without a connected phone by keeping local automation, evidence gates, and handoff instructions current.

### Implemented

- Updated `docs/60-next-goal-handoff.md`.
- Updated `docs/53-hardware-next-actions.md`.
- Updated hardware readiness, phone-alpha dry-run, status, and next-action recommendation scripts.
- Regenerated operator-pack workflow summaries, hardware dashboard, and hardware next-action reports.

### Trial/Error Notes

- The default no-hardware operator pack still passes.
- Controlled direction planning remains ready with `0/80` observed rows.
- Phone evidence remains blocked only for the final hardware step because authorized ADB devices are `0`.
- No phone, glasses, Meta DAT, Android XR, or haptics support claim was promoted.

### Verification

From the repository root:

```bash
data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
node scripts/summarize-hardware-test-status.mjs --write-report --json
node scripts/recommend-hardware-next-actions.mjs --write-report --json
node scripts/scan-evidence-privacy.mjs --path scripts/summarize-hardware-test-status.mjs --path scripts/recommend-hardware-next-actions.mjs --path docs/60-next-goal-handoff.md --path data/runs/20260528_voice_direction_mvp/118-next-goal-handoff.md --path data/runs/20260528_voice_direction_mvp/99-hardware-test-status-dashboard --path data/runs/20260528_voice_direction_mvp/111-hardware-next-actions --json
```

Result:

- Operator-pack workflow completed successfully.
- Dashboard decision is `pre_phone_workflow_ready_keep_phone_last`.
- Targeted privacy scan passed with zero violations.

## 2026-06-01 KST: Pre-Phone Gate Refresh

### Decision

Refresh only the pre-phone gates and keep phone hardware execution deferred.

### Reasoning

The next useful work before a real phone run is to prove that Stage 117, controlled direction planning, service readiness, and privacy scans remain current without creating new broad planning documents or making hardware claims.

### Trial/Error Notes

- Stage 117 glasses-lane review still returns `blocked` because real Ray-Ban Display, Ray-Ban Gen 1 fallback, Android XR projected runtime, and strict glasses-alpha promotion evidence are missing.
- Controlled direction session validation passes and remains ready for 80 planned rows, with observed rows still `0/80`.
- Default operator-pack workflow passes and leaves phone/glasses private-alpha candidates false.
- Phone evidence remains final-step-only and blocked by authorized ADB device count `0`.

### Verification

From the repository root:

```bash
scripts/review-glasses-lane-evidence.mjs --write-report --json
node scripts/audit-service-readiness.mjs --write-report --report-dir data/runs/20260528_voice_direction_mvp/52-service-readiness-audit
scripts/scan-evidence-privacy.mjs --write-report --json
data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session/commands.sh
data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
node scripts/summarize-hardware-test-status.mjs --write-report --json
node scripts/recommend-hardware-next-actions.mjs --write-report --json
```

Result:

- No-hardware workflow passed.
- Controlled direction session passed.
- Privacy scan passed with zero violations.
- Hardware next-action decision remains `pre_phone_workflow_ready_keep_phone_last`.

## 2026-06-01 KST: Avoid Repeating Current No-Hardware Workflow

### Decision

Mark the default no-hardware workflow as `current` when the dashboard checks, service gates, controlled-direction validator, and privacy scan already pass.

### Reasoning

The next-action automation previously kept `refresh-default-workflow` as the first `ready` action even immediately after a successful refresh. That was safe, but inefficient because the executor would keep rerunning the same no-hardware workflow instead of surfacing manual pre-phone preparation.

### Implemented

- Updated `scripts/recommend-hardware-next-actions.mjs`.
- Updated `docs/53-hardware-next-actions.md`.
- Updated `docs/54-hardware-next-action-executor.md`.
- Regenerated `data/runs/20260528_voice_direction_mvp/111-hardware-next-actions`.
- Regenerated `data/runs/20260528_voice_direction_mvp/112-hardware-next-action-executor`.

### Trial/Error Notes

- Current default workflow now reports status `current`.
- Recommendation now reports `pre_phone_manual_preparation_available`.
- Executor dry-run now reports `No ready action found.` instead of rerunning the default workflow.
- Phone lane remains last and blocked by authorized ADB device count `0`.

### Verification

From the repository root:

```bash
node --check scripts/recommend-hardware-next-actions.mjs
node scripts/recommend-hardware-next-actions.mjs --write-report --json
scripts/run-hardware-next-action.mjs --write-report --json
```

Result:

- Next-action report generation passed.
- Executor dry-run safely refused execution because no action is currently `ready`.

## 2026-06-01 KST: Support Preparation Split From Strict Evidence

### Decision

Track support drill preparation separately from strict support evidence in the hardware status dashboard.

### Reasoning

The user asked to finish pre-phone work before the final Android phone run. Support work had one combined lane, so it was hard to tell whether the support pack itself was ready or whether only real owner-reviewed support evidence was missing.

### Implemented

- Updated `scripts/summarize-hardware-test-status.mjs`.
- Updated support drill privacy redaction wording in the generator and existing session pack.
- Regenerated `data/runs/20260528_voice_direction_mvp/99-hardware-test-status-dashboard`.
- Regenerated `data/runs/20260528_voice_direction_mvp/111-hardware-next-actions`.

### Trial/Error Notes

- `data/runs/20260528_voice_direction_mvp/74-support-drill-session-pack/commands.sh` passes.
- Support incident process validation passes.
- Support drill draft gate passes with expected warnings that deletion and mistaken-alert drills have not run.
- Strict support validation remains blocked until real owner-reviewed drill evidence exists.
- Targeted privacy scan initially flagged the forbidden encrypted-payload marker inside the support privacy rules. The rule now describes ciphertext prefixes without embedding that marker.

### Verification

From the repository root:

```bash
data/runs/20260528_voice_direction_mvp/74-support-drill-session-pack/commands.sh
node --check scripts/summarize-hardware-test-status.mjs
node --check scripts/create-support-drill-session.mjs
node scripts/summarize-hardware-test-status.mjs --write-report --json
node scripts/recommend-hardware-next-actions.mjs --write-report --json
```

Result:

- Dashboard `support.preparationReady=true`.
- Dashboard `support.strictReady=false`.
- Support lane remains `manual-required`, not release-ready.

## 2026-06-01 KST: Mark Prepared Pre-Phone Lanes Current

### Decision

Mark controlled-direction planning and support preparation as `current` when their validators pass, while keeping real observed rows and strict support drill evidence as evidence gaps.

### Reasoning

The previous dashboard still showed prepared lanes as `manual-required`, which made the next goal look like it should rerun preparation instead of moving toward the final phone hardware step. The new status separates preparation from real evidence collection.

### Implemented

- Updated `scripts/summarize-hardware-test-status.mjs`.
- Updated `scripts/recommend-hardware-next-actions.mjs`.
- Updated `docs/53-hardware-next-actions.md`.
- Regenerated hardware dashboard, hardware next actions, and next-action executor report.

### Trial/Error Notes

- Controlled direction trial session is now `current` when the 80-row plan validates but observed rows are still `0/80`.
- Support drill lane is now `current` when incident process, draft gate, and session pack validate.
- Strict support evidence remains an evidence gap until real owner-reviewed deletion and mistaken-alert drills exist.
- Executor dry-run still refuses execution with `No ready action found.`

### Verification

From the repository root:

```bash
node --check scripts/summarize-hardware-test-status.mjs
node --check scripts/recommend-hardware-next-actions.mjs
node scripts/summarize-hardware-test-status.mjs --write-report --json
node scripts/recommend-hardware-next-actions.mjs --write-report --json
scripts/run-hardware-next-action.mjs --write-report --json
```

Result:

- Next-action decision is `pre_phone_preparation_current_hardware_blocked`.
- `run-controlled-direction-session` is `current`.
- `run-support-lane` is `current`.
- `run-phone-lane` remains blocked by authorized ADB device count `0`.

## 2026-06-01 KST: Stage Meta DAT Gradle Coordinates Without Activating SDK

### Decision

Add the official Meta DAT GitHub Packages repository hook and `mwdat` version-catalog aliases while keeping the stub adapter active and not adding DAT runtime dependencies to the app module yet.

### Reasoning

The glasses preflight showed DAT Gradle setup as blocked even though the remaining real blockers are credentials, device access, and hardware evidence. The repository hook is conditional on a local `GITHUB_TOKEN` or ignored `local.properties` `github_token`, and the artifact aliases do not resolve or upload anything unless a future implementation uses them.

### Implemented

- Updated `apps/voice-direction-glass/settings.gradle.kts` with conditional Meta DAT GitHub Packages access.
- Updated `apps/voice-direction-glass/gradle/libs.versions.toml` with `mwdat-core`, `mwdat-camera`, and `mwdat-mockdevice` aliases.
- Kept `MetaDatDisplayStubAdapter` active.

### Trial/Error Notes

- No token or application id values are stored.
- The app build should still work without a DAT token because the aliases are not used as dependencies yet.
- Real Meta DAT support remains blocked until account credentials, package access, and Ray-Ban Display evidence exist.

## 2026-06-01 KST: Add Android XR Projected Dependencies Without Real Runtime Claim

### Decision

Add Android XR runtime, Projected, and Glimmer dependencies from the Android XR setup guidance while keeping the current phone-preview/stub path active.

### Reasoning

The preflight still had an Android XR dependency blocker before any physical phone or glasses run. Configuring the official Jetpack XR dependencies is safe local preparation, but it is not evidence of real Android XR support until the app uses ProjectedContext and a device/emulator run proves projected runtime behavior.

### Implemented

- Installed Android SDK Platform 37.0 locally with the bundled JDK for `sdkmanager`.
- Raised app `compileSdk` to 37 while leaving `targetSdk` unchanged.
- Added `xr-runtime`, `xr-projected`, and `xr-glimmer` aliases to the Gradle version catalog.
- Added those dependencies to the app module.
- Updated the glasses preflight next action text so it still requires ProjectedContext implementation and runtime evidence before adapter replacement or support claims.

### Trial/Error Notes

- First build attempt with Glimmer on `compileSdk=36` failed because `androidx.xr.glimmer:glimmer:1.0.0-alpha12` requires compile SDK 37 or later.
- `AndroidXrDisplayStubAdapter` remains active.
- Strict Android XR validation must still fail until ProjectedContext launch, projected-device context, adapter replacement, and runtime evidence exist.
- No raw audio, transcript, speaker name, device id, or exact location evidence was generated.

## 2026-06-01 KST: Add ProjectedContext Calls While Keeping Runtime Evidence Gate

### Decision

Use Jetpack Projected `ProjectedContext` APIs for projected activity launch and projected-device context probing, but keep Android XR strict validation blocked until real runtime evidence exists.

### Reasoning

The app can prepare the Android XR launch and device-context code path before hardware, but a code path alone is not Android XR proof. The validator now checks the code shape and the non-PII glasses evidence manifest separately so future adapter work cannot accidentally mark Android XR ready without device/emulator evidence.

### Implemented

- `MainActivity` launches the projected cue screen with `ProjectedContext.createProjectedActivityOptions` and falls back to normal launch if unavailable.
- `AndroidXrDisplayStubAdapter` probes `ProjectedContext.createProjectedDeviceContext` before marking an Android XR display cue delivered.
- `AndroidListeningEngineFactory` passes the app context into the Android XR adapter.
- `scripts/validate-android-xr-projected-contract.mjs` now scans adapter-level projected-device context usage and requires real `glasses-evidence/manifest.json` runtime proof for strict readiness.

### Trial/Error Notes

- The Android XR adapter is still explicitly a stub.
- Strict Android XR validation remains expected to fail without runtime evidence and adapter replacement.
- No private device identifiers or audio data were generated.

## 2026-06-01 KST: Keep Phone Lane Last And Tighten Android XR Glasses Readiness

### Decision

Keep direct Android phone integration as the final hardware step, and make the glasses-private-alpha runner's Android XR ready boolean match the stricter ProjectedContext/runtime evidence gate.

### Reasoning

The next-action workflow already ranks phone evidence last, but the handoff sequence still placed a phone run before the glasses lane. Also, the glasses runner only required Android XR status, real adapter, and projected cue visibility for its readiness boolean. That could make a generated summary look more ready than the strict Android XR and glasses hardware validators.

### Implemented

- Reordered `docs/60-next-goal-handoff.md` so controlled-direction tooling stays ready, glasses evidence runs before direct phone integration, and the phone lane remains last.
- Updated `scripts/run-glasses-private-alpha-evidence.mjs` so Android XR projected readiness requires runtime availability, Jetpack Projected dependencies, projected activity launch, projected-device context use, cue/empty-state visibility, microphone-or-Bluetooth fallback evidence, and failure-state documentation.
- Updated `scripts/validate-glasses-private-alpha-evidence-runner.mjs` so `androidXrProjectedReady=true` cannot pass without strict glasses hardware validation.
- Updated the root `README.md` to describe phone output as host/fallback instead of the proof of glasses support.

### Trial/Error Notes

- This does not claim real Meta DAT, Android XR, or glasses haptics support.
- Actual Android XR readiness remains blocked until a real runtime/device or emulator session supplies non-PII evidence.
- No raw audio, transcript, speaker name, device id, token, or exact location evidence was generated.

## 2026-06-01 KST: Restore Phone Lane As First Real Hardware Step

### Decision

Use the Android phone lane as the first real hardware step after the local no-hardware workflow is current.

### Reasoning

The active project objective prioritizes Android phone install/run, phone notification/vibration/TTS proof, and controlled direction rows before Meta Ray-Ban Display, Ray-Ban Gen 1 fallback, and Android XR evidence. The previous handoff and next-action ordering still treated direct phone integration as the final hardware step, which could send the next run toward glasses preparation before the required phone MVP proof.

### Implemented

- Updated the hardware next-action recommender so `run-phone-lane` is priority 2 after the local workflow refresh.
- Updated phone runner/watcher wording from "final phone hardware step" to "real phone hardware step".
- Updated the current handoff and root README so phone install/run evidence is the first real hardware milestone while still not claiming glasses support from phone output.

### Trial/Error Notes

- The phone lane remains blocked in this workspace until exactly one authorized ADB phone is attached.
- No fake direction rows or device evidence were generated.
- Meta DAT, Android XR, and glasses haptics remain unclaimed until real hardware evidence exists.

## 2026-06-01 KST: Fix Handoff Milestone Phone Order

### Decision

Keep the next-goal handoff's recommended milestone aligned with the phone-first objective.

### Reasoning

The handoff scope and next execution order already said phone lane first, but the final recommended milestone still described the phone run as the final hardware step. That could send the next run toward the wrong order.

### Implemented

- Updated `docs/60-next-goal-handoff.md` recommended milestone to phone-lane real-device run first, controlled direction rows second, glasses evidence third.
- Kept Meta DAT, Android XR, and glasses haptics unclaimed until hardware evidence exists.

## 2026-06-17 KST: Add Phone-Independent Ray-Ban Display Web App Lane

### Decision

Keep Android phone-first as the core processing lane, but add a separate Meta Ray-Ban Display Web App prototype for display-only direction cue proof while ADB phone connection is blocked.

### Reasoning

Meta's current public materials describe two Ray-Ban Display developer-preview paths: native mobile DAT integrations and Web Apps. The Android app is still the right place for microphone permission, foreground service behavior, local voice profile handling, notification, vibration, TTS, and direction evidence. A Web App is a better phone-independent artifact for quickly testing a 600x600 glasses display cue, as long as it receives only non-PII cue data and does not claim voice detection or direction accuracy.

### Implemented

- Added `apps/meta-rayban-display-webapp` with static `index.html`, `styles.css`, `app.js`, and `README.md`.
- Added `docs/61-meta-rayban-webapps-mvp.md` to define the Web Apps MVP boundary, deployment gate, and privacy rules.
- Updated `docs/01-platform-research.md` with Meta Web Apps, DAT Android, and DAT iOS source implications.
- Updated `docs/03-technical-architecture.md` so Meta Ray-Ban Display output is split into Web App cue and DAT native lanes.
- Updated `docs/24-glasses-setup-readiness.md`, `docs/README.md`, root `README.md`, and `apps/voice-direction-glass/local.properties.example`.

### Trial/Error Notes

- No Android phone evidence was generated because ADB still does not list an authorized device.
- The Web App does not request microphone, camera, Bluetooth, location, account, or raw sensor permissions.
- The Web App stores only the latest non-PII cue enum locally in browser storage.
- This does not claim Meta DAT native integration, Ray-Ban Display runtime proof, phone alpha readiness, glasses alpha readiness, real direction accuracy, or glasses haptics support.
