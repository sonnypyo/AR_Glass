package com.voicedirection.glass.storage

import com.voicedirection.glass.alerts.AlertChannel
import com.voicedirection.glass.audio.AudioDirectionEvidenceLevel
import com.voicedirection.glass.audio.AudioDirectionSampleStatus
import com.voicedirection.glass.detection.PrototypeVoiceMatchStatus
import com.voicedirection.glass.enrollment.VoiceEnrollmentSampleStatus
import com.voicedirection.glass.model.CallerDirection
import com.voicedirection.glass.model.DetectionEvent
import com.voicedirection.glass.model.DetectionFeedback
import com.voicedirection.glass.model.DetectionFeedbackType
import com.voicedirection.glass.model.DirectionValidationStatus
import com.voicedirection.glass.model.DirectionValidationTrial
import com.voicedirection.glass.model.FalsePositiveRun
import com.voicedirection.glass.model.SpeakerEnrollmentStatus
import com.voicedirection.glass.model.SpeakerProfile
import com.voicedirection.glass.model.SpeakerVerificationMode
import java.net.URLDecoder
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

object LocalStorageCodecs {
    fun encodeDirection(direction: CallerDirection): String = direction.name

    fun decodeDirection(value: String): CallerDirection? =
        runCatching { CallerDirection.valueOf(value) }.getOrNull()

    fun encodeAlertChannels(channels: Set<AlertChannel>): String =
        channels
            .map { channel -> channel.name }
            .sorted()
            .joinToString(DELIVERY_SEPARATOR)

    fun decodeAlertChannels(value: String): Set<AlertChannel>? {
        if (value.isBlank()) return emptySet()
        return value
            .split(DELIVERY_SEPARATOR)
            .map { encodedChannel -> decodeAlertChannel(encodedChannel) ?: return null }
            .toSet()
    }

    fun encodeCue(cue: GlassesCueSnapshot): String =
        listOf(
            enc(cue.speakerLabel.orEmpty()),
            cue.direction.name,
            cue.confidence.toString(),
            cue.createdAtMillis.toString(),
        ).joinToString(FIELD_SEPARATOR)

    fun decodeCue(line: String): GlassesCueSnapshot? {
        val parts = line.split(FIELD_SEPARATOR)
        if (parts.size != 4) return null
        return GlassesCueSnapshot(
            speakerLabel = dec(parts[0]).ifBlank { null },
            direction = decodeDirection(parts[1]) ?: return null,
            confidence = parts[2].toFloatOrNull() ?: return null,
            createdAtMillis = parts[3].toLongOrNull() ?: return null,
        )
    }

    fun encodeServiceAutomationBridge(snapshot: ServiceAutomationBridgeSnapshot): String =
        listOf(
            enc(snapshot.eventId),
            snapshot.checkedAtMillis.toString(),
            snapshot.actionable.toString(),
            snapshot.sampleStatus?.name.orEmpty(),
            snapshot.matchStatus.name,
            snapshot.similarity.toString(),
            snapshot.audioDirectionStatus?.name.orEmpty(),
            snapshot.usedAudioDirection.toString(),
            snapshot.direction.name,
            snapshot.directionConfidence.toString(),
            enc(snapshot.sourceAdapter),
        ).joinToString(FIELD_SEPARATOR)

    fun decodeServiceAutomationBridge(line: String): ServiceAutomationBridgeSnapshot? {
        val parts = line.split(FIELD_SEPARATOR)
        if (parts.size != 11) return null
        return ServiceAutomationBridgeSnapshot(
            eventId = dec(parts[0]),
            checkedAtMillis = parts[1].toLongOrNull() ?: return null,
            actionable = parts[2].toBooleanStrictOrNull() ?: return null,
            sampleStatus = parts[3].ifBlank { null }?.let(::decodeVoiceSampleStatus),
            matchStatus = decodePrototypeVoiceMatchStatus(parts[4]) ?: return null,
            similarity = parts[5].toFloatOrNull() ?: return null,
            audioDirectionStatus = parts[6].ifBlank { null }?.let(::decodeAudioDirectionSampleStatus),
            usedAudioDirection = parts[7].toBooleanStrictOrNull() ?: return null,
            direction = decodeDirection(parts[8]) ?: return null,
            directionConfidence = parts[9].toFloatOrNull() ?: return null,
            sourceAdapter = dec(parts[10]),
        )
    }

