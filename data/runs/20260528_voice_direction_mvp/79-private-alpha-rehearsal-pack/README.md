# Private Alpha Rehearsal Summary

Generated: 2026-05-28T08:01:28+09:00

## Session

- Tester: local private alpha tester
- App: Voice Direction Glass
- Physical device session: data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack
- Support drill session: data/runs/20260528_voice_direction_mvp/74-support-drill-session-pack
- Glasses hardware session: data/runs/20260528_voice_direction_mvp/77-glasses-hardware-session-pack

## Objective

Run a top-level rehearsal that shows whether the project is ready to move from internal prototype toward phone private alpha and later glasses private alpha.

This pack does not replace the child evidence sessions. It links them, validates their structure, records strict gates that remain blocked, and keeps service-readiness audit output with the rehearsal.

## Required Order

1. Read `privacy-redaction-rules.md`.
2. Run `commands.sh`.
3. Fill `private-alpha-rehearsal-checklist.md` with aggregate status only.
4. Run the physical phone session when an Android phone is attached.
5. Run the glasses hardware session when Ray-Ban or Android XR hardware is available.
6. Run the support drill session before any external or production support claim.
7. Regenerate service readiness audit after every evidence change.

## Linked Evidence Sessions

- Phone and direction evidence: `data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack`
- Support deletion/mistaken-alert drill evidence: `data/runs/20260528_voice_direction_mvp/74-support-drill-session-pack`
- Ray-Ban/Android XR hardware evidence: `data/runs/20260528_voice_direction_mvp/77-glasses-hardware-session-pack`

## Current Expected Result

- Internal prototype can remain ready.
- Phone private alpha remains not ready until physical phone evidence and manual rows exist.
- Glasses private alpha remains blocked until phone evidence, Meta DAT credentials, Ray-Ban Display proof, Ray-Ban Gen 1 fallback proof, Android XR projected proof, and strict glasses hardware validation exist.
- External beta and production remain blocked until support drills, policy/legal/store review, release signing, screenshots, production speaker model, and direction accuracy gates close.
