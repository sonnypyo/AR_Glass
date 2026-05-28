# Direction Accuracy Checklist

Generated: 2026-05-28T12:17:16+09:00

Use this checklist before changing `front-back-direction-evidence` or making any front/back or four-direction claim. Record only aggregate counts, statuses, booleans, enum values, confidence buckets, latency buckets, and route/device-class notes. Do not paste raw audio, PCM, transcripts, speaker names, raw embeddings, private alert text, or Bluetooth owner names.

## Validation Commands

- [ ] `node scripts/validate-direction-accuracy-evidence.mjs --json` passes.
- [ ] `node scripts/validate-direction-accuracy-evidence.mjs --require-production-direction-ready --json` is blocked until controlled evidence exists, or passes only after the manifest has been deliberately updated with real aggregate evidence.

## Phone Baseline

- [ ] Physical Android phone model recorded as device class only.
- [ ] App posture recorded: handheld / table / pocket-adjacent / glasses-worn companion.
- [ ] Microphone inventory captured from Android microphone APIs.
- [ ] Active microphone metadata captured during sampling.
- [ ] Channel mapping captured when available.
- [ ] Hardware pose or mounting orientation documented.

## Controlled Direction Trials

- [ ] Clear old debug trial rows before a controlled run: `scripts/record-direction-validation-trial.sh --clear`.
- [ ] Optional ADB entry path tested without private labels: `scripts/record-direction-validation-trial.sh --expected LEFT --observed UNKNOWN --source controlled-phone`.
- [ ] Front trials count >= 20 before any front claim.
- [ ] Back trials count >= 20 before any back claim.
- [ ] Left trials count >= 20 before any left claim.
- [ ] Right trials count >= 20 before any right claim.
- [ ] UNKNOWN outcomes preserved as UNKNOWN.
- [ ] Confident wrong-direction outcomes counted separately.
- [ ] Confidence buckets recorded.
- [ ] p95 direction latency bucket recorded.

## Wearable Routes

- [ ] Ray-Ban Meta Gen 1 Bluetooth HFP route tested as single-microphone fallback only.
- [ ] Meta Ray-Ban Display DAT route tested only after real adapter exists.
- [ ] Android XR projected-context microphone route tested only after projected runtime proof exists.
- [ ] At least one claimed wearable route has controlled evidence before wearable direction copy is used.

## Outcome

- Strict direction validation status: blocked / passed
- Claimed routes:
- Claimed directions:
- Blocking issue ids:
- Next run needed:
