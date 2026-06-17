# Meta Ray-Ban Display Cue Web App

This is a phone-independent display prototype for Voice Direction Glass.

It is intentionally small: it renders a non-PII direction cue for Meta Ray-Ban Display Web Apps while the Android phone lane remains blocked by physical device setup.

## Scope

- Static HTML/CSS/JavaScript only.
- Designed around a 600x600 display viewport.
- Uses high-contrast dark UI and D-pad style focusable controls.
- Accepts only direction enum, confidence bucket, source label, and timestamp.
- Does not request microphone, camera, contacts, Bluetooth, location, or account data.
- Does not store raw audio, speaker names, transcripts, exact locations, device IDs, or private alert text.

## Local Test

Open this file directly in a browser:

```text
apps/meta-rayban-display-webapp/index.html
```

Use arrow keys to change direction:

- Left arrow: `LEFT`
- Right arrow: `RIGHT`
- Up arrow: `FRONT`
- Down arrow: `BACK`
- Space: `UNKNOWN`

URL parameters can seed a cue:

```text
index.html?direction=left&confidence=0.72&source=android-phone
```

## Glasses Deployment

Meta's public Web App toolkit says a Ray-Ban Display Web App must be hosted at a publicly available HTTPS URL before it can be added to glasses. This prototype therefore has no build step; deploy the folder as static files when hardware testing is ready.

## MVP Role

The Android app remains the core processor for voice detection, local profile storage, notification, vibration, TTS, and direction estimation. This Web App is only the display layer candidate for Meta Ray-Ban Display.

