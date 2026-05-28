# Privacy Redaction Rules

The operator pack may contain:

- command labels
- exit codes
- pass/fail/manual status
- booleans
- counts
- enum values
- checklist ids
- workspace-relative paths

The operator pack must not contain:

- audio recordings or PCM samples
- speech transcripts from real people
- speaker names
- contact names
- voice embedding values
- encrypted payload values
- Bluetooth owner/device/product names
- MAC addresses
- private alert message text
- exact locations
- account tokens, application ids, passwords, or signing key material