    fun encodeAudioDirectionSampleSnapshot(snapshot: AudioDirectionSampleSnapshot): String =
        listOf(
            snapshot.checkedAtMillis.toString(),
            snapshot.status.name,
            snapshot.direction.name,
            snapshot.confidence.toString(),
            snapshot.evidenceLevel.name,
            snapshot.sampleRateHz?.toString().orEmpty(),
            snapshot.samplesRead.toString(),
            enc(snapshot.source),
            snapshot.microphoneInventoryCaptured.toString(),
            snapshot.availableMicrophoneCount.toString(),
            snapshot.availablePositionKnownCount.toString(),
            snapshot.availableOrientationKnownCount.toString(),
            snapshot.activeMicrophoneCaptured.toString(),
            snapshot.activeMicrophoneCount?.toString().orEmpty(),
            snapshot.activeChannelMappingCount?.toString().orEmpty(),
        ).joinToString(FIELD_SEPARATOR)

    fun decodeAudioDirectionSampleSnapshot(line: String): AudioDirectionSampleSnapshot? {
        val parts = line.split(FIELD_SEPARATOR)
        if (parts.size != 8 && parts.size != 15) return null
        return AudioDirectionSampleSnapshot(
            checkedAtMillis = parts[0].toLongOrNull() ?: return null,
            status = decodeAudioDirectionSampleStatus(parts[1]) ?: return null,
            direction = decodeDirection(parts[2]) ?: return null,
            confidence = parts[3].toFloatOrNull() ?: return null,
            evidenceLevel = decodeAudioDirectionEvidenceLevel(parts[4]) ?: return null,
            sampleRateHz = parts[5].ifBlank { null }?.toIntOrNull(),
            samplesRead = parts[6].toIntOrNull() ?: return null,
            source = dec(parts[7]),
            microphoneInventoryCaptured = if (parts.size >= 15) {
                parts[8].toBooleanStrictOrNull() ?: return null
            } else {
                false
            },
            availableMicrophoneCount = if (parts.size >= 15) parts[9].toIntOrNull() ?: return null else 0,
            availablePositionKnownCount = if (parts.size >= 15) parts[10].toIntOrNull() ?: return null else 0,
            availableOrientationKnownCount = if (parts.size >= 15) parts[11].toIntOrNull() ?: return null else 0,
            activeMicrophoneCaptured = if (parts.size >= 15) {
                parts[12].toBooleanStrictOrNull() ?: return null
            } else {
                false
            },
            activeMicrophoneCount = if (parts.size >= 15) parts[13].ifBlank { null }?.toIntOrNull() else null,
            activeChannelMappingCount = if (parts.size >= 15) parts[14].ifBlank { null }?.toIntOrNull() else null,
        )
    }

    fun encodeAlertDeliverySnapshot(snapshot: AlertDeliverySnapshot): String =
        listOf(
            enc(snapshot.eventId),
            snapshot.checkedAtMillis.toString(),
            snapshot.deliveries.joinToString(DELIVERY_SEPARATOR) { delivery ->
                "${delivery.channel.name}:${delivery.delivered}"
            },
        ).joinToString(FIELD_SEPARATOR)

    fun decodeAlertDeliverySnapshot(line: String): AlertDeliverySnapshot? {
        val parts = line.split(FIELD_SEPARATOR)
        if (parts.size != 3) return null
        val deliveries = if (parts[2].isBlank()) {
            emptyList()
        } else {
            parts[2].split(DELIVERY_SEPARATOR).map { encodedDelivery ->
                val deliveryParts = encodedDelivery.split(":", limit = 2)
                if (deliveryParts.size != 2) return null
                AlertDeliveryRecord(
                    channel = decodeAlertChannel(deliveryParts[0]) ?: return null,
                    delivered = deliveryParts[1].toBooleanStrictOrNull() ?: return null,
                )
            }
        }
        return AlertDeliverySnapshot(
            eventId = dec(parts[0]),
            checkedAtMillis = parts[1].toLongOrNull() ?: return null,
            deliveries = deliveries,
        )
    }

