#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEFAULT_JAVA_HOME="$ROOT_DIR/.toolchains/jdk-17.0.19+10/Contents/Home"
APP_DIR="$ROOT_DIR/apps/voice-direction-glass"
APK_PATH="$APP_DIR/app/build/outputs/apk/debug/app-debug.apk"
PACKAGE_NAME="com.voicedirection.glass"
MAIN_ACTIVITY="$PACKAGE_NAME/.app.MainActivity"
PROJECTED_ACTIVITY="$PACKAGE_NAME/.app.GlassesProjectedActivity"
DEBUG_STORAGE_SELF_CHECK_ACTION="$PACKAGE_NAME.qa.DEBUG_STORAGE_SELF_CHECK"
DEBUG_STORAGE_SELF_CHECK_RECEIVER="$PACKAGE_NAME/.qa.StorageSelfCheckReceiver"
DEBUG_REPOSITORY_SELF_CHECK_ACTION="$PACKAGE_NAME.qa.DEBUG_REPOSITORY_SELF_CHECK"
DEBUG_REPOSITORY_SELF_CHECK_RECEIVER="$PACKAGE_NAME/.qa.RepositorySelfCheckReceiver"
DEBUG_EVIDENCE_SNAPSHOT_ACTION="$PACKAGE_NAME.qa.DEBUG_EVIDENCE_SNAPSHOT"
DEBUG_EVIDENCE_SNAPSHOT_RECEIVER="$PACKAGE_NAME/.qa.EvidenceSnapshotReceiver"
DEBUG_ALERT_OUTPUT_TEST_ACTION="$PACKAGE_NAME.qa.DEBUG_ALERT_OUTPUT_TEST"
DEBUG_ALERT_OUTPUT_TEST_RECEIVER="$PACKAGE_NAME/.qa.AlertOutputTestReceiver"
DEBUG_DIRECTION_SAMPLE_TEST_ACTION="$PACKAGE_NAME.qa.DEBUG_DIRECTION_SAMPLE_TEST"
DEBUG_DIRECTION_SAMPLE_TEST_RECEIVER="$PACKAGE_NAME/.qa.DirectionSampleTestReceiver"
DEBUG_DIRECTION_VALIDATION_TRIAL_ACTION="$PACKAGE_NAME.qa.DEBUG_DIRECTION_VALIDATION_TRIAL"
DEBUG_DIRECTION_VALIDATION_TRIAL_RECEIVER="$PACKAGE_NAME/.qa.DirectionValidationTrialReceiver"
DEBUG_GLASSES_CUE_SEED_ACTION="$PACKAGE_NAME.qa.DEBUG_GLASSES_CUE_SEED"
DEBUG_GLASSES_CUE_SEED_RECEIVER="$PACKAGE_NAME/.qa.GlassesCueSeedReceiver"
DEBUG_BLUETOOTH_ROUTE_EVIDENCE_ACTION="$PACKAGE_NAME.qa.DEBUG_BLUETOOTH_ROUTE_EVIDENCE"
DEBUG_BLUETOOTH_ROUTE_EVIDENCE_RECEIVER="$PACKAGE_NAME/.qa.BluetoothRouteEvidenceReceiver"
DEBUG_LOCAL_DELETE_SELF_CHECK_ACTION="$PACKAGE_NAME.qa.DEBUG_LOCAL_DELETE_SELF_CHECK"
DEBUG_LOCAL_DELETE_SELF_CHECK_RECEIVER="$PACKAGE_NAME/.qa.LocalDataDeleteSelfCheckReceiver"
DEBUG_RELEASE_READINESS_SNAPSHOT_ACTION="$PACKAGE_NAME.qa.DEBUG_RELEASE_READINESS_SNAPSHOT"
DEBUG_RELEASE_READINESS_SNAPSHOT_RECEIVER="$PACKAGE_NAME/.qa.ReleaseReadinessSnapshotReceiver"
DEBUG_GLASSES_READINESS_SNAPSHOT_ACTION="$PACKAGE_NAME.qa.DEBUG_GLASSES_READINESS_SNAPSHOT"
DEBUG_GLASSES_READINESS_SNAPSHOT_RECEIVER="$PACKAGE_NAME/.qa.GlassesReadinessSnapshotReceiver"

if [[ -z "${JAVA_HOME:-}" && -d "$DEFAULT_JAVA_HOME" ]]; then
  export JAVA_HOME="$DEFAULT_JAVA_HOME"
fi

if [[ -z "${ANDROID_HOME:-}" && -d "/Users/sonjunpyo/Library/Android/sdk" ]]; then
  export ANDROID_HOME="/Users/sonjunpyo/Library/Android/sdk"
fi

ADB_BIN="${ADB:-${ANDROID_HOME:-}/platform-tools/adb}"

if [[ ! -x "$ADB_BIN" ]]; then
  echo "adb not found. Set ANDROID_HOME or ADB." >&2
  exit 1
