package com.voicedirection.glass.session

import com.voicedirection.glass.alerts.AlertDelivery
import com.voicedirection.glass.alerts.AlertChannel
import com.voicedirection.glass.model.CallerDirection
import com.voicedirection.glass.model.DetectionEvent
import com.voicedirection.glass.model.DetectionFeedback
import com.voicedirection.glass.model.DirectionValidationTrial
import com.voicedirection.glass.model.FalsePositiveRun
import com.voicedirection.glass.model.SpeakerEnrollmentStatus
import com.voicedirection.glass.model.SpeakerProfile
import com.voicedirection.glass.model.SpeakerVerificationMode
import com.voicedirection.glass.storage.AlertDeliverySnapshot
import com.voicedirection.glass.storage.ServiceAutomationBridgeSnapshot

data class ListeningSessionState(
    val isListening: Boolean = false,
    val triggerPhrase: String = "준표",
    val simulatedTranscript: String = "민지가 준표 하고 불렀어",
    val simulatedDirection: CallerDirection = CallerDirection.RIGHT,
    val simulatedDirectionConfidence: Float = 0.82f,
    val enabledAlertChannels: Set<AlertChannel> = AlertChannel.PHONE_MVP_DEFAULTS,
    val microphoneDisclosureAccepted: Boolean = false,
    val microphoneDisclosureVersion: String = "",
    val newSpeakerName: String = "",
    val newSpeakerConsentConfirmed: Boolean = false,
    val enrolledProfiles: List<SpeakerProfile> = listOf(
        SpeakerProfile(
            id = "speaker-minji",
            displayName = "민지",
            consentVersion = "local-dev-v1",
            createdAtMillis = 0L,
            embeddingRef = "transcript-label-simulator:minji",
            verificationMode = SpeakerVerificationMode.TRANSCRIPT_LABEL_SIMULATION,
            enrollmentStatus = SpeakerEnrollmentStatus.LABEL_ONLY,
            sampleCount = 0,
        ),
    ),
    val lastEvent: DetectionEvent? = null,
    val eventHistory: List<DetectionEvent> = emptyList(),
    val feedbackHistory: List<DetectionFeedback> = emptyList(),
    val falsePositiveRun: FalsePositiveRun? = null,
    val lastDeliveries: List<AlertDelivery> = emptyList(),
    val latestAlertDeliverySnapshot: AlertDeliverySnapshot? = null,
    val audioProbeSummary: String? = null,
    val audioDirectionSampleSummary: String? = null,
    val bluetoothAudioRouteSummary: String? = null,
    val directionValidationExpectedDirection: CallerDirection = CallerDirection.RIGHT,
    val directionValidationTrials: List<DirectionValidationTrial> = emptyList(),
    val voiceEnrollmentSampleSummary: String? = null,
    val prototypeVoiceMatchSummary: String? = null,
    val latestServiceAutomationBridge: ServiceAutomationBridgeSnapshot? = null,
    val statusMessage: String = "대기 중",
)