    fun encodeProfile(profile: SpeakerProfile): String =
        listOf(
            enc(profile.id),
            enc(profile.displayName),
            enc(profile.consentVersion),
            profile.createdAtMillis.toString(),
            enc(profile.embeddingRef),
            profile.verificationMode.name,
            profile.enrollmentStatus.name,
            profile.sampleCount.toString(),
        ).joinToString(FIELD_SEPARATOR)

    fun decodeProfile(line: String): SpeakerProfile? {
        val parts = line.split(FIELD_SEPARATOR)
        if (parts.size != 5 && parts.size != 8) return null
        return SpeakerProfile(
            id = dec(parts[0]),
            displayName = dec(parts[1]),
            consentVersion = dec(parts[2]),
            createdAtMillis = parts[3].toLongOrNull() ?: return null,
            embeddingRef = dec(parts[4]),
            verificationMode = if (parts.size >= 6) {
                decodeVerificationMode(parts[5]) ?: return null
            } else {
                SpeakerVerificationMode.TRANSCRIPT_LABEL_SIMULATION
            },
            enrollmentStatus = if (parts.size >= 7) {
                decodeEnrollmentStatus(parts[6]) ?: return null
            } else {
                SpeakerEnrollmentStatus.LABEL_ONLY
            },
            sampleCount = if (parts.size >= 8) {
                parts[7].toIntOrNull() ?: return null
            } else {
                0
            },
        )
    }

    fun encodeEvent(event: DetectionEvent): String =
        listOf(
            enc(event.id),
            enc(event.speakerProfileId.orEmpty()),
            enc(event.speakerLabel.orEmpty()),
            event.phraseMatched.toString(),
            event.speakerConfidence.toString(),
            event.direction.name,
            event.directionConfidence.toString(),
            enc(event.sourceAdapter),
            event.createdAtMillis.toString(),
            event.processingLatencyMillis?.toString().orEmpty(),
        ).joinToString(FIELD_SEPARATOR)

    fun decodeEvent(line: String): DetectionEvent? {
        val parts = line.split(FIELD_SEPARATOR)
        if (parts.size != 9 && parts.size != 10) return null
        return DetectionEvent(
            id = dec(parts[0]),
            speakerProfileId = dec(parts[1]).ifBlank { null },
            speakerLabel = dec(parts[2]).ifBlank { null },
            phraseMatched = parts[3].toBooleanStrictOrNull() ?: return null,
            speakerConfidence = parts[4].toFloatOrNull() ?: return null,
            direction = decodeDirection(parts[5]) ?: return null,
            directionConfidence = parts[6].toFloatOrNull() ?: return null,
            sourceAdapter = dec(parts[7]),
            createdAtMillis = parts[8].toLongOrNull() ?: return null,
            processingLatencyMillis = if (parts.size >= 10) {
                parts[9].ifBlank { null }?.toLongOrNull()
            } else {
                null
            },
        )
    }

    fun encodeFeedback(feedback: DetectionFeedback): String =
        listOf(
            enc(feedback.eventId),
            feedback.type.name,
            feedback.createdAtMillis.toString(),
        ).joinToString(FIELD_SEPARATOR)

    fun decodeFeedback(line: String): DetectionFeedback? {
        val parts = line.split(FIELD_SEPARATOR)
        if (parts.size != 3) return null
        return DetectionFeedback(
            eventId = dec(parts[0]),
            type = decodeFeedbackType(parts[1]) ?: return null,
            createdAtMillis = parts[2].toLongOrNull() ?: return null,
        )
    }

