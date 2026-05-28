# Direction Validation Target Progress UI

Date: 2026-05-28 KST

## Goal

Show controlled direction-trial target progress inside the Android app while testers record expected-vs-observed direction rows.

## Why

Strict direction evidence requires at least 20 trials for each of front, back, left, and right. The generated session and dashboard already track the 80-row plan, but the in-app `방향 검증 기록` panel only showed current counts. A tester using the phone during a physical run should also see how many rows remain before the planned evidence target is filled.

## Implemented

- Updated `DirectionValidationSummary` with:
  - `requiredTrialsPerDirection`
  - `requiredTotalTrials`
  - per-direction missing trial counts
  - `missingTotalTrials`
  - `controlledTrialTargetComplete`
- Added `DirectionValidationSummarizer.CONTROLLED_TRIALS_PER_DIRECTION = 20`.
- Updated the `방향 검증 기록` panel to show:
  - target trials per direction
  - current total progress against 80 planned rows
  - total remaining rows
  - remaining front/back/left/right rows
- Added unit coverage for target progress and target-complete states.

## Current Result

- A fresh app session shows the controlled direction target as 20 trials per direction and 80 planned rows.
- Until real trials are recorded, the UI shows all target rows as remaining.
- The UI target is an operator progress aid only. It does not prove direction accuracy or change `productionDirectionCandidate=false`.

## Verification

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
cd apps/voice-direction-glass
./gradlew --no-daemon test assembleDebug
```

Result:

- Unit tests passed.
- Debug APK assembled.
- `DirectionValidationSummarizerTest` covers the 20-per-direction and 80-row target math.

## Trial/Error Notes

- The target counter is based on expected direction row counts, not match accuracy.
- The app still stores only direction enums, status, confidence, sample rate/count, source label, and timestamp for each trial.
- The target-complete flag must not be used as production readiness. Strict direction validation still requires microphone metadata, route proof, latency, privacy proof, and reviewed aggregate evidence.
