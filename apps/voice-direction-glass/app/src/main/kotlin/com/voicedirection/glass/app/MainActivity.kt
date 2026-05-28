package com.voicedirection.glass.app

import android.Manifest
import android.content.Intent
import android.os.Bundle
import android.os.Build
import android.content.pm.PackageManager
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.compose.setContent
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.voicedirection.glass.alerts.AlertChannel
import com.voicedirection.glass.alerts.AlertRouter
import com.voicedirection.glass.alerts.DirectionCueOutputContracts
import com.voicedirection.glass.audio.AndroidAudioCapabilityProbe
import com.voicedirection.glass.audio.AndroidBluetoothAudioRouteProbe
import com.voicedirection.glass.audio.AndroidStereoDirectionSampler
import com.voicedirection.glass.audio.AudioCapabilityProbe
import com.voicedirection.glass.audio.AudioDirectionSampleStatus
import com.voicedirection.glass.audio.AudioDirectionSampleSummaryFormatter
import com.voicedirection.glass.audio.AudioDirectionSampler
import com.voicedirection.glass.audio.AudioProbeSummaryFormatter
import com.voicedirection.glass.audio.BluetoothAudioRouteProbe
import com.voicedirection.glass.audio.BluetoothAudioRouteSummaryFormatter
import com.voicedirection.glass.detection.PrototypeVoiceMatchChecker
import com.voicedirection.glass.detection.PrototypeVoiceMatchSummaryFormatter
import com.voicedirection.glass.diagnostics.DiagnosticsLogger
import com.voicedirection.glass.enrollment.AndroidVoiceEnrollmentSampler
import com.voicedirection.glass.enrollment.VoiceEnrollmentSampleSummaryFormatter
import com.voicedirection.glass.enrollment.VoiceEnrollmentSampler
import com.voicedirection.glass.model.CallerDirection
import com.voicedirection.glass.model.DetectionFeedback
import com.voicedirection.glass.model.DetectionFeedbackType
import com.voicedirection.glass.model.DirectionValidationStatus
import com.voicedirection.glass.model.DirectionValidationTrial
import com.voicedirection.glass.model.FalsePositiveRun
import com.voicedirection.glass.model.SpeakerEnrollmentStatus
import com.voicedirection.glass.model.SpeakerProfile
import com.voicedirection.glass.model.SpeakerVerificationMode
import com.voicedirection.glass.model.VoiceEmbedding
import com.voicedirection.glass.model.VoiceEmbeddingRefCodec
import com.voicedirection.glass.qa.VoiceDirectionTesterConsent
import com.voicedirection.glass.service.ListeningForegroundService
import com.voicedirection.glass.session.AndroidListeningEngineFactory
import com.voicedirection.glass.session.ListeningSessionEngine
import com.voicedirection.glass.session.ListeningSessionState
import com.voicedirection.glass.speech.AndroidSpeechRecognitionController
import com.voicedirection.glass.speech.SpeechRecognitionController
import com.voicedirection.glass.storage.AlertDeliverySnapshot
import com.voicedirection.glass.storage.AudioDirectionSampleSnapshot
import com.voicedirection.glass.storage.GlassesCueSnapshot
import com.voicedirection.glass.storage.PreferencesVoiceDirectionRepository
import com.voicedirection.glass.storage.VoiceDirectionSettings
import com.voicedirection.glass.storage.VoiceDirectionRepository
import com.voicedirection.glass.ui.VoiceDirectionApp