fi

skip_build=false
launch_projected=true
write_evidence=false
run_storage_self_check=true
run_repository_self_check=true
evidence_dir=""

usage() {
  echo "Usage: $0 [--skip-build] [--main-only] [--skip-storage-self-check] [--skip-repository-self-check] [--write-evidence] [--evidence-dir DIR]" >&2
}

while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --skip-build)
      skip_build=true
      shift
      ;;
    --main-only)
      launch_projected=false
      shift
      ;;
    --skip-storage-self-check)
      run_storage_self_check=false
      shift
      ;;
    --skip-repository-self-check)
      run_repository_self_check=false
      shift
      ;;
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
STARTED_AT="$(date +"%Y-%m-%dT%H:%M:%S%z")"
STORAGE_SELF_CHECK_RESET_OUTPUT="skipped"
STORAGE_SELF_CHECK_WRITE_OUTPUT="skipped"
STORAGE_SELF_CHECK_VERIFY_OUTPUT="skipped"
STORAGE_SELF_CHECK_RESULT="skipped"
REPOSITORY_SELF_CHECK_RESET_OUTPUT="skipped"
REPOSITORY_SELF_CHECK_WRITE_OUTPUT="skipped"
REPOSITORY_SELF_CHECK_VERIFY_OUTPUT="skipped"
REPOSITORY_SELF_CHECK_RESULT="skipped"
EVIDENCE_SNAPSHOT_OUTPUT="skipped"
EVIDENCE_SNAPSHOT_RESULT="skipped"
ALERT_OUTPUT_TEST_OUTPUT="skipped"
ALERT_OUTPUT_TEST_RESULT="skipped"
DIRECTION_SAMPLE_TEST_OUTPUT="skipped"
DIRECTION_SAMPLE_TEST_RESULT="skipped"
GLASSES_CUE_SEED_OUTPUT="skipped"
GLASSES_CUE_SEED_RESULT="skipped"
BLUETOOTH_ROUTE_EVIDENCE_OUTPUT="skipped"
BLUETOOTH_ROUTE_EVIDENCE_RESULT="skipped"
LOCAL_DELETE_SELF_CHECK_OUTPUT="skipped"
LOCAL_DELETE_SELF_CHECK_RESULT="skipped"
RELEASE_READINESS_SNAPSHOT_OUTPUT="skipped"
RELEASE_READINESS_SNAPSHOT_RESULT="skipped"
GLASSES_READINESS_SNAPSHOT_OUTPUT="skipped"
GLASSES_READINESS_SNAPSHOT_RESULT="skipped"

run_storage_self_check_phase() {
  local phase="$1"
  local output
  output="$("${ADB_DEVICE[@]}" shell am broadcast \
    --include-stopped-packages \
    -a "$DEBUG_STORAGE_SELF_CHECK_ACTION" \
    -n "$DEBUG_STORAGE_SELF_CHECK_RECEIVER" \
    --es phase "$phase" 2>&1)"
  printf '%s\n' "$output"
  if ! grep -q "result=100" <<< "$output"; then
    echo "Encrypted storage self-check phase '$phase' failed." >&2
    return 1
  fi
}

run_repository_self_check_phase() {
  local phase="$1"
  local output
  output="$("${ADB_DEVICE[@]}" shell am broadcast \
    --include-stopped-packages \
    -a "$DEBUG_REPOSITORY_SELF_CHECK_ACTION" \
    -n "$DEBUG_REPOSITORY_SELF_CHECK_RECEIVER" \
    --es phase "$phase" 2>&1)"
  printf '%s\n' "$output"
  if ! grep -q "result=100" <<< "$output"; then
    echo "Repository self-check phase '$phase' failed." >&2
    return 1
  fi
}

run_evidence_snapshot() {
  local output
  output="$("${ADB_DEVICE[@]}" shell am broadcast \
    --include-stopped-packages \
    -a "$DEBUG_EVIDENCE_SNAPSHOT_ACTION" \
    -n "$DEBUG_EVIDENCE_SNAPSHOT_RECEIVER" 2>&1)"
  printf '%s\n' "$output"
  if ! grep -q "result=100" <<< "$output"; then
    echo "Evidence snapshot collection failed." >&2
    return 1
  fi
}

run_alert_output_test() {
  local output
  output="$("${ADB_DEVICE[@]}" shell am broadcast \
    --include-stopped-packages \
    -a "$DEBUG_ALERT_OUTPUT_TEST_ACTION" \
    -n "$DEBUG_ALERT_OUTPUT_TEST_RECEIVER" 2>&1)"
  printf '%s\n' "$output"
  if ! grep -q "result=100" <<< "$output"; then
    echo "Alert output test broadcast failed." >&2
    return 1
  fi
}

