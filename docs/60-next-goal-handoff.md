# Next Goal Handoff

Date: 2026-05-28 KST

## Purpose

This handoff is the first file to read when the project goal is resumed.

It summarizes only the current verified state, the unfinished work, and the exact next execution order for the voice-direction glasses app. It intentionally separates internal MVP progress from real service readiness so the next run does not overclaim hardware, Android XR, Meta DAT, front/back direction, or production readiness.

## Scope Control

As of 2026-06-01, keep the next goal narrow and make the Android phone lane the first real hardware step.

Do only work that moves one of these forward:

1. Local no-hardware workflow stays green: build, unit tests, validators, service audit, privacy scan.
2. Stage 117/glasses-lane review remains minimally integrated and explicitly blocked only by real hardware evidence.
3. Android phone integration, ADB install/run, phone alert proof, and phone evidence collection happen first when one authorized phone is attached.
4. Controlled direction session tooling stays ready for front, back, left, and right rows after the phone app run is proven.
5. Glasses/support preflight gaps stay explicit without claiming Meta DAT, Android XR, or glasses haptics support.

Do not spend time on new broad reports, new market research, new release paperwork, extra agent documents, extra wiki expansion, or speculative Android XR/Meta abstractions unless they directly unblock the above sequence.

Reporting rule: report only changed files, commands run, pass/fail result, current blocker, and next command.

## Progress Snapshot

- Real service readiness: 42%.
- Internal MVP and automation foundation: 75-80%.
- Documentation/process coverage: about 95%.
- Android app implementation foundation: about 70%.
- Automation and QA harness: about 85%.
- Real phone hardware evidence: 0% collected in this workspace.
- Real glasses hardware evidence: 0% collected in this workspace.
- Controlled 20-per-direction front/back/left/right rows: 0% collected in this workspace.

The 42% number is the service-readiness estimate, not the amount of code written. The codebase and documents are broad, but production-grade readiness is still blocked by physical evidence.

## Current Build State

- Native Android Kotlin app exists under `apps/voice-direction-glass`.
- The app has a foreground listening-service scaffold, consent/disclosure gates, local-only storage policies, simulated direction flow, phone notification/vibration/TTS output, glasses cue intent contracts, Android XR projected-contract stubs, release-readiness UI, and hardware-test dashboards.
- The project has extensive runbooks and scripts for phone, glasses, support drills, direction evidence extraction, privacy scanning, service-gate assertions, and operator-pack validation.
- The current implementation lock says `current_stage=glasses_lane_post_run_review_minimally_integrated`.
- Stage 117 glasses-lane post-run review is minimally integrated into QA, implementation lock, and service audit. Final report/wiki expansion is intentionally skipped unless a later gate requires it.

## Latest Completed Stage

Stage 116 is the latest broad documentation-integrated stage.

Completed Stage 116 artifacts:

- `scripts/run-phone-lane-when-ready.mjs`
- `docs/58-phone-lane-ready-watcher.md`
- `data/runs/20260528_voice_direction_mvp/116-phone-lane-ready-watcher.md`
- `data/runs/20260528_voice_direction_mvp/116-phone-lane-ready-watcher/phone-lane-ready-watcher.md`
- `data/runs/20260528_voice_direction_mvp/116-phone-lane-ready-watcher/phone-lane-ready-watcher.json`
- QA report entries for phone-lane ready watcher checks.
- Implementation lock updated to `phone_lane_ready_watcher_added`.
- Service-readiness audit regenerated with Stage 116 artifacts.
- Privacy scan passed after the Stage 116 docs/scripts update.

Important Stage 116 verification:

```bash
node --check scripts/run-phone-lane-when-ready.mjs
scripts/run-phone-lane-when-ready.mjs --help
scripts/run-phone-lane-when-ready.mjs --timeout-ms 0 --interval-ms 250 --write-report --json
scripts/scan-evidence-privacy.mjs --write-report --json
```

The no-phone watcher result is expected to time out safely.

## Partially Completed Stage 117

Stage 117 exists and is minimally integrated for readiness tracking.

Created Stage 117 artifacts:

- `scripts/review-glasses-lane-evidence.mjs`
- `docs/59-glasses-lane-post-run-review.md`
- `data/runs/20260528_voice_direction_mvp/117-glasses-lane-post-run-review.md`
- `data/runs/20260528_voice_direction_mvp/117-glasses-lane-post-run-review/glasses-lane-post-run-review.md`
- `data/runs/20260528_voice_direction_mvp/117-glasses-lane-post-run-review/glasses-lane-post-run-review.json`
- `docs/README.md` references for doc 59 and Stage 117.

Verified Stage 117 commands:

```bash
node --check scripts/review-glasses-lane-evidence.mjs
scripts/review-glasses-lane-evidence.mjs --help
scripts/review-glasses-lane-evidence.mjs --write-report --json
```

The current Stage 117 report is correctly blocked:

