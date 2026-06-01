package com.voicedirection.glass.storage

import com.voicedirection.glass.alerts.AlertChannel
import com.voicedirection.glass.alerts.AlertDelivery
import com.voicedirection.glass.audio.AudioDirectionEvidenceClassifier
import com.voicedirection.glass.audio.AudioDirectionEvidenceLevel
import com.voicedirection.glass.audio.AudioDirectionSampleResult
import com.voicedirection.glass.audio.AudioDirectionSampleStatus
import com.voicedirection.glass.detection.PrototypeVoiceMatchStatus
import com.voicedirection.glass.enrollment.VoiceEnrollmentSampleStatus
import com.voicedirection.glass.model.DetectionFeedback
import com.voicedirection.glass.model.DetectionEvent
import com.voicedirection.glass.model.DirectionValidationTrial
import com.voicedirection.glass.model.FalsePositiveRun
import com.voicedirection.glass.model.SpeakerProfile
import com.voicedirection.glass.model.CallerDirection

data class VoiceDirectionSettings(
    val triggerPhrase: String = "준표",
    val simulatedDirection: CallerDirection = CallerDirection.RIGHT,
    val simulatedDirectionConfidence: Float = 0.82f,
    val enabledAlertChannels: Set<AlertChannel> = AlertChannel.PHONE_MVP_DEFAULTS,
    val microphoneDisclosureAccepted: Boolean = false,
    val microphoneDisclosureVersion: String = "",
)

data class GlassesCueSnapshot(
    val speakerLabel: String?,
    val direction: CallerDirection,
    val confidence: Float,
    val createdAtMillis: Long,
) {
    companion object {
        fun fromEvent(event: DetectionEvent): GlassesCueSnapshot =
            GlassesCueSnapshot(
                speakerLabel = event.speakerLabel,
                direction = event.direction,
                confidence = event.directionConfidence,
                createdAtMillis = event.createdAtMillis,
            )
    }
}

data class ServiceAutomationBridgeSnapshot(
    val eventId: String,
    val checkedAtMillis: Long,
    val actionable: Boolean,
    val sampleStatus: VoiceEnrollmentSampleStatus?,
    val matchStatus: PrototypeVoiceMatchStatus,
    val similarity: Float,
    val audioDirectionStatus: AudioDirectionSampleStatus?,
    val usedAudioDirection: Boolean,
    val direction: CallerDirection,
    val directionConfidence: Float,
    val sourceAdapter: String,
) {
    companion object {
        fun from(
            result: com.voicedirection.glass.session.PrototypeVoiceSessionResult,
            audioDirectionStatus: AudioDirectionSampleStatus?,
            usedAudioDirection: Boolean,
        ): ServiceAutomationBridgeSnapshot =
            ServiceAutomationBridgeSnapshot(
                eventId = result.event.id,
                checkedAtMillis = result.event.createdAtMillis,
                actionable = result.event.isActionable,
                sampleStatus = result.sampleStatus,
                matchStatus = result.match.status,
                similarity = result.match.similarity,
                audioDirectionStatus = audioDirectionStatus,
                usedAudioDirection = usedAudioDirection,
                direction = result.event.direction,
                directionConfidence = result.event.directionConfidence,
                sourceAdapter = result.event.sourceAdapter,
            )
    }
}

data class AudioDirectionSampleSnapshot(
    val checkedAtMillis: Long,
    val status: AudioDirectionSampleStatus,
    val direction: CallerDirection,
    val confidence: Float,
    val evidenceLevel: AudioDirectionEvidenceLevel,
    val sampleRateHz: Int?,
    val samplesRead: Int,
    val source: String,
    val microphoneInventoryCaptured: Boolean = false,
    val availableMicrophoneCount: Int = 0,
    val availablePositionKnownCount: Int = 0,
    val availableOrientationKnownCount: Int = 0,
    val activeMicrophoneCaptured: Boolean = false,
    val activeMicrophoneCount: Int? = null,
    val activeChannelMappingCount: Int? = null,
) {
    companion object {
        fun from(result: AudioDirectionSampleResult): AudioDirectionSampleSnapshot =
            AudioDirectionSampleSnapshot(
                checkedAtMillis = result.checkedAtMillis,
                status = result.status,
                direction = result.estimate?.direction ?: CallerDirection.UNKNOWN,
                confidence = result.estimate?.confidence ?: 0f,
                evidenceLevel = AudioDirectionEvidenceClassifier.classify(result).level,
                sampleRateHz = result.sampleRateHz,
                samplesRead = result.samplesRead,
                source = result.estimate?.source ?: "missing",
                microphoneInventoryCaptured = result.microphoneMetadata.inventoryQuerySucceeded,
                availableMicrophoneCount = result.microphoneMetadata.availableMicrophoneCount,
                availablePositionKnownCount = result.microphoneMetadata.availablePositionKnownCount,
                availableOrientationKnownCount = result.microphoneMetadata.availableOrientationKnownCount,
                activeMicrophoneCaptured = result.microphoneMetadata.activeMicrophoneQuerySucceeded,
                activeMicrophoneCount = result.microphoneMetadata.activeMicrophoneCount,
                activeChannelMappingCount = result.microphoneMetadata.activeChannelMappingCount,
            )
    }
}

