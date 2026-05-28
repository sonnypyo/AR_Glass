# Policy Clearance Matrix

Date: 2026-05-28 KST

Clearance result: BLOCKED

External submission: not performed

## Purpose

This document maps the production policy and SDK clearance work for Voice Direction Glass. It is an engineering checklist, not legal advice and not a store-review result.

The goal is to keep the production release gate honest: the app can keep improving locally, but production service must remain blocked until Meta Wearables, Android XR, Google Play, voice/recording, tester-consent, and operational-review items have real evidence.

## Source Snapshot

Checked on 2026-05-28 KST against public official sources where available.

| Source | What matters for this app | Current access result |
| --- | --- | --- |
| Meta Wearables developer docs: https://wearables.developer.meta.com/docs/develop | Official DAT setup, device registration, permission flows, display app distribution, release channels. | Login required. Meta logged-in review: required. |
| Meta Wearables DAT Android GitHub: https://github.com/facebook/meta-wearables-dat-android | Public README states DAT is in developer preview, requires package access, app registration, supported glasses or MockDeviceKit, and Developer Center terms. | Publicly accessible. |
| Meta Wearables Developer Terms: https://wearables.developer.meta.com/terms | Terms must be reviewed before external distribution. | Login required. |
| Meta Wearables Acceptable Use Policy: https://wearables.developer.meta.com/acceptable-use-policy | Acceptable-use constraints must be reviewed before external distribution. | Login required. |
| Android XR Jetpack SDK: https://developer.android.com/develop/xr/jetpack-xr-sdk | Jetpack XR is developer preview; Jetpack Projected supports phone-hosted experiences for audio/display glasses. | Publicly accessible. |
| Android XR packaging guidance: https://developer.android.com/develop/xr/jetpack-xr-sdk/build-immersive | XR manifest features and Play filtering affect Android XR distribution. | Publicly accessible. |
| Android audio capture: https://developer.android.com/guide/topics/media/audio-capture | `RECORD_AUDIO` is a dangerous permission and must be requested at runtime. | Publicly accessible. |
| Android foreground service types: https://developer.android.com/develop/background-work/services/fgs/service-types | Microphone foreground services require `FOREGROUND_SERVICE_MICROPHONE` and `RECORD_AUDIO`. | Publicly accessible. |
| Android background foreground-service restrictions: https://developer.android.com/about/versions/12/foreground-services | A microphone foreground service should be started while the app has a visible/user-initiated context unless an exemption applies. | Publicly accessible. |
| Google Play User Data policy: https://support.google.com/googleplay/android-developer/answer/10144311?hl=en | Microphone, camera, and similar device data are personal and sensitive user data; access, use, sharing, retention, deletion, and privacy policy must be disclosed. | Publicly accessible. |
| Google Play permissions and sensitive APIs: https://support.google.com/googleplay/android-developer/answer/16558241?hl=en | Sensitive permissions must be necessary for current core functionality, requested in context, and used only for consented purposes. | Publicly accessible. |
| Google Play prominent disclosure practices: https://support.google.com/googleplay/android-developer/answer/11150561?hl=en-EN | Prominent disclosure should appear in-app before permission or sensitive capability requests when required. | Publicly accessible. |

## Clearance Matrix

