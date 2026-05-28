# Service Gate Assertions

Date: 2026-05-28 KST

## Purpose

This document defines the service promotion assertion command. The command reads the current service readiness audit and fails when a promotion profile is claimed before the matching evidence exists.

## Command

```bash
scripts/assert-service-gates.mjs --profile current-safe --json
```

Profiles:

- `current-safe`: internal prototype ready, phone/glasses/beta/production not ready.
- `internal-prototype`: internal prototype ready only.
- `phone-alpha`: phone private alpha ready with validator-passing device evidence.
- `glasses-alpha`: phone and glasses private alpha ready, including Meta DAT and Android XR readiness.
- `production`: all release targets ready.

## Current Expected State

The current repository should pass:

```bash
scripts/assert-service-gates.mjs --profile current-safe --json
scripts/assert-service-gates.mjs --profile internal-prototype --json
```

The current repository should fail:

```bash
scripts/assert-service-gates.mjs --profile phone-alpha --json
scripts/assert-service-gates.mjs --profile glasses-alpha --json
scripts/assert-service-gates.mjs --profile production --json
```

The failure is expected until physical phone evidence, glasses evidence, external beta evidence, and production evidence close their gates.

## Evidence Rules

- `phone-alpha` requires `PHONE_PRIVATE_ALPHA.ready=true`, no open phone ids, and validator-passing `device-evidence.md`.
- `glasses-alpha` additionally requires all glasses platform summaries to be ready.
- `production` requires all release targets ready.
- The assertion command does not replace the underlying validators; it only prevents accidental promotion claims.

## Trial/Error Notes

- `current-safe` is a safety profile, not a launch profile.
- A warning about missing device evidence is acceptable for `current-safe`; it is fatal for hardware promotion profiles.
- Update this document when release target names, profiles, or audit JSON shape changes.

## Verification

```bash
node --check scripts/assert-service-gates.mjs
scripts/assert-service-gates.mjs --profile current-safe --json
scripts/assert-service-gates.mjs --profile internal-prototype --json
scripts/assert-service-gates.mjs --profile phone-alpha --json
```

Expected result:

- `current-safe` passes.
- `internal-prototype` passes.
- `phone-alpha` fails until real phone evidence exists.
