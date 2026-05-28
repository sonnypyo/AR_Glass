# Phone Runner Direction Evidence Integration

Date: 2026-05-28 KST

## What Changed

Connected the Stage 95 direction evidence extractor to the phone-private-alpha evidence runner and operator pack flow.

Changed files:

- `scripts/run-phone-private-alpha-evidence.mjs`
- `scripts/validate-phone-private-alpha-evidence-runner.mjs`
- `scripts/create-hardware-test-operator-pack.mjs`
- `scripts/validate-hardware-test-promotion.mjs`
- `docs/35-phone-private-alpha-evidence-runner.md`
- `docs/36-phone-private-alpha-runner-validator.md`
- `docs/40-hardware-test-operator-pack.md`
- `docs/43-phone-runner-direction-evidence.md`

## Current Result

No-device mode remains workflow-only:

- `phonePrivateAlphaCandidate=false`
- `directionEvidence.exists=false`
- `directionEvidence.validatorOk=false`
- `directionEvidence.productionDirectionCandidate=false`

The operator pack default run still passes and does not create hardware evidence.

When `RUN_PHONE=1` is used with exactly one authorized Android phone, the phone runner will now extract and validate direction evidence after `device-evidence.md` exists.

## Verification

Commands run:

```bash
node --check scripts/run-phone-private-alpha-evidence.mjs
node --check scripts/validate-phone-private-alpha-evidence-runner.mjs
node --check scripts/create-hardware-test-operator-pack.mjs
node --check scripts/validate-hardware-test-promotion.mjs
scripts/run-phone-private-alpha-evidence.mjs --skip-build --allow-no-device --evidence-dir data/runs/20260528_voice_direction_mvp/88-phone-private-alpha-evidence-runner/android-phone-smoke --report-dir data/runs/20260528_voice_direction_mvp/88-phone-private-alpha-evidence-runner --json
scripts/validate-phone-private-alpha-evidence-runner.mjs data/runs/20260528_voice_direction_mvp/88-phone-private-alpha-evidence-runner/phone-alpha-evidence-summary.json --json
scripts/validate-phone-private-alpha-evidence-runner.mjs data/runs/20260528_voice_direction_mvp/88-phone-private-alpha-evidence-runner/phone-alpha-evidence-summary.json --require-phone-alpha-candidate --json
scripts/create-hardware-test-operator-pack.mjs --force --json
scripts/validate-hardware-test-operator-pack.mjs --json
data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
scripts/validate-hardware-test-promotion.mjs --profile workflow --write-report --report-dir data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/promotion-validation --json
scripts/validate-hardware-test-promotion.mjs --profile current-safe --json
scripts/validate-hardware-test-promotion.mjs --profile phone-alpha --json
scripts/validate-hardware-test-promotion.mjs --profile glasses-alpha --json
scripts/validate-hardware-test-promotion.mjs --profile support-ready --json
node scripts/audit-service-readiness.mjs --write-report --report-dir data/runs/20260528_voice_direction_mvp/52-service-readiness-audit
JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk ./gradlew --no-daemon test assembleDebug
```

The Gradle command was run from `apps/voice-direction-glass`.

Result:

- Syntax checks passed.
- No-device runner passed and kept phone/direction candidates false.
- Default runner summary validation passed.
- Strict phone-alpha validation failed as expected.
- Operator pack generation, validation, and default no-hardware run passed.
- Promotion validator `workflow` and `current-safe` passed while direction summary validation remained false because no phone evidence exists.
- Promotion validator `phone-alpha`, `glasses-alpha`, and `support-ready` failed as expected without real evidence.
- Service readiness audit was regenerated with `docs/43-phone-runner-direction-evidence.md`.
- Android unit tests and debug APK assembly passed.

## Next Step

Attach exactly one authorized Android phone and run:

```bash
RUN_PHONE=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh
```

Then inspect:

```text
data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/phone-alpha-runner/direction-evidence/
```
