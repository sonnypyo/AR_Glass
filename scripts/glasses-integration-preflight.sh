#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT_DIR/apps/voice-direction-glass"
APP_GRADLE="$APP_DIR/app/build.gradle.kts"
ROOT_GRADLE="$APP_DIR/build.gradle.kts"
VERSION_CATALOG="$APP_DIR/gradle/libs.versions.toml"
MANIFEST="$APP_DIR/app/src/main/AndroidManifest.xml"
LOCAL_PROPERTIES="$APP_DIR/local.properties"
APK_PATH="$APP_DIR/app/build/outputs/apk/debug/app-debug.apk"
PROJECTED_ACTIVITY_SOURCE="$APP_DIR/app/src/main/kotlin/com/voicedirection/glass/app/GlassesProjectedActivity.kt"
META_STUB_SOURCE="$APP_DIR/app/src/main/kotlin/com/voicedirection/glass/devices/MetaDatDisplayStubAdapter.kt"
XR_STUB_SOURCE="$APP_DIR/app/src/main/kotlin/com/voicedirection/glass/devices/AndroidXrDisplayStubAdapter.kt"
ANDROID_XR_CONTRACT_VALIDATOR="$ROOT_DIR/scripts/validate-android-xr-projected-contract.mjs"

if [[ -z "${ANDROID_HOME:-}" && -d "/Users/sonjunpyo/Library/Android/sdk" ]]; then
  export ANDROID_HOME="/Users/sonjunpyo/Library/Android/sdk"
fi

ADB_BIN="${ADB:-${ANDROID_HOME:-}/platform-tools/adb}"

write_evidence=false
evidence_dir=""

usage() {
  echo "Usage: $0 [--write-evidence] [--evidence-dir DIR]" >&2
}

while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --write-evidence)
      write_evidence=true
      shift
      ;;
    --evidence-dir)
      write_evidence=true
      shift
      if [[ "$#" -eq 0 ]]; then
        echo "--evidence-dir requires a directory path." >&2
        usage
        exit 1
      fi
      evidence_dir="$1"
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

ROWS=()
BLOCKERS=0
MANUAL_ITEMS=0
PASSES=0

escape_cell() {
  printf '%s' "$1" | sed 's/|/\\|/g'
}

add_row() {
  local area="$1"
  local check="$2"
  local result="$3"
  local notes="$4"
  ROWS+=("| $(escape_cell "$area") | $(escape_cell "$check") | $(escape_cell "$result") | $(escape_cell "$notes") |")
  case "$result" in
    pass)
      PASSES=$((PASSES + 1))
      ;;
    blocked)
      BLOCKERS=$((BLOCKERS + 1))
      ;;
    manual|required|manual-required)
      MANUAL_ITEMS=$((MANUAL_ITEMS + 1))
      ;;
  esac
}

file_contains() {
  local file="$1"
  local pattern="$2"
  [[ -f "$file" ]] && grep -q "$pattern" "$file"
}

local_property_exists() {
  local key="$1"
  [[ -f "$LOCAL_PROPERTIES" ]] && grep -Eq "^${key}[[:space:]]*=" "$LOCAL_PROPERTIES"
}

has_dat_token=false
if [[ -n "${GITHUB_TOKEN:-}" ]] || local_property_exists "github_token"; then
  has_dat_token=true
fi

has_meta_app_id=false
if [[ -n "${META_WEARABLES_APPLICATION_ID:-}" ]] ||
  local_property_exists "meta_wearables_application_id" ||
  local_property_exists "metaWearablesApplicationId"; then
  has_meta_app_id=true
fi

add_row "Workspace" "Android app directory" "$(if [[ -d "$APP_DIR" ]]; then echo pass; else echo blocked; fi)" "$APP_DIR"
add_row "Workspace" "Android manifest" "$(if [[ -f "$MANIFEST" ]]; then echo pass; else echo blocked; fi)" "$MANIFEST"
add_row "Workspace" "Debug APK built" "$(if [[ -f "$APK_PATH" ]]; then echo pass; else echo manual-required; fi)" "$APK_PATH"

