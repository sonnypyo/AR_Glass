# Support Drill Privacy Redaction Rules

Generated: 2026-05-28T07:34:32+09:00

These rules apply to every file in this support drill session folder.

## Never Paste

- Audio recordings or sample buffers.
- Speech text from real people.
- Person names, caller names, profile labels, or contact names.
- Model vectors or biometric reference values.
- Encrypted payload values such as `enc:v1:`.
- Bluetooth owner/device names if they reveal a person.
- Private alert message text.
- Home/work location details.

## Allowed Evidence

- Pass/fail/manual/blocking status.
- Counts.
- Booleans.
- Enum values such as `false_positive`, `wrong_direction`, `left`, `right`, or `unknown`.
- Confidence buckets.
- Checklist ids.
- Command names.
- Workspace-relative evidence file paths.

## If Private Data Appears

1. Stop copying that output.
2. Replace the private value with `[redacted]`.
3. Keep the surrounding count/status if it is useful.
4. Note which command produced private output so the script or process can be fixed.
