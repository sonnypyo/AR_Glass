# Service Readiness Audit

Date: 2026-05-28 KST

## Purpose

This document defines the local audit command that ties together the app implementation, release checklist, glasses readiness checklist, and generated device evidence files.

Run it after every build, physical phone test, Meta Ray-Ban session, or Android XR session:

```bash
node scripts/audit-service-readiness.mjs --write-report --report-dir data/runs/<run>/service-readiness-audit
```

For machine-readable output:

```bash
node scripts/audit-service-readiness.mjs --json
```

## What It Reads

- `apps/voice-direction-glass/app/src/main/kotlin/com/voicedirection/glass/qa/ReleaseReadiness.kt`
- `apps/voice-direction-glass/app/src/main/kotlin/com/voicedirection/glass/devices/GlassesIntegrationReadiness.kt`
- `data/runs/**/device-evidence.md` when a physical-device report exists.
- `data/runs/20260528_voice_direction_mvp/30-glasses-preflight-evidence/glasses-preflight.md`
- Required local artifact paths such as docs, debug APK, and canonical QA report.
- `docs/15-policy-clearance-matrix.md` as a required local policy artifact.
- `docs/16-privacy-policy-data-safety-draft.md` as a required local privacy/Data Safety draft artifact.
- `docs/17-store-review-submission-package-draft.md` as a required local store-review package draft artifact.
- `docs/18-release-artifact-signing-runbook.md` as a required local release artifact/signing draft artifact.
- `docs/19-release-notes-versioning.md` as a required local release-note/versioning draft artifact.
- `docs/20-play-screenshot-media-runbook.md` as a required local Play screenshot/media draft artifact.
- `docs/21-production-speaker-model-evaluation.md` as a required local production speaker model evaluation draft artifact.
- `docs/22-direction-accuracy-evidence.md` as a required local direction accuracy evidence draft artifact.
- `docs/23-support-drill-evidence.md` and `apps/voice-direction-glass/support-drills/manifest.json` as required local support drill evidence draft artifacts.
- `scripts/create-support-drill-session.mjs` and `scripts/validate-support-drill-session.mjs` as required local support drill automation artifacts.
- `docs/24-glasses-setup-readiness.md`, `scripts/validate-glasses-setup-readiness.mjs`, and `apps/voice-direction-glass/local.properties.example` as required local glasses setup artifacts.
- `docs/25-glasses-hardware-evidence.md`, `apps/voice-direction-glass/glasses-evidence/manifest.json`, and `scripts/validate-glasses-hardware-evidence.mjs` as required local glasses hardware evidence artifacts.
- `docs/26-glasses-hardware-session-runbook.md`, `scripts/create-glasses-hardware-session.mjs`, `scripts/validate-glasses-hardware-session.mjs`, and `scripts/apply-glasses-hardware-session.mjs` as required local glasses hardware session automation artifacts.
- `docs/27-private-alpha-rehearsal-runbook.md`, `scripts/create-private-alpha-rehearsal.mjs`, and `scripts/validate-private-alpha-rehearsal.mjs` as required local private-alpha rehearsal automation artifacts.
- `docs/28-private-alpha-hardware-runner.md` and `scripts/run-private-alpha-hardware-rehearsal.mjs` as required local hardware-day private-alpha runner artifacts.
- `docs/29-private-alpha-hardware-readiness-preflight.md` and `scripts/check-private-alpha-hardware-readiness.mjs` as required local hardware-day readiness preflight artifacts.
- `docs/30-platform-source-freshness.md` and `scripts/check-platform-source-freshness.mjs` as required local platform source freshness artifacts.
- `docs/31-direction-cue-output-contract.md` as a required local cue output contract artifact.
- `docs/32-direction-validation-evidence-snapshot.md` as a required local direction validation evidence snapshot artifact.
- `docs/33-release-readiness-ui.md` as a required local release readiness UI artifact.
- `docs/34-release-readiness-next-actions.md` as a required local release readiness next-action artifact.
- `docs/35-phone-private-alpha-evidence-runner.md` and `scripts/run-phone-private-alpha-evidence.mjs` as required local phone-private-alpha evidence runner artifacts.
- `docs/36-phone-private-alpha-runner-validator.md` and `scripts/validate-phone-private-alpha-evidence-runner.mjs` as required local phone-private-alpha runner validator artifacts.
- `docs/37-service-gate-assertions.md` and `scripts/assert-service-gates.mjs` as required local service promotion assertion artifacts.
- `docs/38-glasses-haptics-intent-contract.md` as a required local glasses haptics intent artifact.
- `docs/39-glasses-private-alpha-evidence-runner.md`, `scripts/run-glasses-private-alpha-evidence.mjs`, and `scripts/validate-glasses-private-alpha-evidence-runner.mjs` as required local glasses-private-alpha evidence runner artifacts.
- `docs/40-hardware-test-operator-pack.md`, `scripts/create-hardware-test-operator-pack.mjs`, and `scripts/validate-hardware-test-operator-pack.mjs` as required local hardware test operator pack artifacts.
- `docs/41-hardware-test-promotion-validator.md` and `scripts/validate-hardware-test-promotion.mjs` as required local hardware test promotion validator artifacts.
- `docs/42-direction-evidence-extractor.md`, `scripts/extract-direction-evidence-summary.mjs`, and `scripts/validate-direction-evidence-summary.mjs` as required local direction evidence summary artifacts.
- `docs/52-direction-evidence-manifest-apply.md` and `scripts/apply-direction-evidence-summary.mjs` as required local direction evidence manifest apply artifacts.
- `docs/43-phone-runner-direction-evidence.md` as the required local phone-runner direction evidence integration artifact.
- `docs/44-android-xr-projected-contract.md` and `scripts/validate-android-xr-projected-contract.mjs` as required local Android XR projected contract artifacts.
- `docs/45-android-xr-preflight-contract-integration.md` as the required local Android XR projected contract preflight integration artifact.
- `docs/46-hardware-test-status-dashboard.md` and `scripts/summarize-hardware-test-status.mjs` as required local hardware test status dashboard artifacts, including controlled direction session row-count visibility.
- `data/runs/20260528_voice_direction_mvp/99-hardware-test-status-dashboard/hardware-test-status-dashboard.md` as the current generated lane-readiness dashboard.
- `docs/47-device-evidence-redaction.md` as the required local generated phone evidence redaction artifact.
- `docs/48-evidence-privacy-scan.md` and `scripts/scan-evidence-privacy.mjs` as required local evidence privacy scan artifacts.
- `data/runs/20260528_voice_direction_mvp/101-evidence-privacy-scan/evidence-privacy-scan.md` as the current generated folder-level privacy scan report.
- `docs/49-operator-pack-privacy-scan-integration.md` and `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/evidence-privacy-scan/evidence-privacy-scan.md` as the required operator-pack privacy scan integration artifacts.
- `docs/50-direction-validation-adb-recorder.md`, `scripts/record-direction-validation-trial.sh`, and `apps/voice-direction-glass/app/src/debug/kotlin/com/voicedirection/glass/qa/DirectionValidationTrialReceiver.kt` as the required debug ADB direction-trial recorder artifacts.
- `data/runs/20260528_voice_direction_mvp/106-direction-validation-target-progress-ui.md` as the required in-app controlled direction target-progress artifact.
- `data/runs/20260528_voice_direction_mvp/107-direction-target-progress-evidence-snapshot.md` as the required generated-evidence controlled direction target-progress artifact.
- `data/runs/20260528_voice_direction_mvp/108-direction-evidence-summary-target-progress.md` as the required direction summary controlled target-progress propagation artifact.
- `data/runs/20260528_voice_direction_mvp/109-direction-evidence-manifest-apply.md` as the required direction manifest apply gate artifact.
- `data/runs/20260528_voice_direction_mvp/110-phone-runner-direction-apply-dry-run.md` as the required phone-runner direction manifest apply dry-run integration artifact.
- `docs/53-hardware-next-actions.md`, `scripts/recommend-hardware-next-actions.mjs`, `data/runs/20260528_voice_direction_mvp/111-hardware-next-actions/hardware-next-actions.md`, and `data/runs/20260528_voice_direction_mvp/111-hardware-next-actions.md` as required hardware next-action artifacts.
- `docs/54-hardware-next-action-executor.md`, `scripts/run-hardware-next-action.mjs`, `data/runs/20260528_voice_direction_mvp/112-hardware-next-action-executor/hardware-next-action-execution.md`, and `data/runs/20260528_voice_direction_mvp/112-hardware-next-action-executor.md` as required hardware next-action execution artifacts.
- `docs/55-phone-lane-collection-readiness.md` and `data/runs/20260528_voice_direction_mvp/113-phone-lane-collection-readiness.md` as required phone lane collection-readiness artifacts.
- `docs/56-phone-lane-hardware-runner.md`, `scripts/run-phone-lane-hardware.mjs`, `data/runs/20260528_voice_direction_mvp/114-phone-lane-hardware-runner/phone-lane-hardware-runner.md`, and `data/runs/20260528_voice_direction_mvp/114-phone-lane-hardware-runner.md` as required phone lane hardware runner artifacts.
- `docs/57-phone-lane-post-run-review.md`, `scripts/review-phone-lane-evidence.mjs`, `data/runs/20260528_voice_direction_mvp/115-phone-lane-post-run-review/phone-lane-post-run-review.md`, and `data/runs/20260528_voice_direction_mvp/115-phone-lane-post-run-review.md` as required phone lane post-run review artifacts.
- `docs/58-phone-lane-ready-watcher.md`, `scripts/run-phone-lane-when-ready.mjs`, `data/runs/20260528_voice_direction_mvp/116-phone-lane-ready-watcher/phone-lane-ready-watcher.md`, and `data/runs/20260528_voice_direction_mvp/116-phone-lane-ready-watcher.md` as required phone lane ready watcher artifacts.
- `docs/51-controlled-direction-trial-session.md`, `scripts/create-controlled-direction-trial-session.mjs`, `scripts/validate-controlled-direction-trial-session.mjs`, and `data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session` as the required controlled direction-trial session artifacts.

## What It Proves

- Whether the static release checklist still says internal prototype, phone alpha, glasses alpha, external beta, or production is ready.
- Which blocking checklist ids remain open.
- Whether local docs and generated artifacts exist.
- Whether the latest generated `device-evidence.md` exists and passes `scripts/validate-device-evidence.mjs`.
- Whether the latest glasses preflight evidence is still pass/manual/blocked.

## What It Does Not Prove

- It does not run the Android app.
- It does not attach to a phone or glasses device.
- It does not prove foreground-service behavior, TTS audibility, vibration feel, projected display visibility, DAT connectivity, Android XR runtime behavior, microphone metadata correctness, or direction accuracy.
- It does not replace the manual rows in `docs/08-device-test-plan.md` or the generated `device-evidence.md`.

## Current Result

The current generated report is:

```text
data/runs/20260528_voice_direction_mvp/52-service-readiness-audit/service-readiness-audit.md
```

Current status:

- Internal prototype: ready.
- Phone private alpha: not ready; fourteen physical-phone manual evidence rows remain open.
- Glasses private alpha: blocked by phone evidence plus Meta DAT credentials, Ray-Ban Display proof, and Android XR proof.
- External beta: blocked by encrypted-storage device proof, production speaker model, and tester/policy review.
- Production service: blocked by front/back direction evidence and store/SDK policy clearance; the policy clearance matrix, privacy/Data Safety draft, store review package draft, release artifact/signing runbook, release-note/versioning draft, screenshot/media runbook, production speaker model evaluation draft, direction accuracy evidence draft, direction validation evidence snapshot contract, direction validation ADB recorder, controlled direction-trial session, direction evidence extractor, phone-runner direction evidence integration, release readiness UI, release readiness next-action UI, phone-private-alpha evidence runner/validator, service gate assertions, support drill evidence draft, support drill session automation, glasses setup readiness gate, glasses hardware evidence gate, glasses hardware session automation, private-alpha rehearsal automation, hardware-day private-alpha runner, hardware-day readiness preflight, platform source freshness automation, direction cue output contract, glasses-private-alpha evidence runner, hardware test operator pack, hardware test promotion validator, hardware test status dashboard, hardware next-action brief/executor, phone lane collection readiness, phone lane hardware runner, phone lane post-run review, phone lane ready watcher, evidence privacy scan, and operator-pack privacy scan integration are present but external clearance, public hosting, Play submission, upload-signed release AAB, strict screenshot package, strict model evaluation, strict direction evaluation, strict support drill validation, strict glasses credential validation, strict glasses hardware validation, release-track evidence, and legal/policy review are not done.

