# Store Review Submission Package Draft

Date: 2026-05-28 KST

Submission package status: DRAFT_NOT_SUBMITTED

Review status: NOT_REQUESTED

Release track: INTERNAL_TESTING_DRAFT

## Purpose

This document prepares the Google Play and wearable-review submission package for Voice Direction Glass. It is a draft bundle of store listing copy, app-content declarations, reviewer instructions, media requirements, and release gates.

It is not a Play Console submission, not a Meta Wearables submission, not an Android XR release-track approval, and not legal advice.

## Official Source Snapshot

Checked on 2026-05-28 KST.

| Source | URL | Relevance |
| --- | --- | --- |
| Google Play create and set up app | https://support.google.com/googleplay/android-developer/answer/9859152?hl=en-EN | Store listing fields, app name, short description, full description, shared track listing behavior. |
| Google Play prepare app for review | https://support.google.com/googleplay/android-developer/answer/9859455?hl=en-EN | App content page, privacy policy, app access instructions, target audience, permissions, content rating. |
| Google Play User Data policy | https://support.google.com/googleplay/android-developer/answer/10144311?hl=en | Privacy policy, sensitive data disclosure, SDK responsibility, retention/deletion requirements. |
| Google Play Data Safety guidance | https://support.google.com/googleplay/android-developer/answer/10787469?hl=en | Data Safety form and user-facing data practices. |
| Google Play target audience settings | https://support.google.com/googleplay/android-developer/answer/9867159?hl=en-EN | Target age declaration and prerequisites for target audience/content setup. |
| Google Play content rating | https://support.google.com/googleplay/android-developer/answer/9859655?hl=en | Content rating questionnaire and unrated-app handling. |
| Google Play store listing best practices | https://support.google.com/googleplay/android-developer/answer/13393723?hl=en | Metadata, screenshots, translations, and policy-sensitive listing content. |
| Google Play sensitive permissions policy | https://support.google.com/googleplay/android-developer/answer/16558241?hl=en | Sensitive permission necessity and in-context use. |
| Meta Wearables developer docs | https://wearables.developer.meta.com/docs/develop | DAT app setup, distribution, and device review path. Login review still required. |
| Android XR Jetpack SDK | https://developer.android.com/develop/xr/jetpack-xr-sdk | Android XR projected/immersive packaging and runtime review path. |

## Current Release Scope

The current submitted scope should be treated as an internal testing draft only.

| Scope item | Current answer | Release implication |
| --- | --- | --- |
| App package | Android phone-hosted app with debug APK evidence only. | A release AAB/signing flow is not prepared. |
| Primary feature | Detect a trusted local trigger/caller event and emit direction cue outputs. | Public copy must avoid guaranteed identity or guaranteed direction language. |
| Glasses support | Meta DAT and Android XR adapters are stubs; projected preview exists. | Do not claim production glasses integration, glasses haptics, or Ray-Ban Display support in public listing. |
| Voice model | Prototype acoustic feature matching only. | Do not claim production speaker identification. |
| Direction support | Synthetic/diagnostic left/right only; front/back unproven. `docs/22-direction-accuracy-evidence.md` tracks the direction proof gate. | Do not claim front/back accuracy or four-direction support. |
| Privacy state | Local-first draft privacy/Data Safety document exists. | Public privacy URL and Play Console Data Safety submission are still missing. |
| Physical evidence | No attached Android phone evidence in this workspace. | Phone private alpha is not ready. |
| Release artifact | `docs/18-release-artifact-signing-runbook.md` defines the AAB/signing path. | Upload-ready AAB is blocked until upload-key signing is configured. |
| Release notes | `docs/19-release-notes-versioning.md` drafts internal-testing notes for `0.1.0`/`1`. | Notes must be revalidated and matched to the exact uploaded bundle before Play release. |
| Preview assets | `docs/20-play-screenshot-media-runbook.md` drafts phone screenshot, feature graphic, and Android XR preview asset capture. | Strict screenshot/media validation is blocked until real non-private assets are captured. |

## Store Listing Draft

These fields are a safe starting point only. Replace them after legal, policy, hardware, and actual store-review evidence exists.

| Field | Draft value | Notes |
| --- | --- | --- |
| App name | Voice Direction Glass | 21 characters; under the 30-character Play limit. |
| Short description | Direction cues when a trusted voice calls you nearby. | 55 characters; under the 80-character Play limit. |
| Full description | Voice Direction Glass is an experimental local-first Android app for testing trusted voice-call cues and directional alerts. After explicit microphone disclosure and Android microphone permission, the app can listen for a configured trigger flow, compare prototype local voice references, and emit direction-only cues through phone notification, vibration, TextToSpeech, and planned glasses display adapters. The current build does not store raw audio, PCM buffers, full speech transcripts, exact location, contacts, or private alert text. The app is not a safety device, does not guarantee speaker identity, and does not prove front/back direction accuracy. Meta Ray-Ban Display and Android XR integrations are under development and require separate hardware and SDK review before public claims. | Keep limitation language until hardware and policy evidence changes. |

## App Content Declarations Draft

| Play Console area | Draft answer | Evidence needed before submission |
| --- | --- | --- |
| Privacy policy | Required. URL: TBD public non-PDF URL. | Replace TBD, host publicly, link in app, and keep consistent with `docs/16-privacy-policy-data-safety-draft.md`. |
| Data Safety | Current draft says no off-device collection or sharing by the app. | Recheck after every SDK, backend, analytics, crash reporting, cloud model, Meta DAT, Android XR, or support-upload change. |
| Ads | No ads. | Recheck if any ads, attribution, or monetization SDK is added. |
| App access | App access: no login or restricted account flow in current build. | If a gated beta, reviewer must receive install instructions and any required access steps. |
| Target audience | Adults only; not designed for children. | Complete Play target audience form accurately. |
| Content rating | Utility/productivity-style assistive prototype; no user-generated public content. | Complete the official questionnaire in Play Console. |
| Sensitive permissions | Microphone is core to voice-call detection and sample diagnostics. | Physical proof of prominent disclosure, runtime permission, visible foreground service, and stoppable listening. |
| Account deletion | No account creation in current build. | If account/profile sync is added, add in-app and web deletion flow before submission. |
| Government/medical/safety | Not government, medical, emergency, or safety-critical service. | Public copy must not imply emergency, surveillance, or guaranteed safety behavior. |

## Reviewer Instructions Draft

Use these only after the release artifact and internal-test track are ready.

1. Install the submitted Android app on a physical Android phone with microphone support.
2. Open the app and read the `마이크 사용 안내` disclosure.
3. Verify microphone-backed actions are disabled until the disclosure is accepted.
4. Accept the disclosure and grant Android microphone permission when prompted.
5. Use the simulator controls to trigger a generic direction cue without entering real names.
6. Use `알림 출력 점검` to verify phone notification, vibration, and TextToSpeech cue paths.
7. Use the local delete action to clear profiles, events, feedback, direction trials, alert settings, and latest cue metadata.
8. Treat Meta Ray-Ban Display and Android XR screens as preview/development surfaces unless a separate hardware review build is provided.

Do not ask reviewers to record or upload real speaker audio. Do not include real speaker names, transcripts, or private device names in reviewer notes.

## Screenshots And Media Plan

| Asset | Required status | Content rule |
| --- | --- | --- |
| Phone main screen | Needed before store submission. | Show session state and disclosure without private names. |
| Alert output card | Needed before store submission. | Show generic direction cue only. |
| Local data/delete card | Needed before store submission. | Show deletion control and limitation language. |
| Glasses projected preview | Optional until hardware proof. | Mark as preview; do not imply production glasses support. |
| Video | Optional. | If used, show synthetic/generic cue flow only. |

Validate the draft asset plan:

```bash
node scripts/validate-play-screenshot-package.mjs --json
```

Require real assets only after capture:

```bash
node scripts/validate-play-screenshot-package.mjs --require-assets --json
```

Validate the direction accuracy evidence draft before any copy or screenshot implies direction precision:

```bash
node scripts/validate-direction-accuracy-evidence.mjs --json
```

## Public Copy Guardrails

- Do not claim front/back direction accuracy before hardware evidence exists.
- Do not claim four-direction direction support before strict direction accuracy validation passes.
- Do not claim production speaker identification while the prototype acoustic feature path is active.
- Do not claim Meta Ray-Ban Display support until real DAT adapter evidence exists.
- Do not claim Android XR production support until real Projected/XR runtime evidence exists.
- Do not claim glasses-side per-side haptics until an official API and hardware proof exist.
- Do not use surveillance, emergency, medical, or safety-critical language.
- Do not imply background recording is hidden or continuous without visible foreground disclosure.

## Submission Blockers

The package must not be submitted externally until these are complete:

1. Physical Android phone `device-evidence.md` exists and passes `scripts/validate-device-evidence.mjs`.
2. Public privacy policy URL is hosted and linked in the app and Play Console.
3. Play Data Safety answers are completed for the exact package and SDK set.
4. App listing screenshots are generated from non-private test data and pass `scripts/validate-play-screenshot-package.mjs --require-assets --json`.
5. Release AAB/signing flow in `docs/18-release-artifact-signing-runbook.md` is prepared.
6. `scripts/validate-release-artifact-readiness.mjs --require-upload-ready --json` passes.
7. Release notes in `docs/19-release-notes-versioning.md` and `apps/voice-direction-glass/release-notes/internal-testing-v0.1.0.md` match the exact Gradle version and pass validation.
8. Meta DAT and Android XR claims are either removed from public listing copy or backed by real review/hardware evidence.
9. Tester consent, microphone disclosure, and voice/biometric-adjacent handling are reviewed.
10. Support/deletion and mistaken-alert drills are rehearsed.

## Release Gate

This draft does not close any external-beta or production release gate.

- `privacy-consent-copy` remains `MANUAL_REQUIRED`.
- `store-and-sdk-policy-clearance` remains `BLOCKED`.
- `production-speaker-model` remains `BLOCKED`.
- `front-back-direction-evidence` remains `BLOCKED`.
- `front-back-direction-evidence` remains `BLOCKED`.
- `support-incident-process` remains `MANUAL_REQUIRED`.

## Trial/Error Notes

- A store listing can accidentally overstate the product faster than code does; this draft intentionally keeps copy narrower than the long-term product vision.
- Reviewer instructions must not depend on real private voices or unredacted logs.
- Google Play listing text, privacy policy, Data Safety form, in-app disclosures, and SDK behavior must match each other.
- Wearable screenshots should not be used as production claims until Meta DAT and Android XR adapters are real.
