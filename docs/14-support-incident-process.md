# Support And Incident Process

Date: 2026-05-28 KST

## Purpose

This document defines the first support, deletion verification, and mistaken-alert incident process for Voice Direction Glass.

The app is still an internal prototype. This process does not make it production-ready by itself. It creates the operating baseline that must be rehearsed before any external beta or production release.

## Scope

Covered:

- Tester support intake.
- Local data deletion verification.
- Mistaken alert response.
- False-positive and wrong-speaker/wrong-direction triage.
- Glasses output failure reports.
- Evidence handling without private voice content.

Not covered:

- Legal approval.
- App store policy clearance.
- Meta DAT distribution approval.
- Android XR partner approval.
- Production support staffing or service-level agreement.

## Support Intake

Use one private intake channel per test phase.

| Phase | Intake Channel | Response Target | Owner |
| --- | --- | --- | --- |
| Internal prototype | Project owner direct channel | Best effort | Project owner |
| Phone private alpha | Private tester form or direct channel | 2 business days | Project owner |
| Glasses private alpha | Private tester form plus device session notes | 2 business days | Project owner |
| External beta | Dedicated support inbox/form | 1 business day for safety/privacy reports | Assigned support owner |
| Production | Public support channel | Published SLA required | Support owner |

The intake channel must never ask users to upload raw audio, transcripts, speaker names, contact names, or private locations. It should ask for status-level evidence only.

## Allowed Support Fields

Support records may include:

- App version.
- Android model and OS version.
- Glasses platform category: Meta DAT, Ray-Ban fallback, Android XR, phone only.
- Event type: false positive, wrong speaker, wrong direction, missed alert, output failure, deletion request, permission issue, crash.
- Direction enum: left, right, front, back, unknown.
- Confidence bucket.
- Alert output channel status: phone notification, phone vibration, TTS, Meta display, Android XR display.
- Whether `device-evidence.md` and session validator passed.
- Checklist ids from release/glasses readiness.

Support records must not include:

- Raw audio.
- PCM buffers.
- Transcripts.
- Speaker names or profile labels.
- Voice embeddings.
- Encrypted payload values.
- Bluetooth owner names.
- Private alert message text.
- Home/work location details.

## Deletion Verification

For local-only prototype builds:

1. User taps the local delete action in the app.
2. Tester force-stops and reopens the app.
3. Tester verifies that local profile count, event count, latest cue, feedback count, and false-positive run state are cleared or reset.
4. Tester records pass/fail only in the session checklist.
5. If the debug evidence snapshot is available, tester records only count fields.

For future backend builds:

1. User requests deletion through support or in-app account flow.
2. Support verifies account identifier through a privacy-preserving account channel, not voice content.
3. Backend deletion job removes server profiles, embeddings, events, feedback, and analytics rows tied to the user.
4. Support records deletion job id, completion timestamp, and retained legal/security exception if any.
5. User receives deletion completion confirmation.

Backend deletion is not implemented in the current app because the current app is local-first.

## Mistaken Alert Triage

Classify every mistaken alert report with one primary type:

| Type | Meaning | Required Action |
| --- | --- | --- |
| False positive | App alerted when no enrolled person called | Mark feedback, collect count/status evidence, check trigger threshold. |
| Wrong speaker | App matched the wrong enrolled or nearby person | Mark wrong-speaker feedback, disable affected profile for external tests until reviewed. |
| Wrong direction | App detected the call but direction was wrong | Mark wrong-direction feedback, record expected/observed enum and confidence bucket only. |
| Unsafe distraction | Alert output caused unsafe distraction | Disable the distracting channel for the tester and review UI/output timing. |
| Missed alert | Enrolled person called and no alert fired | Record non-actionable status and relevant permission/device state only. |
| Output failure | Detection happened but notification/vibration/TTS/display failed | Record channel delivery status only. |

## Severity Levels

| Severity | Criteria | Response |
| --- | --- | --- |
| S0 | User reports injury, dangerous distraction, or repeated unsafe output while moving | Stop the test for that user, disable affected output path, open incident review. |
| S1 | Wrong speaker or repeated false positive with privacy/safety concern | Disable affected profile/channel for tester, review thresholds and evidence. |
| S2 | Wrong direction, missed alert, or output failure in controlled testing | Keep testing if safe, collect counts and device state. |
| S3 | Usability issue, copy issue, or setup friction | Triage into backlog. |

## Incident Response

For S0 or S1:

1. Acknowledge report without asking for private audio or names.
2. Ask tester to stop using the affected feature until reviewed.
3. Collect allowed support fields only.
4. Ask whether local delete action should be run immediately.
5. Review latest non-PII evidence snapshot, feedback counts, and readiness checklist ids.
6. Decide whether to disable a channel, increase threshold, remove a profile, or pause the test cohort.
7. Document root cause category:
   - model threshold
   - trigger phrase false positive
   - direction estimator limitation
   - OS permission/routing
   - glasses adapter failure
   - tester setup error
   - unknown
8. Record follow-up action and retest requirement.

## Tester Communication Templates

### Acknowledgement

We received the report. Please do not send raw audio, transcripts, speaker names, or private location details. We only need status-level details such as whether the alert was false-positive, wrong-speaker, wrong-direction, missed, or an output failure.

### Stop-Test Notice

Please stop using the affected feature until we complete review. You can use the local delete action in the app if you want to remove local test data from the phone.

### Deletion Confirmation

The local delete action should remove local profiles, detection events, feedback, false-positive test state, and the latest cue from this app build. Please force-stop and reopen the app, then confirm only whether the counts are cleared.

## Evidence Files To Attach

Allowed:

- `device-evidence.md` after privacy review.
- `service-readiness-audit.md`.
- `glasses-preflight.md`.
- Filled session checklists with private fields redacted.

Not allowed:

- Audio recordings.
- Speech transcripts.
- Screenshots containing private names or transcripts.
- Raw SharedPreferences values.
- Encrypted payload strings.

## Release Gate

This process moves the support/incident item from "not defined" to "defined but operationally unproven".

The operational evidence gate is tracked separately in `docs/23-support-drill-evidence.md` and `apps/voice-direction-glass/support-drills/manifest.json`.

Default validation:

```bash
node scripts/validate-support-drill-evidence.mjs --json
```

Production strict validation:

```bash
node scripts/validate-support-drill-evidence.mjs --require-drills-ready --json
```

Before production:

- A real support channel must exist.
- At least one deletion verification drill must pass.
- At least one mistaken-alert incident drill must pass.
- The current tester consent copy must be reviewed against this process.
- The service readiness audit must be regenerated after the drill.
