# Private Alpha Rehearsal Runbook

Date: 2026-05-28 KST

## Purpose

This runbook defines the top-level rehearsal for moving Voice Direction Glass from internal prototype toward phone private alpha and later glasses private alpha.

The rehearsal does not replace the child evidence sessions. It links and validates:

- Physical Android phone evidence session.
- Support deletion/mistaken-alert drill session.
- Ray-Ban Display, Ray-Ban Gen 1 fallback, Android XR projected, and haptics/fallback hardware session.

## Generate A Rehearsal

```bash
node scripts/create-private-alpha-rehearsal.mjs --run-dir data/runs/<run>/private-alpha-rehearsal --tester "<tester label>" --json
```

Optional overrides:

```bash
node scripts/create-private-alpha-rehearsal.mjs \
  --run-dir data/runs/<run>/private-alpha-rehearsal \
  --physical-session data/runs/<run>/physical-test-session \
  --support-session data/runs/<run>/support-drill-session \
  --glasses-session data/runs/<run>/glasses-hardware-session \
  --json
```

## Validate A Rehearsal

```bash
node scripts/validate-private-alpha-rehearsal.mjs data/runs/<run>/private-alpha-rehearsal --json
```

The validator checks required files, shell syntax, linked child session validators, privacy guardrails, service-readiness audit output, and expected strict-failure markers.

## Run The Rehearsal

```bash
data/runs/<run>/private-alpha-rehearsal/commands.sh
```

The command file:

1. Runs Gradle `test assembleDebug`.
2. Validates the physical test session structure.
3. Validates the support drill session structure.
4. Validates the glasses hardware session structure.
5. Dry-runs the glasses hardware session apply step.
6. Runs default support/glasses validators.
7. Confirms strict support/glasses gates are still blocked until real evidence exists.
8. Writes a service-readiness audit into the rehearsal folder.
9. Validates the rehearsal folder.

## Current Session

The current generated rehearsal pack is:

```text
data/runs/20260528_voice_direction_mvp/79-private-alpha-rehearsal-pack
```

Current result:

- Rehearsal generator ran.
- Rehearsal validator passed.
- `commands.sh` ran.
- Gradle `test assembleDebug` passed inside the rehearsal command.
- Linked physical/support/glasses session validators passed.
- Strict support, glasses credential, and glasses hardware gates failed as expected because real evidence is not collected.
- Service-readiness audit was written into the rehearsal folder.

## Promotion Rule

Phone private alpha can be considered only after:

- Physical `device-evidence.md` exists and passes validation.
- Manual phone rows in the physical session are filled with aggregate evidence.
- 30-minute false-positive run is recorded.
- Service-readiness audit is regenerated.

Glasses private alpha can be considered only after:

- Phone private alpha evidence exists first.
- Meta DAT credentials and package access are configured outside source control.
- Ray-Ban Display, Ray-Ban Gen 1 fallback, Android XR projected, and haptics/fallback evidence are reviewed.
- `scripts/apply-glasses-hardware-session.mjs <session-dir> --json` passes.
- `scripts/validate-glasses-hardware-evidence.mjs --require-glasses-alpha-ready --json` passes.

This rehearsal is an operational readiness check, not proof of production readiness.
