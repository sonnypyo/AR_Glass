# Agent Guidelines

## Prime Directive

Every agent must preserve the project goal: build a real, testable glasses-linked app that detects a trusted caller's voice and gives a directional cue, while documenting decisions and failures.

## Required Before Coding

- Read `docs/README.md`.
- Read `docs/00-project-charter.md`.
- Read `docs/01-platform-research.md`.
- Check `docs/06-experiment-log.md` for known blockers.
- If touching Meta DAT or Android XR, re-check official docs because both are preview-stage platforms.

## Role Instructions

### Research Agent

- Verify current Meta DAT, Android XR, and device availability.
- Prefer official sources.
- Record source links and dates in `docs/01-platform-research.md`.
- Mark login-gated or unverified claims as unverified.

### Product Agent

- Keep MVP constrained.
- Do not expand into full assistant features before caller detection works.
- Update `docs/02-product-plan.md` and canonical JSON under `data/canonical/`.

### Backend/Privacy Agent

- Default to local encrypted storage.
- Treat voice profiles as sensitive biometric data.
- Never add cloud audio upload without explicit user approval.
- Keep analytics free of PII.

### Mobile Agent

- Build Android native first.
- Use Kotlin and Jetpack Compose.
- Keep Meta DAT and Android XR code behind adapters.
- Use foreground service patterns for listening.
- Add unit tests for event fusion and direction mapping before hardware tests.

### XR/Glasses Agent

- For Meta, follow DAT session lifecycle and MockDeviceKit.
- For Android XR, use projected activity and Compose Glimmer for display glasses.
- Run `scripts/validate-android-xr-projected-contract.mjs --json` before and after Android XR projected launch, dependency, Glimmer, or adapter changes.
- Use `scripts/validate-android-xr-projected-contract.mjs --require-real-android-xr --json` only after ProjectedContext launch, projected-device context access, real adapter replacement, and device/emulator evidence are expected to pass.
- Do not implement fake glasses haptics; use interface stubs until official APIs exist.
- Keep `GlassesHapticsIntent` as an app-side intent contract only until official API/device proof is recorded.

### QA Agent

- Test simulator mode first.
- Test false positives and permission revocation.
- Test session pause/resume/disconnect.
- Record hardware, OS, firmware, SDK version, test result, and failure notes.
- Use `scripts/create-hardware-test-operator-pack.mjs` and `scripts/validate-hardware-test-operator-pack.mjs` before real phone/glasses/support test days.
- Run the generated operator pack once without hardware flags before using `RUN_PHONE=1`, `RUN_GLASSES=1`, or `RUN_SUPPORT=1`.
- Run `scripts/validate-hardware-test-promotion.mjs --profile workflow --json` after every operator-pack run, and strict profiles only after real evidence exists.
- Regenerate `scripts/summarize-hardware-test-status.mjs --write-report --json` after every operator-pack, phone, glasses, support, preflight, or Android XR contract evidence change.
- After a generated `device-evidence.md` contains direction trial counts, run `scripts/extract-direction-evidence-summary.mjs <device-evidence.md> --json` and validate it with `scripts/validate-direction-evidence-summary.mjs --json`.
- For controlled direction trials on an installed debug APK, prefer `scripts/record-direction-validation-trial.sh` when the operator needs a repeatable ADB entry point. Record only direction enums, statuses, confidence buckets, counts, and allow-listed source labels.
- Before a controlled direction test day, generate and validate a session with `scripts/create-controlled-direction-trial-session.mjs` and `scripts/validate-controlled-direction-trial-session.mjs` so front/back/left/right rows, ADB templates, aggregate summaries, and privacy rules are prepared.
- Generated `device-evidence.md` must keep `Device serial` and `Build fingerprint` redacted. Run `scripts/validate-device-evidence.mjs <device-evidence.md> --json` before copying any phone evidence into higher-level reports.
- After any generated evidence/report folder is refreshed, run `scripts/scan-evidence-privacy.mjs <folder-or-report> --write-report --json` so copied private fields fail before release or promotion review.
- Prefer the phone runner or operator pack because `scripts/run-phone-private-alpha-evidence.mjs` now performs direction summary extraction automatically after real `device-evidence.md` exists.
- Use `scripts/validate-direction-evidence-summary.mjs --require-production-direction-candidate --json` only after controlled phone and wearable direction evidence is expected to satisfy the production gate.
- Use `scripts/apply-direction-evidence-summary.mjs <summary.json> --json` for dry-run review, and use `--write` only after strict summary validation is expected to pass.
- Do not manually copy `manifest-update-template.json` into `apps/voice-direction-glass/direction-evidence/manifest.json`.

## Documentation Rules

- Every meaningful decision goes into `docs/06-experiment-log.md`.
- Every new platform constraint goes into `docs/01-platform-research.md`.
- Every architecture change goes into `docs/03-technical-architecture.md`.
- Every implementation milestone gets a run note under `data/runs/<date>_<slug>/`.
- Every hardware-day workflow change updates `docs/40-hardware-test-operator-pack.md`.
- Every hardware promotion profile change updates `docs/41-hardware-test-promotion-validator.md`.
- Every direction evidence extraction or summary-shape change updates `docs/42-direction-evidence-extractor.md`.
- Every direction manifest apply workflow change updates `docs/52-direction-evidence-manifest-apply.md`.
- Every phone-runner direction evidence integration change updates `docs/43-phone-runner-direction-evidence.md`.
- Every Android XR projected launch, dependency, Glimmer, or adapter contract change updates `docs/44-android-xr-projected-contract.md`.
- Every glasses preflight change that adds or changes Android XR projected contract rows updates `docs/45-android-xr-preflight-contract-integration.md`.
- Every hardware status dashboard lane, blocker, strict-profile, or privacy-shape change updates `docs/46-hardware-test-status-dashboard.md`.
- Every generated phone evidence redaction rule or private-field validator change updates `docs/47-device-evidence-redaction.md`.
- Every folder-level evidence privacy scan rule, target, or report-shape change updates `docs/48-evidence-privacy-scan.md`.
- Every operator-pack change that adds, removes, or reorders the built-in privacy scan updates `docs/49-operator-pack-privacy-scan-integration.md`.
- Every debug ADB direction-trial recorder change updates `docs/50-direction-validation-adb-recorder.md`.
- Every controlled direction-trial session generator, validator, template, or privacy-shape change updates `docs/51-controlled-direction-trial-session.md`.

## Forbidden Shortcuts

- Do not claim production readiness without real hardware verification.
- Do not store raw audio silently.
- Do not identify non-enrolled people.
- Do not imply front/back direction is reliable until measured.
- Do not depend on private, reverse-engineered, or jailbreak APIs.
