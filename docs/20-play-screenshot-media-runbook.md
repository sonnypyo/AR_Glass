# Play Screenshot And Media Runbook

Date: 2026-05-28 KST

Screenshot package status: STORE_ASSETS_DRAFT_ONLY

Capture status: MISSING_PHYSICAL_CAPTURE

External submission: not performed

## Purpose

This document defines how Voice Direction Glass will capture and validate Google Play preview assets before any internal-testing or review-track submission.

It is not a completed screenshot package, not a Play Console upload, not Android XR media proof, and not approval to claim production glasses support.

## Official Source Snapshot

Checked on 2026-05-28 KST.

| Source | URL | Relevance |
| --- | --- | --- |
| Google Play preview assets | https://support.google.com/googleplay/android-developer/answer/1078870?hl=en | Screenshot, feature graphic, and Android XR preview asset requirements. |
| Google Play metadata policy | https://support.google.com/googleplay/android-developer/answer/9898842?hl=en | Store listing metadata, screenshot, icon, and promotional-image guardrails. |
| Google Play store listing best practices | https://support.google.com/googleplay/android-developer/answer/13393723?hl=en | Store listing quality, screenshots, translations, and policy-sensitive copy guidance. |
| Google Play create and set up app | https://support.google.com/googleplay/android-developer/answer/9859152?hl=en-EN | App setup, store listing, and app bundle context. |

## Current Asset Package

The draft manifest is stored at:

```text
apps/voice-direction-glass/store-assets/play-preview/manifest.json
```

Current status:

| Asset group | Status | Submission meaning |
| --- | --- | --- |
| Phone screenshots | Missing physical capture | Needed before any Play store listing submission. |
| Feature graphic | Missing design/capture | Needed before a polished listing and any preview-video cover path. |
| Android XR screenshots | Blocked until XR runtime proof | Required only if Android XR listing/support is claimed; must be separate from phone screenshots. |
| Video | Deferred | Optional; must use synthetic/generic cue flow only. |

## Asset Requirements

| Asset type | Requirement used by this project |
| --- | --- |
| Phone screenshots | JPEG or PNG, at least 2 images before submission, minimum 320 px, maximum 3840 px, max side no more than 2x min side, no private names/transcripts/audio. |
| Feature graphic | JPEG or 24-bit PNG, exactly 1024px by 500px, no alpha, no tiny unreadable text, no production claims. |
| Android XR screenshots | 4 to 8 screenshots if XR support is claimed, PNG or JPEG, max 8 MB each, 8:5 aspect ratio, recommended 3840x2400, minimum 1920x1200. |
| Video | Optional, reviewer-safe synthetic flow only; no real people, private voices, private rooms, or unproven glasses claims. |

## Capture Workflow

From the repository root:

```bash
scripts/capture-play-screenshots.sh --output-dir apps/voice-direction-glass/store-assets/play-preview
```

The script installs the debug APK, launches the main phone activity, captures phone screenshots with `adb exec-out screencap -p`, and can also capture the projected preview screen. It exits with code `2` when no ADB device is attached.

Before capture:

1. Use a generic test profile name only if a profile is visible.
2. Accept `마이크 사용 안내` only if the screenshot needs to show the post-disclosure state.
3. Use `알림 출력 점검` or simulator controls only with generic cue data.
4. Do not show real speaker names, transcripts, contacts, exact location, Bluetooth owner names, or private notification text.
5. Do not show Meta Ray-Ban Display or Android XR screens as production support before hardware proof exists.

## Privacy And Claim Guardrails

Screenshots and media must not include:

- real person names
- raw transcripts or spoken phrases
- raw audio, PCM, embeddings, encrypted payloads, or log output
- private Bluetooth device owner names
- exact location, address, contacts, or calendar information
- front/back accuracy claims
- production speaker identification claims
- production Meta DAT, Android XR, or glasses haptics claims

Allowed current wording:

- internal prototype
- local-first
- microphone disclosure
- phone notification, vibration, and TextToSpeech cues
- projected cue preview
- hardware proof pending

## Validation Command

Default draft validation:

```bash
node scripts/validate-play-screenshot-package.mjs --json
```

Strict phone/store asset validation after real capture:

```bash
node scripts/validate-play-screenshot-package.mjs --require-assets --json
```

Strict Android XR asset validation only after XR support is actually claimed:

```bash
node scripts/validate-play-screenshot-package.mjs --require-assets --require-xr-assets --json
```

The validator checks:

- runbook sections, status markers, and official source URLs
- draft manifest structure and required planned assets
- PNG/JPEG file type and dimensions when files exist
- phone screenshot count in strict mode
- feature graphic size in strict mode
- Android XR screenshot count and 8:5 dimensions when XR strict mode is requested
- private-field and unsupported-claim guardrails in manifest text

## Release Gate

This runbook does not close any external-beta or production release gate.

- `privacy-consent-copy` remains `MANUAL_REQUIRED`.
- `store-and-sdk-policy-clearance` remains `BLOCKED`.
- `front-back-direction-evidence` remains `BLOCKED`.
- `production-speaker-model` remains `BLOCKED`.
- Play screenshot/media assets remain missing until strict validation passes on real captured images.

## Trial/Error Notes

- Store images can become stronger claims than the listing text, so screenshots stay blocked until they are generated from non-private, reviewed test data.
- Android XR preview assets are separated because XR screenshots have different requirements and would imply a stronger platform claim.
- The current package is a manifest and automation shell only; it intentionally does not fabricate screenshots.
- The first real capture should happen after physical phone evidence exists so the screenshots match the tested build state.
