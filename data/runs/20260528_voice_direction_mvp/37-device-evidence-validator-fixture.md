# Android Device Smoke Evidence

Generated: 2026-05-28T04:10:00+0900

## Test Metadata

- Date/time: 2026-05-28T04:10:00+0900
- Tester: validator fixture
- Device serial: fixture
- Device model: fixture
- OS/build number: Android fixture / SDK fixture
- Build fingerprint: redacted-by-fixture
- App APK: apps/voice-direction-glass/app/build/outputs/apk/debug/app-debug.apk
- Command used: scripts/android-device-smoke-test.sh --write-evidence
- Glasses connected: manual check required
- Network state: manual check required

## Setup Checks

- ADB device visible: yes
- App installed: yes
- `RECORD_AUDIO` granted: granted
- `POST_NOTIFICATIONS` granted: granted
- `BLUETOOTH_CONNECT` granted: granted
- Main Activity launch: launched
- Projected Activity launch: skipped
- Encrypted storage self-check: script-pass
- Repository direction-validation self-check: script-pass
- Non-PII repository evidence snapshot: script-pass
- Processing latency metrics in snapshot: script-pass
- Alert delivery statuses in snapshot: script-pass
- Direction microphone metadata in snapshot: script-pass
- Debug alert output test: script-pass
- Debug direction sample test: script-pass
- Debug glasses cue seed: script-pass
- Debug Bluetooth route evidence: script-pass
- Debug local delete self-check: script-pass
- Release readiness snapshot: script-pass
- Glasses readiness snapshot: script-pass
- Alert channel preferences tested: manual check required
- Microphone disclosure gate tested: manual check required
- Speaker consent gate tested: manual check required
- Foreground service notification visible: manual check required
- Projected display available: manual check required

## Functional Result

| Check | Result | Notes |
| --- | --- | --- |
| Main Activity launches | script-pass | `am start` returned success. |
| Processing latency is recorded | manual | Latest/average latency buckets only. |
| Alert delivery statuses persist | manual | Channel/status counts only. |
| Alert channel preferences filter outputs | manual | Enabled channel names and delivered counts only. |
| Debug alert output test broadcast runs | script-pass | Generic cue emitted through enabled channels and stored as channel/status counts only. |
| Debug direction sample test broadcast runs | script-pass | Samples direction once and stores status/count metadata only. |
| Debug glasses cue seed broadcast runs | script-pass | Seeds the projected cue with direction/confidence metadata only before projected launch. |
| Debug Bluetooth route evidence broadcast runs | script-pass | Records route support and Bluetooth input counts without device names. |
| Debug local delete self-check broadcast runs | script-pass | Seeds and clears a separate debug store, then records post-delete counts only. |
| Microphone disclosure gate blocks permission request | manual | Pass/fail only. |
| Speaker consent gate blocks unchecked enrollment | manual | Pass/fail only. |

## Detection Feedback Checks

| Check | Result | Notes |
| --- | --- | --- |
| Feedback summary updates | manual | Counts only. |

## Encrypted Storage Checks

| Check | Result | Notes |
| --- | --- | --- |
| Debug self-check encrypted write survives force-stop | script-pass | Uses non-PII sentinel data. |
| Debug repository direction-validation trial survives force-stop | script-pass | Uses non-PII trial data. |

Debug alert output test broadcast output:

```text
Broadcast completed: result=100, data="passed=true;enabledAlertChannelCount=5;deliveryCount=5;deliveredCount=3;latestDeliverySource=TEST_CUE;phoneNotification=DELIVERED;phoneVibration=DELIVERED;tts=DELIVERED;metaDisplay=FAILED;androidXrDisplay=FAILED;vibrationPatternDirection=RIGHT;vibrationPatternSignature=0-180-80-60;vibrationPatternPulseCount=2;vibrationPatternTotalMillis=320;phoneVibrationSideSpecific=false;cueContractDirection=RIGHT;cueContractConfidencePercent=82;cueContractNotificationDirection=RIGHT;cueContractTtsDirectionOnly=true;cueContractTtsSpeakerLabelIncluded=false;cueContractGlassesHapticTarget=RIGHT;cueContractGlassesHapticIntensity=MEDIUM;cueContractGlassesHapticPulseCount=2;cueContractGlassesHapticRequiresApiProof=true;cueContractGlassesHapticEvidence=direction=RIGHT,target=RIGHT,intensity=MEDIUM,pulseCount=2,perSideIntent=true,apiProofRequired=true,phoneFallbackRequired=true;cueContractDisplayEvidence=direction=RIGHT,confidencePercent=82,labelPresent=false;message=pass"
```

