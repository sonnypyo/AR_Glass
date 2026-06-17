# Platform Research

Updated: 2026-05-28 KST

## Sources Checked

- Meta Wearables developer entry point: https://wearables.developer.meta.com/docs/develop
- Meta display glasses developer blog: https://developers.meta.com/blog/build-for-display-glasses/
- Meta Wearables Web App toolkit: https://github.com/facebookincubator/meta-wearables-webapp
- Meta DAT Android GitHub: https://github.com/facebook/meta-wearables-dat-android
- Meta DAT iOS GitHub: https://github.com/facebook/meta-wearables-dat-ios
- Meta DAT Android `AGENTS.md`: https://raw.githubusercontent.com/facebook/meta-wearables-dat-android/main/AGENTS.md
- Meta DAT session lifecycle: https://wearables.developer.meta.com/docs/develop/dat/lifecycle-events/
- Meta DAT Mock Device Kit: https://wearables.developer.meta.com/docs/mock-device-kit/
- Android XR overview: https://developer.android.com/develop/xr
- Android XR Jetpack XR SDK: https://developer.android.com/develop/xr/jetpack-xr-sdk
- Android XR first activity for audio/display glasses: https://developer.android.com/develop/xr/jetpack-xr-sdk/glasses/first-activity
- Android XR ASR: https://developer.android.com/develop/xr/jetpack-xr-sdk/asr
- Android XR hardware access: https://developer.android.com/develop/xr/jetpack-xr-sdk/access-hardware-projected-context
- Android XR support different glasses: https://developer.android.com/develop/xr/jetpack-xr-sdk/glasses/support-different-types
- Android XR TTS: https://developer.android.com/develop/xr/jetpack-xr-sdk/tts
- Android XR Developer Preview 4 announcement: https://developer.android.com/blog/posts/updates-to-the-android-xr-sdk-introducing-developer-preview-4
- Android XR AI glasses design principles: https://developer.android.com/design/ui/ai-glasses/guides/foundations/design-principles?hl=en
- Android Gradle Plugin 9.2 release notes: https://developer.android.com/build/releases/gradle-plugin
- Android built-in Kotlin migration: https://developer.android.com/build/migrate-to-built-in-kotlin
- Kotlin release process: https://kotlinlang.org/docs/releases.html
- Compose compiler migration guide: https://kotlinlang.org/docs/compose-compiler-migration-guide.html
- Compose BOM setup: https://developer.android.com/develop/ui/compose/setup-compose-dependencies-and-compiler
- Google Play User Data policy: https://support.google.com/googleplay/android-developer/answer/10144311?hl=en
- Google Play permissions and sensitive APIs: https://support.google.com/googleplay/android-developer/answer/16558241?hl=en
- Google Play prominent disclosure practices: https://support.google.com/googleplay/android-developer/answer/11150561?hl=en-EN

## Meta Wearables Findings

Meta now exposes two public developer-preview paths for Meta Ray-Ban Display: native mobile integrations through the Meta Wearables Device Access Toolkit and Web Apps rendered directly on the glasses display.

DAT is the native mobile path. The Android DAT repository says the toolkit enables hands-free wearable experiences in mobile apps and is in Developer Preview. The Android SDK is pulled from GitHub Packages and currently uses Maven artifacts under `com.meta.wearable`. The iOS DAT repository is also public and uses Swift Package Manager, so an iPhone companion is technically possible after the Android phone-first MVP proves the core flow.

Important DAT modules for this project:

- `mwdat-core`: registration, permissions, devices, sessions.
- `mwdat-camera`: stream capability, video frames, photo capture.
- `mwdat-mockdevice`: MockDeviceKit for local and automated tests.

The public GitHub README currently shows `mwdat-core`, `mwdat-camera`, and `mwdat-mockdevice` setup examples. Display-specific DAT APIs or modules must be confirmed from the authenticated Wearables Developer Center before replacing `MetaDatDisplayStubAdapter`.

DAT session behavior matters. The public session lifecycle docs define `STOPPED`, `RUNNING`, and `PAUSED`; the app must observe state and release/restart resources only from observed device state, not assumptions.

MockDeviceKit is useful immediately. It simulates device pairing, availability, camera streaming, permissions, and device state changes without requiring the physical glasses on every iteration.

Current caution:

- Some Meta docs are login-gated.
- DAT is Developer Preview, so distribution and API stability are not production-grade.
- The public Android DAT agent file emphasizes camera/display/session APIs, but does not provide a confirmed raw multi-microphone direction API. Directional audio must be proven on actual hardware before claiming the final feature.
- Web Apps are useful for a Ray-Ban Display cue layer, but the public toolkit does not prove raw microphone access, speaker verification, or direction-of-arrival support. Treat Web Apps as display output unless authenticated docs and hardware evidence prove more.

## Meta Ray-Ban Display Web Apps Findings

