#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_NAME="com.voicedirection.glass"
ACTION="$PACKAGE_NAME.qa.DEBUG_DIRECTION_VALIDATION_TRIAL"
RECEIVER="$PACKAGE_NAME/.qa.DirectionValidationTrialReceiver"

if [[ -z "${ANDROID_HOME:-}" && -d "/Users/sonjunpyo/Library/Android/sdk" ]]; then
  export ANDROID_HOME="/Users/sonjunpyo/Library/Android/sdk"
fi

ADB_BIN="${ADB:-${ANDROID_HOME:-}/platform-tools/adb}"
expected=""
observed="UNKNOWN"
status="SAMPLED"
confidence="0.5"
sample_rate_hz=""
samples_read=""
source="manual-adb-direction-validation"
clear=false

usage() {
  cat >&2 <<'USAGE'
Usage:
  scripts/record-direction-validation-trial.sh --expected LEFT --observed RIGHT [options]
  scripts/record-direction-validation-trial.sh --clear

Options:
  --expected FRONT|BACK|LEFT|RIGHT|UNKNOWN
  --observed FRONT|BACK|LEFT|RIGHT|UNKNOWN
  --status SAMPLED|NO_PERMISSION|NO_STEREO_INPUT|RECORDER_UNAVAILABLE|READ_FAILED|ERROR
  --confidence 0.0-1.0
  --sample-rate-hz N
  --samples-read N
  --source controlled-phone|bluetooth-route|rayban-display|rayban-gen1-fallback|android-xr-projected

The broadcast stores only direction enums, status, confidence, counts, and an allow-listed source label.
USAGE
}

normalize_direction() {
  local value
  value="$(printf '%s' "$1" | tr '[:lower:]-' '[:upper:]_')"
  case "$value" in
    FRONT|BACK|LEFT|RIGHT|UNKNOWN) printf '%s' "$value" ;;
    *) echo "Invalid direction: $1" >&2; exit 1 ;;
  esac
}

normalize_status() {
  local value
  value="$(printf '%s' "$1" | tr '[:lower:]-' '[:upper:]_')"
  case "$value" in
    SAMPLED|NO_PERMISSION|NO_STEREO_INPUT|RECORDER_UNAVAILABLE|READ_FAILED|ERROR) printf '%s' "$value" ;;
    *) echo "Invalid status: $1" >&2; exit 1 ;;
  esac
}

normalize_source() {
  case "$1" in
    controlled-phone|bluetooth-route|rayban-display|rayban-gen1-fallback|android-xr-projected|manual-adb-direction-validation)
      printf '%s' "$1"
      ;;
    *)
      echo "Invalid source: $1" >&2
      exit 1
      ;;
  esac
}

while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --expected)
      shift
      [[ "$#" -gt 0 ]] || { echo "--expected requires a value." >&2; usage; exit 1; }
      expected="$(normalize_direction "$1")"
      shift
      ;;
    --observed)
      shift
      [[ "$#" -gt 0 ]] || { echo "--observed requires a value." >&2; usage; exit 1; }
      observed="$(normalize_direction "$1")"
      shift
      ;;
    --status)
      shift
      [[ "$#" -gt 0 ]] || { echo "--status requires a value." >&2; usage; exit 1; }
      status="$(normalize_status "$1")"
      shift
      ;;
    --confidence)
      shift
      [[ "$#" -gt 0 ]] || { echo "--confidence requires a value." >&2; usage; exit 1; }
      confidence="$1"
      shift
      ;;
    --sample-rate-hz)
      shift
      [[ "$#" -gt 0 ]] || { echo "--sample-rate-hz requires a value." >&2; usage; exit 1; }
      sample_rate_hz="$1"
      shift
      ;;
    --samples-read)
      shift
      [[ "$#" -gt 0 ]] || { echo "--samples-read requires a value." >&2; usage; exit 1; }
      samples_read="$1"
      shift
      ;;
    --source)
      shift
      [[ "$#" -gt 0 ]] || { echo "--source requires a value." >&2; usage; exit 1; }
      source="$(normalize_source "$1")"
      shift
      ;;
    --clear)
      clear=true
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

if [[ "$clear" == false && -z "$expected" ]]; then
  echo "--expected is required unless --clear is used." >&2
  usage
  exit 1
fi

device_args=()
if [[ -n "${ANDROID_SERIAL:-}" ]]; then
  device_args=(-s "$ANDROID_SERIAL")
fi

args=(
  shell am broadcast
  --include-stopped-packages
  -a "$ACTION"
  -n "$RECEIVER"
)

if [[ "$clear" == true ]]; then
  args+=(--ez clear true)
else
  args+=(--es expected "$expected")
  args+=(--es observed "$observed")
  args+=(--es status "$status")
  args+=(--ef confidence "$confidence")
  args+=(--es source "$source")
  if [[ -n "$sample_rate_hz" ]]; then args+=(--ei sampleRateHz "$sample_rate_hz"); fi
  if [[ -n "$samples_read" ]]; then args+=(--ei samplesRead "$samples_read"); fi
fi

output="$("$ADB_BIN" "${device_args[@]}" "${args[@]}" 2>&1)"
printf '%s\n' "$output"
if ! grep -q "result=100" <<< "$output"; then
  echo "Direction validation trial broadcast failed." >&2
  exit 1
fi

echo "Direction validation trial command completed."
