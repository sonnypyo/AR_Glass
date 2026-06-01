# Service Readiness Audit

Generated: 2026-06-01T15:44:32+09:00

## Purpose

This audit ties the implemented app, release checklist, glasses readiness checklist, and local evidence files into one service-readiness view. It is meant to be regenerated after every physical phone or glasses test.

## Target Summary

| Target | Ready | Total | Pass | Manual | Blocked | Open Blocking IDs |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| INTERNAL_PROTOTYPE | yes | 3 | 3 | 0 | 0 | - |
| PHONE_PRIVATE_ALPHA | no | 18 | 4 | 14 | 0 | physical-phone-smoke, foreground-service-runtime-loop, tts-direction-device-qa, direction-validation-device-qa, repository-self-check-device-qa, evidence-snapshot-device-qa, debug-alert-output-device-qa, debug-direction-sample-device-qa, debug-glasses-cue-seed-device-qa, debug-bluetooth-route-evidence-device-qa, debug-local-delete-self-check-device-qa, alert-channel-preferences-device-qa, prototype-enrollment-device-qa, false-positive-run |
| GLASSES_PRIVATE_ALPHA | no | 21 | 4 | 14 | 3 | physical-phone-smoke, foreground-service-runtime-loop, tts-direction-device-qa, direction-validation-device-qa, repository-self-check-device-qa, evidence-snapshot-device-qa, debug-alert-output-device-qa, debug-direction-sample-device-qa, debug-glasses-cue-seed-device-qa, debug-bluetooth-route-evidence-device-qa, debug-local-delete-self-check-device-qa, alert-channel-preferences-device-qa, prototype-enrollment-device-qa, false-positive-run, meta-dat-credentials, meta-display-cue, android-xr-device-proof |
| EXTERNAL_BETA | no | 24 | 4 | 16 | 4 | physical-phone-smoke, foreground-service-runtime-loop, tts-direction-device-qa, direction-validation-device-qa, repository-self-check-device-qa, evidence-snapshot-device-qa, debug-alert-output-device-qa, debug-direction-sample-device-qa, debug-glasses-cue-seed-device-qa, debug-bluetooth-route-evidence-device-qa, debug-local-delete-self-check-device-qa, alert-channel-preferences-device-qa, prototype-enrollment-device-qa, false-positive-run, meta-dat-credentials, meta-display-cue, android-xr-device-proof, encrypted-local-storage, production-speaker-model, privacy-consent-copy |
| PRODUCTION_SERVICE | no | 27 | 4 | 17 | 6 | physical-phone-smoke, foreground-service-runtime-loop, tts-direction-device-qa, direction-validation-device-qa, repository-self-check-device-qa, evidence-snapshot-device-qa, debug-alert-output-device-qa, debug-direction-sample-device-qa, debug-glasses-cue-seed-device-qa, debug-bluetooth-route-evidence-device-qa, debug-local-delete-self-check-device-qa, alert-channel-preferences-device-qa, prototype-enrollment-device-qa, false-positive-run, meta-dat-credentials, meta-display-cue, android-xr-device-proof, encrypted-local-storage, production-speaker-model, privacy-consent-copy, front-back-direction-evidence, store-and-sdk-policy-clearance, support-incident-process |

## Glasses Summary

| Platform | Ready For Glasses Alpha | Total | Pass | Manual | Blocked | Open Blocking IDs |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| META_DAT | no | 6 | 0 | 2 | 4 | meta-dat-credentials, meta-dat-real-adapter, meta-rayban-display-proof, rayban-bluetooth-hfp-route-proof, wearable-direction-evidence, glasses-haptics-api-proof |
| ANDROID_XR | no | 4 | 1 | 2 | 1 | android-xr-runtime-proof, android-xr-real-adapter, android-xr-bluetooth-hfp-route-proof |

## Local Evidence