## Trial/Error Notes

- The first parser version accidentally treated the Kotlin `data class ReleaseReadinessItem(...)` declaration as a checklist item. The script now filters parsed constructor calls to bodies containing `id =`.
- The audit intentionally treats missing `device-evidence.md` as not-run, not as a script failure. This keeps local no-device development usable while still making the missing physical evidence visible.
- The audit output must stay non-PII. It reports checklist ids, counts, statuses, and file paths only.
- The policy clearance matrix validates the tracking document only; it does not prove Meta, Google Play, Android XR, or legal clearance.
- The privacy/Data Safety draft validates the repository draft only; it does not prove public privacy-policy hosting, Play Console submission, or legal approval.
- The store review submission package validates draft copy and blockers only; it does not prove a Play Console submission, release AAB, screenshots, or review approval.
- The release artifact/signing runbook validates the process only; strict upload-ready validation remains blocked until upload-key signing is configured and a signed release AAB exists.
- The release-note/versioning document validates draft release copy and Gradle version alignment only; it does not prove Play upload or tester availability.
- The screenshot/media runbook validates the capture plan only; strict media validation remains blocked until real non-private screenshots and feature graphic assets exist.
- The production speaker model evaluation document validates the evidence plan only; strict model validation remains blocked until a real model candidate and aggregate evaluation results exist.
- The direction accuracy evidence document validates the evidence plan only; strict direction validation remains blocked until controlled phone/glasses direction trials, microphone metadata, route proof, and latency evidence exist.
- The support drill evidence document validates the evidence plan only; strict drill validation remains blocked until a support channel, deletion verification drill, mistaken-alert incident drill, evidence files, and regenerated service readiness audit exist.
- The glasses setup readiness document validates the secret-free setup template only; strict credential validation remains blocked until local Meta application ID and GitHub Packages token values exist outside source control.
- The glasses hardware evidence document validates the proof plan only; strict glasses hardware validation remains blocked until real Ray-Ban Display, Ray-Ban Gen 1 fallback, Android XR projected, and haptics/fallback evidence exists.
- The glasses hardware session runbook and apply automation validate the evidence workflow only; they do not prove Ray-Ban Display rendering, Ray-Ban Gen 1 fallback, Android XR projected runtime, or glasses-side haptics.
- The private-alpha rehearsal validates the linked evidence workflow only; it does not prove phone private alpha, glasses private alpha, external beta, or production readiness.
- The hardware-day private-alpha runner validates orchestration and records command status only; it does not prove hardware evidence unless run with actual phone, support, and glasses sessions that produce reviewed evidence files.
- The hardware-day readiness preflight validates local execution readiness and recommended runner flags only; it does not prove phone, support, Ray-Ban, or Android XR evidence.
- The platform source freshness check validates source availability and canonical URL alignment only; it does not prove SDK account approval, DAT package access, hardware behavior, or policy clearance.
- The direction cue output contract validates local formatting and UI surfacing only; it does not prove vibration feel, TTS audibility, display visibility, glasses haptics, or direction accuracy.
- The direction validation evidence snapshot validates aggregate field shape only; it does not prove controlled phone/glasses direction accuracy.
- The direction validation ADB recorder validates a repeatable debug input path only; it does not prove algorithmic direction accuracy without a real controlled trial around it.
- The controlled direction-trial session validates test-day planning and privacy shape only; it does not prove direction accuracy until observed rows and aggregate evidence are filled from real hardware.
- The direction evidence extractor validates summary shape and privacy guardrails only; fixture or workflow summaries must not be treated as production direction proof.
- Direction summary target progress validates row-count propagation only; it does not prove direction accuracy until real observed rows and strict production validation pass.
- The direction manifest apply gate validates promotion mechanics only; with fixture evidence it must keep `applyReady=false` and refuse `--write`.
- Phone-runner direction apply dry-run validates automation wiring only; it must never write canonical direction manifest files during phone evidence collection.
- The release readiness UI validates local visibility of checklist status only; it does not approve a private alpha, beta, or production release without matching evidence.
- The release readiness next-action UI validates operator guidance only; it does not prove the suggested phone evidence command was run on hardware.
- The phone-private-alpha evidence runner validates the phone-first automation path only; no-device dry runs do not prove phone evidence.
- The phone-private-alpha runner validator validates summary shape and privacy guardrails only; strict mode must fail until real phone evidence exists.
- The service gate assertion command validates promotion claims only; it does not generate the evidence required to change a gate.
- The glasses-private-alpha evidence runner validates the glasses workflow only; strict mode must fail until real phone and glasses evidence exists.
- The hardware test operator pack validates day-of-test orchestration and privacy shape only; default no-hardware runs must not be treated as phone, glasses, support, beta, or production evidence.
- The hardware test promotion validator classifies operator-pack outputs only; `workflow` and `current-safe` profiles are not release approval, while strict profiles must fail until real evidence exists.
- The hardware test status dashboard summarizes lane readiness only; a ready default lane means workflow safety, not phone/glasses/support/direction/private-alpha evidence.
- The hardware next-action brief orders commands from the dashboard only; it does not run hardware lanes or prove phone/glasses/support evidence.
- The hardware next-action executor runs only ready allow-listed actions; the current successful default execution is still no-hardware workflow evidence only.
- The phone lane ready watcher automates polling and execute/review chaining only; the current no-phone timeout is expected and does not prove physical phone evidence.
- Phone lane collection readiness separates pre-run blockers from post-run evidence gaps; it does not prove phone evidence.
- The phone lane hardware runner refreshes and gates `RUN_PHONE=1`; the current no-phone blocked result is not phone evidence.
- The phone lane post-run reviewer summarizes generated phone evidence readiness; the current blocked result is expected without real `device-evidence.md`.
- The device evidence redaction rule validates generated report shape only; testers still need to review the full report before sharing or using it for promotion evidence.
- The evidence privacy scan checks generated folders without printing matched private text; it does not replace human review before sharing or promotion use.
