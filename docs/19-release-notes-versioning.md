# Release Notes And Versioning Readiness

Date: 2026-05-28 KST

Release notes status: INTERNAL_TESTING_DRAFT

Version status: VERSION_0_1_0_CODE_1

External submission: not performed

## Purpose

This document defines the Play internal-testing release notes, current app version source, version increment rules, and wording guardrails for Voice Direction Glass.

It is not a Play Console upload, not a production release note, not a public listing approval, and not proof that the app is ready for external testers.

## Official Source Snapshot

Checked on 2026-05-28 KST.

| Source | URL | Relevance |
| --- | --- | --- |
| Google Play prepare and roll out release | https://support.google.com/googleplay/android-developer/answer/9859348?hl=en-EN | Release tracks, app bundles, release notes, and the 500 Unicode characters per language release-note limit. |
| Google Play set up open, closed, or internal test | https://support.google.com/googleplay/android-developer/answer/9845334?hl=en | Internal testing track purpose, tester setup, and test distribution behavior. |
| Google Play create and set up app | https://support.google.com/googleplay/android-developer/answer/9859152?hl=en-EN | App bundle upload context and store-listing field constraints. |

## Current Version Source

The authoritative version source is:

```text
apps/voice-direction-glass/app/build.gradle.kts
```

| Field | Current value | Meaning |
| --- | --- | --- |
| `applicationId` | `com.voicedirection.glass` | Package identity for local builds and future Play setup. |
| `versionCode` | `1` | Numeric Play upload version. Must increase for every Play upload attempt. |
| `versionName` | `0.1.0` | Human-readable internal prototype version. |

## Release Notes Draft

The current internal-testing release-note draft is stored at:

```text
apps/voice-direction-glass/release-notes/internal-testing-v0.1.0.md
```

Rules for this draft:

- Keep one note per locale under 500 Unicode characters.
- Keep the release status as `DRAFT_NOT_SUBMITTED` until Play Console upload evidence exists.
- Do not include private speaker names, transcripts, raw audio details, Bluetooth owner names, or real tester identities.
- State current limitations directly: not production speaker ID, not front/back proven, not real Meta DAT/Android XR release support.
- Re-run `scripts/validate-release-notes-versioning.mjs --json` after every wording or version change.

## Versioning Rules

1. Increase `versionCode` before every new Play upload, including internal testing, closed testing, open testing, and production.
2. Keep `versionName` semantic and human-readable; `0.1.0` is the current internal prototype line.
3. Never reuse a `versionCode` after a bundle has been uploaded to Play Console.
4. Do not change public release notes without checking the exact build artifact that will be attached to the track.
5. Keep release notes narrower than store copy and narrower than the product vision.
6. Treat a structural `app-release.aab` as insufficient until `docs/18-release-artifact-signing-runbook.md` reaches upload-ready validation.

## Internal Testing Gate

The internal-testing release note can be used only after these remain aligned:

| Gate | Current status | Required action |
| --- | --- | --- |
| Physical phone evidence | Missing | Run `scripts/android-device-smoke-test.sh --write-evidence` with a real Android phone. |
| Privacy URL | Missing | Host the privacy policy from `docs/16-privacy-policy-data-safety-draft.md` and replace TBD fields. |
| Play Data Safety | Draft only | Complete Play Console answers for the exact package and SDK set. |
| Upload-signed AAB | Blocked | Configure upload-key signing outside source control and pass strict release artifact validation. |
| Screenshots | Missing | Generate non-private screenshots from generic test data. |
| Tester list | Missing | Create the internal tester group/list in Play Console. |
| Review package | Draft only | Keep `docs/17-store-review-submission-package-draft.md` valid and attach reviewer-safe instructions. |

## Public Copy Guardrails

Release notes must not claim:

- guaranteed speaker identity
- front/back direction proven
- real Meta DAT support
- Android XR production support
- glasses haptics supported
- production ready
- available on Google Play

Allowed language for the current build:

- internal prototype
- local-first Android app
- microphone disclosure
- phone notification, vibration, and TextToSpeech cue paths
- projected cue preview
- Meta DAT and Android XR adapters under development

## Validation Command

From the repository root:

```bash
node scripts/validate-release-notes-versioning.mjs --json
```

The validator checks:

- the current Gradle `applicationId`, `versionCode`, and `versionName`
- document sections, status markers, and official source URLs
- locale release-note blocks and the 500-character limit
- limitation language and prohibited public claims
- release-note filename/title alignment with the current Gradle version

## Release Gate

This document does not close any external-beta or production release gate.

- `privacy-consent-copy` remains `MANUAL_REQUIRED`.
- `store-and-sdk-policy-clearance` remains `BLOCKED`.
- `production-speaker-model` remains `BLOCKED`.
- `front-back-direction-evidence` remains `BLOCKED`.
- Upload-ready release validation remains blocked until a signed AAB and signing evidence exist.

## Trial/Error Notes

- Versioning and release notes look small, but they become permanent release history once uploaded.
- Internal tester copy must still avoid production claims because screenshots, release notes, and listing metadata can be reviewed as external representations of the app.
- Korean and English notes should say the same limitations even if the wording is localized.
- The current release note intentionally says less than the long-term target because Meta DAT, Android XR, and front/back direction evidence are not proven yet.
