# Private Alpha Hardware Readiness Preflight

Generated: 2026-06-01T15:20:15+09:00

## Purpose

This preflight checks whether the local machine is ready to run the private-alpha hardware runner with real phone, support, or glasses evidence. It stores device counts only and never persists ADB serials, Bluetooth names, raw logs, audio, transcripts, embeddings, or private alert text.

## Local Toolchain

- JDK present: yes
- Android SDK present: yes
- Debug APK present: yes (apps/voice-direction-glass/app/build/outputs/apk/debug/app-debug.apk)

## ADB Device Counts

- ADB executable: yes
- Authorized devices: 0
- Unauthorized devices: 0
- Offline devices: 0
- Other device rows: 0

## Session Pack Status

| Session | Exists | commands.sh executable | Validator | Warnings |
| --- | --- | --- | --- | --- |
| Physical phone | yes | yes | pass | No android-phone-smoke/device-evidence.md exists yet; run commands.sh with an attached phone.; No glasses-preflight/glasses-preflight.md exists yet.; No service-readiness-audit/service-readiness-audit.md exists yet. |
| Support drill | yes | yes | pass | - |
| Glasses hardware | yes | yes | pass | - |
| Private alpha rehearsal | yes | yes | pass | - |

## Gate Snapshot

- Latest device evidence: missing
- Latest device evidence validation: not ready
- Can run phone session now: no
- Glasses setup default validation: pass
- Meta application id configured: no
- GitHub Packages token configured: no
- Glasses preflight status: blocked, pass=13, manual=5, blocked=3
- Default hardware runner summary available: yes
- Default hardware runner summary status: pass

## Recommended Runner Command

```bash
scripts/run-private-alpha-hardware-rehearsal.mjs --json
```

## Next Actions

- Keep phone collection as the final hardware step; it will need exactly one authorized Android phone before using `--run-phone`.
- Configure Meta Wearables application id and GitHub Packages token outside source control before DAT work.
- Rerun `scripts/glasses-integration-preflight.sh --write-evidence` after credentials, dependencies, or device availability change.
- Create phone `device-evidence.md` only during the final phone hardware step with `scripts/android-device-smoke-test.sh --write-evidence`.
- Use the recommended runner command below, then fill only aggregate/manual rows in the linked session checklists.
- Regenerate `scripts/audit-service-readiness.mjs --write-report` after every evidence change.

## Privacy Guardrail

This report intentionally records only aggregate readiness status, booleans, counts, command recommendations, and workspace-relative paths.