| Area | Current implementation | Required for clearance | Status | Evidence and next action |
| --- | --- | --- | --- | --- |
| Android microphone permission | Manifest declares `RECORD_AUDIO`; foreground service uses `android:foregroundServiceType="microphone"`; app shows `마이크 사용 안내` before microphone actions. | Runtime permission flow and user-facing explanation must be physically tested. | MANUAL_REQUIRED | Run the phone smoke session and record disclosure gate, permission, service start, visible notification, and stop action evidence. |
| Android foreground service microphone | Manifest declares `FOREGROUND_SERVICE_MICROPHONE` and a visible foreground listening service. | Physical Android device must prove the microphone service starts only from user-visible flow and remains stoppable. | MANUAL_REQUIRED | Use `data/runs/20260528_voice_direction_mvp/53-physical-test-session-pack/commands.sh`. |
| Google Play User Data | Local-first design avoids raw audio, PCM, transcripts, and cloud upload by default; `docs/16-privacy-policy-data-safety-draft.md` drafts privacy policy and Data Safety answers. | Public privacy policy URL, Play Console Data Safety answers, retention/deletion language, and disclosure review must be completed. | BLOCKED | Google Play Console review: required; current draft is not submitted or hosted. |
| Google Play sensitive permissions | The microphone is core to the advertised voice-direction feature; `docs/17-store-review-submission-package-draft.md` drafts limited listing and reviewer copy. | Store listing must disclose the exact voice/direction feature and must not imply hidden or unrelated data collection. | BLOCKED | Validate the submission package, then review against the permissions policy before submission. |
| Prominent disclosure and consent | In-app tester consent copy exists; explicit speaker profile consent gate exists; microphone disclosure gate blocks permission/audio flow until accepted. | Disclosure must be reviewed for microphone use, background/foreground listening expectations, local storage, deletion, and prototype limitations. | BLOCKED | Review `VoiceDirectionTesterConsent.copy`, `microphoneDisclosure`, and the physical user flow with policy criteria. |
| Speaker profile and voice matching | Prototype acoustic embeddings and consent version metadata exist. `docs/21-production-speaker-model-evaluation.md` defines the model evaluation gate. | Production speaker model: not selected. Voice/biometric-adjacent handling needs legal/policy review before public users. | BLOCKED | Select on-device verifier, define thresholds, retention, deletion, anti-spoofing decision, and false-positive limits. |
| Direction claims | Left/right estimator is unit-tested on synthetic stereo PCM; front/back direction is not proven. `docs/22-direction-accuracy-evidence.md` defines the strict evidence gate. | Front/back direction: unproven. Claims must match actual hardware evidence. | BLOCKED | Collect controlled device evidence and pass `scripts/validate-direction-accuracy-evidence.mjs --require-production-direction-ready --json` before using front/back marketing or release language. |
| Meta Wearables DAT SDK | Manifest includes `com.meta.wearable.mwdat.APPLICATION_ID` placeholder and `com.meta.wearable.mwdat.ANALYTICS_OPT_OUT=true`; adapters are still stubs. | Meta app ID, GitHub package access, Developer Center project, terms/AUP review, registration, permissions, and display proof. | BLOCKED | Login to Meta Wearables Developer Center and rerun `scripts/glasses-integration-preflight.sh --write-evidence`. |
| Meta Ray-Ban Display output | Latest cue storage and stub display adapter exist. | Real DAT display adapter and Ray-Ban Display runtime evidence. | BLOCKED | Replace `MetaDatDisplayStubAdapter` only after preflight blockers close. |
| Ray-Ban Meta Gen 1 fallback | Phone notification, vibration, TTS, and Bluetooth route probe exist. | Physical fallback evidence for displayless/audio-only behavior. | MANUAL_REQUIRED | Record whether TTS/phone alert/Bluetooth route behavior is usable with Gen 1. |
| Android XR projected output | `GlassesProjectedActivity` exists with `android:requiredDisplayCategory="xr_projected"`; real Projected adapter is not implemented. | Jetpack Projected dependency proof, Android XR runtime launch, and Play/XR packaging review. | BLOCKED | Keep XR feature requirements optional for the mobile APK unless creating a dedicated XR track. |
| Glasses haptics | Phone vibration adapter and app-side haptics intent contract exist; glasses-side per-side haptics is not confirmed. | Official platform API and hardware proof before claiming right/left glasses haptics. | BLOCKED | Do not claim per-side glasses vibration until a platform-specific implementation is proven. |
| Third-party SDK data | No production third-party model SDK is selected; Meta DAT is a planned SDK. | All SDK data practices must be disclosed and must not sell or share sensitive data in disallowed ways. | BLOCKED | Review Meta SDK terms and any model SDK terms before external beta. |
| Support and deletion process | `docs/14-support-incident-process.md` defines support intake, deletion verification, mistaken-alert triage, severity, and incident response. | Real support channel, deletion verification drill, and mistaken-alert incident drill. | MANUAL_REQUIRED | Run the drills before production. |
| External beta release | Internal prototype builds; phone/glasses physical evidence is missing. | Phone evidence, tester consent review, encrypted-storage device proof, production model, and SDK distribution clearance. | BLOCKED | Do not invite external testers until readiness gates change. |
| Production service | No public release submission has been made. | Store review, SDK release channel approval, voice/recording/legal review, support drills, and hardware direction evidence. | BLOCKED | Keep `store-and-sdk-policy-clearance` blocked in `ReleaseReadiness.kt`; keep support drills blocked until `scripts/validate-support-drill-evidence.mjs --require-drills-ready --json` passes. |

## Data And Permission Mapping

| Data or capability | Current storage behavior | Permission or policy surface | Clearance requirement |
| --- | --- | --- | --- |
| Microphone input | Transient for recognition, enrollment sampling, prototype matching, and short direction sampling. | `RECORD_AUDIO`, foreground-service microphone, Google Play User Data. | Runtime permission, in-app disclosure, foreground visibility, no hidden collection. |
| Raw PCM/audio | Not persisted by current implementation. | Google Play personal/sensitive user data and recording expectations. | Keep out of evidence and storage unless a new approved debug mode is added. |
| Transcript text | Speech recognition text is transient for event fusion; full transcripts are not stored. | User Data and sensitive-permission disclosure. | Do not write transcripts to evidence or telemetry. |
| Speaker labels | Local UI labels can identify a trusted person. | Personal/sensitive data and voice/biometric-adjacent consent. | Keep local, encrypted, deletable, and consent-gated. |
| Voice embeddings | Prototype references are stored; raw vectors should not appear in evidence. | Biometric-adjacent data handling. | Production model and legal/policy review required. |
| Direction metadata | Expected/observed direction, confidence, sample metadata, and route metadata may be stored. | Accuracy and safety claims. | Avoid guaranteed-precision claims; front/back remains unproven until strict direction validation passes. |
| Alert output status | Channel and status only, no private message text. | User data minimization. | Keep evidence non-PII. |
| Bluetooth route metadata | Communication-device route probe avoids device owner names in evidence. | Device data and privacy. | Keep route evidence generic and avoid private device names. |

No raw audio, PCM, transcripts, speaker names, voice embeddings, encrypted payload values, Bluetooth owner names, or private alert text in evidence.

## Platform Packaging Notes

- The current APK is a phone-hosted Android app with an Android XR projected activity. Do not set XR-only manifest requirements that would hide the app from phones unless a separate Android XR release track is created.
- The mobile APK should avoid required hardware features that are not universally available on phones or Android XR devices.
- Meta DAT configuration must keep secrets out of source control. `APPLICATION_ID` can come from manifest placeholders; tokens must remain local or CI secrets.
- Meta DAT analytics opt-out is currently declared as `com.meta.wearable.mwdat.ANALYTICS_OPT_OUT=true`; keep this explicit until a reviewed analytics decision says otherwise.
- Debug receivers are for physical QA and should not be exposed in a release build.

## Required Manual Reviews

Before external beta:

1. Google Play privacy policy and Data Safety draft in `docs/16-privacy-policy-data-safety-draft.md`, then public hosting and Play Console review.
2. Store review submission package in `docs/17-store-review-submission-package-draft.md`, then release artifact, screenshots, and reviewer instruction review.
3. Google Play microphone and sensitive-permission flow review.
4. Tester consent copy review against the actual app screens.
5. Production speaker verification model selection and threshold review.
6. Controlled direction accuracy review for phone, Meta Ray-Ban, and Android XR routes.
6. Meta Wearables logged-in docs, terms, AUP, app registration, and release-channel review.
7. Android XR projected-device runtime and packaging review.
8. Physical Android phone evidence report passing `scripts/validate-device-evidence.mjs`.
9. Physical Ray-Ban Display and Android XR evidence, or a documented fallback-only beta scope.

Before production:

1. Store listing, support contact, privacy policy, deletion workflow, and incident process rehearsed.
2. Front/back direction evidence exists and strict direction validation passes, or all public copy removes front/back claims.
3. Meta release channel and SDK use are approved for the intended distribution scope.
4. Google Play review is complete for the submitted APK/AAB.
5. Production telemetry is useful without private voice, transcript, speaker, route-owner, or encrypted payload values.

## Release Gate

The release-readiness item `store-and-sdk-policy-clearance` remains `BLOCKED`.

This document only proves that the policy clearance work is tracked. It does not prove:

- Meta Wearables Developer Center approval.
- Meta Wearables Developer Terms or Acceptable Use Policy acceptance.
- Google Play review approval.
- Public privacy-policy URL and Play Data Safety submission.
- Play store listing, screenshots, app-content declarations, and reviewer instructions submission.
- Android XR release-track eligibility.
- Voice/biometric legal clearance.
- Production speaker verification safety.
- Front/back direction accuracy.

## Trial/Error Notes

- Public Meta DAT GitHub docs are enough to design a preflight and adapter boundary, but not enough to claim distribution readiness because the official Developer Center docs and terms require login.
- Google Play policy treats microphone data as personal and sensitive. Even local-only processing still needs disclosure and permission timing to match user expectations.
- The app must not market glasses-side per-side haptics until an official API path and physical proof exist.
- Android XR developer-preview APIs can change. Keep Android XR work behind an adapter and rerun policy/package review before release.
- A policy matrix is useful evidence for process maturity, but it is not a substitute for actual review decisions.