run_direction_sample_test() {
  local output
  output="$("${ADB_DEVICE[@]}" shell am broadcast \
    --include-stopped-packages \
    -a "$DEBUG_DIRECTION_SAMPLE_TEST_ACTION" \
    -n "$DEBUG_DIRECTION_SAMPLE_TEST_RECEIVER" 2>&1)"
  printf '%s\n' "$output"
  if ! grep -q "result=100" <<< "$output"; then
    echo "Direction sample test broadcast failed." >&2
    return 1
  fi
}

run_glasses_cue_seed() {
  local output
  output="$("${ADB_DEVICE[@]}" shell am broadcast \
    --include-stopped-packages \
    -a "$DEBUG_GLASSES_CUE_SEED_ACTION" \
    -n "$DEBUG_GLASSES_CUE_SEED_RECEIVER" 2>&1)"
  printf '%s\n' "$output"
  if ! grep -q "result=100" <<< "$output"; then
    echo "Glasses cue seed broadcast failed." >&2
    return 1
  fi
}

run_bluetooth_route_evidence() {
  local output
  output="$("${ADB_DEVICE[@]}" shell am broadcast \
    --include-stopped-packages \
    -a "$DEBUG_BLUETOOTH_ROUTE_EVIDENCE_ACTION" \
    -n "$DEBUG_BLUETOOTH_ROUTE_EVIDENCE_RECEIVER" \
    --es mode probe 2>&1)"
  printf '%s\n' "$output"
  if ! grep -q "result=100" <<< "$output"; then
    echo "Bluetooth route evidence broadcast failed." >&2
    return 1
  fi
}

run_local_delete_self_check() {
  local output
  output="$("${ADB_DEVICE[@]}" shell am broadcast \
    --include-stopped-packages \
    -a "$DEBUG_LOCAL_DELETE_SELF_CHECK_ACTION" \
    -n "$DEBUG_LOCAL_DELETE_SELF_CHECK_RECEIVER" 2>&1)"
  printf '%s\n' "$output"
  if ! grep -q "result=100" <<< "$output"; then
    echo "Local data delete self-check broadcast failed." >&2
    return 1
  fi
}

run_release_readiness_snapshot() {
  local output
  output="$("${ADB_DEVICE[@]}" shell am broadcast \
    --include-stopped-packages \
    -a "$DEBUG_RELEASE_READINESS_SNAPSHOT_ACTION" \
    -n "$DEBUG_RELEASE_READINESS_SNAPSHOT_RECEIVER" 2>&1)"
  printf '%s\n' "$output"
  if ! grep -q "result=100" <<< "$output"; then
    echo "Release readiness snapshot collection failed." >&2
    return 1
  fi
}

run_glasses_readiness_snapshot() {
  local output
  output="$("${ADB_DEVICE[@]}" shell am broadcast \
    --include-stopped-packages \
    -a "$DEBUG_GLASSES_READINESS_SNAPSHOT_ACTION" \
    -n "$DEBUG_GLASSES_READINESS_SNAPSHOT_RECEIVER" 2>&1)"
  printf '%s\n' "$output"
  if ! grep -q "result=100" <<< "$output"; then
    echo "Glasses readiness snapshot collection failed." >&2
    return 1
  fi
}

echo "Installing $APK_PATH on $DEVICE"
"${ADB_DEVICE[@]}" install -r "$APK_PATH"

echo "Granting runtime permissions where supported"
"${ADB_DEVICE[@]}" shell pm grant "$PACKAGE_NAME" android.permission.RECORD_AUDIO >/dev/null 2>&1 || true
"${ADB_DEVICE[@]}" shell pm grant "$PACKAGE_NAME" android.permission.POST_NOTIFICATIONS >/dev/null 2>&1 || true
"${ADB_DEVICE[@]}" shell pm grant "$PACKAGE_NAME" android.permission.BLUETOOTH_CONNECT >/dev/null 2>&1 || true

if [[ "$run_storage_self_check" == true ]]; then
  echo "Running encrypted storage self-check"
  STORAGE_SELF_CHECK_RESET_OUTPUT="$(run_storage_self_check_phase reset)"
  STORAGE_SELF_CHECK_WRITE_OUTPUT="$(run_storage_self_check_phase write)"
  echo "Force-stopping app before encrypted storage verify phase"
  "${ADB_DEVICE[@]}" shell am force-stop "$PACKAGE_NAME"
  STORAGE_SELF_CHECK_VERIFY_OUTPUT="$(run_storage_self_check_phase verify)"
  STORAGE_SELF_CHECK_RESULT="script-pass"
else
  echo "Skipping encrypted storage self-check"
fi

if [[ "$run_repository_self_check" == true ]]; then
  echo "Running repository direction-validation self-check"
  REPOSITORY_SELF_CHECK_RESET_OUTPUT="$(run_repository_self_check_phase reset)"
  REPOSITORY_SELF_CHECK_WRITE_OUTPUT="$(run_repository_self_check_phase write)"
  echo "Force-stopping app before repository verify phase"
  "${ADB_DEVICE[@]}" shell am force-stop "$PACKAGE_NAME"
  REPOSITORY_SELF_CHECK_VERIFY_OUTPUT="$(run_repository_self_check_phase verify)"
  REPOSITORY_SELF_CHECK_RESULT="script-pass"
