# Privacy Redaction Rules

Generated: 2026-05-28T12:17:16+09:00

These rules apply to every file in this physical test session folder.

## Never Paste

- Raw audio files or PCM samples.
- Speech transcripts from real people.
- Speaker names, caller names, profile labels, or contact names.
- Voice embedding values or model vectors.
- Encrypted payload values such as `enc:v1:`.
- Bluetooth owner/device names if they reveal a person.
- Private alert message text.
- Home/work location details.

## Allowed Evidence

- Pass/fail/manual/blocking status.
- Counts.
- Enum values such as `LEFT`, `RIGHT`, `UNKNOWN`, `TEST_CUE`.
- Confidence buckets.
- Latency buckets or milliseconds.
- Checklist ids.
- Non-private device model/OS version.
- Screenshots only after checking they do not show private names or transcripts.

## If Private Data Appears

1. Stop copying that output.
2. Replace the private value with `[redacted]`.
3. Keep the surrounding count/status if it is useful.
4. Note which command produced private output so the script can be fixed.
