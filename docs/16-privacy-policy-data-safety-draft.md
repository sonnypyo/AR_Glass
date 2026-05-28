# Privacy Policy And Data Safety Draft

Date: 2026-05-28 KST

Submission status: DRAFT_NOT_SUBMITTED

Review status: LEGAL_POLICY_REVIEW_REQUIRED

## Purpose

This document is a release-preparation draft for Voice Direction Glass. It maps the current app behavior to a privacy policy outline and a Google Play Data Safety worksheet.

It is not legal advice, not a public privacy policy URL, and not a Play Console submission.

## Official Source Snapshot

Checked on 2026-05-28 KST.

| Source | URL | Relevance |
| --- | --- | --- |
| Google Play User Data policy | https://support.google.com/googleplay/android-developer/answer/10144311?hl=en | Personal/sensitive data handling, privacy policy requirements, SDK responsibility. |
| Google Play Data Safety form guidance | https://support.google.com/googleplay/android-developer/answer/10787469?hl=en | Data Safety form, collection/sharing concepts, Play Console requirements. |
| Prominent disclosure and consent guidance | https://support.google.com/googleplay/android-developer/answer/11150561?hl=en-EN | In-app disclosure relationship to privacy policy and Data Safety. |
| Prepare your app for review | https://support.google.com/googleplay/android-developer/answer/9859455?hl=en-EN | App content page, privacy policy URL, sensitive data review preparation. |
| SDK safety guidance | https://support.google.com/googleplay/android-developer/answer/13326895?hl=en-EN | Developer responsibility for third-party SDK data behavior. |

## Current App Data Inventory

| Data or capability | Current use | Stored locally | Sent off device | Shared with third parties | Notes |
| --- | --- | --- | --- | --- | --- |
| Microphone input | Trigger phrase recognition, consented enrollment sample analysis, prototype voice match, short direction sample. | No raw audio or PCM persistence. | No. | No. | Access is gated by `마이크 사용 안내` and Android runtime permission. |
| Recognized speech text | Transient input to event fusion. | Full transcript is not stored. | No. | No. | Evidence must not include transcripts. |
| Speaker label | User-entered trusted-person label. | Yes, encrypted app-private settings/profile storage. | No. | No. | Can identify a person; treat as personal/sensitive. |
| Prototype voice feature reference | Local prototype embedding reference after accepted samples. | Yes, encrypted app-private profile storage. | No. | No. | Biometric-adjacent; production review required. |
| Direction metadata | Direction enum, confidence bucket, sample metadata, validation counts. | Yes. | No. | No. | Front/back remains unproven. |
| Alert delivery metadata | Channel/status counts, latest delivery source. | Yes. | No. | No. | No private alert body text is stored. |
| Bluetooth route metadata | Generic route status/counts. | Not persisted as detailed route history. | No. | No. | Do not paste owner/device names in evidence. |
| Diagnostics/logcat | Local debug lifecycle/status events. | Android logcat only during debug runs. | No remote telemetry. | No. | Must not include transcripts, speaker names, embeddings, or audio. |
| Meta DAT SDK data | Planned; real adapter not implemented. | Not active. | Not active. | Not active. | Must be re-reviewed when DAT dependencies are added. |
| Android XR Projected data | Projected activity preview only; real adapter not implemented. | Latest cue metadata only. | No. | No. | Must be re-reviewed when real Projected APIs are added. |

## Data Safety Worksheet Draft

Current build answer: no user data is collected or shared off device by the app.

Important distinction: Google Play Data Safety uses collection/sharing declarations for data transmitted off device. This app still accesses sensitive data locally, so the privacy policy and in-app disclosures must explain local microphone access and local voice-profile storage even if the Data Safety "collected" answer is currently "No".

| Data Safety area | Draft answer for current build | Reason | Must change if |
| --- | --- | --- | --- |
| Data collected | No | Current app does not transmit microphone, transcript, speaker profile, embedding, direction, or diagnostics off device. | Any backend, analytics, crash SDK, Meta SDK data export, cloud ASR, cloud speaker model, or remote support upload is added. |
| Data shared | No | Current app does not share app user data with third parties. | Meta DAT, Android XR, model SDK, analytics, or support export sends user/device data off device. |
| Data encrypted in transit | Not applicable for current no-network data flow. | No current app server transmission is used. | Any network transmission is added. |
| Users can request deletion | Local deletion exists in app. | `로컬 데이터 삭제` clears local profiles, events, settings, cue, feedback, and run state. | Account or backend storage is added; external deletion URL/process becomes mandatory. |
| Account creation | No | Current app has no account system. | Any login/account/profile sync is added. |
| Data retention | Local data remains until the user deletes it or uninstalls the app. | No backend retention exists. | Cloud storage, support attachments, or analytics are added. |
| Ads | No | No ads SDK or advertising use exists. | Any ads or attribution SDK is added. |
| Children/families target | No | Current MVP is a private adult tester prototype. | Product audience changes. |

