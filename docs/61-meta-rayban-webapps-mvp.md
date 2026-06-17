# Meta Ray-Ban Display Web Apps MVP

Date: 2026-06-17 KST

## Purpose

This document defines the phone-independent Web Apps lane for Meta Ray-Ban Display while Android phone ADB evidence is blocked.

It does not replace the Android phone-first core. It adds a display-only prototype that can be tested in a browser now and deployed to Ray-Ban Display later through a public HTTPS URL.

## Source Snapshot

Checked on 2026-06-17 KST:

| Source | Current implication |
| --- | --- |
| https://developers.meta.com/blog/build-for-display-glasses/ | Meta describes two developer-preview build paths for Ray-Ban Display: native mobile apps via Device Access Toolkit and Web Apps. |
| https://github.com/facebookincubator/meta-wearables-webapp | Public toolkit says Web Apps are standard HTML/CSS/JavaScript rendered on Meta Ray-Ban Display. It lists 600x600 viewport, D-pad navigation, dark background, high contrast, `.focusable` elements, local browser testing, and HTTPS deployment. |
| https://github.com/facebook/meta-wearables-dat-android | Android DAT remains the native mobile path for existing Android apps and GitHub Packages integration. |
| https://github.com/facebook/meta-wearables-dat-ios | iOS DAT exists and should be considered after MVP because the user's current Ray-Ban devices are paired to iPhone. |

## MVP Boundary

The Web App may:

- Render `FRONT`, `BACK`, `LEFT`, `RIGHT`, or `UNKNOWN`.
- Accept only direction enum, confidence bucket, source label, and timestamp.
- Support D-pad style input for local browser and glasses control testing.
- Store only the latest non-PII cue in browser local storage.

The Web App must not:

- Request microphone, camera, Bluetooth, contacts, location, account, or raw sensor permissions in MVP.
- Store raw audio, PCM, transcripts, speaker names, voice embeddings, exact locations, device IDs, Bluetooth names, tokens, or private alert text.
- Claim phone detection, speaker verification, direction accuracy, DAT native integration, or glasses haptics.

## Artifact

Static prototype:

```text
apps/meta-rayban-display-webapp/
  index.html
  styles.css
  app.js
  README.md
```

Local test:

```text
open apps/meta-rayban-display-webapp/index.html
```

Seeded cue example:

```text
apps/meta-rayban-display-webapp/index.html?direction=left&confidence=0.72&source=android-phone
```

## Relationship To Android Core

```text
Android phone app
  - voice detection
  - profile consent/storage
  - microphone permission and foreground service
  - notification, vibration, TTS
  - direction evidence

Meta Ray-Ban Display Web App
  - display-only cue
  - no raw voice data
  - no private speaker text in evidence
```

Until a privacy-reviewed bridge exists, the Web App should remain manual/demo or receive only non-PII cue enums. Any bridge from Android/iOS to Web App must be reviewed before adding network transmission.

## Deployment Gate

Before glasses testing:

1. Host the static folder at a public HTTPS URL.
2. Confirm the URL loads without authentication loops or mixed content.
3. Add the URL in the Meta AI app Web Apps flow after logged-in Meta documentation review.
4. Record only display-visible direction state, source label, timestamp, and pass/fail status.
5. Do not paste account names, Web App private URLs with tokens, device identifiers, or video/audio captures containing private people.

## Open Questions

- Whether Web Apps can receive a cue from a paired phone without a backend or deep link refresh.
- Whether Meta AI app Web Apps setup is available on the user's account and region.
- Whether Web Apps can run reliably while the Android/iOS phone app performs listening and notification tasks.
- Whether a DAT native display adapter is still a better long-term path once credentials and hardware evidence exist.

