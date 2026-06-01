# Hardware Test Status Dashboard

Generated: 2026-06-01T15:20:23+09:00
Pack: data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack

## Decision

- Current safe workflow: yes
- Phone alpha candidate: no
- Glasses alpha candidate: no
- Controlled direction plan ready: yes
- Controlled direction observed rows complete: no
- Private alpha candidate: no

## Lane Status

| Lane | Status | Command | Blockers |
| --- | --- | --- | --- |
| Default no-hardware workflow | ready | `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh` | - |
| Phone evidence | blocked | `RUN_PHONE=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh` | authorized ADB devices must be exactly 1, current=0 |
| Glasses evidence | blocked | `RUN_GLASSES=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh` | Meta application id missing; GitHub Packages token missing; glasses preflight blocked=3; real Android XR projected contract not ready; glasses private alpha candidate false |
| Support evidence | current | `RUN_SUPPORT=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh` | - |
| Controlled direction trials | current | `data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session/commands.sh` | - |

## Evidence Gaps

| Lane | Evidence gaps after collection |
| --- | --- |
| Default no-hardware workflow | - |
| Phone evidence | real phone device-evidence.md not collected yet; direction summary will be generated only after real phone device-evidence.md exists; direction manifest apply is not ready for canonical promotion; phone private alpha candidate false until manual device evidence rows pass |
| Glasses evidence | - |
| Support evidence | strict support evidence not complete until real owner-reviewed drills exist |
| Controlled direction trials | observed direction rows incomplete: 0/80; production direction candidate false until aggregate evidence is reviewed |

## Key Evidence

- Hardware readiness summary: `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/hardware-readiness/hardware-readiness-preflight.json`
- Phone summary: `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/phone-alpha-runner/phone-alpha-evidence-summary.json`
- Glasses summary: `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/glasses-alpha-runner/glasses-alpha-evidence-summary.json`
- Promotion report: `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/promotion-validation/promotion-validation.json`
- Evidence privacy scan: `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/evidence-privacy-scan/evidence-privacy-scan.json`
- Android XR contract: `data/runs/20260528_voice_direction_mvp/97-android-xr-projected-contract/android-xr-projected-contract.json`
- Controlled direction session: `data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session`

## Current Counts

- Authorized ADB devices: 0
- Glasses preflight: blocked, pass=13, manual=5, blocked=3
- Phone direction summary validated: no
- Phone direction manifest apply dry-run: no
- Phone direction manifest apply ready: no
- Evidence privacy scan: pass, files=18, violations=0
- Android XR contract mode: phone_preview_stub
- Real Android XR candidate: no
- Controlled direction validator: pass
- Controlled direction planned rows: 80
- Controlled direction recorded rows: 0
- Controlled direction TODO rows: 80
- Controlled direction source/route: controlled-phone / phone-built-in-microphones
- Support preparation: ready
- Support strict evidence: blocked

## Next Actions

- Run the default no-hardware workflow before any real evidence lane.
- Keep data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session/trial-plan.csv ready; recorded rows are 0/80.
- Prepare glasses and support evidence gates, but do not claim hardware support without real evidence.
- Support drill preparation is current; strict support evidence remains blocked until real owner-reviewed drills exist.
- Keep `RUN_PHONE=1` last; it still needs exactly one authorized Android phone.
- Keep phone/glasses/support strict promotion profiles blocked until matching real evidence exists.
- Use `scripts/validate-hardware-test-promotion.mjs --profile workflow --json` after every operator-pack run.
- Regenerate this dashboard after any phone, glasses, support, Android XR, or preflight evidence change.

## Privacy Guardrail

This dashboard stores only booleans, counts, statuses, command recommendations, and workspace-relative paths. It must not include raw command output, ADB serials, Bluetooth names, MAC addresses, raw audio, transcripts, speaker names, embeddings, private alert text, exact locations, tokens, or application id values.
