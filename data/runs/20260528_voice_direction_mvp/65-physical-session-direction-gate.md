# Stage 65: Physical Session Direction Gate

Date: 2026-05-28 KST

## What Changed

- Updated `scripts/create-physical-test-session.mjs` to generate `direction-accuracy-checklist.md`.
- Updated `scripts/validate-physical-test-session.mjs` to require the direction checklist and direction validation command markers.
- Regenerated `data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack`.
- Updated `docs/13-physical-test-session-runbook.md`.

## Reasoning

The first hardware session should not only prove that the app runs. It should also preserve the distinction between a smoke-test direction sample and production direction evidence. The session pack now carries that distinction into the manual checklist.

## Verification

```bash
node --check scripts/create-physical-test-session.mjs
node --check scripts/validate-physical-test-session.mjs
node scripts/validate-physical-test-session.mjs data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack --json
bash -n data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack/commands.sh
```

Result: passed. The validator still warns that physical phone, glasses preflight, and session audit outputs are missing, which is expected before hardware is attached.
