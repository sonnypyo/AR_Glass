# Glasses Hardware Privacy Redaction Rules

Generated: 2026-05-28T07:50:41+09:00

These rules apply to every file in this glasses hardware session folder.

## Never Paste

- Audio recordings or PCM samples.
- Speech transcripts from real people.
- Speaker names, caller names, profile labels, or contact names.
- Voice embedding values or model vectors.
- Encrypted payload values such as `enc:v1:`.
- Bluetooth owner/device names or product names if they reveal a person.
- MAC addresses or serial numbers that identify a private device.
- Private alert message text.
- Home/work location details.

## Allowed Evidence

- Pass/fail/manual/blocking status.
- Counts.
- Booleans.
- Enum values such as `not_collected`, `passed`, `failed`, `documented_unavailable`, `stub`, or `real_adapter`.
- Lifecycle event labels that contain no private data.
- Confidence buckets.
- Checklist ids.
- Command names.
- Workspace-relative evidence file paths.
- Screenshots only after confirming they show non-private placeholder labels.

## If Private Data Appears

1. Stop copying that output.
2. Replace the private value with `[redacted]`.
3. Keep the surrounding count/status if it is useful.
4. Note which command produced private output so the script or process can be fixed.
