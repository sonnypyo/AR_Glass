# Private Alpha Hardware Readiness Preflight

Date: 2026-05-28 KST

## Purpose

This document defines the preflight check to run before using the private-alpha hardware runner with real phone, support, Ray-Ban, or Android XR evidence.

The preflight is intentionally non-PII. It reports only toolchain status, ADB device counts, session validator status, credential presence booleans, latest evidence path, and recommended runner command. It must not store ADB serials, Bluetooth names, raw logs, raw audio, transcripts, embeddings, encrypted values, private alert text, or exact locations.

## Command

```bash
node scripts/check-private-alpha-hardware-readiness.mjs --write-report --json
```

The generated hardware operator pack runs this preflight first in its default command:

```bash
data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
```

Optional output folder:

```bash
node scripts/check-private-alpha-hardware-readiness.mjs \
  --write-report \
  --report-dir data/runs/<run>/private-alpha-hardware-readiness \
  --json
```

## What It Checks

- Local JDK availability.
- Android SDK availability.
- Debug APK presence.
- ADB executable presence.
- Authorized, unauthorized, offline, and other ADB device row counts.
- Physical phone session pack validator.
- Support drill session pack validator.
- Glasses hardware session pack validator.
- Private-alpha rehearsal session validator.
- Latest `device-evidence.md` presence and validator status.
- Meta Wearables application id presence without printing the value.
- GitHub Packages token presence without printing the value.
- Latest glasses preflight status.
- Latest default hardware runner summary status.

## Current Result

The current generated preflight report is:

```text
data/runs/20260528_voice_direction_mvp/81-private-alpha-hardware-readiness/hardware-readiness-preflight.md
```

Current result:

- JDK, Android SDK, and debug APK are present.
- ADB executable is present.
- Authorized ADB devices: 0.
- Physical/support/glasses/private-alpha session validators pass.
- Latest physical `device-evidence.md` is missing.
- Meta application id is not configured.
- GitHub Packages token is not configured.
- Glasses preflight remains blocked.
- Recommended command remains the default no-hardware runner: `scripts/run-private-alpha-hardware-rehearsal.mjs --json`.

## Hardware-Day Rule

Use `--run-phone` only when exactly one authorized Android phone is attached over ADB.

Use `--run-glasses` only after the phone path is ready and Ray-Ban/Android XR evidence can actually be collected.

Use `--run-support` only when the deletion verification and mistaken-alert drill evidence owners are ready to fill the support drill pack.

Run the preflight again after every hardware, credential, dependency, or session-pack change.

Run the operator pack once without flags after preflight changes, then add `RUN_PHONE=1`, `RUN_GLASSES=1`, or `RUN_SUPPORT=1` only when the matching readiness conditions are met.
