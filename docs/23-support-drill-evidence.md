# Support Drill Evidence

Date: 2026-05-28 KST

## Purpose

This document defines the evidence gate for support deletion verification and mistaken-alert incident drills for Voice Direction Glass.

Support drill evidence status: DRAFT_DRILLS_NOT_RUN.

The existing support process in `docs/14-support-incident-process.md` defines what should happen. This document defines how to prove that it has been rehearsed without collecting private voice content.

## Current App State

- The app is still an internal prototype.
- Local delete behavior exists in app code and has a debug-only self-check path.
- No public support channel is configured.
- No deletion verification drill has been run.
- No mistaken-alert incident drill has been run.
- The `support-incident-process` release item remains `MANUAL_REQUIRED`.

## Drill Evidence Manifest

The draft manifest lives at:

```text
apps/voice-direction-glass/support-drills/manifest.json
```

Current manifest status: `DRAFT_SUPPORT_DRILLS_NOT_RUN`.

The manifest records only operational status and aggregate counts. It must not contain raw audio, PCM buffers, transcripts, speaker names, contact names, voice embeddings, encrypted payload strings, Bluetooth owner names, private alert message text, or private locations.

## Allowed Evidence Fields

Allowed deletion drill evidence:

- App version.
- Build type.
- Test phase.
- Support channel status.
- Deletion request received status.
- Local delete action executed status.
- App restart verified status.
- Post-delete profile count.
- Post-delete event count.
- Post-delete feedback count.
- Post-delete direction validation count.
- Post-delete latest cue presence.
- Post-delete latest delivery presence.
- Post-delete settings reset status.
- Validator command and pass/fail result.

Allowed mistaken-alert incident evidence:

- App version.
- Build type.
- Test phase.
- Incident severity enum: S0, S1, S2, or S3.
- Primary incident type enum: false positive, wrong speaker, wrong direction, missed alert, output failure, unsafe distraction.
- Expected direction enum, when applicable.
- Observed direction enum, when applicable.
- Confidence bucket.
- Feedback recorded status.
- Follow-up action enum.
- Retest requirement status.
- Private-data redaction status.
- Validator command and pass/fail result.

## Privacy Guardrails

Do not include:

- Raw audio.
- PCM buffers.
- Speech transcripts.
- Speaker names.
- Contact names.
- Voice embedding values.
- Encrypted preference payload strings.
- Bluetooth product names, owner names, or MAC addresses.
- Private alert message text.
- Home, work, school, or exact location details.

Evidence should use count/status/enum fields only. If a support message includes private material, redact it before storing the session artifact.

## Deletion Verification Drill

Minimum rehearsal path:

1. Configure a private test support channel for the selected phase.
2. Create a local test profile with non-private placeholder labels.
3. Record pre-delete counts only.
4. Trigger the user-facing local delete action.
5. Force-stop and reopen the app.
6. Verify post-delete counts are zero and latest cue/delivery state is absent.
7. Record pass/fail only in the evidence file.
8. Update `apps/voice-direction-glass/support-drills/manifest.json`.
9. Run the strict validator.

Minimum pass criteria:

- `deletionDrill.status` is `passed`.
- `deletionDrill.verifiedLocalDelete` is `true`.
- Post-delete counts are all zero.
- `postDeleteLatestCuePresent` is `false`.
- `postDeleteLatestDeliveryPresent` is `false`.
- `postDeleteSettingsReset` is `true`.
- Evidence path exists and contains no private structured fields.

## Mistaken-Alert Incident Drill

Minimum rehearsal path:

1. Create a controlled mistaken-alert scenario using non-private placeholder records.
2. Classify the incident severity and primary type.
3. Record only expected/observed enum fields and confidence bucket.
4. Record whether feedback was saved.
5. Record the chosen follow-up action.
6. Record whether retest is required.
7. Redact any private material before writing evidence.
8. Update `apps/voice-direction-glass/support-drills/manifest.json`.
9. Run the strict validator.

Minimum pass criteria:

- `mistakenAlertDrill.status` is `passed`.
- `mistakenAlertDrill.severityReviewed` is `true`.
- `mistakenAlertDrill.feedbackRecorded` is `true`.
- `mistakenAlertDrill.followUpActionRecorded` is `true`.
- `mistakenAlertDrill.retestRequirementRecorded` is `true`.
- `mistakenAlertDrill.privateDataRedacted` is `true`.
- Evidence path exists and contains no private structured fields.

## Strict Validation

Default validation checks that the runbook and draft manifest exist:

```bash
node scripts/validate-support-drill-evidence.mjs --json
```

Strict validation is allowed to pass only after both operational drills have real evidence:

```bash
node scripts/validate-support-drill-evidence.mjs --require-drills-ready --json
```

Expected current result: default validation passes; strict validation fails until a support channel is configured and both drills pass.

## Session Automation

Create a support drill session pack before running a rehearsal:

```bash
node scripts/create-support-drill-session.mjs --run-dir data/runs/<run>/support-drill-session --json
```

Validate the generated session folder:

```bash
node scripts/validate-support-drill-session.mjs data/runs/<run>/support-drill-session --json
```

The session pack contains:

- `README.md`
- `commands.sh`
- `deletion-verification-drill.md`
- `mistaken-alert-incident-drill.md`
- `manifest-update-template.json`
- `privacy-redaction-rules.md`

The generator does not update the canonical manifest automatically. After the drill, review the session files for private data and deliberately copy only approved aggregate values into `apps/voice-direction-glass/support-drills/manifest.json`.

## Release Gate

This document does not make production ready. It makes the remaining support-drill blocker machine-checkable.

Before production:

- A real support channel must be configured.
- A deletion verification drill must pass.
- A mistaken-alert incident drill must pass.
- A support drill session folder must validate with `scripts/validate-support-drill-session.mjs`.
- `scripts/validate-support-drill-evidence.mjs --require-drills-ready --json` must pass.
- `scripts/audit-service-readiness.mjs --write-report` must be regenerated after the drills.

## Trial/Error Notes

- The debug local delete self-check proves repository clear semantics on a separate debug store. It is not the same as a user-facing support deletion drill.
- A support process document can be valid while the service is still operationally unproven.
- The first manifest is intentionally a draft with no evidence paths. This prevents accidental production claims while keeping the future drill shape explicit.