if [[ -x "$ADB_BIN" ]]; then
  device_count="$("$ADB_BIN" devices | awk 'NR > 1 && $2 == "device" { count++ } END { print count + 0 }')"
  if [[ "$device_count" -gt 0 ]]; then
    add_row "Device" "ADB device attached" "pass" "$device_count device(s) attached."
  else
    add_row "Device" "ADB device attached" "manual-required" "No ADB device is attached. Connect Android phone, Ray-Ban host phone, or Android XR host."
  fi
else
  add_row "Device" "ADB available" "blocked" "adb not found. Set ANDROID_HOME or ADB."
fi

add_row "Meta DAT" "GitHub Packages token configured" "$(if [[ "$has_dat_token" == true ]]; then echo pass; else echo blocked; fi)" "Use GITHUB_TOKEN or app local.properties github_token; value is never printed."
add_row "Meta DAT" "Meta Wearables application id configured" "$(if [[ "$has_meta_app_id" == true ]]; then echo pass; else echo blocked; fi)" "Use META_WEARABLES_APPLICATION_ID or app local.properties meta_wearables_application_id; value is never printed."
add_row "Meta DAT" "Application ID manifest metadata" "$(if file_contains "$MANIFEST" "com.meta.wearable.mwdat.APPLICATION_ID"; then echo pass; else echo blocked; fi)" "Value is supplied through manifest placeholder and must not be hard-coded."
add_row "Meta DAT" "Analytics opt-out manifest metadata" "$(if file_contains "$MANIFEST" "com.meta.wearable.mwdat.ANALYTICS_OPT_OUT"; then echo pass; else echo manual-required; fi)" "Privacy-first default for DAT analytics."
add_row "Meta DAT" "DAT Maven repository configured" "$(if file_contains "$APP_GRADLE" "meta-wearables-dat-android" || file_contains "$ROOT_GRADLE" "meta-wearables-dat-android"; then echo pass; else echo blocked; fi)" "Needed before replacing MetaDatDisplayStubAdapter."
add_row "Meta DAT" "DAT dependency configured" "$(if file_contains "$APP_GRADLE" "com.meta.wearable" || file_contains "$VERSION_CATALOG" "com.meta.wearable"; then echo pass; else echo blocked; fi)" "Public setup lists com.meta.wearable artifacts; display cue API/module still needs account-doc confirmation."
add_row "Meta DAT" "Stub adapter still active" "$(if [[ -f "$META_STUB_SOURCE" ]]; then echo manual-required; else echo pass; fi)" "Replace only after credentials, package access, and a device session are available."

add_row "Android XR" "Projected activity source exists" "$(if [[ -f "$PROJECTED_ACTIVITY_SOURCE" ]]; then echo pass; else echo blocked; fi)" "$PROJECTED_ACTIVITY_SOURCE"
add_row "Android XR" "Manifest declares projected display category" "$(if file_contains "$MANIFEST" "android:requiredDisplayCategory=\"xr_projected\""; then echo pass; else echo blocked; fi)" "Required for launching the cue screen as projected glasses UI."
add_row "Android XR" "RECORD_AUDIO permission declared" "$(if file_contains "$MANIFEST" "android.permission.RECORD_AUDIO"; then echo pass; else echo blocked; fi)" "Needed for phone and projected-device microphone flows."
add_row "Android XR" "BLUETOOTH_CONNECT permission declared" "$(if file_contains "$MANIFEST" "android.permission.BLUETOOTH_CONNECT"; then echo pass; else echo manual-required; fi)" "Needed for Bluetooth HFP fallback testing."
add_row "Android XR" "MODIFY_AUDIO_SETTINGS permission declared" "$(if file_contains "$MANIFEST" "android.permission.MODIFY_AUDIO_SETTINGS"; then echo pass; else echo manual-required; fi)" "Needed before routing communication audio to Bluetooth HFP during device tests."
add_row "Android XR" "Jetpack Projected dependency configured" "$(if file_contains "$APP_GRADLE" "androidx.xr" || file_contains "$VERSION_CATALOG" "androidx.xr"; then echo pass; else echo blocked; fi)" "Needed for ProjectedContext launch and projected-device hardware access."
add_row "Android XR" "Compose Glimmer dependency configured" "$(if file_contains "$APP_GRADLE" "glimmer" || file_contains "$VERSION_CATALOG" "glimmer"; then echo pass; else echo manual-required; fi)" "Needed for production display-glasses UI; current preview uses standard Compose."
add_row "Android XR" "Stub adapter still active" "$(if [[ -f "$XR_STUB_SOURCE" ]]; then echo manual-required; else echo pass; fi)" "Replace after Jetpack Projected runtime proof."
add_row "Android XR" "Projected contract default validation" "$(if [[ -x "$ANDROID_XR_CONTRACT_VALIDATOR" ]] && "$ANDROID_XR_CONTRACT_VALIDATOR" --json >/dev/null 2>&1; then echo pass; else echo blocked; fi)" "Validates the current phone-preview/stub contract without storing page bodies or private data."
add_row "Android XR" "Strict real projected contract" "$(if [[ -x "$ANDROID_XR_CONTRACT_VALIDATOR" ]] && "$ANDROID_XR_CONTRACT_VALIDATOR" --require-real-android-xr --json >/dev/null 2>&1; then echo pass; else echo manual-required; fi)" "Expected to remain manual-required until Jetpack XR, Glimmer, ProjectedContext, real adapter, and runtime evidence exist."

