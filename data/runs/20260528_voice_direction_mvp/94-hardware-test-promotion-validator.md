# Stage 94: Hardware Test Promotion Validator

Date: 2026-05-28 KST

## Decision

Add a promotion validator for generated hardware test operator packs.

## Reasoning

The operator pack created a safe day-of-test command surface, but a separate validator was needed to answer the next question: "Do these pack outputs prove only workflow integrity, or are they enough for phone alpha, glasses alpha, support readiness, or private alpha?"

Without that layer, a passing no-hardware operator run could be misread as a promotion signal. The new validator makes strict promotion checks explicit and intentionally failing until real evidence exists.

## Implemented

- `scripts/validate-hardware-test-promotion.mjs`
- Operator pack `commands.sh` now runs workflow promotion validation and writes:
  - `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/promotion-validation/promotion-validation.json`
  - `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/promotion-validation/promotion-validation.md`
- `docs/41-hardware-test-promotion-validator.md`

## Current Result

- `workflow` profile passes.
- `current-safe` profile passes.
- `phone-alpha` profile fails as expected because phone evidence and phone-alpha service gate are missing.
- `glasses-alpha` profile fails as expected because phone evidence, glasses evidence, and glasses-alpha service gate are missing.
- `support-ready` profile fails as expected because deletion and mistaken-alert support drills have not run.

## Trial/Error Notes

- The first argument parser treated `--profile workflow` as a pack path. The fix skips option values when choosing positional arguments.
- The validator writes summarized promotion evidence only; it does not persist raw child command output.
- `workflow` is not a release approval. It exists to prove that no-hardware orchestration is intact and private data was not introduced into the summary layer.

## Verification

```bash
node --check scripts/validate-hardware-test-promotion.mjs
scripts/validate-hardware-test-promotion.mjs --profile workflow --json
scripts/validate-hardware-test-promotion.mjs --profile current-safe --json
scripts/validate-hardware-test-promotion.mjs --profile phone-alpha --json
scripts/validate-hardware-test-promotion.mjs --profile glasses-alpha --json
scripts/validate-hardware-test-promotion.mjs --profile support-ready --json
data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
```

Result:

- Syntax check passed.
- Workflow/current-safe validation passed.
- Strict phone/glasses/support profiles failed as expected without physical or support evidence.
- Operator pack default command passed and wrote promotion validation reports.
