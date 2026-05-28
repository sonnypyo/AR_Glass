# Platform Source Freshness

Date: 2026-05-28 KST

## Purpose

This document defines the source freshness check for critical Meta Wearables and Android XR references used by Voice Direction Glass.

The check exists because platform docs can move or redirect while the implementation still compiles. A stale source URL can lead to the wrong SDK setup, wrong projected-activity path, or unsupported product claims.

## Command

```bash
node scripts/check-platform-source-freshness.mjs --write-report --json
```

Optional output folder:

```bash
node scripts/check-platform-source-freshness.mjs \
  --write-report \
  --report-dir data/runs/<run>/platform-source-freshness \
  --json
```

## What It Checks

- Meta Wearables developer entry point.
- Meta DAT Android GitHub repository.
- Meta DAT lifecycle canonical URL.
- Android XR Jetpack XR SDK page.
- Android XR audio/display glasses first-activity canonical URL.
- Deprecated Android XR `ai-glasses/first-activity` alias redirect.
- Android XR projected hardware access page.
- Android XR support-different-glasses page.
- Local docs/scripts that must reference the canonical Android XR first-activity URL.

## Current Finding

The current generated report is:

```text
data/runs/20260528_voice_direction_mvp/82-platform-source-freshness/platform-source-freshness.md
```

Current result:

- All checked source URLs returned HTTP 200.
- Android XR pages report Last updated `2026-05-19 UTC`.
- The deprecated Android XR `ai-glasses/first-activity` alias redirects to `glasses/first-activity`.
- The canonical Android XR first-activity URL is now:

```text
https://developer.android.com/develop/xr/jetpack-xr-sdk/glasses/first-activity
```

- Meta DAT lifecycle canonical URL is now:

```text
https://wearables.developer.meta.com/docs/develop/dat/lifecycle-events/
```

## Local Update

The following files were updated to use the current source basis:

- `docs/01-platform-research.md`
- `docs/11-glasses-integration-preflight.md`
- `docs/24-glasses-setup-readiness.md`
- `docs/25-glasses-hardware-evidence.md`
- `scripts/validate-glasses-setup-readiness.mjs`
- `scripts/validate-glasses-hardware-evidence.mjs`
- `scripts/glasses-integration-preflight.sh`

## Release Gate

Run this freshness check after every platform-doc, SDK dependency, Meta DAT setup, Android XR setup, or release-gate source change.

Do not replace the Meta DAT or Android XR stub adapters based on stale local source references.
