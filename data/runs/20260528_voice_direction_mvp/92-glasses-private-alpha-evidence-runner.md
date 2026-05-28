# Stage 92: Glasses Private Alpha Evidence Runner

Date: 2026-05-28 KST

## Decision

Add a glasses-specific private-alpha evidence runner and validator.

## Reasoning

The project already has a generated glasses hardware session pack and a top-level private-alpha hardware rehearsal runner. The missing piece was a narrow command that answers one question for the glasses lane: "Does the current Ray-Ban/Android XR evidence make this a glasses-private-alpha candidate?" A dedicated runner lets the tester rerun that check without also running phone/support workflows.

## Implemented

- `scripts/run-glasses-private-alpha-evidence.mjs`
- `scripts/validate-glasses-private-alpha-evidence-runner.mjs`
- Default summary output under `data/runs/20260528_voice_direction_mvp/92-glasses-private-alpha-evidence-runner/`.
- `docs/39-glasses-private-alpha-evidence-runner.md`.

## Current No-Hardware Result

- The generated session pack validates.
- The glasses hardware draft manifest validates.
- Strict glasses hardware validation fails as expected.
- Manifest apply dry-run passes.
- Glasses-alpha service gate fails as expected.
- Service readiness audit is regenerated under the runner report folder.
- `glassesHardwareEvidenceCandidate=false`.
- `glassesPrivateAlphaCandidate=false`.
- Raw command output is not persisted.

## Trial/Error Notes

- The runner treats strict failures as expected in no-hardware mode, but strict candidate validation still fails.
- `--run-session` is opt-in so the user can choose when to actually refresh preflight and hardware-session evidence.
- The generated summary separates glasses hardware evidence candidate from full glasses private alpha candidate, because the latter also depends on the broader service gate.

## Verification

```bash
node --check scripts/run-glasses-private-alpha-evidence.mjs
node --check scripts/validate-glasses-private-alpha-evidence-runner.mjs
scripts/run-glasses-private-alpha-evidence.mjs --json
scripts/validate-glasses-private-alpha-evidence-runner.mjs --json
scripts/validate-glasses-private-alpha-evidence-runner.mjs --require-glasses-alpha-candidate --json
```

Result:

- Syntax checks passed.
- Default runner and summary validator passed.
- Strict summary validator failed as expected until real glasses alpha evidence exists.
