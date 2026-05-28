# Privacy And Safety

## Sensitive Data Classification

Voice profiles are biometric-adjacent sensitive data. Treat them as private even if stored as embeddings instead of raw audio.

## Consent

Enrollment requires explicit consent from the person whose voice is saved. The app should show:

- What is stored.
- Why it is stored.
- Where it is stored.
- How to delete it.
- Whether any cloud processing is enabled.

Current tester-facing copy is maintained in:

```text
apps/voice-direction-glass/app/src/main/kotlin/com/voicedirection/glass/qa/TesterConsentCopy.kt
```

It is rendered in the host app under `테스터 동의와 한계`. The copy covers stored data, data not stored, prototype limitations, tester commitments, and the local delete action. It is a review-ready draft, not final legal/policy approval.

`VoiceDirectionTesterConsent.microphoneDisclosure` is rendered near the top of the host app as `마이크 사용 안내`. Microphone-backed actions must not request OS microphone permission or start audio flow until that disclosure is checked. The accepted disclosure version is stored in local settings and appears in non-PII evidence snapshots.

The current policy tracking matrix is:

```text
docs/15-policy-clearance-matrix.md
```

That matrix keeps store, SDK, recording, voice, and wearable distribution clearance blocked until external review evidence exists.

The current privacy policy and Google Play Data Safety draft is:

```text
docs/16-privacy-policy-data-safety-draft.md
```

That draft maps the current local-first implementation to a privacy policy outline and Data Safety worksheet. It is not submitted, not hosted at a public privacy URL, and not legal or Play Console approval.

## Local-First Defaults

Default behavior:

- Store speaker embeddings locally.
- Store only detection metadata.
- Do not store raw audio.
- Do not upload audio.
- Do not upload transcripts.
- Do not upload exact location.

Current development implementation:

- The Android scaffold stores consented speaker labels, simulated/prototype embedding references, trigger phrase settings, simulated direction settings, latest glasses cue metadata, service bridge snapshots, detection metadata, detection feedback, and false-positive run state as AndroidKeyStore AES-GCM encrypted string payloads in app-private `SharedPreferences`.
- The Android scaffold stores microphone disclosure acceptance state and version as local settings.
- Legacy plaintext preference keys are read only as a migration fallback when no encrypted value exists. New writes remove the plaintext key.
- It does not store raw audio.
- The foreground service uses recognized text as transient input for event fusion; it does not persist full transcripts.
- The microphone channel probe checks Android `AudioRecord` support metadata and minimum buffer sizes; it does not read or store PCM samples.
- The Bluetooth route probe checks Android communication-device metadata only; it does not start recording or store audio.
- Bluetooth route selection uses Android communication routing for an observed test session and does not store route history, device names, audio, or transcripts.
- TTS output uses short direction-only text and intentionally avoids speaking stored speaker labels by default.
- Glasses display payloads may include the trusted speaker label for the user-facing cue, but adapter delivery messages and generated evidence use a non-PII summary with only direction, confidence percent, and speaker-label-present status.
- The direction sample action reads one short PCM buffer in memory and immediately reduces it to direction/confidence metadata; it does not write PCM to disk or preferences.
- Direction validation trials persist only expected direction, observed direction, status, confidence, sample rate, sample count, source label, and timestamp; they do not store PCM, transcripts, or speaker labels.
- The enrollment sample action reads one short mono PCM buffer in memory and immediately reduces it to RMS/peak/clipping quality metadata plus a prototype feature embedding. It persists only profile sample count, enrollment status, and embedding reference, not PCM.
- The prototype voice match action reads a fresh mono PCM buffer in memory, reduces it to an embedding, compares it locally, and stores no match audio.
- Detection feedback stores only event id, feedback type, and timestamp. It does not store corrected transcripts, speaker names, or raw audio.
- False-positive run state stores only run id, start/end timestamps, and target duration.
- Alert channel preferences store only enabled output enum names.
- Direct alert output tests store only channel delivery status and use a generic direction cue; they do not create detection events.
- It has a local delete action.
- The encrypted storage path must still be proven on a physical Android device before any external beta that uses real voice profiles.

## Debug Mode

Debug mode can record short samples only if the user explicitly enables it. Debug files must be easy to delete and must not sync automatically.

## Identification Limits

The app identifies only enrolled speakers. It must not label unknown people by name. Unknown voice results should remain `unknown`.

## Alert Safety

Direction cues are assistive, not safety-critical. The UI must avoid language that implies guaranteed precision. Use confidence and fallback states.

Tester limitation language must continue to state that:

- Prototype voice matching is not a guaranteed identity model.
- Front/back direction is not verified.
- Left/right direction still needs hardware evidence.
- Glasses haptics and real Meta DAT/Android XR output remain behind hardware gates.

## Cloud AI Rules

Cloud AI is allowed only after explicit approval and documentation update. Required before enabling:

- Vendor and API documented.
- Data sent documented.
- Retention policy documented.
- User opt-in designed.
- Offline/local fallback retained.

## Analytics Rules

Allowed:

- Generic event names.
- Device adapter type.
- Confidence bucket.
- Error code.

Forbidden:

- Speaker name.
- Trigger phrase.
- Raw audio.
- Transcript.
- Contact identifiers.
- Exact location.
- Voice embedding values.
- Encrypted payload values.
- Bluetooth owner names.
