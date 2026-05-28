# Deletion Verification Drill

Generated: 2026-05-28T07:34:32+09:00

Record only status, booleans, counts, command names, and checklist ids. Do not include private names, speech text, vectors, encrypted values, Bluetooth owner labels, or exact locations.

## Setup

- [ ] Support channel configured for this phase.
- [ ] Test build installed.
- [ ] Test profile created with non-private placeholder label.
- [ ] Pre-delete profile count recorded as number only.
- [ ] Pre-delete event count recorded as number only.
- [ ] Pre-delete feedback count recorded as number only.
- [ ] Pre-delete direction validation count recorded as number only.

## Execution

- [ ] Deletion request received through allowed support channel.
- [ ] User-facing local delete action executed.
- [ ] App force-stopped.
- [ ] App reopened.
- [ ] Post-delete profile count is 0.
- [ ] Post-delete event count is 0.
- [ ] Post-delete feedback count is 0.
- [ ] Post-delete direction validation count is 0.
- [ ] Post-delete latest cue present is false.
- [ ] Post-delete latest delivery present is false.
- [ ] Settings reset after delete is true.

## Evidence Summary

- status: not_run
- executedAt:
- appVersion: 0.1.0
- buildType: debug
- verifiedLocalDelete: false
- appRestartVerified: false
- postDeleteProfileCount:
- postDeleteEventCount:
- postDeleteFeedbackCount:
- postDeleteDirectionValidationCount:
- postDeleteLatestCuePresent:
- postDeleteLatestDeliveryPresent:
- postDeleteSettingsReset: false
- validatorCommand: node scripts/validate-support-drill-evidence.mjs --require-drills-ready --json

## Outcome

- Drill result: blocked / passed / failed
- Blocking issue ids:
- Next run needed:
