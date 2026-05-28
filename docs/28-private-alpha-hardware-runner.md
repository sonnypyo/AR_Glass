# Private Alpha Hardware Runner

Date: 2026-05-28 KST

## Purpose

This document defines the hardware-day runner for Voice Direction Glass private-alpha rehearsal.

The runner does not replace phone, support, or glasses evidence packs. It coordinates them, records command status, and writes a non-PII summary so a real hardware session can be repeated without losing the service-readiness trail.

## Default Command

```bash
node scripts/run-private-alpha-hardware-rehearsal.mjs --json
```

For operator-led hardware days, prefer the newer generated operator pack first:

```bash
scripts/create-hardware-test-operator-pack.mjs --force --json
scripts/validate-hardware-test-operator-pack.mjs --json
data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
```

Default mode:

1. Validates the physical phone session pack.
2. Validates the support drill session pack.
3. Validates the glasses hardware session pack.
4. Dry-runs glasses hardware manifest apply.
5. Runs the top-level private-alpha rehearsal commands.
6. Writes a service-readiness audit under the runner folder.
7. Validates the private-alpha rehearsal folder.

## Hardware-Day Command

Before choosing hardware flags, run:

```bash
node scripts/check-private-alpha-hardware-readiness.mjs --write-report --json
```

Use these flags only when the matching hardware or operational drill is actually ready:

```bash
node scripts/run-private-alpha-hardware-rehearsal.mjs \
  --run-phone \
  --run-support \
  --run-glasses \
  --json
```

`--run-phone` should be used with a physical Android phone connected over ADB. If no device is attached, the runner writes the summary and exits non-zero after the phone session command fails.

`--run-support` should be used after the deletion verification and mistaken-alert incident drill owners are ready to fill the support drill evidence files.

`--run-glasses` should be used when Meta Ray-Ban Display, Ray-Ban Meta Gen 1 fallback, or Android XR projected-runtime evidence can be collected.

## Output

The default output folder is:

```text
data/runs/20260528_voice_direction_mvp/80-private-alpha-hardware-runner
```

Generated files:

- `hardware-run-summary.md`: human-readable non-PII run summary.
- `hardware-run-summary.json`: machine-readable run summary.
- `service-readiness-audit/service-readiness-audit.md`: refreshed service-readiness audit for the runner.

The summary stores command labels, statuses, exit codes, timestamps, flags, session paths, and next actions only. It must not persist raw command output, raw audio, transcripts, speaker names, embeddings, encrypted payload values, Bluetooth product names, MAC addresses, private alert text, or exact locations.

## Current Result

The default no-hardware runner has passed:

```text
data/runs/20260528_voice_direction_mvp/80-private-alpha-hardware-runner/hardware-run-summary.md
```

Result:

- Physical, support, and glasses session validators passed.
- Glasses hardware session apply dry-run passed.
- Top-level private-alpha rehearsal commands passed.
- Runner service-readiness audit was written.
- Private-alpha rehearsal validator passed.
- Phone private alpha remains blocked because no physical phone evidence was collected.
- Glasses private alpha remains blocked because no real glasses hardware evidence was collected.

## Promotion Rule

Do not treat a passing default runner as private-alpha readiness. It proves that the rehearsal automation path is intact.

Do not treat a passing default operator pack as private-alpha readiness either. It proves orchestration and privacy shape only until `RUN_PHONE=1`, `RUN_GLASSES=1`, or `RUN_SUPPORT=1` collect reviewed evidence.

Phone private alpha still requires a real phone run with validated `device-evidence.md` and completed manual rows.

Glasses private alpha still requires phone evidence first, Meta DAT credentials outside source control, Ray-Ban Display proof, Ray-Ban Gen 1 fallback proof or documented limitation, Android XR projected proof, and strict glasses hardware validation.