- `glassesAlphaReady=false`
- Workflow promotion profile passes.
- Default Android XR projected contract passes.
- Operator-pack privacy scan passes with zero violations.
- Strict glasses summary fails.
- Strict glasses-alpha promotion fails.
- Strict Android XR projected contract fails.
- Meta Ray-Ban Display evidence is not ready.
- Ray-Ban Gen 1 fallback evidence is not ready.
- Android XR projected runtime evidence is not ready.
- Haptics proof or documented phone-vibration fallback is ready.

Stage 117 remaining work is hardware-only:

- Real Meta Ray-Ban Display evidence.
- Real Ray-Ban Gen 1 fallback evidence.
- Real Android XR projected runtime evidence.
- Strict glasses-alpha promotion after the above evidence exists.

## Next Goal First Execution Order

Start here on the next goal run.

1. Confirm Stage 117 remains blocked only by missing real glasses evidence.

```bash
node --check scripts/review-glasses-lane-evidence.mjs
scripts/review-glasses-lane-evidence.mjs --help
scripts/review-glasses-lane-evidence.mjs --write-report --json
```

2. Keep service-readiness audit current after evidence changes.

```bash
node scripts/audit-service-readiness.mjs --write-report --report-dir data/runs/20260528_voice_direction_mvp/52-service-readiness-audit
```

3. Skip broad final-report/wiki expansion unless it is required by a gate.

4. Run privacy scans.

```bash
scripts/scan-evidence-privacy.mjs --write-report --json
scripts/scan-evidence-privacy.mjs \
  --path scripts/review-glasses-lane-evidence.mjs \
  --path docs/59-glasses-lane-post-run-review.md \
  --path data/runs/20260528_voice_direction_mvp/117-glasses-lane-post-run-review.md \
  --path data/runs/20260528_voice_direction_mvp/117-glasses-lane-post-run-review \
  --path apps/voice-direction-glass/README.md \
  --path apps/voice-direction-glass/agent-output/implementation.lock.json \
  --path data/canonical/voice-direction-glass.qa-report.json \
  --path data/runs/20260528_voice_direction_mvp/final-report.md \
  --path llm-wiki/wiki/apps/voice-direction-glass.md \
  --json
```

5. Run the real phone lane as the first hardware step.

```bash
scripts/run-phone-lane-when-ready.mjs --execute --write-report --json
scripts/review-phone-lane-evidence.mjs --write-report --json
```

This needs exactly one attached Android phone with USB debugging authorized, the correct app build path, and operator review of the generated non-PII evidence.

6. Keep the controlled direction session ready, then collect rows after the phone app run is proven.

```bash
data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session/commands.sh
```

Target: 20 reviewed rows per direction for front, back, left, and right. Store only aggregate and redacted evidence. Do not store raw audio, private names, transcripts, exact locations, device serials, or Bluetooth identifiers.

7. Run the glasses lane with real hardware after the phone MVP and direction evidence path are proven.

Use the existing operator pack and glasses hardware session pack:

- `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack`
- `data/runs/20260528_voice_direction_mvp/77-glasses-hardware-session-pack`

Required evidence:

- Meta Ray-Ban Display cue proof.
- Ray-Ban Gen 1 fallback proof through phone notification/vibration/TTS or Bluetooth route evidence.
- Android XR projected runtime proof.
- Haptics proof or explicit fallback proof.

Re-run:

```bash
scripts/review-glasses-lane-evidence.mjs --write-report --json
```

## Current Gates

- Internal prototype: structurally ready, but still needs careful local checks after each change.
- Phone private alpha: blocked until real phone runner evidence and post-run review pass.
- Glasses alpha: blocked until real Ray-Ban Display, Ray-Ban Gen 1 fallback, Android XR, and haptics/fallback evidence pass.
- External beta: blocked until phone alpha, glasses alpha, support drills, policy review, screenshot/media package, and privacy/data-safety review pass.
- Production: blocked until model evaluation, controlled direction accuracy, false-positive evidence, long-running reliability, support process, and store review package are complete.

## Do Not Claim Yet

Do not claim any of the following until the matching evidence exists:

- Production readiness.
- Real front/back direction accuracy.
- Raw multi-microphone glasses direction access.
- Meta DAT integration running on Ray-Ban Display.
- Android XR ProjectedContext/Glimmer integration running on hardware.
- Real glasses haptics support.
- Phone alpha readiness.
- Glasses alpha readiness.

## Key Files To Open First

- `docs/60-next-goal-handoff.md`
- `docs/59-glasses-lane-post-run-review.md`
- `docs/58-phone-lane-ready-watcher.md`
- `docs/12-service-readiness-audit.md`
- `docs/06-experiment-log.md`
- `apps/voice-direction-glass/README.md`
- `apps/voice-direction-glass/agent-output/implementation.lock.json`
- `data/canonical/voice-direction-glass.qa-report.json`
- `data/runs/20260528_voice_direction_mvp/final-report.md`
- `llm-wiki/wiki/apps/voice-direction-glass.md`

## Recommended Next Milestone

The next milestone should be:

`Phone-lane real-device run first, then controlled direction rows, then glasses evidence.`

Reason: The active objective prioritizes Android phone build/install/run, phone notification/vibration/TTS proof, and controlled direction rows before Meta Ray-Ban Display, Ray-Ban Gen 1 fallback, and Android XR evidence.
