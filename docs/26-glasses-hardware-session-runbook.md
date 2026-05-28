# Glasses Hardware Session Runbook

Date: 2026-05-28 KST

## Purpose

This runbook defines the repeatable folder workflow for collecting real glasses hardware evidence after the draft gate in `docs/25-glasses-hardware-evidence.md`.

The session pack is for Meta Ray-Ban Display, Ray-Ban Meta Gen 1 Bluetooth fallback, Android XR projected runtime, and haptics/fallback evidence. It does not make glasses private alpha ready by itself.

## Generate A Session

```bash
node scripts/create-glasses-hardware-session.mjs --run-dir data/runs/<run>/glasses-hardware-session --tester "<tester label>" --target "Meta Ray-Ban Display / Ray-Ban Meta Gen 1 / Android XR"
```

The generator creates:

- `README.md`
- `commands.sh`
- `meta-rayban-display-evidence.md`
- `rayban-gen1-fallback-evidence.md`
- `android-xr-projected-evidence.md`
- `haptics-fallback-evidence.md`
- `manifest-update-template.json`
- `privacy-redaction-rules.md`

## Validate A Session

```bash
node scripts/validate-glasses-hardware-session.mjs data/runs/<run>/glasses-hardware-session --json
```

The validator checks required files, shell syntax, evidence checklist markers, manifest update paths, privacy guardrails, and optional generated preflight/audit outputs.

## Run The Session Commands

```bash
data/runs/<run>/glasses-hardware-session/commands.sh
```

The command file:

1. Runs `./gradlew --no-daemon test assembleDebug`.
2. Runs the glasses setup validator.
3. Runs the glasses hardware draft validator.
4. Confirms strict glasses hardware validation is still blocked before real evidence.
5. Writes glasses preflight evidence into the session folder.
6. Validates the session folder.
7. Writes a service-readiness audit into the session folder.
8. Re-validates the session folder.

## Run The Glasses-Lane Runner

After validating or updating a session, write a non-PII lane summary:

```bash
scripts/run-glasses-private-alpha-evidence.mjs --session-dir data/runs/<run>/glasses-hardware-session --report-dir data/runs/<run>/glasses-alpha-runner --json
```

Only add `--run-session` when the hardware session should actually execute:

```bash
scripts/run-glasses-private-alpha-evidence.mjs --session-dir data/runs/<run>/glasses-hardware-session --report-dir data/runs/<run>/glasses-alpha-runner --run-session --json
```

Validate the summary:

```bash
scripts/validate-glasses-private-alpha-evidence-runner.mjs data/runs/<run>/glasses-alpha-runner/glasses-alpha-evidence-summary.json --json
```

Strict summary validation must fail until the session and service gates prove glasses private alpha:

```bash
scripts/validate-glasses-private-alpha-evidence-runner.mjs data/runs/<run>/glasses-alpha-runner/glasses-alpha-evidence-summary.json --require-glasses-alpha-candidate --json
```

For an actual test day, prefer the top-level operator pack so phone, glasses, support, readiness, and service-gate checks stay grouped:

```bash
scripts/create-hardware-test-operator-pack.mjs --force --json
scripts/validate-hardware-test-operator-pack.mjs --json
data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
RUN_GLASSES=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
```

## Evidence Rules

Record only:

- Pass/fail/manual/blocking status.
- Counts.
- Booleans.
- Enum values.
- Non-private lifecycle labels.
- Command names.
- Workspace-relative evidence paths.

Do not paste raw audio, PCM, transcripts, speaker names, contact names, voice embeddings, encrypted payload values, Bluetooth owner/device names, MAC addresses, private alert text, or exact locations.

## Promotion Rule

After a real hardware session:

1. Review every evidence file for private data.
2. Dry-run the manifest apply step:

```bash
node scripts/apply-glasses-hardware-session.mjs data/runs/<run>/glasses-hardware-session --json
```

3. Apply only after the dry-run is clean and the session evidence has been reviewed:

```bash
node scripts/apply-glasses-hardware-session.mjs data/runs/<run>/glasses-hardware-session --write --json
```

4. Run:

```bash
node scripts/validate-glasses-hardware-evidence.mjs --require-glasses-alpha-ready --json
```

5. Regenerate service readiness audit.

Strict validation must keep failing until the manifest points to real evidence files and the relevant Ray-Ban Display, Ray-Ban Gen 1 fallback, Android XR, and haptics/fallback fields are deliberately proven.

Draft session manifests are refused by the apply script in `--write` mode unless `--allow-draft` is explicitly provided. This prevents a template folder from accidentally replacing the canonical hardware manifest.

## Current Session

The current generated session pack is:

```text
data/runs/20260528_voice_direction_mvp/77-glasses-hardware-session-pack
```

Current result:

- Session generator ran.
- Session validator passed.
- `commands.sh` ran.
- Preflight evidence was written under the session folder.
- Service-readiness audit was written under the session folder.
- Strict glasses hardware validation remains blocked because no real Ray-Ban Display, Ray-Ban Gen 1 fallback, or Android XR hardware proof has been collected.
