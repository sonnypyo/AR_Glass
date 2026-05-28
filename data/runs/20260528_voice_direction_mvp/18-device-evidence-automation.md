# Device Evidence Automation Stage

Date: 2026-05-28 KST

## Goal

Make the first physical-phone smoke test leave a structured evidence report automatically.

## Implemented

- `scripts/android-device-smoke-test.sh --write-evidence`.
- `scripts/android-device-smoke-test.sh --evidence-dir DIR`.
- Default report directory: `data/runs/<timestamp>_<device>_android_phone_smoke/`.
- Generated file: `device-evidence.md`.
- Captures device metadata, APK path, permission states, Activity launch results, logcat lines, and manual checklist rows.

## Privacy Boundary

- Report includes only non-PII logcat lines from `VoiceDirectionGlass`, package names, and device/build metadata.
- Manual transcript, speaker names, raw audio, and embedding values remain excluded.

## What This Proves

- Device QA can now produce consistent Markdown evidence.
- The report structure matches the project test plan.
- The script still fails clearly when no ADB device is attached.

## What This Does Not Prove Yet

- Actual physical-phone behavior.
- Foreground notification visibility.
- Vibration feel.
- Glasses rendering.
- Prototype voice match behavior on hardware.

## Verification

```bash
bash -n scripts/android-device-smoke-test.sh
scripts/android-device-smoke-test.sh --help
scripts/android-device-smoke-test.sh --skip-build --write-evidence
```

Result: syntax passed; help displayed the evidence options; no-device path exits with code `2`.

## Next Work

1. Connect a physical Android phone.
2. Run `scripts/android-device-smoke-test.sh --write-evidence`.
3. Complete the generated manual checklist.
4. Commit real device findings to the matching run folder.
