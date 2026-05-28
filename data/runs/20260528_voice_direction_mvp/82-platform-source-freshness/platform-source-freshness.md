# Platform Source Freshness

Generated: 2026-05-28T11:13:05+09:00

## Purpose

This report checks critical official Meta Wearables and Android XR source URLs used by Voice Direction Glass. It stores only status, redirect, final URL, page title, Last updated date when available, and local canonical-reference checks. It does not store source page bodies or credentials.

## Source Checks

| Source | OK | HTTP | Redirected | Login Gate | Last Updated UTC | Final URL |
| --- | --- | ---: | --- | --- | --- | --- |
| Meta Wearables develop docs | yes | 200 | no | no | - | https://wearables.developer.meta.com/docs/develop |
| Meta DAT Android GitHub | yes | 200 | no | no | - | https://github.com/facebook/meta-wearables-dat-android |
| Meta DAT lifecycle | yes | 200 | no | no | - | https://wearables.developer.meta.com/docs/develop/dat/lifecycle-events/ |
| Android XR Jetpack XR SDK | yes | 200 | no | no | 2026-05-19 | https://developer.android.com/develop/xr/jetpack-xr-sdk?hl=en |
| Android XR glasses first activity | yes | 200 | no | no | 2026-05-19 | https://developer.android.com/develop/xr/jetpack-xr-sdk/glasses/first-activity?hl=en |
| Deprecated Android XR ai-glasses first activity alias | yes | 200 | yes | no | 2026-05-19 | https://developer.android.com/develop/xr/jetpack-xr-sdk/glasses/first-activity?hl=en |
| Android XR projected hardware access | yes | 200 | no | no | 2026-05-19 | https://developer.android.com/develop/xr/jetpack-xr-sdk/access-hardware-projected-context?hl=en |
| Android XR support different glasses | yes | 200 | no | no | 2026-05-19 | https://developer.android.com/develop/xr/jetpack-xr-sdk/glasses/support-different-types?hl=en |

## Local Canonical Reference Checks

| File | OK | Canonical URL | Deprecated Full URL |
| --- | --- | --- | --- |
| docs/01-platform-research.md | yes | yes | no |
| docs/11-glasses-integration-preflight.md | yes | yes | no |
| docs/24-glasses-setup-readiness.md | yes | yes | no |
| docs/25-glasses-hardware-evidence.md | yes | yes | no |
| scripts/validate-glasses-setup-readiness.mjs | yes | yes | no |
| scripts/validate-glasses-hardware-evidence.mjs | yes | yes | no |
| scripts/glasses-integration-preflight.sh | yes | yes | no |

## Current Finding

- Android XR first-activity canonical URL: https://developer.android.com/develop/xr/jetpack-xr-sdk/glasses/first-activity
- Deprecated alias checked: https://developer.android.com/develop/xr/jetpack-xr-sdk/ai-glasses/first-activity
- Meta Wearables pages may return a login gate; that is acceptable only for Meta authenticated documentation checks and still means account review is required before live DAT work.

## Next Actions

- Regenerate this report after platform docs, source URLs, SDK dependencies, or release-gate assumptions change.
- Keep `docs/01-platform-research.md`, `docs/24-glasses-setup-readiness.md`, and `docs/25-glasses-hardware-evidence.md` synchronized with this report.