data class AlertDeliveryRecord(
    val channel: AlertChannel,
    val delivered: Boolean,
)

data class AlertDeliverySnapshot(
    val eventId: String,
    val checkedAtMillis: Long,
    val deliveries: List<AlertDeliveryRecord>,
) {
    val source: AlertDeliverySource
        get() = AlertDeliverySource.fromEventId(eventId)

    val totalCount: Int
        get() = deliveries.size

    val deliveredCount: Int
        get() = deliveries.count { delivery -> delivery.delivered }

    fun statusFor(channel: AlertChannel): AlertDeliveryStatus {
        val delivery = deliveries.firstOrNull { item -> item.channel == channel }
        return when {
            delivery == null -> AlertDeliveryStatus.MISSING
            delivery.delivered -> AlertDeliveryStatus.DELIVERED
            else -> AlertDeliveryStatus.FAILED
        }
    }

    companion object {
        fun from(
            eventId: String,
            deliveries: List<AlertDelivery>,
            checkedAtMillis: Long,
        ): AlertDeliverySnapshot =
            AlertDeliverySnapshot(
                eventId = eventId,
                checkedAtMillis = checkedAtMillis,
                deliveries = deliveries.map { delivery ->
                    AlertDeliveryRecord(
                        channel = delivery.channel,
                        delivered = delivery.delivered,
                    )
                },
            )
    }
}

enum class AlertDeliveryStatus {
    DELIVERED,
    FAILED,
    MISSING,
}

enum class AlertDeliverySource {
    TEST_CUE,
    DETECTION_EVENT,
    UNKNOWN;

    companion object {
        fun fromEventId(eventId: String): AlertDeliverySource =
            when {
                eventId.startsWith("alert-test-") -> TEST_CUE
                eventId.startsWith("event-") -> DETECTION_EVENT
                else -> UNKNOWN
            }
    }
}

data class VoiceDirectionSnapshot(
    val profiles: List<SpeakerProfile>,
    val events: List<DetectionEvent>,
    val feedback: List<DetectionFeedback>,
    val directionValidationTrials: List<DirectionValidationTrial>,
    val falsePositiveRun: FalsePositiveRun?,
    val settings: VoiceDirectionSettings,
    val latestGlassesCue: GlassesCueSnapshot?,
    val latestServiceAutomationBridge: ServiceAutomationBridgeSnapshot?,
    val latestAudioDirectionSample: AudioDirectionSampleSnapshot?,
    val latestAlertDeliverySnapshot: AlertDeliverySnapshot?,
    val isInitialized: Boolean,
)

interface VoiceDirectionRepository {
    fun loadSnapshot(): VoiceDirectionSnapshot
    fun saveProfiles(profiles: List<SpeakerProfile>)
    fun saveSettings(settings: VoiceDirectionSettings)
    fun saveLatestGlassesCue(cue: GlassesCueSnapshot)
    fun saveLatestServiceAutomationBridge(snapshot: ServiceAutomationBridgeSnapshot)
    fun saveLatestAudioDirectionSample(snapshot: AudioDirectionSampleSnapshot)
    fun saveLatestAlertDeliverySnapshot(snapshot: AlertDeliverySnapshot)
    fun appendEvent(event: DetectionEvent)
    fun upsertFeedback(feedback: DetectionFeedback)
    fun appendDirectionValidationTrial(trial: DirectionValidationTrial)
    fun clearDirectionValidationTrials()
    fun saveFalsePositiveRun(run: FalsePositiveRun?)
    fun clearAll()
}
