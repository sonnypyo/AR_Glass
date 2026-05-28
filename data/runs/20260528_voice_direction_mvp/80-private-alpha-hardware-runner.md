# Stage 80: Private Alpha Hardware Runner

Date: 2026-05-28 KST

## Objective

Add a top-level hardware-day runner that can coordinate the existing physical phone, support drill, glasses hardware, and private-alpha rehearsal packs without persisting raw command output.

## Implemented

- Added `scripts/run-private-alpha-hardware-rehearsal.mjs`.
- Added `docs/28-private-alpha-hardware-runner.md`.
- Generated `data/runs/20260528_voice_direction_mvp/80-private-alpha-hardware-runner/hardware-run-summary.md`.
- Generated `data/runs/20260528_voice_direction_mvp/80-private-alpha-hardware-runner/hardware-run-summary.json`.
- Generated `data/runs/20260528_voice_direction_mvp/80-private-alpha-hardware-runner/service-readiness-audit/service-readiness-audit.md`.

## Runner Behavior

Default mode validates linked session packs, dry-runs glasses hardware session apply, runs the top-level private-alpha rehearsal, writes a runner service-readiness audit, and validates the rehearsal folder.

Hardware flags:

- `--run-phone`: executes the physical Android phone session commands.
- `--run-support`: executes the support drill session commands.
- `--run-glasses`: executes the glasses hardware session commands.
- `--skip-private-rehearsal`: skips the top-level rehearsal command when debugging only the child sessions.

## Verification

```bash
node --check scripts/run-private-alpha-hardware-rehearsal.mjs
node scripts/run-private-alpha-hardware-rehearsal.mjs --json
```

Result:

- Script syntax passed.
- Default runner passed.
- Physical phone session validation passed with expected no-hardware warnings in child validators.
- Support drill session validation passed.
- Glasses hardware session validation passed.
- Glasses hardware session apply dry-run passed.
- Top-level private-alpha rehearsal commands passed.
- Runner service-readiness audit was written.
- Private-alpha rehearsal validator passed.

## Remaining Gates

- Phone private alpha is still blocked until an attached Android phone produces validated `device-evidence.md` and manual evidence rows.
- Glasses private alpha is still blocked until phone evidence, Meta DAT credentials, Ray-Ban Display proof, Ray-Ban Gen 1 fallback proof or documented limitation, Android XR projected proof, and strict hardware validation exist.
- External beta and production remain blocked by support drills, public privacy URL, release signing/upload, real screenshots, production speaker model, direction accuracy evidence, and policy/legal review.
