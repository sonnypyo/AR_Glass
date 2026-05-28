# Mistaken-Alert Incident Drill

Generated: 2026-05-28T07:34:32+09:00

Record only status, booleans, enums, count fields, confidence buckets, command names, and checklist ids. Do not include private names, speech text, vectors, encrypted values, Bluetooth owner labels, or exact locations.

## Setup

- [ ] Support channel configured for this phase.
- [ ] Controlled mistaken-alert scenario created with non-private placeholder records.
- [ ] Private material redaction checked before writing evidence.

## Classification

- [ ] Severity reviewed: S0 / S1 / S2 / S3.
- [ ] Primary type selected: false_positive / wrong_speaker / wrong_direction / missed_alert / output_failure / unsafe_distraction.
- [ ] Expected direction enum recorded: left / right / front / back / unknown / blank.
- [ ] Observed direction enum recorded: left / right / front / back / unknown / blank.
- [ ] Confidence bucket recorded: high / medium / low / unknown / blank.
- [ ] Feedback recorded.
- [ ] Follow-up action recorded.
- [ ] Retest requirement recorded.
- [ ] Private data redacted.

## Evidence Summary

- status: not_run
- executedAt:
- appVersion: 0.1.0
- buildType: debug
- severity:
- primaryType:
- expectedDirection:
- observedDirection:
- confidenceBucket:
- severityReviewed: false
- feedbackRecorded: false
- followUpActionRecorded: false
- retestRequirementRecorded: false
- privateDataRedacted: false
- validatorCommand: node scripts/validate-support-drill-evidence.mjs --require-drills-ready --json

## Outcome

- Drill result: blocked / passed / failed
- Follow-up action:
- Retest required: yes / no
- Blocking issue ids:
- Next run needed:
