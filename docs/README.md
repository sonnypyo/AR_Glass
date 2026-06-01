# Voice Direction Glass Project Docs

Created: 2026-05-28 KST

This folder is the working instruction set for the glasses app project. Keep it current as implementation decisions change.

## Document Map

- [00-project-charter.md](00-project-charter.md): goal, outcome, MVP boundary, technology stack.
- [01-platform-research.md](01-platform-research.md): Meta Wearables and Android XR findings from official/current sources.
- [02-product-plan.md](02-product-plan.md): product definition, MVP scope, success metrics, non-goals.
- [03-technical-architecture.md](03-technical-architecture.md): app architecture, audio pipeline, glasses adapters, data flow.
- [04-agent-guidelines.md](04-agent-guidelines.md): role-by-role instructions for future agents and contributors.
- [05-service-development-process.md](05-service-development-process.md): actual service path from prototype to test flight/release.
- [06-experiment-log.md](06-experiment-log.md): decisions, assumptions, blockers, and trial/error notes.
- [07-privacy-safety.md](07-privacy-safety.md): consent, local data, model, and notification guardrails.
- [08-device-test-plan.md](08-device-test-plan.md): phone, Meta Ray-Ban, Android XR, and evidence-validator device test checklist.
- [09-device-evidence-template.md](09-device-evidence-template.md): copy template for physical phone/glasses test evidence.
- [10-release-readiness.md](10-release-readiness.md): internal prototype, phone alpha, glasses alpha, beta, and production promotion gates.
- [11-glasses-integration-preflight.md](11-glasses-integration-preflight.md): preflight automation for Meta DAT and Android XR adapter replacement.
- [12-service-readiness-audit.md](12-service-readiness-audit.md): local audit command that summarizes release gates and evidence status.
- [13-physical-test-session-runbook.md](13-physical-test-session-runbook.md): generated session folder workflow for real phone, Ray-Ban, and Android XR evidence.
- [14-support-incident-process.md](14-support-incident-process.md): support intake, deletion verification, mistaken-alert triage, and incident response process.
- [15-policy-clearance-matrix.md](15-policy-clearance-matrix.md): Meta, Android XR, Google Play, recording, voice, and wearable distribution clearance matrix.
- [16-privacy-policy-data-safety-draft.md](16-privacy-policy-data-safety-draft.md): draft privacy policy and Google Play Data Safety worksheet for the current local-first build.
- [17-store-review-submission-package-draft.md](17-store-review-submission-package-draft.md): draft Play/wearable review package with listing copy, app-content declarations, reviewer instructions, and submission blockers.
- [18-release-artifact-signing-runbook.md](18-release-artifact-signing-runbook.md): release AAB, upload-key signing, Play App Signing, and key-hygiene runbook.
- [19-release-notes-versioning.md](19-release-notes-versioning.md): Play internal-testing release-note draft, current Gradle version source, version increment rules, and wording guardrails.
- [20-play-screenshot-media-runbook.md](20-play-screenshot-media-runbook.md): Play phone screenshots, feature graphic, Android XR preview assets, capture automation, and strict media validation runbook.
- [21-production-speaker-model-evaluation.md](21-production-speaker-model-evaluation.md): production on-device speaker verification model selection, evaluation, threshold, anti-spoofing, and privacy gate.
- [22-direction-accuracy-evidence.md](22-direction-accuracy-evidence.md): controlled phone/glasses direction accuracy, front/back evidence, route proof, microphone metadata, and strict production-claim gate.
- [23-support-drill-evidence.md](23-support-drill-evidence.md): support deletion verification and mistaken-alert incident drill evidence gate.
- [24-glasses-setup-readiness.md](24-glasses-setup-readiness.md): Meta DAT and Android XR credential/template/source-readiness gate.
- [25-glasses-hardware-evidence.md](25-glasses-hardware-evidence.md): Ray-Ban Display, Ray-Ban Gen 1 fallback, Android XR projected runtime, and haptics hardware proof gate.
- [26-glasses-hardware-session-runbook.md](26-glasses-hardware-session-runbook.md): generated session folder workflow for real glasses hardware evidence collection.
- [27-private-alpha-rehearsal-runbook.md](27-private-alpha-rehearsal-runbook.md): top-level phone/support/glasses private-alpha rehearsal workflow.
- [28-private-alpha-hardware-runner.md](28-private-alpha-hardware-runner.md): hardware-day runner that coordinates phone/support/glasses/private-alpha rehearsal commands and records a non-PII summary.
- [29-private-alpha-hardware-readiness-preflight.md](29-private-alpha-hardware-readiness-preflight.md): non-PII preflight for local toolchain, ADB counts, credentials, session packs, and recommended hardware-runner flags.
- [30-platform-source-freshness.md](30-platform-source-freshness.md): network-backed freshness check for official Meta Wearables and Android XR source URLs.
- [31-direction-cue-output-contract.md](31-direction-cue-output-contract.md): in-app contract for direction cue notification, vibration, TTS, and glasses evidence output before physical testing.
- [32-direction-validation-evidence-snapshot.md](32-direction-validation-evidence-snapshot.md): per-direction matched/mismatched/unknown evidence snapshot contract for controlled direction trials.
- [33-release-readiness-ui.md](33-release-readiness-ui.md): in-app release readiness card for internal, phone alpha, glasses alpha, beta, and production gates.
- [34-release-readiness-next-actions.md](34-release-readiness-next-actions.md): in-app phone-private-alpha blocker evidence and next-action rows for hardware testers.
- [35-phone-private-alpha-evidence-runner.md](35-phone-private-alpha-evidence-runner.md): final phone evidence runner for build, smoke evidence, validator, service audit, and non-PII summary.
- [36-phone-private-alpha-runner-validator.md](36-phone-private-alpha-runner-validator.md): validator for phone-alpha runner summaries, privacy shape, no-device dry runs, and strict candidate claims.
- [37-service-gate-assertions.md](37-service-gate-assertions.md): assertion profiles for current-safe, internal prototype, phone alpha, glasses alpha, and production promotion gates.
- [38-glasses-haptics-intent-contract.md](38-glasses-haptics-intent-contract.md): app-side haptics target/intensity/pulse intent contract without claiming physical glasses haptics support.
- [39-glasses-private-alpha-evidence-runner.md](39-glasses-private-alpha-evidence-runner.md): glasses-lane runner for Ray-Ban Display, Ray-Ban Gen 1 fallback, Android XR, haptics/fallback proof, and strict alpha-candidate summaries.
- [40-hardware-test-operator-pack.md](40-hardware-test-operator-pack.md): day-of-test operator pack generator/validator for phone, glasses, support, readiness, and service-gate checks.
- [41-hardware-test-promotion-validator.md](41-hardware-test-promotion-validator.md): validator profiles that classify operator-pack outputs as workflow-only, current-safe, phone alpha, glasses alpha, support-ready, or private-alpha evidence.
- [42-direction-evidence-extractor.md](42-direction-evidence-extractor.md): extractor and validator for turning generated device evidence into non-PII direction summary and manifest update template.
- [43-phone-runner-direction-evidence.md](43-phone-runner-direction-evidence.md): phone runner integration that writes direction summaries after real `device-evidence.md` exists.
- [44-android-xr-projected-contract.md](44-android-xr-projected-contract.md): Android XR projected contract validator that separates phone-hosted preview/stub evidence from real ProjectedContext/Glimmer integration proof.
- [45-android-xr-preflight-contract-integration.md](45-android-xr-preflight-contract-integration.md): glasses preflight integration for Android XR projected default and strict contract rows.
- [46-hardware-test-status-dashboard.md](46-hardware-test-status-dashboard.md): non-PII dashboard that summarizes operator-pack lane readiness and keeps no-hardware workflow passes separate from real evidence.
- [47-device-evidence-redaction.md](47-device-evidence-redaction.md): generated phone `device-evidence.md` redaction gate for ADB serials, build fingerprints, MAC-like identifiers, and Bluetooth private fields.
- [48-evidence-privacy-scan.md](48-evidence-privacy-scan.md): folder-level scanner for generated evidence/report artifacts so copied private voice, device, Bluetooth, account, token, or raw-audio fields fail before promotion review.
- [49-operator-pack-privacy-scan-integration.md](49-operator-pack-privacy-scan-integration.md): operator-pack integration that runs the evidence privacy scanner before promotion validation and surfaces the result in the hardware dashboard.
- [50-direction-validation-adb-recorder.md](50-direction-validation-adb-recorder.md): debug-only ADB recorder for controlled expected-vs-observed direction trials without storing private audio or labels.
- [51-controlled-direction-trial-session.md](51-controlled-direction-trial-session.md): generated controlled direction-trial session folder for 20-per-direction front/back/left/right planning, ADB templates, aggregate summaries, and privacy rules.
- [52-direction-evidence-manifest-apply.md](52-direction-evidence-manifest-apply.md): safe apply gate for promoting strict direction summaries into the canonical direction manifest.
- [53-hardware-next-actions.md](53-hardware-next-actions.md): ordered non-PII next-action brief for real hardware test days.
- [54-hardware-next-action-executor.md](54-hardware-next-action-executor.md): safe executor for the first ready action in the hardware next-action brief.
- [55-phone-lane-collection-readiness.md](55-phone-lane-collection-readiness.md): separation of phone collection blockers from post-run evidence gaps.
- [56-phone-lane-hardware-runner.md](56-phone-lane-hardware-runner.md): one-command phone lane readiness refresh and guarded `RUN_PHONE=1` execution.
- [57-phone-lane-post-run-review.md](57-phone-lane-post-run-review.md): post-run phone evidence review before phone-alpha claims.
- [58-phone-lane-ready-watcher.md](58-phone-lane-ready-watcher.md): polling watcher that waits for phone-lane readiness, then optionally executes and reviews the phone lane.
- [59-glasses-lane-post-run-review.md](59-glasses-lane-post-run-review.md): post-run glasses evidence review before glasses-alpha claims.
- [60-next-goal-handoff.md](60-next-goal-handoff.md): resume document with current progress, partial Stage 117 state, and next execution order.

## App Artifact

- [../apps/voice-direction-glass](../apps/voice-direction-glass): Android-native scaffold with simulator direction flow, microphone disclosure gate, visible foreground listening service, phone notification/vibration/TTS adapters, in-app direction cue output contract, app-side glasses haptics intent contract, in-app release readiness card with phone-alpha evidence next actions, direction-coded phone vibration pattern evidence, alert channel preferences, one-shot speech recognition, local event/latest glasses cue storage, projected glasses cue screen, debug glasses-cue seed automation, Bluetooth route evidence automation, debug local-delete self-check automation, debug ADB direction-trial recorder, controlled direction-trial session generator/validator, in-app 20-per-direction target progress, audio direction evidence snapshot storage, per-direction validation evidence snapshot fields, direction evidence extractor/validator, phone-runner direction evidence integration, Android XR projected contract validator and preflight integration, hardware test status dashboard, hardware next-action reporter/executor, phone lane collection-readiness split, phone lane hardware runner, phone lane post-run reviewer, phone lane ready watcher, glasses lane post-run reviewer, generated device-evidence redaction gate, evidence privacy scanner, operator-pack privacy scan integration, debug alert-output broadcast automation, non-PII device diagnostics/evidence snapshot, release/glasses readiness snapshot automation, device-evidence validator, phone-private-alpha evidence runner and runner-summary validator, glasses-private-alpha evidence runner and runner-summary validator, hardware test operator pack generator/validator, hardware test promotion validator, service gate assertion profiles, service-readiness audit, physical-test session generator/validator, support/policy/privacy/store-submission/release-artifact/release-note/screenshot-media/production-speaker-model/direction-accuracy/support-drill validators, glasses hardware session generator/validator/apply automation, private-alpha rehearsal generator/validator, private-alpha hardware runner/readiness preflight, platform source freshness automation, release-readiness QA checklist, Meta/Android XR stub adapters, and glasses integration preflight automation.
- [../data/runs/20260528_voice_direction_mvp/final-report.md](../data/runs/20260528_voice_direction_mvp/final-report.md): current Korean integration report with outcome, stack, verification, and remaining gates.
- [../data/runs/20260528_voice_direction_mvp/74-support-drill-session-pack](../data/runs/20260528_voice_direction_mvp/74-support-drill-session-pack): generated support deletion/mistaken-alert drill session pack template.
- [../data/runs/20260528_voice_direction_mvp/77-glasses-hardware-session-pack](../data/runs/20260528_voice_direction_mvp/77-glasses-hardware-session-pack): generated Ray-Ban Display, Ray-Ban Gen 1 fallback, Android XR, and haptics/fallback hardware evidence session pack.
- [../data/runs/20260528_voice_direction_mvp/79-private-alpha-rehearsal-pack](../data/runs/20260528_voice_direction_mvp/79-private-alpha-rehearsal-pack): generated top-level private alpha rehearsal pack.
- [../data/runs/20260528_voice_direction_mvp/80-private-alpha-hardware-runner](../data/runs/20260528_voice_direction_mvp/80-private-alpha-hardware-runner): generated hardware-day private alpha runner summary and service-readiness audit.
- [../data/runs/20260528_voice_direction_mvp/81-private-alpha-hardware-readiness](../data/runs/20260528_voice_direction_mvp/81-private-alpha-hardware-readiness): generated non-PII hardware readiness preflight report.
- [../data/runs/20260528_voice_direction_mvp/82-platform-source-freshness](../data/runs/20260528_voice_direction_mvp/82-platform-source-freshness): generated official platform source freshness report.
- [../data/runs/20260528_voice_direction_mvp/83-direction-cue-output-contract.md](../data/runs/20260528_voice_direction_mvp/83-direction-cue-output-contract.md): implementation note for the in-app cue output contract card and tests.
- [../data/runs/20260528_voice_direction_mvp/84-cue-contract-device-evidence.md](../data/runs/20260528_voice_direction_mvp/84-cue-contract-device-evidence.md): implementation note for cue output contract markers in generated device evidence.
- [../data/runs/20260528_voice_direction_mvp/85-direction-validation-evidence-snapshot.md](../data/runs/20260528_voice_direction_mvp/85-direction-validation-evidence-snapshot.md): implementation note for per-direction validation outcome fields in generated device evidence.
- [../data/runs/20260528_voice_direction_mvp/86-release-readiness-ui.md](../data/runs/20260528_voice_direction_mvp/86-release-readiness-ui.md): implementation note for the in-app release readiness card.
- [../data/runs/20260528_voice_direction_mvp/87-release-readiness-next-actions.md](../data/runs/20260528_voice_direction_mvp/87-release-readiness-next-actions.md): implementation note for phone-alpha evidence/next-action rows in the release readiness card.
- [../data/runs/20260528_voice_direction_mvp/88-phone-private-alpha-evidence-runner.md](../data/runs/20260528_voice_direction_mvp/88-phone-private-alpha-evidence-runner.md): implementation note for the phone-private-alpha evidence runner.
- [../data/runs/20260528_voice_direction_mvp/89-phone-private-alpha-runner-validator.md](../data/runs/20260528_voice_direction_mvp/89-phone-private-alpha-runner-validator.md): implementation note for validating phone-alpha runner summaries.
- [../data/runs/20260528_voice_direction_mvp/90-service-gate-assertions.md](../data/runs/20260528_voice_direction_mvp/90-service-gate-assertions.md): implementation note for service promotion gate assertion profiles.
- [../data/runs/20260528_voice_direction_mvp/91-glasses-haptics-intent-contract.md](../data/runs/20260528_voice_direction_mvp/91-glasses-haptics-intent-contract.md): implementation note for glasses haptics target/intensity/pulse intent markers.
- [../data/runs/20260528_voice_direction_mvp/92-glasses-private-alpha-evidence-runner.md](../data/runs/20260528_voice_direction_mvp/92-glasses-private-alpha-evidence-runner.md): implementation note for the glasses-private-alpha evidence runner and validator.
- [../data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack.md](../data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack.md): implementation note for the hardware test operator pack generator and validator.
- [../data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack](../data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack): generated day-of-test operator pack for phone/glasses/support opt-in evidence runs.
- [../data/runs/20260528_voice_direction_mvp/94-hardware-test-promotion-validator.md](../data/runs/20260528_voice_direction_mvp/94-hardware-test-promotion-validator.md): implementation note for validating operator-pack outputs against workflow and strict promotion profiles.
- [../data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor.md](../data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor.md): implementation note for direction evidence extraction and strict non-promotion validation.
- [../data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor](../data/runs/20260528_voice_direction_mvp/95-direction-evidence-extractor): generated fixture-based direction summary and manifest update template.
- [../data/runs/20260528_voice_direction_mvp/96-phone-runner-direction-evidence.md](../data/runs/20260528_voice_direction_mvp/96-phone-runner-direction-evidence.md): implementation note for phone runner and operator-pack direction summary integration.
- [../data/runs/20260528_voice_direction_mvp/97-android-xr-projected-contract.md](../data/runs/20260528_voice_direction_mvp/97-android-xr-projected-contract.md): implementation note for Android XR projected contract validation.
- [../data/runs/20260528_voice_direction_mvp/97-android-xr-projected-contract](../data/runs/20260528_voice_direction_mvp/97-android-xr-projected-contract): generated non-PII Android XR projected contract report.
- [../data/runs/20260528_voice_direction_mvp/98-android-xr-preflight-contract-integration.md](../data/runs/20260528_voice_direction_mvp/98-android-xr-preflight-contract-integration.md): implementation note for integrating Android XR projected contract checks into glasses preflight.
- [../data/runs/20260528_voice_direction_mvp/99-hardware-test-status-dashboard.md](../data/runs/20260528_voice_direction_mvp/99-hardware-test-status-dashboard.md): implementation note for the hardware test status dashboard.
- [../data/runs/20260528_voice_direction_mvp/99-hardware-test-status-dashboard](../data/runs/20260528_voice_direction_mvp/99-hardware-test-status-dashboard): generated non-PII lane-readiness dashboard for the operator pack.
- [../data/runs/20260528_voice_direction_mvp/100-device-evidence-redaction.md](../data/runs/20260528_voice_direction_mvp/100-device-evidence-redaction.md): implementation note for generated phone evidence redaction.
- [../data/runs/20260528_voice_direction_mvp/101-evidence-privacy-scan.md](../data/runs/20260528_voice_direction_mvp/101-evidence-privacy-scan.md): implementation note for the folder-level evidence privacy scanner.
- [../data/runs/20260528_voice_direction_mvp/101-evidence-privacy-scan](../data/runs/20260528_voice_direction_mvp/101-evidence-privacy-scan): generated evidence privacy scan report and JSON summary.
- [../data/runs/20260528_voice_direction_mvp/102-operator-pack-privacy-scan-integration.md](../data/runs/20260528_voice_direction_mvp/102-operator-pack-privacy-scan-integration.md): implementation note for the operator-pack privacy scan integration.
- [../data/runs/20260528_voice_direction_mvp/103-direction-validation-adb-recorder.md](../data/runs/20260528_voice_direction_mvp/103-direction-validation-adb-recorder.md): implementation note for the debug ADB direction-trial recorder.
- [../data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session.md](../data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session.md): implementation note for the controlled direction-trial session generator and validator.
- [../data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session](../data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session): generated controlled front/back/left/right direction-trial session folder.
- [../data/runs/20260528_voice_direction_mvp/105-hardware-dashboard-controlled-direction-session.md](../data/runs/20260528_voice_direction_mvp/105-hardware-dashboard-controlled-direction-session.md): hardware dashboard integration note for controlled direction session readiness and recorded-row status.
- [../data/runs/20260528_voice_direction_mvp/106-direction-validation-target-progress-ui.md](../data/runs/20260528_voice_direction_mvp/106-direction-validation-target-progress-ui.md): implementation note for in-app 20-per-direction target progress in `방향 검증 기록`.
- [../data/runs/20260528_voice_direction_mvp/107-direction-target-progress-evidence-snapshot.md](../data/runs/20260528_voice_direction_mvp/107-direction-target-progress-evidence-snapshot.md): implementation note for adding controlled direction target-progress fields to generated device evidence.
- [../data/runs/20260528_voice_direction_mvp/108-direction-evidence-summary-target-progress.md](../data/runs/20260528_voice_direction_mvp/108-direction-evidence-summary-target-progress.md): implementation note for propagating controlled direction target progress into extracted direction summaries and manifest templates.
- [../data/runs/20260528_voice_direction_mvp/109-direction-evidence-manifest-apply.md](../data/runs/20260528_voice_direction_mvp/109-direction-evidence-manifest-apply.md): implementation note for the strict direction evidence manifest apply gate.
- [../data/runs/20260528_voice_direction_mvp/110-phone-runner-direction-apply-dry-run.md](../data/runs/20260528_voice_direction_mvp/110-phone-runner-direction-apply-dry-run.md): implementation note for phone-runner direction manifest apply dry-run integration.
- [../data/runs/20260528_voice_direction_mvp/111-hardware-next-actions.md](../data/runs/20260528_voice_direction_mvp/111-hardware-next-actions.md): implementation note for the hardware next-action recommendation report.
- [../data/runs/20260528_voice_direction_mvp/112-hardware-next-action-executor.md](../data/runs/20260528_voice_direction_mvp/112-hardware-next-action-executor.md): implementation note for safe next-action execution.
- [../data/runs/20260528_voice_direction_mvp/112-hardware-next-action-executor](../data/runs/20260528_voice_direction_mvp/112-hardware-next-action-executor): generated non-PII execution summary for the first ready hardware next action.
- [../data/runs/20260528_voice_direction_mvp/113-phone-lane-collection-readiness.md](../data/runs/20260528_voice_direction_mvp/113-phone-lane-collection-readiness.md): implementation note for separating phone lane collection readiness from evidence gaps.
- [../data/runs/20260528_voice_direction_mvp/114-phone-lane-hardware-runner.md](../data/runs/20260528_voice_direction_mvp/114-phone-lane-hardware-runner.md): implementation note for the guarded phone-lane hardware runner.
- [../data/runs/20260528_voice_direction_mvp/114-phone-lane-hardware-runner](../data/runs/20260528_voice_direction_mvp/114-phone-lane-hardware-runner): generated non-PII phone-lane runner readiness report.
- [../data/runs/20260528_voice_direction_mvp/115-phone-lane-post-run-review.md](../data/runs/20260528_voice_direction_mvp/115-phone-lane-post-run-review.md): implementation note for phone-lane post-run review.
- [../data/runs/20260528_voice_direction_mvp/115-phone-lane-post-run-review](../data/runs/20260528_voice_direction_mvp/115-phone-lane-post-run-review): generated non-PII phone-lane post-run review report.
- [../data/runs/20260528_voice_direction_mvp/116-phone-lane-ready-watcher.md](../data/runs/20260528_voice_direction_mvp/116-phone-lane-ready-watcher.md): implementation note for phone-lane readiness polling and guarded execute/review chaining.
- [../data/runs/20260528_voice_direction_mvp/116-phone-lane-ready-watcher](../data/runs/20260528_voice_direction_mvp/116-phone-lane-ready-watcher): generated non-PII phone-lane ready watcher report.
- [../data/runs/20260528_voice_direction_mvp/117-glasses-lane-post-run-review.md](../data/runs/20260528_voice_direction_mvp/117-glasses-lane-post-run-review.md): implementation note for glasses-lane post-run review.
- [../data/runs/20260528_voice_direction_mvp/117-glasses-lane-post-run-review](../data/runs/20260528_voice_direction_mvp/117-glasses-lane-post-run-review): generated non-PII glasses-lane post-run review report.
- [../data/runs/20260528_voice_direction_mvp/118-next-goal-handoff.md](../data/runs/20260528_voice_direction_mvp/118-next-goal-handoff.md): current-state handoff for the next goal run.

## Current Position

The first realistic build target is a native Android Kotlin app because both Meta DAT Android and Android XR projected experiences are Android-first for this MVP. iOS can follow after the interaction and model pipeline are validated.

The hard technical risk is directional voice detection. Public docs confirm useful glasses access paths, but they do not yet guarantee the raw multi-microphone audio/beamforming output needed for reliable front/back/left/right caller direction on all target glasses. The architecture therefore keeps direction detection behind an adapter and starts with a simulator, then device-specific proofs.