| Evidence | Status | Notes |
| --- | --- | --- |
| Debug APK | present | apps/voice-direction-glass/app/build/outputs/apk/debug/app-debug.apk |
| Project charter | present | docs/00-project-charter.md |
| Service development process | present | docs/05-service-development-process.md |
| Device test plan | present | docs/08-device-test-plan.md |
| Release readiness checklist | present | docs/10-release-readiness.md |
| Glasses preflight guide | present | docs/11-glasses-integration-preflight.md |
| Canonical QA report | present | data/canonical/voice-direction-glass.qa-report.json |
| Support incident process | present | docs/14-support-incident-process.md |
| Policy clearance matrix | present | docs/15-policy-clearance-matrix.md |
| Privacy/Data Safety draft | present | docs/16-privacy-policy-data-safety-draft.md |
| Store review submission package | present | docs/17-store-review-submission-package-draft.md |
| Release artifact signing runbook | present | docs/18-release-artifact-signing-runbook.md |
| Release notes versioning | present | docs/19-release-notes-versioning.md |
| Play screenshot media runbook | present | docs/20-play-screenshot-media-runbook.md |
| Production speaker model evaluation | present | docs/21-production-speaker-model-evaluation.md |
| Direction accuracy evidence | present | docs/22-direction-accuracy-evidence.md |
| Support drill evidence | present | docs/23-support-drill-evidence.md |
| Support drill manifest | present | apps/voice-direction-glass/support-drills/manifest.json |
| Support drill session generator | present | scripts/create-support-drill-session.mjs |
| Support drill session validator | present | scripts/validate-support-drill-session.mjs |
| Glasses setup readiness | present | docs/24-glasses-setup-readiness.md |
| Glasses setup validator | present | scripts/validate-glasses-setup-readiness.mjs |
| Local properties example | present | apps/voice-direction-glass/local.properties.example |
| Glasses hardware evidence | present | docs/25-glasses-hardware-evidence.md |
| Glasses hardware manifest | present | apps/voice-direction-glass/glasses-evidence/manifest.json |
| Glasses hardware validator | present | scripts/validate-glasses-hardware-evidence.mjs |
| Glasses hardware session runbook | present | docs/26-glasses-hardware-session-runbook.md |
| Glasses hardware session generator | present | scripts/create-glasses-hardware-session.mjs |
| Glasses hardware session validator | present | scripts/validate-glasses-hardware-session.mjs |
| Glasses hardware session apply | present | scripts/apply-glasses-hardware-session.mjs |
| Private alpha rehearsal runbook | present | docs/27-private-alpha-rehearsal-runbook.md |
| Private alpha rehearsal generator | present | scripts/create-private-alpha-rehearsal.mjs |
| Private alpha rehearsal validator | present | scripts/validate-private-alpha-rehearsal.mjs |
| Private alpha hardware runner | present | docs/28-private-alpha-hardware-runner.md |
| Private alpha hardware runner script | present | scripts/run-private-alpha-hardware-rehearsal.mjs |
| Private alpha hardware readiness preflight | present | docs/29-private-alpha-hardware-readiness-preflight.md |
| Private alpha hardware readiness preflight script | present | scripts/check-private-alpha-hardware-readiness.mjs |
| Platform source freshness | present | docs/30-platform-source-freshness.md |
| Platform source freshness script | present | scripts/check-platform-source-freshness.mjs |
| Direction cue output contract | present | docs/31-direction-cue-output-contract.md |
| Direction validation evidence snapshot | present | docs/32-direction-validation-evidence-snapshot.md |
| Release readiness UI | present | docs/33-release-readiness-ui.md |
| Release readiness next actions | present | docs/34-release-readiness-next-actions.md |
| Phone private alpha evidence runner | present | docs/35-phone-private-alpha-evidence-runner.md |
| Phone private alpha evidence runner script | present | scripts/run-phone-private-alpha-evidence.mjs |
| Phone private alpha runner validator | present | docs/36-phone-private-alpha-runner-validator.md |
| Phone private alpha runner validator script | present | scripts/validate-phone-private-alpha-evidence-runner.mjs |
| Service gate assertions | present | docs/37-service-gate-assertions.md |
| Service gate assertion script | present | scripts/assert-service-gates.mjs |
| Glasses haptics intent contract | present | docs/38-glasses-haptics-intent-contract.md |
| Glasses private alpha evidence runner | present | docs/39-glasses-private-alpha-evidence-runner.md |
| Glasses private alpha evidence runner script | present | scripts/run-glasses-private-alpha-evidence.mjs |
| Glasses private alpha runner validator script | present | scripts/validate-glasses-private-alpha-evidence-runner.mjs |
| Hardware test operator pack | present | docs/40-hardware-test-operator-pack.md |
| Hardware test operator pack generator | present | scripts/create-hardware-test-operator-pack.mjs |
| Hardware test operator pack validator | present | scripts/validate-hardware-test-operator-pack.mjs |
| Hardware test promotion validator | present | docs/41-hardware-test-promotion-validator.md |
| Hardware test promotion validator script | present | scripts/validate-hardware-test-promotion.mjs |
| Direction evidence extractor | present | docs/42-direction-evidence-extractor.md |
| Direction evidence extractor script | present | scripts/extract-direction-evidence-summary.mjs |
| Direction evidence summary validator script | present | scripts/validate-direction-evidence-summary.mjs |
| Direction evidence manifest apply gate | present | docs/52-direction-evidence-manifest-apply.md |
| Direction evidence manifest apply script | present | scripts/apply-direction-evidence-summary.mjs |
| Phone runner direction evidence integration | present | docs/43-phone-runner-direction-evidence.md |
| Android XR projected contract | present | docs/44-android-xr-projected-contract.md |
| Android XR projected contract validator script | present | scripts/validate-android-xr-projected-contract.mjs |
| Android XR preflight contract integration | present | docs/45-android-xr-preflight-contract-integration.md |
| Hardware test status dashboard | present | docs/46-hardware-test-status-dashboard.md |
| Hardware test status dashboard script | present | scripts/summarize-hardware-test-status.mjs |
| Latest hardware test status dashboard | present | data/runs/20260528_voice_direction_mvp/99-hardware-test-status-dashboard/hardware-test-status-dashboard.md |
| Hardware dashboard controlled direction session integration | present | data/runs/20260528_voice_direction_mvp/105-hardware-dashboard-controlled-direction-session.md |
| Device evidence redaction | present | docs/47-device-evidence-redaction.md |
| Evidence privacy scan | present | docs/48-evidence-privacy-scan.md |
| Evidence privacy scanner script | present | scripts/scan-evidence-privacy.mjs |
| Latest evidence privacy scan | present | data/runs/20260528_voice_direction_mvp/101-evidence-privacy-scan/evidence-privacy-scan.md |
| Operator pack privacy scan integration | present | docs/49-operator-pack-privacy-scan-integration.md |
| Latest operator pack privacy scan | present | data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/evidence-privacy-scan/evidence-privacy-scan.md |
| Direction validation ADB recorder | present | docs/50-direction-validation-adb-recorder.md |
| Direction validation ADB recorder script | present | scripts/record-direction-validation-trial.sh |
| Direction validation ADB receiver | present | apps/voice-direction-glass/app/src/debug/kotlin/com/voicedirection/glass/qa/DirectionValidationTrialReceiver.kt |
| Direction validation target progress UI | present | data/runs/20260528_voice_direction_mvp/106-direction-validation-target-progress-ui.md |
| Direction target progress evidence snapshot | present | data/runs/20260528_voice_direction_mvp/107-direction-target-progress-evidence-snapshot.md |
| Direction evidence summary target progress | present | data/runs/20260528_voice_direction_mvp/108-direction-evidence-summary-target-progress.md |
| Direction evidence manifest apply stage | present | data/runs/20260528_voice_direction_mvp/109-direction-evidence-manifest-apply.md |
| Phone runner direction apply dry-run stage | present | data/runs/20260528_voice_direction_mvp/110-phone-runner-direction-apply-dry-run.md |
| Hardware next actions | present | docs/53-hardware-next-actions.md |
| Hardware next actions script | present | scripts/recommend-hardware-next-actions.mjs |
| Latest hardware next actions report | present | data/runs/20260528_voice_direction_mvp/111-hardware-next-actions/hardware-next-actions.md |
| Hardware next actions stage | present | data/runs/20260528_voice_direction_mvp/111-hardware-next-actions.md |
| Hardware next action executor | present | docs/54-hardware-next-action-executor.md |
| Hardware next action executor script | present | scripts/run-hardware-next-action.mjs |
| Latest hardware next action execution report | present | data/runs/20260528_voice_direction_mvp/112-hardware-next-action-executor/hardware-next-action-execution.md |
| Hardware next action executor stage | present | data/runs/20260528_voice_direction_mvp/112-hardware-next-action-executor.md |
| Phone lane collection readiness | present | docs/55-phone-lane-collection-readiness.md |
| Phone lane collection readiness stage | present | data/runs/20260528_voice_direction_mvp/113-phone-lane-collection-readiness.md |
| Phone lane hardware runner | present | docs/56-phone-lane-hardware-runner.md |
| Phone lane hardware runner script | present | scripts/run-phone-lane-hardware.mjs |
| Latest phone lane hardware runner report | present | data/runs/20260528_voice_direction_mvp/114-phone-lane-hardware-runner/phone-lane-hardware-runner.md |
| Phone lane hardware runner stage | present | data/runs/20260528_voice_direction_mvp/114-phone-lane-hardware-runner.md |
| Phone lane post-run review | present | docs/57-phone-lane-post-run-review.md |
| Phone lane post-run review script | present | scripts/review-phone-lane-evidence.mjs |
| Latest phone lane post-run review report | present | data/runs/20260528_voice_direction_mvp/115-phone-lane-post-run-review/phone-lane-post-run-review.md |
| Phone lane post-run review stage | present | data/runs/20260528_voice_direction_mvp/115-phone-lane-post-run-review.md |
| Phone lane ready watcher | present | docs/58-phone-lane-ready-watcher.md |
| Phone lane ready watcher script | present | scripts/run-phone-lane-when-ready.mjs |
| Latest phone lane ready watcher report | present | data/runs/20260528_voice_direction_mvp/116-phone-lane-ready-watcher/phone-lane-ready-watcher.md |
| Phone lane ready watcher stage | present | data/runs/20260528_voice_direction_mvp/116-phone-lane-ready-watcher.md |
| Glasses lane post-run review | present | docs/59-glasses-lane-post-run-review.md |
| Glasses lane post-run review script | present | scripts/review-glasses-lane-evidence.mjs |
| Latest glasses lane post-run review report | present | data/runs/20260528_voice_direction_mvp/117-glasses-lane-post-run-review/glasses-lane-post-run-review.md |
| Glasses lane post-run review stage | present | data/runs/20260528_voice_direction_mvp/117-glasses-lane-post-run-review.md |
| Controlled direction trial session | present | docs/51-controlled-direction-trial-session.md |
| Controlled direction trial session generator | present | scripts/create-controlled-direction-trial-session.mjs |
| Controlled direction trial session validator | present | scripts/validate-controlled-direction-trial-session.mjs |
| Latest controlled direction trial session | present | data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session/README.md |
| Latest glasses preflight evidence | present | data/runs/20260528_voice_direction_mvp/30-glasses-preflight-evidence/glasses-preflight.md |
| Latest device evidence report | missing | Run scripts/android-device-smoke-test.sh --write-evidence with a phone attached. |
| Device evidence validator | not-run | No device-evidence.md file found under data/runs. |
| Latest glasses preflight | blocked | pass=15, manual=4, blocked=2 |

## Current Promotion Decision

- Internal prototype: ready.
- Phone private alpha: not ready; physical phone evidence is still required when open ids remain.
- Glasses private alpha: blocked; Meta DAT credentials, real adapters, and wearable proof must close first.
- External beta: blocked; production speaker verification, tester/policy review, and public privacy-policy hosting remain outside the current prototype.
- Production service: blocked; front/back direction evidence, policy clearance, Play/privacy submission package, upload-signed release artifact, release-track notes, strict screenshot package, strict speaker model evaluation, strict direction accuracy evaluation, support/incident drills, and real glasses hardware proof are not proven yet.

## Next Execution Path

1. Connect a physical Android phone and run `scripts/android-device-smoke-test.sh --write-evidence`.
2. Fill the manual rows in the generated `device-evidence.md`, then run `scripts/validate-device-evidence.mjs <device-evidence.md> --json`.
3. Keep `docs/16-privacy-policy-data-safety-draft.md` valid after every SDK or data-flow change.
4. Keep `docs/17-store-review-submission-package-draft.md` valid after every listing, media, SDK, release-track, or review-instruction change.
5. Keep `docs/18-release-artifact-signing-runbook.md` valid after every release artifact, signing, or Play App Signing change.
6. Keep `docs/19-release-notes-versioning.md` valid after every Gradle version, release-note, or Play track change.
7. Keep `docs/20-play-screenshot-media-runbook.md` valid after every screenshot, feature graphic, Android XR media, or Play preview-asset change.
8. Keep `docs/21-production-speaker-model-evaluation.md` valid after every model candidate, threshold, evaluation, latency, or anti-spoofing change.
9. Keep `docs/22-direction-accuracy-evidence.md` valid after every direction algorithm, microphone metadata, controlled trial, route evidence, or platform claim change.
10. Keep `docs/23-support-drill-evidence.md` valid after every support channel, deletion drill, mistaken-alert drill, or support evidence change.
11. Keep `docs/24-glasses-setup-readiness.md` valid after every Meta DAT, Android XR, credential-template, or projected-source change.
12. Keep `docs/25-glasses-hardware-evidence.md` valid after every Ray-Ban Display, Ray-Ban Gen 1 fallback, Android XR projected, or haptics proof change.
13. Generate a glasses hardware session with `scripts/create-glasses-hardware-session.mjs` before copying hardware proof into the canonical manifest.
14. Validate filled glasses hardware sessions with `scripts/validate-glasses-hardware-session.mjs <session-dir> --json`.
15. Dry-run reviewed glasses hardware manifest updates with `scripts/apply-glasses-hardware-session.mjs <session-dir> --json` before using `--write`.
16. Run `scripts/create-private-alpha-rehearsal.mjs` and `scripts/validate-private-alpha-rehearsal.mjs` before any tester-facing private-alpha claim.
17. Run `scripts/run-private-alpha-hardware-rehearsal.mjs --json` for the default hardware-day rehearsal summary, then add `--run-phone`, `--run-support`, or `--run-glasses` only when the matching evidence can be collected.
18. Run `scripts/check-private-alpha-hardware-readiness.mjs --write-report --json` before adding hardware-runner flags on a test day.
19. Run `scripts/check-platform-source-freshness.mjs --write-report --json` after platform docs, source URLs, or SDK assumptions change.
20. Keep `docs/31-direction-cue-output-contract.md` valid after every notification, vibration, TTS, or glasses cue formatting change.
21. Keep `docs/32-direction-validation-evidence-snapshot.md` valid after every direction trial, snapshot, or validator field change.
22. Keep `docs/33-release-readiness-ui.md` valid after every release checklist, readiness snapshot, or readiness UI change.
23. Keep `docs/34-release-readiness-next-actions.md` valid after every phone-alpha evidence, next-action, or operator-facing release card change.
24. Use `scripts/run-phone-private-alpha-evidence.mjs` for the phone-first evidence run before making a phone alpha claim.
25. Validate phone-alpha runner summaries with `scripts/validate-phone-private-alpha-evidence-runner.mjs` and use strict mode only after real phone evidence exists.
26. Assert promotion profiles with `scripts/assert-service-gates.mjs` before any phone alpha, glasses alpha, beta, or production claim.
27. Keep `docs/38-glasses-haptics-intent-contract.md` valid after every haptic target, intensity, pulse, fallback, or platform-claim change.
28. Use `scripts/run-glasses-private-alpha-evidence.mjs` for glasses-lane evidence summaries before any glasses alpha claim.
29. Validate glasses-lane runner summaries with `scripts/validate-glasses-private-alpha-evidence-runner.mjs` and use strict mode only after real glasses and phone evidence exists.
30. Generate and validate hardware operator packs with `scripts/create-hardware-test-operator-pack.mjs` and `scripts/validate-hardware-test-operator-pack.mjs` before the real phone/glasses/support test day.
31. Run the generated operator pack once without hardware flags, then add `RUN_PHONE=1`, `RUN_GLASSES=1`, or `RUN_SUPPORT=1` only when the matching evidence can be collected.
32. Validate operator-pack outputs with `scripts/validate-hardware-test-promotion.mjs --profile workflow --json`; use strict profiles only after matching real evidence exists.
33. Confirm the phone runner generated `direction-evidence/direction-evidence-summary.json` after any real phone `device-evidence.md` run.
34. Extract direction evidence with `scripts/extract-direction-evidence-summary.mjs <device-evidence.md> --json` manually only if using a report outside the phone runner.
35. Validate the Android XR projected contract with `scripts/validate-android-xr-projected-contract.mjs --json`; use strict mode only after ProjectedContext, Glimmer, real adapter, and device evidence exist.
36. Confirm `scripts/glasses-integration-preflight.sh --write-evidence` records Android XR default projected contract pass and strict real projected contract manual-required before adapter work.
37. Regenerate `scripts/summarize-hardware-test-status.mjs --write-report --json` after every operator-pack, phone, glasses, support, Android XR, or preflight evidence change.
38. Run `scripts/recommend-hardware-next-actions.mjs --write-report --json` after the hardware dashboard changes so the day-of-test command order reflects current blockers.
39. Confirm `collectionReadiness.phoneCollectionBlockers` contains only pre-run blockers and `collectionReadiness.phoneEvidenceGaps` contains post-run promotion gaps before using the phone lane.
40. For the next phone pass, run `scripts/run-phone-lane-hardware.mjs --write-report --json`, then add `--execute` only when it reports the phone lane ready.
41. For unattended phone setup, run `scripts/run-phone-lane-when-ready.mjs --write-report --json`; add `--execute` only when the connected phone is the intended test device.
42. After a phone-lane execution, run `scripts/review-phone-lane-evidence.mjs --write-report --json` before changing any phone-alpha claim.
43. Run `scripts/run-hardware-next-action.mjs --execute --write-report --json` only when the selected action is `ready` and should be executed.
44. Confirm generated phone `device-evidence.md` redacts `Device serial` and `Build fingerprint` before promotion review.
45. Run `scripts/scan-evidence-privacy.mjs <evidence-or-report-dir> --write-report --json` after every generated evidence/report folder update and before promotion review.
46. Use `scripts/record-direction-validation-trial.sh` only on installed debug APKs when controlled expected-vs-observed direction trials need repeatable ADB entry.
47. Generate `scripts/create-controlled-direction-trial-session.mjs --json` before any 20-per-direction front/back/left/right hardware pass.
48. Add Meta DAT credentials outside source control and rerun `scripts/glasses-integration-preflight.sh --write-evidence`.
49. Replace stub glasses adapters one platform at a time only after preflight blockers close.
50. Keep this audit report with the run artifacts after every phone/glasses/support session.

## Privacy Guardrail

This audit intentionally reports only checklist ids, counts, statuses, file presence, and validator errors/warnings. It must not include raw audio, transcripts, speaker names, embedding values, encrypted payload values, Bluetooth owner names, or private alert text.

## Source Files

- apps/voice-direction-glass/app/src/main/kotlin/com/voicedirection/glass/qa/ReleaseReadiness.kt
- apps/voice-direction-glass/app/src/main/kotlin/com/voicedirection/glass/devices/GlassesIntegrationReadiness.kt
- scripts/validate-device-evidence.mjs