    fun encodeDirectionValidationTrial(trial: DirectionValidationTrial): String =
        listOf(
            enc(trial.id),
            trial.expectedDirection.name,
            trial.observedDirection.name,
            trial.confidence.toString(),
            trial.status.name,
            trial.sampleRateHz?.toString().orEmpty(),
            trial.samplesRead.toString(),
            enc(trial.source),
            trial.createdAtMillis.toString(),
        ).joinToString(FIELD_SEPARATOR)

    fun decodeDirectionValidationTrial(line: String): DirectionValidationTrial? {
        val parts = line.split(FIELD_SEPARATOR)
        if (parts.size != 9) return null
        return DirectionValidationTrial(
            id = dec(parts[0]),
            expectedDirection = decodeDirection(parts[1]) ?: return null,
            observedDirection = decodeDirection(parts[2]) ?: return null,
            confidence = parts[3].toFloatOrNull() ?: return null,
            status = decodeDirectionValidationStatus(parts[4]) ?: return null,
            sampleRateHz = parts[5].ifBlank { null }?.toIntOrNull(),
            samplesRead = parts[6].toIntOrNull() ?: return null,
            source = dec(parts[7]),
            createdAtMillis = parts[8].toLongOrNull() ?: return null,
        )
    }

    fun encodeFalsePositiveRun(run: FalsePositiveRun): String =
        listOf(
            enc(run.id),
            run.startedAtMillis.toString(),
            run.targetDurationMillis.toString(),
            run.endedAtMillis?.toString().orEmpty(),
        ).joinToString(FIELD_SEPARATOR)

    fun decodeFalsePositiveRun(line: String): FalsePositiveRun? {
        val parts = line.split(FIELD_SEPARATOR)
        if (parts.size != 4) return null
        val endedAtMillis = if (parts[3].isBlank()) {
            null
        } else {
            parts[3].toLongOrNull() ?: return null
        }
        return FalsePositiveRun(
            id = dec(parts[0]),
            startedAtMillis = parts[1].toLongOrNull() ?: return null,
            targetDurationMillis = parts[2].toLongOrNull() ?: return null,
            endedAtMillis = endedAtMillis,
        )
    }

    private fun enc(value: String): String =
        URLEncoder.encode(value, StandardCharsets.UTF_8.name())

    private fun dec(value: String): String =
        URLDecoder.decode(value, StandardCharsets.UTF_8.name())

    private fun decodeVerificationMode(value: String): SpeakerVerificationMode? =
        runCatching { SpeakerVerificationMode.valueOf(value) }.getOrNull()

    private fun decodeEnrollmentStatus(value: String): SpeakerEnrollmentStatus? =
        runCatching { SpeakerEnrollmentStatus.valueOf(value) }.getOrNull()

    private fun decodeVoiceSampleStatus(value: String): VoiceEnrollmentSampleStatus? =
        runCatching { VoiceEnrollmentSampleStatus.valueOf(value) }.getOrNull()

    private fun decodePrototypeVoiceMatchStatus(value: String): PrototypeVoiceMatchStatus? =
        runCatching { PrototypeVoiceMatchStatus.valueOf(value) }.getOrNull()

    private fun decodeAudioDirectionSampleStatus(value: String): AudioDirectionSampleStatus? =
        runCatching { AudioDirectionSampleStatus.valueOf(value) }.getOrNull()

    private fun decodeAudioDirectionEvidenceLevel(value: String): AudioDirectionEvidenceLevel? =
        runCatching { AudioDirectionEvidenceLevel.valueOf(value) }.getOrNull()

    private fun decodeAlertChannel(value: String): AlertChannel? =
        runCatching { AlertChannel.valueOf(value) }.getOrNull()

    private fun decodeFeedbackType(value: String): DetectionFeedbackType? =
        runCatching { DetectionFeedbackType.valueOf(value) }.getOrNull()

    private fun decodeDirectionValidationStatus(value: String): DirectionValidationStatus? =
        runCatching { DirectionValidationStatus.valueOf(value) }.getOrNull()

    private const val FIELD_SEPARATOR = "|"
    private const val DELIVERY_SEPARATOR = ","
}