Meta's public display-glasses blog describes Web Apps as a standard HTML/CSS/JavaScript path for Ray-Ban Display. The public toolkit says browser testing can use arrow keys to simulate D-pad input, and glasses deployment requires a publicly available HTTPS URL. It also lists display constraints that matter for this project: 600x600 viewport, D-pad navigation, dark backgrounds, high contrast, and `.focusable` elements.

MVP implication:

- Add a small static Web App that renders only non-PII direction cue enums.
- Do not move voice detection, speaker profiles, microphone capture, or direction estimation into the Web App.
- Do not add a network bridge until the privacy boundary is reviewed.
- Use Web Apps for fast Ray-Ban Display proof while keeping DAT native as the deeper hardware integration path.

## Android XR Findings

Android XR has reached Developer Preview 4 as of 2026-05-19. The official overview explicitly separates immersive XR headsets/wired XR glasses from lightweight audio/display glasses. The current first-activity documentation for this target uses the `glasses/first-activity` path.

For audio/display glasses, Android XR uses a companion host device model: the phone app projects a dedicated activity to the glasses. That maps well to this product because the phone can own enrollment, local storage, notifications, and model execution while glasses present lightweight cues.

Relevant Android XR pieces:

- Jetpack Projected: phone-to-glasses projected experiences.
- Jetpack Compose Glimmer: glanceable UI for display glasses.
- Android `SpeechRecognizer`: built-in ASR, can work offline, requires `RECORD_AUDIO`.
- Android `TextToSpeech`: built-in feedback, useful for displayless or display-off mode.
- Android XR TTS guidance says Android `TextToSpeech` is built in, requires no additional libraries, can work offline, and is useful for displayless mode. The app now uses that as a conservative audio cue fallback.
- Projected context: required to access glasses hardware such as camera/microphone where available.
- CameraX: official path for projected glasses camera capture.
- Bluetooth HFP: fallback path for audio/display glasses when projected context is unavailable, but it is single-microphone and weaker for direction estimation.

Current caution:

- Android XR glasses APIs are still preview APIs.
- Google docs discuss microphone and ASR, but precise multi-mic direction-of-arrival is not guaranteed by the pages reviewed.
- Haptic/vibration output from the glasses was not confirmed in the reviewed docs. Phone vibration and visual/audio cue are the safe MVP outputs.
- Android XR docs describe two glasses microphone routes: projected context for multiple microphones and Bluetooth HFP for a single microphone fallback. The app now exposes a Bluetooth communication-device route probe, but it still needs physical-device proof.

## Product Implications

The viable project shape is:

1. Build a phone-first native Android app.
2. Add a Meta Ray-Ban Display Web App cue prototype for display-only proof.
3. Add a Meta DAT adapter for deeper Ray-Ban Display/Gen 1 hardware sessions after credentials and logged-in docs are confirmed.
4. Add an Android XR projected activity for audio/display glasses.
5. Keep voice detection and direction estimation independent of every display platform.
6. Treat exact direction and glasses-side haptics as hardware validation milestones, not assumptions.

## Build Tooling Findings

The first Android scaffold uses Android Gradle Plugin 9.2.0 because official release notes list it as the current AGP line as of May 2026. AGP 9.2 requires Gradle 9.4.1 and JDK 17.

AGP 9 enables built-in Kotlin support, so the scaffold does not apply `org.jetbrains.kotlin.android`. Because the app uses Compose with Kotlin 2.3.21, it applies `org.jetbrains.kotlin.plugin.compose` as recommended by the Kotlin Compose compiler migration guide.

The scaffold uses Compose BOM `2026.05.00`, which is shown in the current Android Compose dependency setup docs.

## Policy Clearance Findings

The current policy matrix is maintained in `docs/15-policy-clearance-matrix.md`.

The current privacy policy and Play Data Safety draft is maintained in `docs/16-privacy-policy-data-safety-draft.md`.

Key implications:

- Meta Wearables Developer Center docs, Developer Terms, and Acceptable Use Policy still need logged-in review.
- Google Play treats microphone and similar device data as personal and sensitive user data. The app must disclose microphone use, local voice-profile handling, deletion, retention, and any SDK data handling before external beta.
- The current draft describes a no-off-device-collection build, but that answer must be rechecked if Meta DAT, Android XR, analytics, crash reporting, support upload, backend sync, or a cloud model is added.
- Android foreground microphone service behavior must remain visible, permissioned, and user-stoppable.
- The matrix is a tracking artifact only; it does not prove store or SDK approval.

## Open Questions For Device Testing

- Does Meta DAT expose usable microphone frames or only system-mediated audio/voice paths in the current account/dev mode?
- Can Ray-Ban Display show our directional cue through DAT display preview in Korea with the user's account and device firmware?
- Can a Ray-Ban Display Web App be added from the user's Meta AI app account and region, and can it receive a non-PII cue without a backend?
- Can Android XR projected context provide enough microphone/channel data for direction estimation, or only ASR-level text?
- Is any side-specific haptic output available on the glasses or Neural Band through official APIs?
- What are the background recording limits for each target phone OS and release channel?