Debug direction sample test broadcast output:

```text
Broadcast completed: result=100, data="passed=true;status=SAMPLED;evidenceLevel=LEFT_RIGHT_USABLE;direction=LEFT;confidenceBucket=medium;sampleRateHz=16000;samplesRead=4096;microphoneInventoryCaptured=true;availableMicrophoneCount=2;availablePositionKnownCount=1;availableOrientationKnownCount=1;activeMicrophoneCaptured=true;activeMicrophoneCount=2;activeChannelMappingCount=2;message=pass"
```

Debug glasses cue seed broadcast output:

```text
Broadcast completed: result=100, data="passed=true;direction=LEFT;confidenceBucket=medium;confidencePercent=82;labelPresent=false;payloadEvidence=direction=LEFT,confidencePercent=82,labelPresent=false;message=pass"
```

Debug Bluetooth route evidence broadcast output:

```text
Broadcast completed: result=100, data="passed=true;mode=probe;sdkInt=36;communicationRoutingSupported=true;recordAudioPermissionGranted=true;bluetoothConnectPermissionGranted=true;deviceCount=2;bluetoothInputAvailable=true;bluetoothInputCandidateCount=1;selectedBluetoothInputPresent=false;selectedBluetoothInputType=NONE;routeTypeCounts=PHONE:1,BLUETOOTH_SCO:1,BLUETOOTH_A2DP:0,BLE_HEADSET:0,WIRED_HEADSET:0,USB_HEADSET:0,OTHER:0;errorPresent=false;message=pass"
```

Debug local delete self-check broadcast output:

```text
Broadcast completed: result=100, data="passed=true;seededBeforeDelete=true;profileCountBefore=1;eventCountBefore=1;feedbackCountBefore=1;directionTrialCountBefore=1;profileCountAfter=0;eventCountAfter=0;feedbackCountAfter=0;directionTrialCountAfter=0;latestCuePresentAfter=false;latestDeliveryPresentAfter=false;serviceBridgePresentAfter=false;audioDirectionSamplePresentAfter=false;falsePositiveRunPresentAfter=false;settingsResetAfter=true;message=pass"
```

## Non-PII Repository Evidence Snapshot

```text
Broadcast completed: result=100, data="passed=true;profileCount=1;eventCount=2;actionableEventCount=1;microphoneDisclosureAccepted=true;microphoneDisclosureVersion=microphone-disclosure-v1;enabledAlertChannelCount=5;phoneNotificationEnabled=true;phoneVibrationEnabled=true;ttsEnabled=true;metaDisplayEnabled=true;androidXrDisplayEnabled=true;latencyEventCount=2;latestProcessingLatencyMillis=420;averageProcessingLatencyMillis=510;latencyOverTargetCount=0;feedbackCount=1;feedbackCorrect=1;feedbackFalsePositive=0;feedbackWrongDirection=0;feedbackWrongSpeaker=0;directionTrialCount=4;directionRequiredTrialsPerDirection=20;directionRequiredTotalTrials=80;directionMissingTotalTrials=76;directionControlledTrialTargetComplete=false;directionMatched=2;directionMismatched=1;directionUnknownOrUnusable=1;directionFrontTrials=1;directionBackTrials=1;directionLeftTrials=1;directionRightTrials=1;directionFrontMissingTrials=19;directionBackMissingTrials=19;directionLeftMissingTrials=19;directionRightMissingTrials=19;directionFrontMatched=0;directionFrontMismatched=0;directionFrontUnknownOrUnusable=1;directionBackMatched=1;directionBackMismatched=0;directionBackUnknownOrUnusable=0;directionLeftMatched=0;directionLeftMismatched=1;directionLeftUnknownOrUnusable=0;directionRightMatched=1;directionRightMismatched=0;directionRightUnknownOrUnusable=0;latestCuePresent=true;latestCueDirection=LEFT;latestDeliveryPresent=true;latestDeliverySource=TEST_CUE;latestDeliveryTotalCount=5;latestDeliveryDeliveredCount=3;latestDeliveryPhoneNotification=DELIVERED;latestDeliveryPhoneVibration=DELIVERED;latestDeliveryTts=DELIVERED;latestDeliveryMetaDisplay=FAILED;latestDeliveryAndroidXrDisplay=FAILED;latestAudioDirectionSamplePresent=true;latestAudioDirectionStatus=SAMPLED;latestAudioDirectionEvidenceLevel=LEFT_RIGHT_USABLE;latestAudioDirectionDirection=LEFT;latestAudioDirectionConfidenceBucket=medium;latestAudioDirectionSampleRateHz=16000;latestAudioDirectionSamplesRead=4096;latestAudioDirectionMicrophoneInventoryCaptured=true;latestAudioDirectionAvailableMicrophoneCount=2;latestAudioDirectionAvailablePositionKnownCount=1;latestAudioDirectionAvailableOrientationKnownCount=1;latestAudioDirectionActiveMicrophoneCaptured=true;latestAudioDirectionActiveMicrophoneCount=2;latestAudioDirectionActiveChannelMappingCount=2;serviceBridgePresent=true;falsePositiveRunPresent=false;falsePositiveRunActive=false;falsePositiveVerdict=NOT_STARTED;message=pass"
```

