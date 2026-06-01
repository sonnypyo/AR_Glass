# Hardware Next Actions

Generated: 2026-06-01T15:45:43+09:00
Source dashboard: data/runs/20260528_voice_direction_mvp/99-hardware-test-status-dashboard/hardware-test-status-dashboard.json

## Decision

- Recommendation: pre_phone_preparation_current_hardware_blocked
- Current safe workflow: true
- Authorized ADB devices: 0
- Phone manifest apply ready: false
- Controlled direction rows: 0/80

## Ordered Actions

| Priority | Status | Action | Command | Blockers |
| ---: | --- | --- | --- | --- |
| 1 | current | Refresh default no-hardware workflow | `data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh` | - |
| 2 | current | Prepare controlled direction rows | `data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session/commands.sh` | - |
| 3 | blocked | Prepare glasses evidence lane | `RUN_GLASSES=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh` | Meta application id missing; GitHub Packages token missing; glasses preflight blocked=2; real Android XR projected contract not ready; glasses private alpha candidate false |
| 4 | current | Prepare support drill lane | `RUN_SUPPORT=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh` | - |
| 5 | blocked | Run Android phone evidence lane last | `RUN_PHONE=1 data/runs/20260528_voice_direction_mvp/93-hardware-test-operator-pack/commands.sh` | authorized ADB devices must be exactly 1, current=0 |

## Privacy Guardrail

This report stores only booleans, counts, statuses, command recommendations, blockers, and workspace-relative paths. It must not include raw command output, ADB serials, Bluetooth names, MAC addresses, raw audio, transcripts, speaker names, embeddings, private alert text, exact locations, tokens, or application id values.
