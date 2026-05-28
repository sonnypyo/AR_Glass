#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT_DIR/apps/voice-direction-glass"
APK_PATH="$APP_DIR/app/build/outputs/apk/debug/app-debug.apk"
PACKAGE_NAME="com.voicedirection.glass"
MAIN_ACTIVITY="$PACKAGE_NAME/.app.MainActivity"
PROJECTED_ACTIVITY="$PACKAGE_NAME/.app.GlassesProjectedActivity"

if [[ -z "${JAVA_HOME:-}" && -d "/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home" ]]; then
  export JAVA_HOME="/Users/sonjunpyo/.codex/toolchains/jdk-17/Contents/Home"
fi

if [[ -z "${ANDROID_HOME:-}" && -d "/Users/sonjunpyo/Library/Android/sdk" ]]; then
  export ANDROID_HOME="/Users/sonjunpyo/Library/Android/sdk"
fi

ADB_BIN="${ADB:-${ANDROID_HOME:-}/platform-tools/adb}"
OUTPUT_DIR="$ROOT_DIR/apps/voice-direction-glass/store-assets/play-preview"
skip_build=false
include_projected_preview=true

usage() {
  cat >&2 <<'USAGE'
Usage: scripts/capture-play-screenshots.sh [--skip-build] [--phone-only] [--output-dir DIR]

Captures reviewer-safe draft Play screenshots from an attached Android device.
This script does not fabricate assets and exits with code 2 when no ADB device is attached.
USAGE
}

while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --skip-build)
      skip_build=true
      shift
      ;;
    --phone-only)
      include_projected_preview=false
      shift
      ;;
    --output-dir)
      shift
      if [[ "$#" -eq 0 ]]; then
        echo "--output-dir requires a directory path." >&2
        usage
        exit 1
      fi
      OUTPUT_DIR="$1"
      if [[ "$OUTPUT_DIR" != /* ]]; then
        OUTPUT_DIR="$ROOT_DIR/$OUTPUT_DIR"
      fi
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

if [[ ! -x "$ADB_BIN" ]]; then
  echo "adb not found. Set ANDROID_HOME or ADB." >&2
  exit 1
fi

if [[ "$skip_build" == false ]]; then
  (
    cd "$APP_DIR"
    ./gradlew --no-daemon assembleDebug
  )
fi

if [[ ! -f "$APK_PATH" ]]; then
  echo "APK not found: $APK_PATH" >&2
  exit 1
fi

DEVICES=()
while IFS= read -r device; do
  DEVICES+=("$device")
done < <("$ADB_BIN" devices | awk 'NR > 1 && $2 == "device" { print $1 }')

if [[ "${#DEVICES[@]}" -eq 0 ]]; then
  echo "No adb devices are attached." >&2
  "$ADB_BIN" devices >&2
  exit 2
fi

if [[ -n "${ANDROID_SERIAL:-}" ]]; then
  DEVICE="$ANDROID_SERIAL"
elif [[ "${#DEVICES[@]}" -eq 1 ]]; then
  DEVICE="${DEVICES[0]}"
else
  echo "Multiple adb devices attached. Set ANDROID_SERIAL." >&2
  printf ' - %s\n' "${DEVICES[@]}" >&2
  exit 2
fi

ADB_DEVICE=("$ADB_BIN" -s "$DEVICE")
mkdir -p "$OUTPUT_DIR/phone" "$OUTPUT_DIR/android-xr"

"${ADB_DEVICE[@]}" install -r "$APK_PATH" >/dev/null

capture_current_screen() {
  local target="$1"
  "${ADB_DEVICE[@]}" exec-out screencap -p > "$target"
  if [[ ! -s "$target" ]]; then
    echo "Screenshot capture produced an empty file: $target" >&2
    return 1
  fi
}

"${ADB_DEVICE[@]}" shell am start -n "$MAIN_ACTIVITY" >/dev/null
sleep 2
capture_current_screen "$OUTPUT_DIR/phone/main-screen.png"

cat > "$OUTPUT_DIR/CAPTURE-NOTES.md" <<NOTES
# Play Screenshot Capture Notes

Captured: $(date +"%Y-%m-%dT%H:%M:%S%z")
Device: $DEVICE
Package: $PACKAGE_NAME

## Manual Review Required

- Confirm no real speaker names, transcripts, contacts, exact location, Bluetooth owner names, or private notification text are visible.
- Confirm no front/back accuracy, production speaker ID, Meta DAT production, Android XR production, or glasses haptics claim is visible.
- Replace placeholder/missing manifest asset statuses only after review.
NOTES

if [[ "$include_projected_preview" == true ]]; then
  "${ADB_DEVICE[@]}" shell am start -n "$PROJECTED_ACTIVITY" >/dev/null || true
  sleep 2
  capture_current_screen "$OUTPUT_DIR/phone/projected-preview.png" || true
fi

echo "Screenshots captured under: $OUTPUT_DIR"
echo "Run: node scripts/validate-play-screenshot-package.mjs --require-assets --json"
