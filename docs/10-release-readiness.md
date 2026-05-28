# Release Readiness Checklist

Date: 2026-05-28 KST

## Purpose

This document defines the promotion gates for the voice direction glasses app. It separates build-complete prototype work from real-device evidence, wearable SDK integration, external beta readiness, and production service readiness.

The same criteria are represented in app code at:

```text
apps/voice-direction-glass/app/src/main/kotlin/com/voicedirection/glass/qa/ReleaseReadiness.kt
apps/voice-direction-glass/app/src/main/kotlin/com/voicedirection/glass/ui/VoiceDirectionApp.kt
docs/33-release-readiness-ui.md
docs/34-release-readiness-next-actions.md
```

Regenerate the local aggregate view after each evidence run:

```bash
node scripts/audit-service-readiness.mjs --write-report --report-dir data/runs/<run>/service-readiness-audit
```

Validate the current policy clearance matrix before any external beta or production discussion:

```bash
node scripts/validate-policy-clearance-matrix.mjs --json
```

Validate the current privacy policy and Data Safety draft before any Play review discussion:

```bash
node scripts/validate-privacy-data-safety-draft.mjs --json
```

Validate the current store review submission package draft before any release-track discussion:

```bash
node scripts/validate-store-review-submission-package.mjs --json
```

Validate the current release artifact/signing state:

```bash
node scripts/validate-release-artifact-readiness.mjs --json
```

Use strict mode only when an upload-signed release AAB is expected:

```bash
node scripts/validate-release-artifact-readiness.mjs --require-upload-ready --json
```

Validate the current release notes and Gradle versioning state:

```bash
node scripts/validate-release-notes-versioning.mjs --json
```

Validate the current Play screenshot/media package:

```bash
node scripts/validate-play-screenshot-package.mjs --json
```

Use strict mode only after real non-private assets have been captured:

```bash
node scripts/validate-play-screenshot-package.mjs --require-assets --json
```

Validate the current production speaker model evaluation package:

```bash
node scripts/validate-production-speaker-model-readiness.mjs --json
```

Use strict mode only after a real model candidate and aggregate evaluation results exist:

```bash
node scripts/validate-production-speaker-model-readiness.mjs --require-model-ready --json
```

Validate the current direction accuracy evidence package:

```bash
node scripts/validate-direction-accuracy-evidence.mjs --json
```

Extract and validate a generated direction evidence summary after a phone evidence run:

```bash
node scripts/extract-direction-evidence-summary.mjs <device-evidence.md> --json
node scripts/validate-direction-evidence-summary.mjs <direction-evidence-summary.json> --json
node scripts/apply-direction-evidence-summary.mjs <direction-evidence-summary.json> --json
```

Use strict mode only after controlled phone/glasses direction evidence exists:

```bash
node scripts/validate-direction-evidence-summary.mjs <direction-evidence-summary.json> --require-production-direction-candidate --json
node scripts/apply-direction-evidence-summary.mjs <direction-evidence-summary.json> --write --json
node scripts/validate-direction-accuracy-evidence.mjs --require-production-direction-ready --json
```

Validate the current support drill evidence package:

```bash
node scripts/validate-support-drill-evidence.mjs --json
```

Create and validate a support drill session pack before operational rehearsal:

```bash
node scripts/create-support-drill-session.mjs --run-dir data/runs/<run>/support-drill-session --json
node scripts/validate-support-drill-session.mjs data/runs/<run>/support-drill-session --json
```

Use strict mode only after the deletion verification and mistaken-alert incident drills have been run:

```bash
node scripts/validate-support-drill-evidence.mjs --require-drills-ready --json
```

Validate the current Meta DAT / Android XR setup template:

```bash
node scripts/validate-glasses-setup-readiness.mjs --json
```

Use strict mode only after local Meta credentials are configured outside source control:

```bash
node scripts/validate-glasses-setup-readiness.mjs --require-credentials --json
```

Validate the current glasses hardware evidence package:

```bash
node scripts/validate-glasses-hardware-evidence.mjs --json
```

Use strict mode only after real Ray-Ban Display, Ray-Ban Gen 1 fallback, and Android XR projected proof exists:

```bash
node scripts/validate-glasses-hardware-evidence.mjs --require-glasses-alpha-ready --json
```

