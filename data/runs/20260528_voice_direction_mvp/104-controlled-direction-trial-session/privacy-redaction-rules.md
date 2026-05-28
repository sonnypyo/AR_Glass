# Privacy Redaction Rules

These rules apply to every controlled direction-trial session file.

Do not record:

- Raw audio files or PCM samples.
- Speech text from real people.
- Person names or speaker labels.
- Voice embedding values.
- Encrypted payload values.
- Bluetooth owner/device names or MAC addresses.
- Private alert message text.
- Exact room descriptions or exact locations.

Allowed evidence values:

- Direction enums.
- Status enums.
- Confidence buckets.
- Latency buckets.
- Counts and rates.
- Device-class or route-class labels.
- Workspace-relative evidence paths.

If a private value is accidentally pasted, remove it locally before running validators or referencing this folder in reports.
