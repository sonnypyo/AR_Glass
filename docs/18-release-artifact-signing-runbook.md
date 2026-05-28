# Release Artifact And Signing Runbook

Date: 2026-05-28 KST

Release artifact status: STRUCTURAL_DRAFT_ONLY

Upload-ready status: BLOCKED_NO_UPLOAD_KEY

External submission: not performed

## Purpose

This document defines how Voice Direction Glass will move from a debug APK prototype to a Google Play upload-ready Android App Bundle.

It is not a generated upload key, not a Play Console upload, not Play App Signing enrollment, and not proof that the app is release-ready.

## Official Source Snapshot

Checked on 2026-05-28 KST.

| Source | URL | Relevance |
| --- | --- | --- |
| Android command-line build | https://developer.android.com/build/building-cmdline?hl=en | Gradle `bundle<Variant>` tasks, debug APK versus release bundle, release signing requirement. |
| Android app signing | https://developer.android.com/guide/publishing/app-signing.html | Upload key, release signing, Play App Signing flow, key security. |
| Google Play App Signing | https://support.google.com/googleplay/android-developer/answer/9842756/use-play-app-signing?hl=en-GB | App signing key, upload key, certificates, Play-managed signing model. |
| Google Play prepare and roll out release | https://support.google.com/googleplay/android-developer/answer/9859348?hl=en | Release tracks, app bundles, release notes, Play App Signing during first release. |
| Google Play create and set up app | https://support.google.com/googleplay/android-developer/answer/9859152?hl=en-EN | Creating the app record, store listing setup, single app bundle upload expectations. |

## Current Artifact State

| Artifact | Current status | Release meaning |
| --- | --- | --- |
| Debug APK | Present after `./gradlew --no-daemon test assembleDebug`. | Useful for local and physical QA only; not Play upload-ready. |
| Release AAB | Can be generated structurally with `./gradlew --no-daemon bundleRelease`. | Not upload-ready unless signed with the upload key. |
| Upload key | Not present in repository. | Correct; private keys must stay outside source control. |
| Play App Signing | Not configured in this workspace. | Must be configured in Play Console before release. |
| Release screenshots | Not generated. | Required before store submission package can move beyond draft. |
| Physical device evidence | Not present. | Phone private alpha remains not ready. |

## Gradle Signing Configuration

The app module has a conditional release signing path. It reads release signing values from environment variables first and `local.properties` second.

| Value | Environment variable | `local.properties` key | Repository rule |
| --- | --- | --- | --- |
| Upload keystore path | `VOICE_DIRECTION_RELEASE_STORE_FILE` | `voice_direction_release_store_file` | Path may point outside the repo; do not commit the keystore. |
| Keystore password | `VOICE_DIRECTION_RELEASE_STORE_PASSWORD` | `voice_direction_release_store_password` | Secret; never commit. |
| Key alias | `VOICE_DIRECTION_RELEASE_KEY_ALIAS` | `voice_direction_release_key_alias` | Secret-adjacent; keep local. |
| Key password | `VOICE_DIRECTION_RELEASE_KEY_PASSWORD` | `voice_direction_release_key_password` | Secret; never commit. |

If all four values are present, Gradle uses signing config `voiceDirectionUpload` for the `release` build type. If any value is missing, the project can still build debug artifacts and can attempt an unsigned structural release bundle, but that bundle must not be uploaded to Play.

## Local Build Commands

From `apps/voice-direction-glass`:

```bash
export JAVA_HOME=/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home
export ANDROID_HOME=/Users/sonjunpyo/Library/Android/sdk
./gradlew --no-daemon test assembleDebug
./gradlew --no-daemon bundleRelease
```

From the repository root:

```bash
node scripts/validate-release-artifact-readiness.mjs --json
```

Use stricter mode only after the upload key and release bundle are ready:

```bash
node scripts/validate-release-artifact-readiness.mjs --require-upload-ready --json
```

## Upload-Ready Checklist

Before uploading an AAB to Play Console:

1. Physical Android phone `device-evidence.md` exists and passes `scripts/validate-device-evidence.mjs`.
2. Public privacy policy URL exists and is linked in app and Play Console.
3. Play Data Safety answers match the exact package and SDK set.
4. Store review package in `docs/17-store-review-submission-package-draft.md` validates.
5. Play App Signing is configured or ready to be configured for the first release.
6. Upload key is generated and stored outside source control.
7. Release AAB is signed with the upload key.
8. Release notes pass `scripts/validate-release-notes-versioning.mjs --json` and match the exact Gradle version being uploaded.
9. Non-private screenshots pass `scripts/validate-play-screenshot-package.mjs --require-assets --json`.
10. Meta DAT and Android XR claims are removed or backed by actual review/hardware evidence.
11. Support/deletion and mistaken-alert drills are rehearsed.

## Security Guardrails

- Do not commit `.jks`, `.keystore`, `.p12`, `.pem`, `.pk8`, or signing password files.
- Do not print signing passwords in CI logs.
- Prefer a separate upload key from the Play app signing key.
- Keep `local.properties` local-only.
- Rotate the upload key through Play Console if compromised.
- Do not use the debug key for Play upload.

## Release Gate

This runbook does not close any external-beta or production release gate.

- `store-and-sdk-policy-clearance` remains `BLOCKED`.
- `privacy-consent-copy` remains `MANUAL_REQUIRED`.
- `production-speaker-model` remains `BLOCKED`.
- `front-back-direction-evidence` remains `BLOCKED`.
- Physical Android phone evidence is still required.

## Trial/Error Notes

- A generated `app-release.aab` is not automatically upload-ready; signing and Play App Signing context matter.
- The repository should know how to build and validate release artifacts without containing any private key material.
- The first real Play upload should happen only after phone evidence, privacy URL, Data Safety, release screenshots, and policy review are aligned.
- Debug APK success is necessary for development velocity, but it is not an external release artifact.