Create and validate the hardware test operator pack before a real phone/glasses/support test day:

```bash
node scripts/create-hardware-test-operator-pack.mjs --force --json
node scripts/validate-hardware-test-operator-pack.mjs --json
data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
```

Use `RUN_PHONE=1`, `RUN_GLASSES=1`, or `RUN_SUPPORT=1` only when the matching evidence lane is ready.

Validate the operator pack's promotion decision after each run:

```bash
node scripts/validate-hardware-test-promotion.mjs --profile workflow --json
```

Use strict profiles only after real evidence exists:

```bash
node scripts/validate-hardware-test-promotion.mjs --profile phone-alpha --json
node scripts/validate-hardware-test-promotion.mjs --profile glasses-alpha --json
node scripts/validate-hardware-test-promotion.mjs --profile support-ready --json
```

## Status Terms

| Status | Meaning |
| --- | --- |
| `PASS` | Evidence exists in this repository for the current target. |
| `MANUAL_REQUIRED` | The code path exists, but a human/device run must still record evidence. |
| `BLOCKED` | The item needs missing hardware, SDK credentials, policy review, model work, or an external decision before it can pass. |

## Current Target Summary

| Target | Current Result | Why |
| --- | --- | --- |
| Internal prototype | Ready | Gradle tests/build pass, foreground service compiles, no raw PCM persistence is designed into prototype sample paths. |
| Phone private alpha | Not ready | Physical phone smoke test, foreground service runtime loop, TTS audible cue, alert channel preference filtering, debug glasses cue seed, debug Bluetooth route evidence, debug local delete self-check, debug alert output broadcast, debug direction sample broadcast, ADB direction validation trial recorder run, direction validation counts, repository self-check, non-PII evidence snapshot, prototype enrollment/live match, and false-positive run still need device evidence. |
| Glasses private alpha | Blocked | Meta DAT credentials/package access, Ray-Ban Display cue proof, and Android XR projected cue proof are not complete. |
| External beta | Blocked | Encrypted storage exists in code but still needs physical-device migration proof; production-grade on-device speaker verification is now tracked in `docs/21-production-speaker-model-evaluation.md` but no model/evaluation exists; tester-facing consent/limitation copy is not reviewed. |
| Production service | Blocked | Front/back direction evidence and store/SDK policy clearance are blocked; `docs/15-policy-clearance-matrix.md` tracks policy work, `docs/16-privacy-policy-data-safety-draft.md` drafts privacy/Data Safety answers, `docs/17-store-review-submission-package-draft.md` drafts review materials, `docs/18-release-artifact-signing-runbook.md` defines release signing, `docs/19-release-notes-versioning.md` drafts internal-testing release notes, `docs/20-play-screenshot-media-runbook.md` drafts screenshot/media capture, `docs/21-production-speaker-model-evaluation.md` defines model evaluation criteria, `docs/22-direction-accuracy-evidence.md` defines direction accuracy evidence criteria, `docs/23-support-drill-evidence.md` defines support drill evidence criteria, `docs/24-glasses-setup-readiness.md` defines Meta DAT/Android XR setup criteria, and `docs/25-glasses-hardware-evidence.md` defines glasses hardware proof criteria, but no public privacy URL, Play submission, legal review, upload-signed release AAB, release-track evidence, strict screenshot package, strict model evaluation, strict direction evaluation, strict support drill validation, strict glasses credential validation, strict glasses hardware validation, or external clearance has been performed. |

## Phone Private Alpha Gate

The phone-only private alpha is the next realistic target. Before treating it as ready, complete these evidence items:

1. Run `scripts/android-device-smoke-test.sh --write-evidence` with a physical Android phone attached.
2. Confirm the microphone disclosure gate blocks OS microphone permission/audio flow until `마이크 사용 안내` is accepted.
3. Confirm the foreground service starts, stays visible, updates state, backs off on recognition errors, and stops from the notification action.
4. Confirm the direction-only TTS cue is audible on the phone route and any connected Bluetooth glasses route.
5. Generate a controlled direction-trial session, then record direction validation aggregate and per-direction matched/mismatched/unknown counts for front, back, left, and right without storing audio. Use the app UI or `scripts/record-direction-validation-trial.sh` after the debug APK is installed.
6. Confirm new speaker profile creation is blocked until explicit consent is selected.
7. Confirm detection processing latency is recorded in the latest event and non-PII evidence snapshot.
8. Confirm alert delivery statuses are persisted without alert message text.
9. Confirm alert channel preference filtering changes the emitted delivery rows for manual simulation and foreground service detections.
10. Confirm `알림 출력 점검` emits only enabled channels without creating a detection event.
11. Confirm the debug glasses cue seed broadcast is script-pass before projected launch and reports only direction/confidence metadata with `labelPresent=false`.
12. Confirm the debug Bluetooth route evidence broadcast is script-pass and reports only route support/count/type metadata without Bluetooth product names.
13. Confirm the debug local delete self-check broadcast is script-pass and reports only before/after counts plus cleared booleans from a separate debug store.
14. Confirm the debug alert output test broadcast is script-pass, includes phone vibration pattern metadata, cue contract markers, glasses haptics intent markers, and the next non-PII snapshot shows `latestDeliverySource=TEST_CUE`.
15. Confirm the debug direction sample test broadcast is script-pass and reports only status, direction evidence, sample counts, and microphone metadata counts.
16. Confirm the debug repository direction-validation self-check is script-pass.
17. Confirm the debug non-PII repository evidence snapshot contains only counts, latency metrics, delivery statuses, microphone disclosure state, latest cue presence/direction, latest audio direction evidence fields, microphone metadata counts, per-direction validation outcome counts, booleans, and enum values.
18. Confirm the debug release readiness snapshot is script-pass and still shows phone private alpha as not ready until manual device rows are completed.
19. Confirm the generated `device-evidence.md` passes `scripts/validate-device-evidence.mjs`.
20. Extract the generated `device-evidence.md` with `scripts/extract-direction-evidence-summary.mjs` and confirm default summary validation passes while `productionDirectionCandidate=false` unless strict controlled direction evidence exists.
21. Run enrollment sample capture and prototype voice match diagnostic with same-speaker and different-speaker attempts.
22. Run at least 30 minutes of indoor false-positive testing.
23. Save the generated `device-evidence.md` under `data/runs/` and fill the manual checklist rows.

## Glasses Private Alpha Gate

Do not call the app glasses-alpha ready until these are complete:

- The hardware test operator pack has been run without hardware flags and then rerun only for lanes where real evidence can be collected.
- The hardware test promotion validator passes the strict `glasses-alpha` profile.
- `scripts/glasses-integration-preflight.sh --write-evidence` has no blocked Meta DAT or Android XR setup rows.
- The generated phone `device-evidence.md` includes a script-pass glasses readiness snapshot showing the current Meta DAT and Android XR open checklist ids.
- Meta Wearables app ID and package access are configured.
- `MetaDatDisplayStubAdapter` is replaced with a real DAT adapter.
- Ray-Ban Display shows the latest actionable cue.
- Ray-Ban Meta Gen 1 fallback behavior is documented.
- Ray-Ban/Android XR Bluetooth HFP fallback route behavior is documented if projected/DAT microphone access is unavailable.
- `GlassesProjectedActivity` runs on Android XR hardware or emulator.
- Any available microphone/channel/direction evidence from wearable hardware is documented.

The app mirrors this gate in `GlassesIntegrationReadiness` and shows it in the host UI. Current result: not ready for glasses private alpha.

## External Beta Gate

External testers require a stricter privacy and model baseline:

- Prove AndroidKeyStore encrypted local storage on a physical phone, including the debug self-check, migration from legacy plaintext preferences, and app restart behavior.
- Replace prototype acoustic feature matching with a selected on-device speaker verification path.
- Define thresholds, false-positive expectations, and fallback behavior.
- Review the in-app tester-facing consent, microphone disclosure, deletion, limitation, and mistaken-alert language now drafted in `VoiceDirectionTesterConsent`.
- Review `docs/16-privacy-policy-data-safety-draft.md`, replace TBD fields, host a public privacy policy URL, and complete Play Data Safety for the exact package and SDK set.
- Review `docs/17-store-review-submission-package-draft.md`, keep public listing copy limited to proven behavior, and prepare non-private screenshots/reviewer instructions.
- Configure release AAB signing with an upload key outside source control and make `scripts/validate-release-artifact-readiness.mjs --require-upload-ready --json` pass before Play upload.
- Keep `docs/19-release-notes-versioning.md` and `apps/voice-direction-glass/release-notes/internal-testing-v0.1.0.md` valid before creating an internal-testing release, and increment `versionCode` before every Play upload attempt.
- Keep `docs/20-play-screenshot-media-runbook.md` valid and make `scripts/validate-play-screenshot-package.mjs --require-assets --json` pass before Play store listing submission.
- Keep `docs/21-production-speaker-model-evaluation.md` valid and make `scripts/validate-production-speaker-model-readiness.mjs --require-model-ready --json` pass before external beta.
- Keep `docs/22-direction-accuracy-evidence.md` valid as a draft, but do not make four-direction or front/back product claims before strict direction validation passes.
- Keep diagnostics non-PII: no transcripts, speaker names, raw audio, PCM, or embedding values.

## Production Service Gate

The service is not production-ready until:

- Front/back/left/right direction claims are backed by controlled hardware evidence and `scripts/validate-direction-accuracy-evidence.mjs --require-production-direction-ready --json` passes.
- The extracted direction summary passes `scripts/validate-direction-evidence-summary.mjs --require-production-direction-candidate --json` before `scripts/apply-direction-evidence-summary.mjs --write --json` is used to update the canonical direction manifest.
- Meta, Android XR, Google Play, biometric, voice, and recording policy requirements are cleared. `docs/15-policy-clearance-matrix.md` is the current tracking matrix; `docs/16-privacy-policy-data-safety-draft.md`, `docs/17-store-review-submission-package-draft.md`, `docs/18-release-artifact-signing-runbook.md`, `docs/19-release-notes-versioning.md`, `docs/20-play-screenshot-media-runbook.md`, `docs/21-production-speaker-model-evaluation.md`, `docs/22-direction-accuracy-evidence.md`, `docs/23-support-drill-evidence.md`, `docs/24-glasses-setup-readiness.md`, and `docs/25-glasses-hardware-evidence.md` are drafts only, not clearance evidence.
- User support, deletion verification, and mistaken-identification incident response are defined and rehearsed, and `scripts/validate-support-drill-evidence.mjs --require-drills-ready --json` passes.
- Production telemetry remains useful without storing PII or voice content.

## Trial/Error Notes

