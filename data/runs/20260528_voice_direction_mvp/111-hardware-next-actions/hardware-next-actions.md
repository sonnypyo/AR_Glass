# Hardware Next Actions

Generated: 2026-06-01T12:49:23+09:00
Source dashboard: data/runs/20260528_voice_direction_mvp/99-hardware-test-status-dashboard/hardware-test-status-dashboard.json

## Decision

- Recommendation: default_workflow_ready_attach_phone_next
- Current safe workflow: true
- Authorized ADB devices: 0
- Phone manifest apply ready: false
- Controlled direction rows: 0/80

## Ordered Actions

| Priority | Status | Action | Command | Blockers |
| ---: | --- | --- | --- | --- |
| 1 | ready | Refresh default no-hardware workflow | `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh` | - |
| 2 | blocked | Run Android phone evidence lane | `RUN_PHONE=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh` | authorized ADB devices must be exactly 1, current=0 |
| 3 | manual-required | Run controlled direction rows | `data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session/commands.sh` | observed direction rows incomplete: 0/80; production direction candidate false until aggregate evidence is reviewed |
| 4 | blocked | Run glasses evidence lane | `RUN_GLASSES=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh` | Meta application id missing; GitHub Packages token missing; glasses preflight blocked=5; real Android XR projected contract not ready; glasses private alpha candidate false |
| 5 | manual-required | Run support drill lane | `RUN_SUPPORT=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh` | support strict evidence not requested or not complete |

## Privacy Guardrail

This report stores only booleans, counts, statuses, command recommendations, blockers, and workspace-relative paths. It must not include raw command output, ADB serials, Bluetooth names, MAC addresses, raw audio, transcripts, speaker names, embeddings, private alert text, exact locations, tokens, or application id values.
