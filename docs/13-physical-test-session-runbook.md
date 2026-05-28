# Physical Test Session Runbook

Date: 2026-05-28 KST

## Purpose

This runbook defines the repeatable physical-test session folder used when an Android phone, Meta Ray-Ban Display, Ray-Ban Meta Gen 1, or Android XR target is available.

Generate a session folder:

```bash
scripts/create-physical-test-session.mjs --run-dir data/runs/<run>/physical-test-session
```

For a full test day, prefer the operator pack first so phone, glasses, support, readiness, and service-gate checks share one control surface:

```bash
scripts/create-hardware-test-operator-pack.mjs --force --json
scripts/validate-hardware-test-operator-pack.mjs --json
data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
```

Validate a generated session folder before or after hardware evidence collection:

```bash
scripts/validate-physical-test-session.mjs data/runs/<run>/physical-test-session --json
```

The generated folder includes:

- `README.md`
- `commands.sh`
- `phone-manual-checklist.md`
- `meta-rayban-checklist.md`
- `android-xr-checklist.md`
- `direction-accuracy-checklist.md`
- `privacy-redaction-rules.md`

## Current Session Pack

The current generated session pack is:

```text
data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack
```

It was generated for:

- Phone: physical Android phone.
- Glasses: Meta Ray-Ban Display, Ray-Ban Meta Gen 1, Android XR.

## Expected Flow

1. Read `privacy-redaction-rules.md`.
2. Run the hardware operator pack without flags if this is a coordinated phone/glasses/support test day.
3. Connect an Android phone with USB debugging enabled.
4. Run the generated `commands.sh`, or run the operator pack with `RUN_PHONE=1`.
5. Fill `phone-manual-checklist.md`.
6. If Meta DAT credentials and Ray-Ban hardware are available, fill `meta-rayban-checklist.md`.
7. If Android XR runtime or hardware is available, fill `android-xr-checklist.md`.
8. Generate a controlled direction trial session with `scripts/create-controlled-direction-trial-session.mjs` before a 20-per-direction front/back/left/right pass.
9. Fill `direction-accuracy-checklist.md` before any front/back or four-direction claim.
10. Rerun `scripts/audit-service-readiness.mjs --write-report`.

## What The Generated Commands Do

- Build and test the debug APK.
- Install and smoke-test the app on an attached Android phone.
- Generate `android-phone-smoke/device-evidence.md`.
- Run the debug-only alert output and direction sample broadcasts before collecting the non-PII snapshot.
- Provide `scripts/record-direction-validation-trial.sh` instructions in the phone and direction checklists for controlled expected-vs-observed trial entry.
- Generate `glasses-preflight/glasses-preflight.md`.
- Validate the generated phone evidence.
- Validate the direction accuracy evidence draft and show whether strict direction validation remains blocked.
- Generate and validate `controlled-direction-trial-session` for 20-per-direction direction evidence planning.
- Preserve microphone inventory and active microphone/channel-mapping counts in evidence snapshots without copying audio.
- Generate `service-readiness-audit/service-readiness-audit.md`.
- Validate the whole session folder with `scripts/validate-physical-test-session.mjs`.

## What The Generated Commands Do Not Do

- They do not create Meta DAT credentials.
- They do not prove Ray-Ban Display cue rendering.
- They do not prove Android XR projected runtime.
- They do not prove production direction accuracy.
- They do not run `scripts/record-direction-validation-trial.sh` automatically because a script cannot know the caller's real position.
- They do not fill manual observation rows.
- They do not allow private transcripts, speaker names, raw audio, PCM, embeddings, encrypted payload values, Bluetooth owner names, or private alert text into evidence.

## Trial/Error Notes

- The session folder is separate from the generic evidence template because actual hardware runs need a stable folder where command output, manual checklists, and follow-up readiness audits stay together.
- `commands.sh` intentionally stops if the Android phone smoke test fails. When no ADB phone is attached, this is expected; connect a phone and rerun.
- Meta Ray-Ban and Android XR checklists are present even while blocked so the missing evidence is explicit instead of hidden in prose.
- The direction accuracy checklist is present because direction proof needs controlled aggregate trials, not just a successful smoke test.
- The ADB direction trial recorder is optional session tooling for repeated controlled rows; it improves evidence entry but does not replace controlled positioning notes or strict direction validation.
- The controlled direction trial session is separate from the broader physical session because 80 planned rows, ADB command templates, and aggregate summaries would otherwise make the main checklist too noisy.
- The session validator intentionally warns, rather than fails, when hardware output files do not exist yet.
- The first validator version flagged the privacy rules file because it contains the forbidden example `enc:v1:`. The privacy rule file is now excluded from private-field scanning while all other session text files are scanned.
