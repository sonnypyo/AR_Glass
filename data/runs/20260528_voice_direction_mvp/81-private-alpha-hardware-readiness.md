# Stage 81: Private Alpha Hardware Readiness Preflight

Date: 2026-05-28 KST

## Objective

Add a non-PII preflight that tells the operator whether the machine is ready to run the private-alpha hardware runner with phone, support, or glasses evidence flags.

## Implemented

- Added `scripts/check-private-alpha-hardware-readiness.mjs`.
- Added `docs/29-private-alpha-hardware-readiness-preflight.md`.
- Generated `data/runs/20260528_voice_direction_mvp/81-private-alpha-hardware-readiness/hardware-readiness-preflight.md`.
- Generated `data/runs/20260528_voice_direction_mvp/81-private-alpha-hardware-readiness/hardware-readiness-preflight.json`.

## Privacy Rules

The preflight stores only:

- Toolchain booleans.
- ADB device state counts.
- Session validator status.
- Credential presence booleans.
- Workspace-relative paths.
- Recommended command and next actions.

It does not store ADB serials, Bluetooth names, raw logs, raw audio, transcripts, embeddings, encrypted values, private alert text, or exact locations.

## Verification

```bash
node --check scripts/check-private-alpha-hardware-readiness.mjs
node scripts/check-private-alpha-hardware-readiness.mjs --write-report --json
```

Result:

- Script syntax passed.
- Preflight report was written.
- Session pack validators passed.
- JDK, Android SDK, debug APK, and ADB executable are present.
- Authorized ADB device count is 0, so `--run-phone` is not recommended yet.
- Meta application id and GitHub Packages token are not configured, so DAT work remains blocked.

## Current Recommendation

Run:

```bash
scripts/run-private-alpha-hardware-rehearsal.mjs --json
```

After connecting exactly one authorized Android phone, rerun this preflight. If `canRunPhoneSession=true`, then use:

```bash
scripts/run-private-alpha-hardware-rehearsal.mjs --run-phone --json
```

Add `--run-support` and `--run-glasses` only when those evidence sessions are ready to be filled.
