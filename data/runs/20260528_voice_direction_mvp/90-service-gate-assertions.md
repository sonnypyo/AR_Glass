# Stage 90: Service Gate Assertions

Date: 2026-05-28 KST

## Decision

Add a service gate assertion command that prevents accidental promotion claims.

## Reasoning

The project now has many validators and summaries. The next risk is not missing a script; it is interpreting a partial run as a release gate. A single assertion command gives CI or a hardware operator a clear pass/fail for the intended profile.

## Implemented

- `scripts/assert-service-gates.mjs`.
- `current-safe` profile for the current repository state.
- `internal-prototype`, `phone-alpha`, `glasses-alpha`, and `production` profiles.
- `docs/37-service-gate-assertions.md`.

## Trial/Error Notes

- `current-safe` passes with a warning that device evidence is missing.
- `phone-alpha` fails as expected because `device-evidence.md` is missing and phone-private-alpha open ids remain.
- Promotion profiles are strict and should only pass after the underlying evidence and validators pass.

## Verification

```bash
node --check scripts/assert-service-gates.mjs
scripts/assert-service-gates.mjs --profile current-safe --json
scripts/assert-service-gates.mjs --profile internal-prototype --json
scripts/assert-service-gates.mjs --profile phone-alpha --json
```

Result:

- Syntax check passed.
- `current-safe` passed.
- `internal-prototype` passed.
- `phone-alpha` failed as expected.
