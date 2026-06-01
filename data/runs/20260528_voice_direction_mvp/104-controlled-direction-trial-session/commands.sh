#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
SESSION_DIR="$ROOT_DIR/data/runs/20260528_voice_direction_mvp/104-controlled-direction-trial-session"

echo "1/6 Validate recorder script"
bash -n "$ROOT_DIR/scripts/record-direction-validation-trial.sh"
"$ROOT_DIR/scripts/record-direction-validation-trial.sh" --help >/dev/null 2>&1

echo "2/6 Build debug APK and run unit tests"
(
  cd "$ROOT_DIR/apps/voice-direction-glass"
  export JAVA_HOME="${JAVA_HOME:-$ROOT_DIR/.toolchains/jdk-17.0.19+10/Contents/Home}"
  export ANDROID_HOME="${ANDROID_HOME:-/Users/sonjunpyo/Library/Android/sdk}"
  ./gradlew --no-daemon test assembleDebug
)

echo "3/6 Validate direction evidence draft gate"
node "$ROOT_DIR/scripts/validate-direction-accuracy-evidence.mjs" --json

echo "4/6 Optionally clear old debug direction trial rows"
if [[ "${RUN_ADB_CLEAR:-0}" == "1" ]]; then
  "$ROOT_DIR/scripts/record-direction-validation-trial.sh" --clear
else
  echo "Skipped ADB clear. Set RUN_ADB_CLEAR=1 only after the debug APK is installed on the test phone."
fi

echo "5/6 Validate controlled direction trial session"
"$ROOT_DIR/scripts/validate-controlled-direction-trial-session.mjs" "$SESSION_DIR" --json

echo "6/6 Regenerate service readiness audit for this session"
node "$ROOT_DIR/scripts/audit-service-readiness.mjs" --write-report --report-dir "$SESSION_DIR/service-readiness-audit"

echo "Controlled direction trial session workflow finished."