summary_status="manual-required"
if [[ "$BLOCKERS" -gt 0 ]]; then
  summary_status="blocked"
elif [[ "$MANUAL_ITEMS" -eq 0 ]]; then
  summary_status="pass"
fi

generate_report() {
  local generated_at
  generated_at="$(date +"%Y-%m-%dT%H:%M:%S%z")"
  printf '# Glasses Integration Preflight\n\n'
  printf 'Generated: %s\n\n' "$generated_at"
  printf '## Summary\n\n'
  printf -- '- Overall status: %s\n' "$summary_status"
  printf -- '- Pass: %s\n' "$PASSES"
  printf -- '- Manual required: %s\n' "$MANUAL_ITEMS"
  printf -- '- Blocked: %s\n\n' "$BLOCKERS"
  printf '## Checks\n\n'
  printf '| Area | Check | Result | Notes |\n'
  printf '| --- | --- | --- | --- |\n'
  printf '%s\n' "${ROWS[@]}"
  printf '\n## Source Basis\n\n'
  printf -- '- Meta DAT Android SDK is developer preview and uses GitHub Packages token access: https://github.com/facebook/meta-wearables-dat-android\n'
  printf -- '- Meta DAT session lifecycle must be observed before doing live work: https://wearables.developer.meta.com/docs/develop/dat/lifecycle-events/\n'
  printf -- '- Android XR Jetpack Projected is the phone-to-audio/display-glasses path: https://developer.android.com/develop/xr/jetpack-xr-sdk\n'
  printf -- '- Android XR projected activities launch with ProjectedContext options: https://developer.android.com/develop/xr/jetpack-xr-sdk/glasses/first-activity\n'
  printf -- '- Android XR projected microphone access needs projected-device-scoped permissions and AudioRecord with projected context: https://developer.android.com/develop/xr/jetpack-xr-sdk/access-hardware-projected-context\n\n'
  printf '## Next Actions\n\n'
  printf '1. Add Meta credentials only in environment variables or `apps/voice-direction-glass/local.properties`.\n'
  printf '2. Add DAT Maven/dependencies after credentials are available.\n'
  printf '3. Add Jetpack Projected/Glimmer dependencies only when Android XR preview artifacts are available in this toolchain.\n'
  printf '4. Keep `scripts/validate-android-xr-projected-contract.mjs --json` passing before changing the projected screen, and use strict mode only when real Android XR runtime evidence should pass.\n'
  printf '5. Run this preflight again, then run `scripts/android-device-smoke-test.sh --write-evidence` with a physical phone.\n'
  printf '6. Do not mark glasses private alpha ready until a Ray-Ban Display or Android XR evidence file proves projected cue behavior.\n'
}

if [[ "$write_evidence" == true ]]; then
  if [[ -z "$evidence_dir" ]]; then
    evidence_dir="$ROOT_DIR/data/runs/$(date +%Y%m%d_%H%M%S)_glasses_preflight"
  elif [[ "$evidence_dir" != /* ]]; then
    evidence_dir="$ROOT_DIR/$evidence_dir"
  fi
  mkdir -p "$evidence_dir"
  generate_report > "$evidence_dir/glasses-preflight.md"
  echo "Preflight evidence written: $evidence_dir/glasses-preflight.md"
else
  generate_report
fi
