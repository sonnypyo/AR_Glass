# AR Glass Voice Direction

Meta Ray-Ban Display, Ray-Ban Meta Gen 1, and Android XR glasses experiments for a voice-direction alert app.

The product goal is to recognize a previously saved trusted voice, estimate where the caller is relative to the user, and notify the user through glasses cues, phone notifications, vibration, and TTS fallbacks.

## Current Status

- Real service readiness: 42%.
- Internal MVP and automation foundation: 75-80%.
- Documentation/process coverage: about 95%.
- Android app implementation foundation: about 70%.
- Automation and QA harness: about 85%.
- Real phone hardware evidence: 0%.
- Real glasses hardware evidence: 0%.
- Controlled front/back/left/right direction rows: 0%.

The codebase has strong planning, Android scaffolding, and evidence automation, but it is not production-ready until real phone, glasses, Android XR, and controlled direction evidence are collected.

## Repository Map

- `apps/voice-direction-glass`: Android Kotlin app scaffold and implementation.
- `docs`: project charter, platform research, architecture, runbooks, QA gates, service process, and next-goal handoff.
- `scripts`: validation, privacy scan, evidence extraction, hardware runner, and service-readiness automation.
- `data/canonical`: product plan, backend contract, and QA report.
- `data/runs/20260528_voice_direction_mvp`: stage-by-stage implementation and evidence reports.
- `llm-wiki`: agent-readable project wiki.

## Start Here

Read these files first:

- `docs/60-next-goal-handoff.md`
- `docs/README.md`
- `data/runs/20260528_voice_direction_mvp/final-report.md`
- `apps/voice-direction-glass/README.md`

## Important Guardrails

Do not claim production readiness, phone alpha readiness, glasses alpha readiness, real front/back direction accuracy, Meta DAT runtime support, Android XR hardware support, or real glasses haptics support until the matching hardware evidence exists.

Do not commit raw audio, transcripts, private names, exact locations, ADB serials, Bluetooth device names, MAC addresses, tokens, signing keys, or local credential files.

## Next Work

1. Fully integrate Stage 117 glasses-lane post-run review into QA, service audit, final report, lock file, app README, and wiki.
2. Run the phone lane on a real Android device.
3. Collect controlled direction evidence: 20 reviewed rows each for front, back, left, and right.
4. Collect Meta Ray-Ban Display, Ray-Ban Gen 1 fallback, and Android XR projected runtime evidence.
5. Re-run service-readiness, privacy, and promotion gates before making alpha or production claims.