## Privacy Policy Draft Text

Use this as a starting point only after developer identity, contact, jurisdiction, public URL, and legal review are complete.

### Voice Direction Glass Privacy Policy

Effective date: TBD

Developer: TBD legal name

Privacy contact: TBD email or contact URL

Voice Direction Glass helps a user test local voice-call detection and directional alert cues for phone and glasses experiences. The current app is a local-first prototype.

### Data We Access

The app can access the device microphone after the user accepts the in-app microphone disclosure and grants Android microphone permission. Microphone input is used for trigger phrase recognition, consented sample quality checks, prototype voice matching, and short direction samples.

The app can store user-entered speaker labels, prototype voice feature references, direction settings, detection metadata, alert channel preferences, direction validation metadata, feedback counts, false-positive run state, and latest glasses cue metadata.

### Data We Do Not Store

The current app does not store raw audio, PCM buffers, full speech transcripts, exact location, contacts, Bluetooth owner names, private alert text, or raw voice embedding values in generated evidence.

### Local Storage And Security

The current Android app stores local app data in app-private preferences. Sensitive local strings are wrapped through AndroidKeyStore-backed AES-GCM envelopes where implemented. No production backend is currently used.

### Sharing And Third Parties

The current build does not transmit user data to a server and does not share user data with third parties. Meta DAT and Android XR real adapters are not active yet. If those SDKs are added, this policy and the Data Safety form must be updated before external beta or production.

### Deletion

Users can use the in-app local delete action to clear local profiles, detection records, direction validation records, feedback, false-positive run state, alert settings, and latest cue metadata. Uninstalling the app also removes app-private local data according to Android app storage behavior.

### Limitations

Prototype voice matching does not guarantee identity. Front/back direction is not verified. Left/right direction still needs real hardware evidence. The app is assistive and must not be used for safety-critical decisions.

### Contact

Contact TBD for privacy questions, deletion questions, or mistaken-alert reports.

## In-App Disclosure Mapping

| App copy surface | Current file/source | Required before external beta |
| --- | --- | --- |
| Microphone disclosure | `VoiceDirectionTesterConsent.microphoneDisclosure` | Physical proof that unchecked disclosure blocks microphone permission/audio flow. |
| Tester consent and limitation copy | `VoiceDirectionTesterConsent.copy` | Review with real testers and legal/policy criteria. |
| Local delete action | `TesterConsentCard` and repository `clearAll()` | Physical proof that local delete clears app-visible data and evidence remains non-PII. |
| Support/incident process | `docs/14-support-incident-process.md` and `docs/23-support-drill-evidence.md` | Run deletion verification and mistaken-alert drills, then pass strict support drill validation. |
| Policy matrix | `docs/15-policy-clearance-matrix.md` | Replace tracking-only state with actual review evidence. |
| Store review package | `docs/17-store-review-submission-package-draft.md` | Keep public listing and reviewer instructions consistent with this privacy/Data Safety draft. |

## External Review Checklist

Before external beta:

1. Replace `TBD` developer identity and contact fields.
2. Host the privacy policy at an active, public, non-PDF, non-geofenced URL.
3. Add the same privacy policy link/text within the app.
4. Complete Play Console Data Safety answers for the exact submitted package and SDK set.
5. Validate the store review package in `docs/17-store-review-submission-package-draft.md`.
6. Re-check all third-party SDKs, including Meta DAT and any model SDK, for data practices.
7. Confirm no network/data export path exists, or update the Data Safety table if one is added.
8. Confirm local delete behavior on a physical Android phone.
9. Confirm microphone disclosure gate behavior on a physical Android phone.
10. Review voice/biometric-adjacent handling for speaker labels and prototype voice references.
11. Confirm public copy does not claim front/back direction or production speaker recognition before evidence exists.

## Release Gate

This draft does not close any external-beta or production release gate.

- `privacy-consent-copy` remains `MANUAL_REQUIRED`.
- `store-and-sdk-policy-clearance` remains `BLOCKED`.
- `production-speaker-model` remains `BLOCKED`.
- Physical Android phone evidence is still required.
- Meta DAT and Android XR SDK reviews are still required.

## Trial/Error Notes

- A local-only app can still need a privacy policy because it accesses microphone and stores sensitive local profile data.
- "No Data Safety collection" is fragile: any SDK, analytics, backend, crash reporter, cloud model, or support upload can change the answer.
- This draft intentionally treats speaker labels and voice feature references as sensitive even when they stay local.
- The privacy policy must eventually name the developer entity shown in the Play listing.
- A Markdown draft in this repository is not an acceptable Play privacy policy URL by itself.