- A build-passing APK is not the same as a phone-private-alpha candidate. The app still needs observed foreground-service behavior on real hardware.
- The prototype embedding path is useful for testing data flow, but it is not a speaker recognition model.
- The current release gate intentionally treats glasses proof as blocked, not merely manual, because SDK credentials and runtime access are not present in this workspace.
- The glasses preflight script now records the exact blocked setup rows before adapter replacement work starts.
- The encrypted storage gate is now manual rather than blocked because the code path exists; it still needs device evidence before external beta.
- Tester-facing consent and microphone disclosure copy now exist in code and UI, but they still need real tester/policy review before external beta.
- The evidence snapshot receiver intentionally reports only counts, statuses, booleans, and enums; raw speaker labels, transcripts, embeddings, preference payloads, and audio must stay out of generated evidence.
- Latest audio direction evidence fields are metadata only; they include direction/status/confidence/sample counts plus microphone inventory and active microphone/channel-mapping counts, not PCM or raw audio.
- The device evidence validator checks report structure and private structured fields, but it does not prove runtime recognition or direction accuracy.
- Processing latency is app-side post-recognition metadata; phone tests must still observe end-to-end runtime behavior.
- Alert delivery persistence stores channel/status only; phone/glasses testers must still observe physical notification, vibration, TTS, and display behavior.
- Alert channel preferences isolate output evidence, but they need physical observation to prove enabled rows match the actual alert output.
- Direct alert-output diagnostics prove routing and delivery bookkeeping only; they do not prove voice detection or direction accuracy.
- Phone vibration pattern metadata proves intended timing shape only; it does not prove the tester felt the vibration or that glasses-side per-side haptics exists.
- Cue contract markers prove intended notification direction, TTS direction-only shape, display evidence metadata, and glasses haptics intent metadata only; they do not prove physical output was seen, heard, or felt.
- The debug glasses cue seed proves app-state handoff for projected preview setup only; it does not prove actual Meta Display, Android XR rendering, or glasses-side haptics.
- The debug Bluetooth route evidence proves Android route visibility/counts only; it does not prove audio quality, direction accuracy, or that a private device name can be exposed in evidence.
- The debug local delete self-check proves repository clear behavior on a separate debug store; the real UI delete button still needs physical observation.
- The debug alert output broadcast now lets ADB produce `TEST_CUE` evidence automatically, but audible TTS, vibration feel, and display visibility still need physical observation.
- The debug direction sample broadcast now lets ADB produce status/evidence/microphone metadata rows automatically, but it still does not prove controlled direction accuracy.
- The release readiness snapshot is automated evidence of gate state only; it does not close manual hardware rows by itself.
- The in-app release readiness card mirrors the same checklist for tester visibility only; it does not approve phone alpha, glasses alpha, beta, or production release without matching evidence.
- The in-app next-action rows show evidence state and the suggested phone-alpha action for operator guidance only; they do not prove the action was executed.
- The glasses readiness snapshot is automated evidence of Meta/Android XR gate state only; it does not replace the separate glasses preflight or real hardware proof.
- The service readiness audit aggregates gate state and local evidence files, but it also does not close manual hardware rows by itself.
- Speaker consent gate blocks accidental local profile creation, but external beta still needs real tester and policy review.
- Microphone disclosure gate blocks microphone-backed actions before OS permission/audio flow, but physical-device evidence and policy review are still required.
- `docs/14-support-incident-process.md` now defines support intake, local deletion verification, mistaken-alert triage, severity, and incident response. It still needs a real support channel and operational drills before production.
- `docs/15-policy-clearance-matrix.md` now records official-source policy requirements and keeps `store-and-sdk-policy-clearance` blocked until external review, Meta logged-in review, Google Play Console review, and voice/recording review are actually complete.
- `docs/16-privacy-policy-data-safety-draft.md` now records a local-first privacy policy and Play Data Safety draft, but it keeps `privacy-consent-copy` manual and `store-and-sdk-policy-clearance` blocked until public hosting, Play Console submission, policy/legal review, and physical-device proof are complete.
- `docs/17-store-review-submission-package-draft.md` now records store listing copy, app-content declarations, reviewer instructions, media requirements, and submission blockers, but it keeps release submission blocked until phone evidence, public privacy URL, Data Safety, release AAB/signing, screenshots, and external review are complete.
- `docs/18-release-artifact-signing-runbook.md` now records the release AAB/upload-key path. A structural `bundleRelease` can run locally, but strict upload-ready validation stays blocked until signing env vars, signed AAB, Play App Signing context, and release evidence exist.
- `docs/19-release-notes-versioning.md` now records the internal-testing release-note draft and version rules. It validates the `0.1.0`/`1` draft only; it does not prove Play upload, tester availability, or external release approval.
- `docs/20-play-screenshot-media-runbook.md` now records the Play screenshot/media capture path. Default validation passes the draft manifest only; strict validation stays blocked until real phone screenshots and feature graphic assets exist.
- `docs/21-production-speaker-model-evaluation.md` now records the production speaker verification model evaluation gate. Default validation passes the draft manifest only; strict validation stays blocked until a real model, thresholds, metrics, anti-spoofing decision, latency evidence, and privacy proof exist.
- `docs/22-direction-accuracy-evidence.md` now records the production direction accuracy evidence gate. Default validation passes the draft manifest only; strict validation stays blocked until controlled phone/glasses direction trials, microphone metadata, route proof, latency evidence, and privacy proof exist.
- `docs/23-support-drill-evidence.md` now records the support drill evidence gate. Default validation passes the draft manifest only; strict validation stays blocked until a real support channel, deletion verification drill, mistaken-alert incident drill, evidence files, and regenerated service readiness audit exist.
- `docs/24-glasses-setup-readiness.md` now records the glasses setup credential/template gate. Default validation passes the secret-free template only; strict validation stays blocked until Meta application ID and GitHub Packages token are configured locally.
- `docs/25-glasses-hardware-evidence.md` now records the glasses hardware proof gate. Default validation passes the draft manifest only; strict validation stays blocked until real Ray-Ban Display, Ray-Ban Gen 1 fallback, Android XR projected, and haptics/fallback evidence exists.