else
  echo "Skipping repository direction-validation self-check"
fi

echo "Seeding debug glasses cue"
GLASSES_CUE_SEED_OUTPUT="$(run_glasses_cue_seed)"
GLASSES_CUE_SEED_RESULT="script-pass"

echo "Launching main activity"
"${ADB_DEVICE[@]}" shell am start -n "$MAIN_ACTIVITY" >/dev/null
sleep 1

if [[ "$launch_projected" == true ]]; then
  echo "Launching projected cue activity"
  PROJECTED_LAUNCH_RESULT="launched"
  "${ADB_DEVICE[@]}" shell am start -n "$PROJECTED_ACTIVITY" >/dev/null || {
    PROJECTED_LAUNCH_RESULT="failed"
    echo "Projected activity launch failed. This can be expected on devices without projected display support." >&2
  }
else
  PROJECTED_LAUNCH_RESULT="skipped"
fi

echo "Running debug alert output test"
ALERT_OUTPUT_TEST_OUTPUT="$(run_alert_output_test)"
ALERT_OUTPUT_TEST_RESULT="script-pass"

echo "Running debug direction sample test"
DIRECTION_SAMPLE_TEST_OUTPUT="$(run_direction_sample_test)"
DIRECTION_SAMPLE_TEST_RESULT="script-pass"

echo "Running Bluetooth route evidence probe"
BLUETOOTH_ROUTE_EVIDENCE_OUTPUT="$(run_bluetooth_route_evidence)"
BLUETOOTH_ROUTE_EVIDENCE_RESULT="script-pass"

echo "Running local data delete self-check"
LOCAL_DELETE_SELF_CHECK_OUTPUT="$(run_local_delete_self_check)"
LOCAL_DELETE_SELF_CHECK_RESULT="script-pass"

echo "Collecting non-PII repository evidence snapshot"
EVIDENCE_SNAPSHOT_OUTPUT="$(run_evidence_snapshot)"
EVIDENCE_SNAPSHOT_RESULT="script-pass"

echo "Collecting release readiness snapshot"
RELEASE_READINESS_SNAPSHOT_OUTPUT="$(run_release_readiness_snapshot)"
RELEASE_READINESS_SNAPSHOT_RESULT="script-pass"

echo "Collecting glasses readiness snapshot"
GLASSES_READINESS_SNAPSHOT_OUTPUT="$(run_glasses_readiness_snapshot)"
GLASSES_READINESS_SNAPSHOT_RESULT="script-pass"

echo "Summarizing recent Voice Direction Glass logcat matches"
LOGCAT_LINES="$("${ADB_DEVICE[@]}" logcat -d -t 120 | grep -E "VoiceDirectionGlass|$PACKAGE_NAME|Voice Direction|AndroidRuntime" || true)"
LOGCAT_MATCH_COUNT="$(printf '%s\n' "$LOGCAT_LINES" | sed '/^$/d' | wc -l | tr -d ' ')"
LOGCAT_RUNTIME_CRASH_COUNT="$(printf '%s\n' "$LOGCAT_LINES" | grep -c "AndroidRuntime" || true)"
echo "Matching logcat line count: $LOGCAT_MATCH_COUNT"
echo "AndroidRuntime matching line count: $LOGCAT_RUNTIME_CRASH_COUNT"

permission_state() {
  local permission="$1"
  if "${ADB_DEVICE[@]}" shell dumpsys package "$PACKAGE_NAME" | tr -d '\r' | grep -q "$permission: granted=true"; then
    echo "granted"
  else
    echo "not-granted-or-unavailable"
  fi
}

