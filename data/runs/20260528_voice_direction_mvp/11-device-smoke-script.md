# Device Smoke Script Stage

Date: 2026-05-28 KST

## Goal

Make the first physical Android phone test repeatable from one command.

## Implemented

- `scripts/android-device-smoke-test.sh`
- Optional `--skip-build` flag.
- Optional `--main-only` flag.
- Local default `JAVA_HOME` and `ANDROID_HOME` detection.
- ADB device detection with `ANDROID_SERIAL` support for multiple devices.
- APK install.
- Runtime permission grants where supported.
- Main Activity launch.
- Projected cue Activity launch attempt.
- Recent logcat summary including the `VoiceDirectionGlass` diagnostic tag.
- Optional `--write-evidence` and `--evidence-dir DIR` report generation.

## What This Proves

- The project now has a concrete path from local build output to first phone smoke test.
- The script fails clearly when no device is connected.
- Device testing steps are no longer only prose documentation.
- The first real-device run will expose service, recognition, audio probe, direction sample, and projected cue checkpoints without logging transcripts or speaker names.
- Physical-device runs can now leave a starter `device-evidence.md` report automatically.

## What This Does Not Prove Yet

- App UI behavior on a physical phone.
- Foreground notification behavior.
- Speech recognition callback behavior.
- Audio capability probe output.
- Meta or Android XR hardware behavior.

## Verification

```bash
scripts/android-device-smoke-test.sh --skip-build
```

Result: expected failure with no attached ADB devices. Exit code `2`.

## Next Work

1. Connect an Android phone with USB debugging enabled.
2. Run `scripts/android-device-smoke-test.sh`.
3. Complete the manual checklist in `docs/08-device-test-plan.md`.
4. Record actual device findings in `docs/06-experiment-log.md`.
