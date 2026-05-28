# Stage 93: Hardware Test Operator Pack

Date: 2026-05-28 KST

## Decision

Add a top-level hardware test operator pack generator and validator.

## Reasoning

The project already had separate phone, glasses, support, and private-alpha rehearsal workflows. A real test day still needed one operator-facing folder that tells the tester what to run first, which hardware lanes are safe to opt into, and how to keep evidence private. The operator pack prevents scattered commands from becoming the de facto process.

## Implemented

- `scripts/create-hardware-test-operator-pack.mjs`
- `scripts/validate-hardware-test-operator-pack.mjs`
- Generated operator pack at `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack`
- `docs/40-hardware-test-operator-pack.md`

## Current No-Hardware Result

- Pack generation passed.
- Pack validator passed before the run.
- Default `commands.sh` passed.
- Hardware readiness preflight wrote a report under the pack.
- `current-safe` service gate passed.
- Phone-private-alpha summary passed with `phonePrivateAlphaCandidate=false`.
- Glasses-private-alpha summary passed with `glassesPrivateAlphaCandidate=false`.
- Phone, glasses, and support hardware lanes were skipped because `RUN_PHONE`, `RUN_GLASSES`, and `RUN_SUPPORT` were not set.
- Service readiness audit was regenerated under the pack.
- Pack validator passed after the run.

## Trial/Error Notes

- The first generated default phone runner command wrote its dry-run evidence path through the phone runner default. The generator now passes an explicit dry-run evidence directory inside the operator pack.
- The operator pack validator checks executable command syntax and privacy shape, but it does not claim physical readiness.
- Hardware opt-in flags remain separate so a phone-only test day does not accidentally run glasses or support commands.

## Verification

```bash
node --check scripts/create-hardware-test-operator-pack.mjs
node --check scripts/validate-hardware-test-operator-pack.mjs
scripts/create-hardware-test-operator-pack.mjs --force --json
scripts/validate-hardware-test-operator-pack.mjs --json
data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
scripts/validate-hardware-test-operator-pack.mjs --json
```

Result:

- Syntax checks passed.
- Generated pack structure passed validation.
- Default no-hardware operator run passed.
- Phone/glasses private alpha remained not-ready because no physical evidence was collected.