write_evidence_report() {
  local report_dir="$1"
  local report_path="$report_dir/device-evidence.md"
  local device_model android_release android_sdk installed_state record_audio_state post_notifications_state bluetooth_state

  mkdir -p "$report_dir"

  device_model="$("${ADB_DEVICE[@]}" shell getprop ro.product.model | tr -d '\r')"
  android_release="$("${ADB_DEVICE[@]}" shell getprop ro.build.version.release | tr -d '\r')"
  android_sdk="$("${ADB_DEVICE[@]}" shell getprop ro.build.version.sdk | tr -d '\r')"
  if "${ADB_DEVICE[@]}" shell pm list packages "$PACKAGE_NAME" | tr -d '\r' | grep -q "^package:$PACKAGE_NAME$"; then
    installed_state="yes"
  else
    installed_state="unknown"
  fi
  record_audio_state="$(permission_state "android.permission.RECORD_AUDIO")"
  post_notifications_state="$(permission_state "android.permission.POST_NOTIFICATIONS")"
  bluetooth_state="$(permission_state "android.permission.BLUETOOTH_CONNECT")"

  {
    printf '# Android Device Smoke Evidence\n\n'
    printf 'Generated: %s\n\n' "$(date +"%Y-%m-%dT%H:%M:%S%z")"
    printf '## Test Metadata\n\n'
    printf -- '- Date/time: %s\n' "$STARTED_AT"
    printf -- '- Tester: local adb smoke script\n'
    printf -- '- Device id field: redacted-by-script\n'
    printf -- '- Device model: %s\n' "${device_model:-unknown}"
    printf -- '- OS/build number: Android %s / SDK %s\n' "${android_release:-unknown}" "${android_sdk:-unknown}"
    printf -- '- OS build private field: redacted-by-script\n'
    printf -- '- App APK: %s\n' "$APK_PATH"
    printf -- '- Command used: scripts/android-device-smoke-test.sh %s%s%s%s%s\n' "$(if [[ "$skip_build" == true ]]; then printf -- '--skip-build '; fi)" "$(if [[ "$launch_projected" == false ]]; then printf -- '--main-only '; fi)" "$(if [[ "$run_storage_self_check" == false ]]; then printf -- '--skip-storage-self-check '; fi)" "$(if [[ "$run_repository_self_check" == false ]]; then printf -- '--skip-repository-self-check '; fi)" "$(if [[ "$write_evidence" == true ]]; then printf -- '--write-evidence'; fi)"
    printf -- '- Glasses connected: manual check required\n'
    printf -- '- Network state: manual check required\n\n'

    printf '## Setup Checks\n\n'
    printf -- '- ADB device visible: yes\n'
    printf -- '- App installed: %s\n' "$installed_state"
    printf -- '- `RECORD_AUDIO` granted: %s\n' "$record_audio_state"
    printf -- '- `POST_NOTIFICATIONS` granted: %s\n' "$post_notifications_state"
    printf -- '- `BLUETOOTH_CONNECT` granted: %s\n' "$bluetooth_state"
    printf -- '- Main Activity launch: launched\n'
    printf -- '- Projected Activity launch: %s\n' "$PROJECTED_LAUNCH_RESULT"
    printf -- '- Encrypted storage self-check: %s\n' "$STORAGE_SELF_CHECK_RESULT"
    printf -- '- Repository direction-validation self-check: %s\n' "$REPOSITORY_SELF_CHECK_RESULT"
    printf -- '- Non-PII repository evidence snapshot: %s\n' "$EVIDENCE_SNAPSHOT_RESULT"
    printf -- '- Processing latency metrics in snapshot: %s\n' "$EVIDENCE_SNAPSHOT_RESULT"
    printf -- '- Alert delivery statuses in snapshot: %s\n' "$EVIDENCE_SNAPSHOT_RESULT"
    printf -- '- Direction microphone metadata in snapshot: %s\n' "$EVIDENCE_SNAPSHOT_RESULT"
    printf -- '- Debug alert output test: %s\n' "$ALERT_OUTPUT_TEST_RESULT"
    printf -- '- Debug direction sample test: %s\n' "$DIRECTION_SAMPLE_TEST_RESULT"
    printf -- '- Debug glasses cue seed: %s\n' "$GLASSES_CUE_SEED_RESULT"
    printf -- '- Debug Bluetooth route evidence: %s\n' "$BLUETOOTH_ROUTE_EVIDENCE_RESULT"
    printf -- '- Debug local delete self-check: %s\n' "$LOCAL_DELETE_SELF_CHECK_RESULT"
    printf -- '- Release readiness snapshot: %s\n' "$RELEASE_READINESS_SNAPSHOT_RESULT"
    printf -- '- Glasses readiness snapshot: %s\n' "$GLASSES_READINESS_SNAPSHOT_RESULT"
    printf -- '- Alert channel preferences tested: manual check required\n'
    printf -- '- Microphone disclosure gate tested: manual check required\n'
    printf -- '- Speaker consent gate tested: manual check required\n'
    printf -- '- Foreground service notification visible: manual check required\n'
    printf -- '- Projected display available: manual check required\n\n'

    printf '## Functional Result\n\n'
    printf '| Check | Result | Notes |\n'
    printf '| --- | --- | --- |\n'
    printf '| Main Activity launches | script-pass | `am start` returned success. |\n'
    printf '| Session starts | manual | Tap `세션 시작` and inspect notification/logcat. |\n'
    printf '| Notification stop action stops service | manual | Use foreground notification stop action. |\n'
    printf '| One-shot speech recognition returns result | manual | Do not paste private transcript. |\n'
    printf '| Detection event created | manual | Record actionable/non-actionable and confidence bucket only. |\n'
    printf '| Detection feedback can be marked | manual | Mark latest event as accurate/false-positive/wrong-direction/wrong-speaker. |\n'
    printf '| Phone notification appears | manual | Verify after actionable simulation/detection. |\n'
    printf '| TTS direction cue is queued | manual | Record whether a short direction-only spoken cue is heard; do not record the spoken environment. |\n'
    printf '| Phone vibration pattern is felt | manual | Verify direction pattern. |\n'
    printf '| Alert delivery statuses persist | manual | Record channel/status counts only; do not paste alert message text. |\n'
    printf '| Alert channel preferences filter outputs | manual | Toggle channels and record enabled channel names plus delivered counts only. |\n'
    printf '| Debug alert output test broadcast runs | %s | Pass requires phone notification, vibration, and TTS delivery status plus non-PII cue contract metadata only. |\n' "$ALERT_OUTPUT_TEST_RESULT"
    printf '| Debug direction sample test broadcast runs | %s | Runs one short direction sample and stores status/evidence/microphone metadata counts only. |\n' "$DIRECTION_SAMPLE_TEST_RESULT"
    printf '| Debug glasses cue seed broadcast runs | %s | Seeds latest projected cue using direction/confidence metadata only before projected launch. |\n' "$GLASSES_CUE_SEED_RESULT"
    printf '| Debug Bluetooth route evidence broadcast runs | %s | Records communication-routing support, Bluetooth input candidate counts, and selected type without device names. |\n' "$BLUETOOTH_ROUTE_EVIDENCE_RESULT"
    printf '| Debug local delete self-check broadcast runs | %s | Seeds and clears a separate debug store, then records post-delete counts only. |\n' "$LOCAL_DELETE_SELF_CHECK_RESULT"
    printf '| Alert output test button runs | manual | Tap `알림 출력 점검` and record channel/status counts only. |\n'
    printf '| Glasses cue preview opens | manual | Use app button. |\n'
    printf '| Projected Activity launches on glasses/XR | %s | Script Activity launch result only; visual display still manual. |\n' "$PROJECTED_LAUNCH_RESULT"
    printf '| Microphone disclosure gate blocks permission request | manual | Leave the disclosure unchecked first; confirm microphone actions do not start permission/audio flow. |\n'
    printf '| Speaker consent gate blocks unchecked enrollment | manual | Record pass/fail only; do not paste speaker names. |\n'
    printf '| Enrollment sample quality capture runs | manual | Record accepted/retry and sample count only. |\n'
    printf '| Prototype voice match diagnostic runs | manual | Record match/low/no-embedding and similarity bucket only. |\n'
    printf '| Service-side prototype voice match runs | manual | Start session after accepted enrollment sample; record actionable/non-actionable and match bucket only. |\n'
    printf '| Microphone channel probe runs | manual | Record mono/stereo support only. |\n'
    printf '| Direction sample runs | manual | Record direction enum and confidence bucket only. |\n'
    printf '| Direction microphone metadata records | manual | Record inventory/active microphone counts and channel-mapping count only. |\n'
    printf '| Direction validation trials persist | manual | Use `방향 검증 기록` for front/back/left/right and record counts plus 20-per-direction remaining-row progress only. |\n'
    printf '| ADB direction validation trial recorder runs | manual | Use `scripts/record-direction-validation-trial.sh --expected LEFT --observed UNKNOWN --source controlled-phone`; record enums/counts only. |\n'
    printf '| Processing latency is recorded | manual | Record latest/average latency buckets only; do not paste transcript or raw audio. |\n'
    printf '| Bluetooth microphone route probe runs | manual | Record communication routing support and whether Bluetooth SCO/BLE headset input appears; do not paste device owner names. |\n'
    printf '| Bluetooth microphone route can be selected and cleared | manual | Use only during an observed device session; record routed/cleared/no-input status only. |\n'
    printf '| Service-side direction sample bridge runs | manual | Record `audioDirectionStatus`, `usedAudioDirection`, direction enum, and confidence bucket only. |\n\n'

    printf '## Detection Feedback Checks\n\n'
    printf '| Check | Result | Notes |\n'
    printf '| --- | --- | --- |\n'
    printf '| Accurate event feedback persists | manual | Mark an event as accurate, reopen app, and verify count only. |\n'
    printf '| False-positive feedback persists | manual | Mark an event as false-positive, reopen app, and verify count only. |\n'
    printf '| Wrong-direction feedback persists | manual | Mark an event as wrong-direction, reopen app, and verify count only. |\n'
    printf '| Feedback summary updates | manual | Record total/correct/false-positive/wrong-speaker/wrong-direction counts only. |\n'
    printf '| False-positive test session can start and stop | manual | Use the 30-minute test card and record elapsed/target status only. |\n'
    printf '| Thirty-minute false-positive run can be summarized | manual | Record elapsed time, verdict, false-positive rate per hour, and feedback counts; do not paste private speech. |\n\n'

    printf '## Encrypted Storage Checks\n\n'
    printf '| Check | Result | Notes |\n'
    printf '| --- | --- | --- |\n'
    printf '| Debug self-check encrypted write survives force-stop | %s | Uses non-PII sentinel data in separate debug preferences. |\n' "$STORAGE_SELF_CHECK_RESULT"
    printf '| Debug repository direction-validation trial survives force-stop | %s | Uses non-PII trial data in separate debug preferences. |\n' "$REPOSITORY_SELF_CHECK_RESULT"
    printf '| Profile/settings/event writes survive app restart | manual | Create data, force-stop/reopen app, and verify UI state only. |\n'
    printf '| Latest glasses cue survives app restart | manual | Trigger an actionable cue, force-stop/reopen projected preview, and verify cue metadata only. |\n'
    printf '| Service bridge snapshot survives app restart | manual | Run service bridge, force-stop/reopen app, and verify diagnostic card statuses only. |\n'
    printf '| Legacy plaintext preference keys are removed after secure writes | manual | Inspect key names only; do not paste speaker names, phrases, embedding refs, or payload values. |\n'
    printf '| Encrypted envelope present for sensitive keys | manual | Confirm secure keys exist and values use the expected encrypted prefix; do not paste values. |\n\n'
    printf 'Debug self-check broadcast outputs:\n\n'
    printf '```text\n'
    printf '%s\n\n%s\n\n%s\n' "$STORAGE_SELF_CHECK_RESET_OUTPUT" "$STORAGE_SELF_CHECK_WRITE_OUTPUT" "$STORAGE_SELF_CHECK_VERIFY_OUTPUT"
    printf '```\n\n'
    printf 'Debug repository self-check broadcast outputs:\n\n'
    printf '```text\n'
    printf '%s\n\n%s\n\n%s\n' "$REPOSITORY_SELF_CHECK_RESET_OUTPUT" "$REPOSITORY_SELF_CHECK_WRITE_OUTPUT" "$REPOSITORY_SELF_CHECK_VERIFY_OUTPUT"
    printf '```\n\n'
    printf 'Debug alert output test broadcast output:\n\n'
    printf '```text\n'
    printf '%s\n' "$ALERT_OUTPUT_TEST_OUTPUT"
    printf '```\n\n'
    printf 'Debug direction sample test broadcast output:\n\n'
    printf '```text\n'
    printf '%s\n' "$DIRECTION_SAMPLE_TEST_OUTPUT"
    printf '```\n\n'
    printf 'Debug glasses cue seed broadcast output:\n\n'
    printf '```text\n'
    printf '%s\n' "$GLASSES_CUE_SEED_OUTPUT"
    printf '```\n\n'
    printf 'Debug Bluetooth route evidence broadcast output:\n\n'
    printf '```text\n'
    printf '%s\n' "$BLUETOOTH_ROUTE_EVIDENCE_OUTPUT"
    printf '```\n\n'
    printf 'Debug local delete self-check broadcast output:\n\n'
    printf '```text\n'
    printf '%s\n' "$LOCAL_DELETE_SELF_CHECK_OUTPUT"
    printf '```\n\n'

    printf '## Non-PII Repository Evidence Snapshot\n\n'
    printf 'The broadcast output below must contain only counts, statuses, booleans, and enum values.\n\n'
    printf '```text\n'
    printf '%s\n' "$EVIDENCE_SNAPSHOT_OUTPUT"
    printf '```\n\n'

    printf '## Release Readiness Snapshot\n\n'
    printf 'The broadcast output below must contain only release target counts, readiness booleans, and checklist ids.\n\n'
    printf '```text\n'
    printf '%s\n' "$RELEASE_READINESS_SNAPSHOT_OUTPUT"
    printf '```\n\n'

    printf '## Glasses Readiness Snapshot\n\n'
    printf 'The broadcast output below must contain only glasses platform counts, readiness booleans, and checklist ids.\n\n'
    printf '```text\n'
    printf '%s\n' "$GLASSES_READINESS_SNAPSHOT_OUTPUT"
    printf '```\n\n'

    printf '## Service Automation Bridge Checks\n\n'
    printf '| Check | Result | Notes |\n'
    printf '| --- | --- | --- |\n'
    printf '| Accepted enrollment sample creates a local profile vector ref | manual | Do not paste vector values. |\n'
    printf '| Service captures prototype live sample only after trigger phrase | manual | Look for `service_prototype_voice_sample_started`. |\n'
    printf '| Service prototype voice match completes | manual | Look for `service_prototype_voice_match_completed`. |\n'
    printf '| Service attempts direction bridge after prototype voice match | manual | Look for `audioDirectionStatus` and `usedAudioDirection`. |\n'
    printf '| Sampled `UNKNOWN` direction is preserved | manual | Treat `UNKNOWN` as pass when confidence is weak. |\n'
    printf '| Service automation diagnostic card updates | manual | Reopen app and verify latest bridge statuses are visible. |\n'
    printf '| Latest glasses cue updates after actionable service event | manual | Verify projected preview shows latest cue. |\n\n'

    printf '## `VoiceDirectionGlass` Log Summary\n\n'
    printf -- '- Matching logcat line count: %s\n' "${LOGCAT_MATCH_COUNT:-0}"
    printf -- '- AndroidRuntime matching line count: %s\n\n' "${LOGCAT_RUNTIME_CRASH_COUNT:-0}"
    printf 'Required events to look for:\n\n'
    printf -- '- `permission_result`\n'
    printf -- '- `listening_session_start_requested`\n'
    printf -- '- `service_foreground_started`\n'
    printf -- '- `recognition_loop_started`\n'
    printf -- '- `service_recognition_listen_started`\n'
    printf -- '- `service_evaluation_completed` or `service_prototype_voice_evaluation_completed`\n'
    printf -- '- `service_prototype_voice_sample_started`\n'
    printf -- '- `service_prototype_voice_match_completed`\n'
    printf -- '- `enrollment_sample_completed`\n'
    printf -- '- `prototype_voice_match_completed`\n'
    printf -- '- `audio_probe_completed`\n'
    printf -- '- `audio_direction_sample_completed`\n'
    printf -- '- `direction_sample_test_completed`\n'
    printf -- '- `direction_validation_trial_adb_completed`\n'
    printf -- '- `glasses_cue_seed_completed`\n'
    printf -- '- `bluetooth_route_evidence_completed`\n'
    printf -- '- `local_data_delete_self_check_completed`\n'
    printf -- '- `direction_validation_trial_recorded`\n'
    printf -- '- `alert_output_test_completed`\n'
    printf -- '- `release_readiness_snapshot_completed`\n'
    printf -- '- `glasses_readiness_snapshot_completed`\n'
    printf -- '- `repository_self_check_completed`\n'
    printf -- '- `evidence_snapshot_completed`\n'
    printf -- '- `bluetooth_audio_route_probe_completed`\n'
    printf -- '- `bluetooth_audio_route_selection_completed`\n'
    printf -- '- `bluetooth_audio_route_clear_completed`\n'
    printf -- '- TTS delivery row in app output card, channel `TTS`\n'
    printf -- '- `projected_cue_loaded`\n\n'

    printf '## Direction Bridge Notes\n\n'
    printf '| Caller Position | Expected | Observed | Audio Direction Status | Used Audio Direction | Confidence Bucket | Notes |\n'
    printf '| --- | --- | --- | --- | --- | --- | --- |\n'
    printf '| Left | LEFT or UNKNOWN |  |  |  |  | UNKNOWN is acceptable if evidence is weak. |\n'
    printf '| Right | RIGHT or UNKNOWN |  |  |  |  | UNKNOWN is acceptable if evidence is weak. |\n'
    printf '| Front | UNKNOWN until proven |  |  |  |  | Do not claim front without stronger evidence. |\n'
    printf '| Back | UNKNOWN until proven |  |  |  |  | Do not claim back without stronger evidence. |\n\n'

    printf '## Direction Validation Trial Counts\n\n'
    printf '| Expected Direction | Total Trials | Matched | Mismatched | Unknown/Unusable | Notes |\n'
    printf '| --- | --- | --- | --- | --- | --- |\n'
    printf '| Front |  |  |  |  | Do not treat front/back as reliable until hardware evidence exists. |\n'
    printf '| Back |  |  |  |  | Do not treat front/back as reliable until hardware evidence exists. |\n'
    printf '| Left |  |  |  |  |  |\n'
    printf '| Right |  |  |  |  |  |\n\n'

    printf '## Privacy Check\n\n'
    printf -- '- Raw audio saved: no evidence from script; confirm manually after app interaction\n'
    printf -- '- Transcript pasted into report: no\n'
    printf -- '- Speaker names pasted into log section: no\n'
    printf -- '- Voice embeddings exported: no\n'
    printf -- '- Raw enrollment PCM saved: no evidence from script; confirm manually\n'
    printf -- '- Raw match PCM saved: no evidence from script; confirm manually\n'
    printf -- '- Local delete button tested: manual\n\n'

    printf '## Outcome\n\n'
    printf -- '- Overall status: script smoke completed; manual phone/glasses checks pending\n'
    printf -- '- Blocking issue: none from script if this file was generated\n'
    printf -- '- Next change needed: complete manual checklist and record results\n'
  } > "$report_path"

  echo "Evidence report written: $report_path"
  if command -v node >/dev/null 2>&1; then
    node "$ROOT_DIR/scripts/validate-device-evidence.mjs" "$report_path"
  else
    echo "Node.js not found; skipped device evidence validation." >&2
  fi
}

if [[ "$write_evidence" == true ]]; then
  if [[ -z "$evidence_dir" ]]; then
    evidence_dir="$ROOT_DIR/data/runs/$(date +%Y%m%d_%H%M%S)_android_phone_smoke"
  elif [[ "$evidence_dir" != /* ]]; then
    evidence_dir="$ROOT_DIR/$evidence_dir"
  fi
  write_evidence_report "$evidence_dir"
fi

echo "Smoke test finished for $DEVICE"