## Release Readiness Snapshot

```text
Broadcast completed: result=100, data="passed=true;internalReady=true;internalTotal=3;internalPassed=3;internalManual=0;internalBlocked=0;phoneReady=false;phoneTotal=18;phonePassed=4;phoneManual=14;phoneBlocked=0;phoneOpenIds=physical-phone-smoke,foreground-service-runtime-loop,tts-direction-device-qa,direction-validation-device-qa,repository-self-check-device-qa,evidence-snapshot-device-qa,debug-alert-output-device-qa,debug-direction-sample-device-qa,debug-glasses-cue-seed-device-qa,debug-bluetooth-route-evidence-device-qa,debug-local-delete-self-check-device-qa,alert-channel-preferences-device-qa,prototype-enrollment-device-qa,false-positive-run;glassesReady=false;glassesManual=14;glassesBlocked=3;externalReady=false;externalManual=16;externalBlocked=4;productionReady=false;productionManual=17;productionBlocked=6;message=pass"
```

## Glasses Readiness Snapshot

```text
Broadcast completed: result=100, data="passed=true;glassesAlphaReady=false;openItemCount=9;metaReady=false;metaTotal=6;metaPassed=0;metaManual=2;metaBlocked=4;metaOpenIds=meta-dat-credentials,meta-dat-real-adapter,meta-rayban-display-proof,rayban-bluetooth-hfp-route-proof,wearable-direction-evidence,glasses-haptics-api-proof;androidXrReady=false;androidXrTotal=4;androidXrPassed=1;androidXrManual=2;androidXrBlocked=1;androidXrOpenIds=android-xr-runtime-proof,android-xr-real-adapter,android-xr-bluetooth-hfp-route-proof;message=pass"
```

## Service Automation Bridge Checks

| Check | Result | Notes |
| --- | --- | --- |
| Service automation diagnostic card updates | manual | Status only. |

## `VoiceDirectionGlass` Log Evidence

```text
VoiceDirectionGlass glasses_cue_seed_completed passed=true direction=LEFT confidence=medium labelPresent=false
VoiceDirectionGlass bluetooth_route_evidence_completed passed=true mode=probe bluetoothInputAvailable=true candidateCount=1
VoiceDirectionGlass local_data_delete_self_check_completed passed=true profileCountAfter=0 eventCountAfter=0 snapshotsCleared=true
VoiceDirectionGlass evidence_snapshot_completed passed=true profileCount=1 eventCount=2 latencyEventCount=2 directionTrialCount=4 feedbackCount=1
```

## Direction Bridge Notes

| Caller Position | Expected | Observed | Audio Direction Status | Used Audio Direction | Confidence Bucket | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Left | LEFT or UNKNOWN | LEFT | sampled | true | high | Fixture only. |

## Direction Validation Trial Counts

| Expected Direction | Total Trials | Matched | Mismatched | Unknown/Unusable | Notes |
| --- | --- | --- | --- | --- | --- |
| Front | 1 | 0 | 0 | 1 | Fixture only. |
| Back | 1 | 0 | 1 | 0 | Fixture only. |
| Left | 1 | 1 | 0 | 0 | Fixture only. |
| Right | 1 | 1 | 0 | 0 | Fixture only. |

## Privacy Check

- Raw audio saved: no
- Transcript pasted into report: no
- Speaker names pasted into log section: no
- Voice embeddings exported: no
- Raw enrollment PCM saved: no
- Raw match PCM saved: no
- Local delete button tested: manual

## Outcome

- Overall status: fixture
- Blocking issue: none
- Next change needed: run on device
