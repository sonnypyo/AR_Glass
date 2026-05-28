# Stage 85: Direction Validation Evidence Snapshot

Date: 2026-05-28 KST

## Decision

Add per-direction matched, mismatched, and unknown/unusable counts to direction validation UI and generated device evidence.

## Reasoning

The app already recorded expected-vs-observed direction trials, but the summary only exposed total matched/mismatched/unknown counts and per-direction trial totals. For front/back claims, this is too weak: a test report needs to show which direction failed and whether the failure was a wrong direction or an unusable sample.

## Implemented

- `DirectionValidationDirectionStats` for each expected direction.
- `DirectionValidationSummary` now carries front/back/left/right stats.
- `DirectionValidationPanel` shows per-direction match/mismatch/unknown counts.
- `EvidenceSnapshotReceiver` emits per-direction outcome counts in the non-PII snapshot.
- `scripts/validate-device-evidence.mjs` requires those snapshot markers.
- `data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md` includes the stricter direction markers.
- `docs/32-direction-validation-evidence-snapshot.md` records the evidence contract.

## Trial/Error Notes

- Trial totals alone can hide a failed axis. Per-direction outcome counts are needed before any front/back claim.
- These fields still do not prove direction accuracy; they make controlled hardware evidence easier to audit once real trials exist.
- The generated report remains aggregate-only and does not store PCM, transcripts, speaker names, or private room notes.

## Verification

From the repository root:

```bash
node --check scripts/validate-device-evidence.mjs
node scripts/validate-device-evidence.mjs data/runs/20260528_voice_direction_mvp/37-device-evidence-validator-fixture.md --json
```

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
```

Result:

- Validator syntax passed.
- Fixture validation returned `"ok": true`.
- Unit tests passed.
- Debug APK assembled.
