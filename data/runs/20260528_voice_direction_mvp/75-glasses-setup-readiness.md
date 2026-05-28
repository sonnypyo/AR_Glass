# Stage 75 - Glasses Setup Readiness

Date: 2026-05-28 KST

## Goal

Make Meta DAT and Android XR setup requirements explicit before real glasses hardware testing.

## Changes

- Added `docs/24-glasses-setup-readiness.md`.
- Added `apps/voice-direction-glass/local.properties.example`.
- Added `scripts/validate-glasses-setup-readiness.mjs`.
- Updated Android XR first-activity references from the older `glasses/first-activity` path to the current `ai-glasses/first-activity` path.

## Trial/Error Notes

- The template intentionally keeps every secret value blank.
- Default validation should pass without credentials.
- Strict validation should fail until a local Meta application ID and GitHub Packages token are configured.
- The validator checks only credential presence in strict mode and never prints secret values.

## Verification

Passed:

```bash
node --check scripts/validate-glasses-setup-readiness.mjs
node scripts/validate-glasses-setup-readiness.mjs --json
scripts/glasses-integration-preflight.sh --write-evidence --evidence-dir data/runs/20260528_voice_direction_mvp/30-glasses-preflight-evidence
```

Expected strict failure:

```bash
node scripts/validate-glasses-setup-readiness.mjs --require-credentials --json
```

Result: strict mode fails because `META_WEARABLES_APPLICATION_ID` / `meta_wearables_application_id` and `GITHUB_TOKEN` / `github_token` are not configured on this machine.