class MainActivity : ComponentActivity() {
    private var state by mutableStateOf(ListeningSessionState())
    private var shouldStartAfterPermissionGrant = false
    private val repository: VoiceDirectionRepository by lazy {
        PreferencesVoiceDirectionRepository(this)
    }
    private val speechRecognitionController: SpeechRecognitionController by lazy {
        AndroidSpeechRecognitionController(this)
    }
    private val audioCapabilityProbe: AudioCapabilityProbe by lazy {
        AndroidAudioCapabilityProbe(this)
    }
    private val audioDirectionSampler: AudioDirectionSampler by lazy {
        AndroidStereoDirectionSampler(audioCapabilityProbe)
    }
    private val bluetoothAudioRouteProbe: BluetoothAudioRouteProbe by lazy {
        AndroidBluetoothAudioRouteProbe(this)
    }
    private val voiceEnrollmentSampler: VoiceEnrollmentSampler by lazy {
        AndroidVoiceEnrollmentSampler(this)
    }
    private val prototypeVoiceMatchChecker by lazy {
        PrototypeVoiceMatchChecker()
    }
    private val permissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) {
            val audioGranted = hasRequiredListeningPermission()
            DiagnosticsLogger.info(
                "permission_result",
                "audioGranted" to audioGranted,
                "startAfterGrant" to shouldStartAfterPermissionGrant,
            )
            if (shouldStartAfterPermissionGrant && hasRequiredListeningPermission()) {
                startListeningSession()
            } else {
                state = state.copy(
                    isListening = false,
                    statusMessage = if (hasRequiredListeningPermission()) {
                        "권한 상태가 갱신되었습니다"
                    } else {
                        "마이크 권한이 필요합니다"
                    },
                )
            }
            shouldStartAfterPermissionGrant = false
        }

    private val engine by lazy {
        AndroidListeningEngineFactory.create(this) { state.enabledAlertChannels }
    }
    private val alertRouter: AlertRouter by lazy {
        AndroidListeningEngineFactory.createAlertRouter(this) { state.enabledAlertChannels }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        restoreLocalState()
        DiagnosticsLogger.info(
            "main_activity_created",
            "profileCount" to state.enrolledProfiles.size,
            "eventCount" to state.eventHistory.size,
        )
        setContent {
            VoiceDirectionApp(
                state = state,
                onStartStop = {
                    if (state.isListening) {
                        stopListeningSession()
                    } else {
                        requestPermissionThenStartListening()
                    }
                },
                onMicrophoneDisclosureAcceptedChange = { accepted ->
                    updateMicrophoneDisclosureAccepted(accepted)
                },
                onTranscriptChange = { transcript ->
                    state = state.copy(simulatedTranscript = transcript)
                },
                onTriggerPhraseChange = { trigger ->
                    state = state.copy(triggerPhrase = trigger)
                    saveCurrentSettings(triggerPhrase = trigger)
                },
                onDirectionChange = { direction ->
                    state = state.copy(simulatedDirection = direction)
                    saveCurrentSettings(simulatedDirection = direction)
                },
                onAlertChannelEnabledChange = { channel, enabled ->
                    updateAlertChannel(channel = channel, enabled = enabled)
                },
                onRunAlertOutputTest = {
                    runAlertOutputTest()
                },
                onListenOnce = {
                    if (!ensureMicrophoneDisclosureAccepted()) {
                        Unit
                    } else if (!hasRequiredListeningPermission()) {
                        requestRuntimePermissionsAfterDisclosure()
                        state = state.copy(statusMessage = "마이크 권한 승인 후 다시 눌러주세요")
                    } else {
                        DiagnosticsLogger.info(
                            "manual_recognition_requested",
                            "profileCount" to state.enrolledProfiles.size,
                        )
                        state = state.copy(statusMessage = "음성 인식 대기 중")
                        speechRecognitionController.listenOnce(
                            onResult = { transcript ->
                                DiagnosticsLogger.info("manual_recognition_result")
                                val recognizedState = state.copy(
                                    simulatedTranscript = transcript,
                                    statusMessage = "음성 인식 완료",
                                )
                                evaluateAndPersist(recognizedState)
                            },
                            onError = { message ->
                                DiagnosticsLogger.warn(
                                    "manual_recognition_error",
                                    "messagePresent" to message.isNotBlank(),
                                )
                                state = state.copy(statusMessage = message)
                            },
                        )
                    }
                },
                onNewSpeakerNameChange = { speakerName ->
                    state = state.copy(newSpeakerName = speakerName)
                },
                onNewSpeakerConsentChange = { confirmed ->
                    state = state.copy(newSpeakerConsentConfirmed = confirmed)
                },
                onAddSpeaker = {
                    val speakerName = state.newSpeakerName.trim()
                    if (speakerName.isEmpty()) {
                        state = state.copy(statusMessage = "화자 이름을 입력하세요")
                    } else if (!state.newSpeakerConsentConfirmed) {
                        state = state.copy(statusMessage = "화자 동의 확인이 필요합니다")
                    } else {
                        val profile = SpeakerProfile(
                            id = "speaker-${System.currentTimeMillis()}",
                            displayName = speakerName,
                            consentVersion = VoiceDirectionTesterConsent.copy.version,
                            createdAtMillis = System.currentTimeMillis(),
                            embeddingRef = "transcript-label-simulator:${speakerName.lowercase()}",
                            verificationMode = SpeakerVerificationMode.TRANSCRIPT_LABEL_SIMULATION,
                            enrollmentStatus = SpeakerEnrollmentStatus.LABEL_ONLY,
                            sampleCount = 0,
                        )
                        val profiles = state.enrolledProfiles + profile
                        repository.saveProfiles(profiles)
                        DiagnosticsLogger.info(
                            "speaker_profile_added",
                            "profileCount" to profiles.size,
                        )
                        state = state.copy(
                            enrolledProfiles = profiles,
                            newSpeakerName = "",
                            newSpeakerConsentConfirmed = false,
                            statusMessage = "화자 프로필 저장 완료",
                        )
                    }
                },
                onCaptureEnrollmentSample = { profileId ->
                    captureEnrollmentSample(profileId)
                },
                onRunPrototypeVoiceMatch = { profileId ->
                    runPrototypeVoiceMatch(profileId)
                },
                onDeleteAllData = {
                    repository.clearAll()
                    DiagnosticsLogger.info("local_data_deleted")
                    state = state.copy(
                        enrolledProfiles = emptyList(),
                        eventHistory = emptyList(),
                        feedbackHistory = emptyList(),
                        directionValidationTrials = emptyList(),
                        falsePositiveRun = null,
                        lastEvent = null,
                        lastDeliveries = emptyList(),
                        latestAlertDeliverySnapshot = null,
                        enabledAlertChannels = AlertChannel.entries.toSet(),
                        microphoneDisclosureAccepted = false,
                        microphoneDisclosureVersion = "",
                        newSpeakerConsentConfirmed = false,
                        voiceEnrollmentSampleSummary = null,
                        prototypeVoiceMatchSummary = null,
                        latestServiceAutomationBridge = null,
                        statusMessage = "로컬 프로필과 감지 기록을 삭제했습니다",
                    )
                },
                onRunSimulation = {
                    DiagnosticsLogger.info(
                        "manual_simulation_requested",
                        "profileCount" to state.enrolledProfiles.size,
                    )
                    evaluateAndPersist(state)
                },
                onOpenGlassesPreview = {
                    DiagnosticsLogger.info("glasses_preview_opened")
                    startActivity(Intent(this, GlassesProjectedActivity::class.java))
                },
                onRunAudioProbe = {
                    runAudioProbe()
                },
                onRunAudioDirectionSample = {
                    runAudioDirectionSample()
                },
                onRunBluetoothAudioRouteProbe = {
                    runBluetoothAudioRouteProbe()
                },
                onSelectBluetoothAudioRoute = {
                    selectBluetoothAudioRoute()
                },
                onClearBluetoothAudioRoute = {
                    clearBluetoothAudioRoute()
                },
                onDirectionValidationExpectedChange = { direction ->
                    state = state.copy(directionValidationExpectedDirection = direction)
                },
                onRecordDirectionValidationTrial = {
                    recordDirectionValidationTrial()
                },
                onClearDirectionValidationTrials = {
                    clearDirectionValidationTrials()
                },
                onMarkEventFeedback = { eventId, feedbackType ->
                    markEventFeedback(eventId, feedbackType)
                },
                onStartFalsePositiveRun = {
                    startFalsePositiveRun()
                },
                onStopFalsePositiveRun = {
                    stopFalsePositiveRun()
                },
                onClearFalsePositiveRun = {
                    clearFalsePositiveRun()
                },
            )
        }
    }

    override fun onResume() {
        super.onResume()
        val snapshot = repository.loadSnapshot()
        state = state.copy(
            eventHistory = snapshot.events,
            feedbackHistory = snapshot.feedback,
            directionValidationTrials = snapshot.directionValidationTrials,
            falsePositiveRun = snapshot.falsePositiveRun,
            lastEvent = snapshot.events.firstOrNull(),
            latestServiceAutomationBridge = snapshot.latestServiceAutomationBridge,
            latestAlertDeliverySnapshot = snapshot.latestAlertDeliverySnapshot,
        )
        if (state.isListening != ListeningForegroundService.isRunning) {
            state = state.copy(
                isListening = ListeningForegroundService.isRunning,
                statusMessage = if (ListeningForegroundService.isRunning) {
                    "포그라운드 리스닝 서비스 실행 중"
                } else {
                    "대기 중"
                },
            )
        }
    }

    override fun onDestroy() {
        speechRecognitionController.release()
        super.onDestroy()
    }

    private fun requestRuntimePermissions() {
        val permissions = allRuntimePermissions().filter { permission ->
            checkSelfPermission(permission) != PackageManager.PERMISSION_GRANTED
        }
        if (permissions.isNotEmpty()) {
            permissionLauncher.launch(permissions.toTypedArray())
        }
    }

    private fun allRuntimePermissions(): List<String> =
        buildList {
            add(Manifest.permission.RECORD_AUDIO)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                add(Manifest.permission.POST_NOTIFICATIONS)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                add(Manifest.permission.BLUETOOTH_CONNECT)
            }
        }

    private fun hasRequiredListeningPermission(): Boolean =
        checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED

    private fun requestPermissionThenStartListening() {
        if (!ensureMicrophoneDisclosureAccepted()) return
        if (hasRequiredListeningPermission()) {
            startListeningSession()
        } else {
            shouldStartAfterPermissionGrant = true
            requestRuntimePermissionsAfterDisclosure()
            state = state.copy(statusMessage = "마이크 권한 승인 대기 중")
        }
    }

    private fun requestRuntimePermissionsAfterDisclosure() {
        if (!ensureMicrophoneDisclosureAccepted()) return
        requestRuntimePermissions()
    }

    private fun ensureMicrophoneDisclosureAccepted(): Boolean {
        if (state.microphoneDisclosureAccepted) return true
        state = state.copy(statusMessage = "마이크 사용 안내 확인이 필요합니다")
        DiagnosticsLogger.info(
            "microphone_disclosure_required",
            "version" to VoiceDirectionTesterConsent.microphoneDisclosure.version,
        )
        return false
    }

    private fun updateMicrophoneDisclosureAccepted(accepted: Boolean) {
        val version = if (accepted) {
            VoiceDirectionTesterConsent.microphoneDisclosure.version
        } else {
            ""
        }
        state = state.copy(
            microphoneDisclosureAccepted = accepted,
            microphoneDisclosureVersion = version,
            statusMessage = if (accepted) {
                "마이크 사용 안내 확인 완료"
            } else {
                "마이크 사용 안내 확인 해제"
            },
        )
        saveCurrentSettings(
            microphoneDisclosureAccepted = accepted,
            microphoneDisclosureVersion = version,
        )
        DiagnosticsLogger.info(
            "microphone_disclosure_updated",
            "accepted" to accepted,
            "version" to (version.ifBlank { "none" }),
        )
    }

    private fun startListeningSession() {
        saveCurrentSettings()
        DiagnosticsLogger.info(
            "listening_session_start_requested",
            "profileCount" to state.enrolledProfiles.size,
        )
        ListeningForegroundService.start(this)
        state = state.copy(
            isListening = true,
            statusMessage = "포그라운드 리스닝 서비스 실행 중",
        )
    }

    private fun stopListeningSession() {
        DiagnosticsLogger.info("listening_session_stop_requested")
        ListeningForegroundService.stop(this)
        state = state.copy(
            isListening = false,
            statusMessage = "대기 중",
        )
    }

    private fun runAudioProbe() {
        if (!ensureMicrophoneDisclosureAccepted()) return
        if (!hasRequiredListeningPermission()) {
            requestRuntimePermissionsAfterDisclosure()
            state = state.copy(statusMessage = "마이크 권한 승인 후 채널 점검을 다시 실행하세요")
            return
        }

        val report = audioCapabilityProbe.probe()
        DiagnosticsLogger.info(
            "audio_probe_completed",
            "audioPermission" to report.recordAudioPermissionGranted,
            "stereoSupported" to report.stereoSupported,
            "supportedStereoRates" to report.capabilities.count {
                it.supported && it.channelLayout == com.voicedirection.glass.audio.AudioChannelLayout.STEREO
            },
        )
        state = state.copy(
            audioProbeSummary = AudioProbeSummaryFormatter.format(report),
            statusMessage = if (report.stereoSupported) {
                "스테레오 입력 가능성 확인"
            } else {
                "스테레오 입력 미확인"
            },
        )
    }

    private fun runAudioDirectionSample() {
        if (!ensureMicrophoneDisclosureAccepted()) return
        if (!hasRequiredListeningPermission()) {
            requestRuntimePermissionsAfterDisclosure()
            state = state.copy(statusMessage = "마이크 권한 승인 후 방향 샘플을 다시 실행하세요")
            return
        }

        val result = audioDirectionSampler.sampleDirection()
        DiagnosticsLogger.info(
            "audio_direction_sample_completed",
            "status" to result.status,
            "sampleRateHz" to result.sampleRateHz,
            "samplesRead" to result.samplesRead,
            "direction" to result.estimate?.direction,
            "directionConfidence" to result.estimate?.let {
                DiagnosticsLogger.confidenceBucket(it.confidence)
            },
        )
        state = state.copy(
            audioDirectionSampleSummary = AudioDirectionSampleSummaryFormatter.format(result),
            statusMessage = when (result.status) {
                AudioDirectionSampleStatus.SAMPLED -> "방향 샘플 점검 완료"
                AudioDirectionSampleStatus.NO_STEREO_INPUT -> "스테레오 입력 없음"
                AudioDirectionSampleStatus.NO_PERMISSION -> "마이크 권한 필요"
                else -> "방향 샘플 점검 실패"
            },
        )
        repository.saveLatestAudioDirectionSample(AudioDirectionSampleSnapshot.from(result))
    }

    private fun recordDirectionValidationTrial() {
        if (!ensureMicrophoneDisclosureAccepted()) return
        if (!hasRequiredListeningPermission()) {
            requestRuntimePermissionsAfterDisclosure()
            state = state.copy(statusMessage = "마이크 권한 승인 후 방향 검증을 다시 실행하세요")
            return
        }

        val result = audioDirectionSampler.sampleDirection()
        val trial = DirectionValidationTrial(
            id = "direction-trial-${System.currentTimeMillis()}",
            expectedDirection = state.directionValidationExpectedDirection,
            observedDirection = result.estimate?.direction ?: CallerDirection.UNKNOWN,
            confidence = result.estimate?.confidence ?: 0f,
            status = result.status.toDirectionValidationStatus(),
            sampleRateHz = result.sampleRateHz,
            samplesRead = result.samplesRead,
            source = "phone-audiorecord-stereo",
            createdAtMillis = System.currentTimeMillis(),
        )
        repository.appendDirectionValidationTrial(trial)
        repository.saveLatestAudioDirectionSample(AudioDirectionSampleSnapshot.from(result))
        val snapshot = repository.loadSnapshot()
        DiagnosticsLogger.info(
            "direction_validation_trial_recorded",
            "expectedDirection" to trial.expectedDirection,
            "observedDirection" to trial.observedDirection,
            "status" to trial.status,
            "confidence" to DiagnosticsLogger.confidenceBucket(trial.confidence),
            "trialCount" to snapshot.directionValidationTrials.size,
        )
        state = state.copy(
            audioDirectionSampleSummary = AudioDirectionSampleSummaryFormatter.format(result),
            directionValidationTrials = snapshot.directionValidationTrials,
            statusMessage = when {
                trial.matched -> "방향 검증 일치 기록"
                trial.mismatched -> "방향 검증 불일치 기록"
                else -> "방향 검증 불명/불가 기록"
            },
        )
    }

    private fun clearDirectionValidationTrials() {
        repository.clearDirectionValidationTrials()
        DiagnosticsLogger.info("direction_validation_trials_cleared")
        state = state.copy(
            directionValidationTrials = emptyList(),
            statusMessage = "방향 검증 기록 초기화",
        )
    }

    private fun runBluetoothAudioRouteProbe() {
        if (!ensureMicrophoneDisclosureAccepted()) return
        if (!hasBluetoothAudioRoutePermissions()) {
            requestRuntimePermissionsAfterDisclosure()
            state = state.copy(statusMessage = "마이크/블루투스 권한 승인 후 경로를 다시 점검하세요")
            return
        }

        val report = bluetoothAudioRouteProbe.probe()
        DiagnosticsLogger.info(
            "bluetooth_audio_route_probe_completed",
            "routingSupported" to report.communicationRoutingSupported,
            "bluetoothPermission" to report.bluetoothConnectPermissionGranted,
            "bluetoothInputAvailable" to report.bluetoothInputAvailable,
            "selectedBluetoothInput" to (report.selectedBluetoothInput != null),
            "deviceCount" to report.devices.size,
            "error" to (report.error ?: "none"),
        )
        state = state.copy(
            bluetoothAudioRouteSummary = BluetoothAudioRouteSummaryFormatter.format(report),
            statusMessage = when {
                report.selectedBluetoothInput != null -> "블루투스 마이크 선택됨"
                report.bluetoothInputAvailable -> "블루투스 입력 후보 확인"
                else -> "블루투스 입력 미확인"
            },
        )
    }

    private fun selectBluetoothAudioRoute() {
        if (!ensureMicrophoneDisclosureAccepted()) return
        if (!hasBluetoothAudioRoutePermissions()) {
            requestRuntimePermissionsAfterDisclosure()
            state = state.copy(statusMessage = "마이크/블루투스 권한 승인 후 경로를 선택하세요")
            return
        }

        val result = bluetoothAudioRouteProbe.selectBluetoothInput()
        DiagnosticsLogger.info(
            "bluetooth_audio_route_selection_completed",
            "status" to result.status,
            "selected" to (result.selectedDevice != null),
            "deviceCount" to result.report.devices.size,
            "error" to (result.report.error ?: "none"),
        )
        state = state.copy(
            bluetoothAudioRouteSummary = BluetoothAudioRouteSummaryFormatter.formatSelection(result),
            statusMessage = when (result.status) {
                com.voicedirection.glass.audio.BluetoothAudioRouteSelectionStatus.ROUTED ->
                    "블루투스 마이크 경로 선택 완료"
                com.voicedirection.glass.audio.BluetoothAudioRouteSelectionStatus.NO_BLUETOOTH_INPUT ->
                    "블루투스 입력 후보 없음"
                com.voicedirection.glass.audio.BluetoothAudioRouteSelectionStatus.CLEARED ->
                    "블루투스 경로 해제"
                else -> "블루투스 경로 선택 실패"
            },
        )
    }

    private fun clearBluetoothAudioRoute() {
        val result = bluetoothAudioRouteProbe.clearSelectedRoute()
        DiagnosticsLogger.info(
            "bluetooth_audio_route_clear_completed",
            "status" to result.status,
            "deviceCount" to result.report.devices.size,
            "error" to (result.report.error ?: "none"),
        )
        state = state.copy(
            bluetoothAudioRouteSummary = BluetoothAudioRouteSummaryFormatter.formatSelection(result),
            statusMessage = if (
                result.status == com.voicedirection.glass.audio.BluetoothAudioRouteSelectionStatus.CLEARED
            ) {
                "블루투스 통신 경로 해제"
            } else {
                "블루투스 통신 경로 해제 실패"
            },
        )
    }

    private fun hasBluetoothAudioRoutePermissions(): Boolean =
        hasRequiredListeningPermission() && (
            Build.VERSION.SDK_INT < Build.VERSION_CODES.S ||
                checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED
            )

    private fun captureEnrollmentSample(profileId: String) {
        if (!ensureMicrophoneDisclosureAccepted()) return
        if (!hasRequiredListeningPermission()) {
            requestRuntimePermissionsAfterDisclosure()
            state = state.copy(statusMessage = "마이크 권한 승인 후 샘플 수집을 다시 실행하세요")
            return
        }

        val profile = state.enrolledProfiles.firstOrNull { it.id == profileId }
        if (profile == null) {
            state = state.copy(statusMessage = "화자 프로필을 찾을 수 없습니다")
            return
        }

        state = state.copy(statusMessage = "화자 샘플 품질 확인 중")
        val result = voiceEnrollmentSampler.captureSample()
        val nextProfiles = if (result.accepted) {
            state.enrolledProfiles.map { existing ->
                if (existing.id == profileId) {
                    val nextSampleCount = existing.sampleCount + 1
                    val nextEmbedding = mergeEnrollmentEmbedding(
                        currentRef = existing.embeddingRef,
                        currentSampleCount = existing.sampleCount,
                        sampleEmbedding = result.embedding,
                    )
                    existing.copy(
                        sampleCount = nextSampleCount,
                        embeddingRef = nextEmbedding?.let(VoiceEmbeddingRefCodec::encode)
                            ?: existing.embeddingRef,
                        enrollmentStatus = if (nextSampleCount >= REQUIRED_ENROLLMENT_SAMPLE_COUNT) {
                            SpeakerEnrollmentStatus.SAMPLES_CAPTURED_MODEL_PENDING
                        } else {
                            SpeakerEnrollmentStatus.SAMPLE_CAPTURE_REQUIRED
                        },
                    )
                } else {
                    existing
                }
            }
        } else {
            state.enrolledProfiles
        }
        if (result.accepted) {
            repository.saveProfiles(nextProfiles)
        }
        val updatedProfile = nextProfiles.firstOrNull { it.id == profileId }
        DiagnosticsLogger.info(
            "enrollment_sample_completed",
            "status" to result.status,
            "accepted" to result.accepted,
            "samplesRead" to result.samplesRead,
            "sampleCount" to (updatedProfile?.sampleCount ?: profile.sampleCount),
            "embeddingCreated" to (result.embedding != null),
            "rms" to result.metrics?.let { DiagnosticsLogger.confidenceBucket(it.rms) },
            "peak" to result.metrics?.let { DiagnosticsLogger.confidenceBucket(it.peak) },
        )
        state = state.copy(
            enrolledProfiles = nextProfiles,
            voiceEnrollmentSampleSummary = VoiceEnrollmentSampleSummaryFormatter.format(result),
            statusMessage = if (result.accepted) {
                "화자 샘플 품질 통과"
            } else {
                "화자 샘플 재시도 필요"
            },
        )
    }

    private fun mergeEnrollmentEmbedding(
        currentRef: String,
        currentSampleCount: Int,
        sampleEmbedding: VoiceEmbedding?,
    ): VoiceEmbedding? {
        if (sampleEmbedding == null) return null
        val currentEmbedding = VoiceEmbeddingRefCodec.decode(currentRef)
        return if (currentEmbedding == null || currentSampleCount <= 0) {
            sampleEmbedding
        } else {
            currentEmbedding.weightedAverage(
                other = sampleEmbedding,
                thisWeight = currentSampleCount,
                otherWeight = 1,
            )
        }
    }

    private fun runPrototypeVoiceMatch(profileId: String) {
        if (!ensureMicrophoneDisclosureAccepted()) return
        if (!hasRequiredListeningPermission()) {
            requestRuntimePermissionsAfterDisclosure()
            state = state.copy(statusMessage = "마이크 권한 승인 후 음성 매칭 점검을 다시 실행하세요")
            return
        }

        val profile = state.enrolledProfiles.firstOrNull { it.id == profileId }
        if (profile == null) {
            state = state.copy(statusMessage = "화자 프로필을 찾을 수 없습니다")
            return
        }

        state = state.copy(statusMessage = "프로토타입 음성 매칭 점검 중")
        val sample = voiceEnrollmentSampler.captureSample()
        val match = prototypeVoiceMatchChecker.check(
            liveEmbedding = sample.embedding,
            profiles = state.enrolledProfiles,
            targetProfileId = profileId,
        )
        DiagnosticsLogger.info(
            "prototype_voice_match_completed",
            "sampleStatus" to sample.status,
            "sampleAccepted" to sample.accepted,
            "matchStatus" to match.status,
            "similarity" to DiagnosticsLogger.confidenceBucket(match.similarity),
            "hasTargetProfile" to (match.profile != null),
        )
        state = state.copy(
            prototypeVoiceMatchSummary = PrototypeVoiceMatchSummaryFormatter.format(match),
            statusMessage = when (match.status) {
                com.voicedirection.glass.detection.PrototypeVoiceMatchStatus.MATCHED ->
                    "프로토타입 음성 매칭 통과"
                com.voicedirection.glass.detection.PrototypeVoiceMatchStatus.LOW_CONFIDENCE ->
                    "프로토타입 음성 매칭 낮음"
                else -> "프로토타입 음성 매칭 불가"
            },
        )
    }

    private fun evaluateAndPersist(inputState: ListeningSessionState) {
        val result = engine.evaluate(inputState)
        repository.appendEvent(result.event)
        repository.saveLatestAlertDeliverySnapshot(
            AlertDeliverySnapshot.from(
                eventId = result.event.id,
                deliveries = result.deliveries,
                checkedAtMillis = System.currentTimeMillis(),
            ),
        )
        val cueSaved = result.event.isActionable
        if (cueSaved) {
            repository.saveLatestGlassesCue(GlassesCueSnapshot.fromEvent(result.event))
        }
        DiagnosticsLogger.detection(
            eventName = "manual_evaluation_completed",
            event = result.event,
            deliveryCount = result.deliveries.size,
            cueSaved = cueSaved,
        )
        val snapshot = repository.loadSnapshot()
        state = inputState.copy(
            lastEvent = result.event,
            eventHistory = snapshot.events,
            feedbackHistory = snapshot.feedback,
            falsePositiveRun = snapshot.falsePositiveRun,
            latestServiceAutomationBridge = snapshot.latestServiceAutomationBridge,
            latestAlertDeliverySnapshot = snapshot.latestAlertDeliverySnapshot,
            lastDeliveries = result.deliveries,
            statusMessage = if (result.event.isActionable) {
                "알림 전송 완료"
            } else {
                "조건 미충족: 문구/화자 신뢰도 확인 필요"
            },
        )
    }

    private fun runAlertOutputTest() {
        if (state.enabledAlertChannels.isEmpty()) {
            state = state.copy(statusMessage = "최소 1개 알림 채널이 필요합니다")
            return
        }
        val checkedAtMillis = System.currentTimeMillis()
        val cue = DirectionCueOutputContracts.cueForDirection(
            direction = state.simulatedDirection,
            confidence = state.simulatedDirectionConfidence,
        )
        val deliveries = alertRouter.emit(cue)
        val deliverySnapshot = AlertDeliverySnapshot.from(
            eventId = "alert-test-$checkedAtMillis",
            deliveries = deliveries,
            checkedAtMillis = checkedAtMillis,
        )
        repository.saveLatestAlertDeliverySnapshot(deliverySnapshot)
        DiagnosticsLogger.info(
            "alert_output_test_completed",
            "direction" to state.simulatedDirection,
            "enabledChannelCount" to state.enabledAlertChannels.size,
            "deliveryCount" to deliveries.size,
            "deliveredCount" to deliverySnapshot.deliveredCount,
        )
        state = state.copy(
            lastDeliveries = deliveries,
            latestAlertDeliverySnapshot = deliverySnapshot,
            statusMessage = "알림 출력 점검 완료",
        )
    }

    private fun markEventFeedback(
        eventId: String,
        feedbackType: DetectionFeedbackType,
    ) {
        val feedback = DetectionFeedback(
            eventId = eventId,
            type = feedbackType,
            createdAtMillis = System.currentTimeMillis(),
        )
        repository.upsertFeedback(feedback)
        val snapshot = repository.loadSnapshot()
        DiagnosticsLogger.info(
            "detection_feedback_recorded",
            "feedbackType" to feedbackType,
            "feedbackCount" to snapshot.feedback.size,
        )
        state = state.copy(
            feedbackHistory = snapshot.feedback,
            falsePositiveRun = snapshot.falsePositiveRun,
            statusMessage = "감지 피드백 저장 완료",
        )
    }

    private fun startFalsePositiveRun() {
        val run = FalsePositiveRun(
            id = "false-positive-${System.currentTimeMillis()}",
            startedAtMillis = System.currentTimeMillis(),
        )
        repository.saveFalsePositiveRun(run)
        DiagnosticsLogger.info("false_positive_run_started")
        state = state.copy(
            falsePositiveRun = run,
            statusMessage = "30분 오탐 테스트 시작",
        )
    }

    private fun stopFalsePositiveRun() {
        val current = state.falsePositiveRun
        if (current == null) {
            state = state.copy(statusMessage = "진행 중인 오탐 테스트가 없습니다")
            return
        }
        val stopped = current.copy(endedAtMillis = System.currentTimeMillis())
        repository.saveFalsePositiveRun(stopped)
        DiagnosticsLogger.info("false_positive_run_stopped")
        state = state.copy(
            falsePositiveRun = stopped,
            statusMessage = "30분 오탐 테스트 종료",
        )
    }

    private fun clearFalsePositiveRun() {
        repository.saveFalsePositiveRun(null)
        DiagnosticsLogger.info("false_positive_run_cleared")
        state = state.copy(
            falsePositiveRun = null,
            statusMessage = "오탐 테스트 세션 초기화",
        )
    }

    private fun saveCurrentSettings(
        triggerPhrase: String = state.triggerPhrase,
        simulatedDirection: CallerDirection = state.simulatedDirection,
        simulatedDirectionConfidence: Float = state.simulatedDirectionConfidence,
        enabledAlertChannels: Set<AlertChannel> = state.enabledAlertChannels,
        microphoneDisclosureAccepted: Boolean = state.microphoneDisclosureAccepted,
        microphoneDisclosureVersion: String = state.microphoneDisclosureVersion,
    ) {
        repository.saveSettings(
            VoiceDirectionSettings(
                triggerPhrase = triggerPhrase,
                simulatedDirection = simulatedDirection,
                simulatedDirectionConfidence = simulatedDirectionConfidence,
                enabledAlertChannels = enabledAlertChannels,
                microphoneDisclosureAccepted = microphoneDisclosureAccepted,
                microphoneDisclosureVersion = microphoneDisclosureVersion,
            ),
        )
    }

    private fun updateAlertChannel(channel: AlertChannel, enabled: Boolean) {
        val channels = if (enabled) {
            state.enabledAlertChannels + channel
        } else {
            state.enabledAlertChannels - channel
        }
        if (channels.isEmpty()) {
            state = state.copy(statusMessage = "최소 1개 알림 채널이 필요합니다")
            return
        }
        state = state.copy(
            enabledAlertChannels = channels,
            statusMessage = "알림 채널 설정 저장 완료",
        )
        saveCurrentSettings(enabledAlertChannels = channels)
        DiagnosticsLogger.info(
            "alert_channel_settings_updated",
            "enabledCount" to channels.size,
        )
    }

    private fun restoreLocalState() {
        val snapshot = repository.loadSnapshot()
        if (snapshot.isInitialized) {
            state = state.copy(
                enrolledProfiles = snapshot.profiles,
                eventHistory = snapshot.events,
                feedbackHistory = snapshot.feedback,
                directionValidationTrials = snapshot.directionValidationTrials,
                falsePositiveRun = snapshot.falsePositiveRun,
                lastEvent = snapshot.events.firstOrNull(),
                triggerPhrase = snapshot.settings.triggerPhrase,
                simulatedDirection = snapshot.settings.simulatedDirection,
                simulatedDirectionConfidence = snapshot.settings.simulatedDirectionConfidence,
                enabledAlertChannels = snapshot.settings.enabledAlertChannels,
                microphoneDisclosureAccepted = snapshot.settings.microphoneDisclosureAccepted,
                microphoneDisclosureVersion = snapshot.settings.microphoneDisclosureVersion,
                latestServiceAutomationBridge = snapshot.latestServiceAutomationBridge,
                statusMessage = "로컬 저장소 복원 완료",
            )
        }
    }

    companion object {
        private const val REQUIRED_ENROLLMENT_SAMPLE_COUNT = 3
    }
}

private fun AudioDirectionSampleStatus.toDirectionValidationStatus(): DirectionValidationStatus =
    when (this) {
        AudioDirectionSampleStatus.SAMPLED -> DirectionValidationStatus.SAMPLED
        AudioDirectionSampleStatus.NO_PERMISSION -> DirectionValidationStatus.NO_PERMISSION
        AudioDirectionSampleStatus.NO_STEREO_INPUT -> DirectionValidationStatus.NO_STEREO_INPUT
        AudioDirectionSampleStatus.RECORDER_UNAVAILABLE -> DirectionValidationStatus.RECORDER_UNAVAILABLE
        AudioDirectionSampleStatus.READ_FAILED -> DirectionValidationStatus.READ_FAILED
        AudioDirectionSampleStatus.ERROR -> DirectionValidationStatus.ERROR
    }
