# Stage 82: Platform Source Freshness

Date: 2026-05-28 KST

## Objective

Add a network-backed source freshness check for the official Meta Wearables and Android XR URLs that guide the glasses integration.

## Implemented

- Added `scripts/check-platform-source-freshness.mjs`.
- Added `docs/30-platform-source-freshness.md`.
- Generated `data/runs/20260528_voice_direction_mvp/82-platform-source-freshness/platform-source-freshness.md`.
- Generated `data/runs/20260528_voice_direction_mvp/82-platform-source-freshness/platform-source-freshness.json`.
- Updated local Android XR first-activity references to the current canonical `glasses/first-activity` path.
- Updated Meta DAT lifecycle references to the current canonical `/docs/develop/dat/lifecycle-events/` path.
- Regenerated latest glasses preflight evidence with the canonical source basis.

## Verification

```bash
node --check scripts/check-platform-source-freshness.mjs
node scripts/check-platform-source-freshness.mjs --write-report --json
scripts/glasses-integration-preflight.sh --write-evidence --evidence-dir data/runs/20260528_voice_direction_mvp/30-glasses-preflight-evidence
```

Result:

- Script syntax passed.
- Source freshness report passed.
- All checked source URLs returned HTTP 200.
- Deprecated Android XR `ai-glasses/first-activity` alias redirects to the canonical `glasses/first-activity` URL.
- Android XR pages report Last updated `2026-05-19 UTC`.
- Local canonical reference checks passed.
- Latest glasses preflight evidence was regenerated with canonical source URLs.

## Current Constraints

- This check proves source availability and canonical URL alignment only.
- It does not prove Meta account approval, DAT package access, Android XR runtime availability, Ray-Ban Display rendering, or microphone direction behavior.
