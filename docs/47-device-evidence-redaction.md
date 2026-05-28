# Device Evidence Redaction

Date: 2026-05-28 KST

## Purpose

This document defines the privacy redaction gate for generated physical-phone `device-evidence.md` reports. The phone smoke script may need device model and Android version for debugging, but it must not persist private device identifiers such as ADB serials, build fingerprints, MAC addresses, Bluetooth names, raw transcripts, speaker names, embeddings, encrypted payloads, PCM, or raw audio.

## Implemented Rule

`scripts/android-device-smoke-test.sh --write-evidence` now writes:

- `Device serial: redacted-by-script`
- `Build fingerprint: redacted-by-script`
- a default evidence directory named `<timestamp>_android_phone_smoke`, without the ADB serial in the folder name

It still records non-private operational metadata:

- device model
- Android release and SDK version
- APK path
- permission states
- script-pass rows
- non-PII debug broadcast outputs
- release/glasses readiness counts and open ids

## Validator Rule

`scripts/validate-device-evidence.mjs` now requires:

- a `Device serial` metadata row, with value `redacted-by-script`, `redacted-by-fixture`, `fixture`, `redacted`, or `unknown`
- a `Build fingerprint` metadata row, with the same allowed redacted values
- no legacy evidence directory path shaped like `<timestamp>_<adb-device-label>_android_phone_smoke`
- no MAC-address-like identifiers in the log evidence block
- no Bluetooth device name, owner, product-name, or address fields in the log evidence block

## What This Proves

- The generated evidence report can still validate with redacted device identifiers.
- The validator fixture stays representative of the generated report shape.
- The first real phone run is less likely to commit or copy private device identifiers into project artifacts.

## What This Does Not Prove

- It does not run the app on a phone.
- It does not prove the foreground service, notification, vibration, TTS, microphone route, or direction behavior.
- It does not prove that all possible Android logcat output is harmless; testers must still review generated reports before sharing.

## Trial/Error Notes

- The first smoke report shape stored `Device serial` and `Build fingerprint` values directly, and the default folder name also included the ADB label. That is useful for local debugging but too identifying for persistent project evidence.
- Redaction is enforced in the validator instead of relying only on operator discipline.
- Device model and Android SDK version remain because they are needed for compatibility debugging and are not enough by themselves to identify a private tester device.
