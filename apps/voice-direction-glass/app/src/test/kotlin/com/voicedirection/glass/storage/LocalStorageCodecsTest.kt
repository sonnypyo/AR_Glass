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
import org.junit.Assert.assertEquals
import org.junit.Test

class LocalStorageCodecsTest {
    @Test
    fun roundTripsSpeakerProfileWithKoreanText() {
        val profile = SpeakerProfile(
            id = "speaker-1",
            displayName = "민지|테스트",
            consentVersion = "local-dev-v1",
            createdAtMillis = 100L,
            embeddingRef = "voice-embedding:minji",
            verificationMode = SpeakerVerificationMode.ON_DEVICE_EMBEDDING,
            enrollmentStatus = SpeakerEnrollmentStatus.MODEL_READY,
            sampleCount = 3,
        )

        assertEquals(profile, LocalStorageCodecs.decodeProfile(LocalStorageCodecs.encodeProfile(profile)))
    }

    @Test
    fun decodesLegacySpeakerProfileAsTranscriptSimulation() {
        val legacyLine = listOf(
            "speaker-1",
            "%EB%AF%BC%EC%A7%80",
            "local-dev-v1",
            "100",
            "simulated%3Aminji",
        ).joinToString("|")

        val profile = LocalStorageCodecs.decodeProfile(legacyLine)

        assertEquals(SpeakerVerificationMode.TRANSCRIPT_LABEL_SIMULATION, profile?.verificationMode)
        assertEquals(SpeakerEnrollmentStatus.LABEL_ONLY, profile?.enrollmentStatus)
        assertEquals(0, profile?.sampleCount)
    }

    @Test
    fun roundTripsDetectionEvent() {
        val event = DetectionEvent(
            id = "event-1",
            speakerProfileId = "speaker-1",
            speakerLabel = "민지",
            phraseMatched = true,
            speakerConfidence = 0.91f,
            direction = CallerDirection.LEFT,
            directionConfidence = 0.79f,
            sourceAdapter = "simulator",
            createdAtMillis = 200L,
            processingLatencyMillis = 320L,
        )

        assertEquals(event, LocalStorageCodecs.decodeEvent(LocalStorageCodecs.encodeEvent(event)))
    }

    @Test
    fun decodesLegacyDetectionEventWithoutLatency() {
        val legacyLine = listOf(
            "event-1",
            "speaker-1",
            "%EB%AF%BC%EC%A7%80",
            "true",
            "0.91",
            "LEFT",
            "0.79",
            "simulator",
            "200",
        ).joinToString("|")

        val event = LocalStorageCodecs.decodeEvent(legacyLine)

        assertEquals(null, event?.processingLatencyMillis)
        assertEquals(CallerDirection.LEFT, event?.direction)
    }

    @Test
    fun roundTripsDetectionFeedback() {
        val feedback = DetectionFeedback(
            eventId = "event-1",
            type = DetectionFeedbackType.WRONG_SPEAKER,
            createdAtMillis = 250L,
        )

        assertEquals(feedback, LocalStorageCodecs.decodeFeedback(LocalStorageCodecs.encodeFeedback(feedback)))
    }

    @Test
    fun roundTripsFalsePositiveRun() {
        val run = FalsePositiveRun(
            id = "run-1",
            startedAtMillis = 100L,
            targetDurationMillis = 1_800_000L,
            endedAtMillis = 200L,
        )

        assertEquals(run, LocalStorageCodecs.decodeFalsePositiveRun(LocalStorageCodecs.encodeFalsePositiveRun(run)))
    }

    @Test
    fun roundTripsDirection() {
        assertEquals(
            CallerDirection.BACK,
            LocalStorageCodecs.decodeDirection(LocalStorageCodecs.encodeDirection(CallerDirection.BACK)),
        )
    }

    @Test
    fun roundTripsEnabledAlertChannels() {
        val channels = setOf(AlertChannel.PHONE_NOTIFICATION, AlertChannel.TTS, AlertChannel.ANDROID_XR_DISPLAY)

        assertEquals(
            channels,
            LocalStorageCodecs.decodeAlertChannels(LocalStorageCodecs.encodeAlertChannels(channels)),
        )
    }

    @Test
    fun roundTripsGlassesCue() {
        val cue = GlassesCueSnapshot(
            speakerLabel = "민지",
            direction = CallerDirection.FRONT,
            confidence = 0.72f,
            createdAtMillis = 300L,
        )

        assertEquals(cue, LocalStorageCodecs.decodeCue(LocalStorageCodecs.encodeCue(cue)))
    }

    @Test
    fun roundTripsServiceAutomationBridgeSnapshot() {
        val snapshot = ServiceAutomationBridgeSnapshot(
            eventId = "event-1",
            checkedAtMillis = 400L,
            actionable = true,
            sampleStatus = VoiceEnrollmentSampleStatus.SAMPLED,
            matchStatus = PrototypeVoiceMatchStatus.MATCHED,
            similarity = 0.91f,
            audioDirectionStatus = AudioDirectionSampleStatus.SAMPLED,
            usedAudioDirection = true,
            direction = CallerDirection.LEFT,
            directionConfidence = 0.73f,
            sourceAdapter = "prototype_voice:stereo_pcm",
        )

        assertEquals(
            snapshot,
            LocalStorageCodecs.decodeServiceAutomationBridge(
                LocalStorageCodecs.encodeServiceAutomationBridge(snapshot),
            ),
        )
    }

    @Test
    fun roundTripsAlertDeliverySnapshotWithoutMessages() {
        val snapshot = AlertDeliverySnapshot(
            eventId = "event-1",
            checkedAtMillis = 450L,
            deliveries = listOf(
                AlertDeliveryRecord(AlertChannel.PHONE_NOTIFICATION, delivered = true),
                AlertDeliveryRecord(AlertChannel.PHONE_VIBRATION, delivered = true),
                AlertDeliveryRecord(AlertChannel.META_DISPLAY, delivered = false),
            ),
        )

        assertEquals(
            snapshot,
            LocalStorageCodecs.decodeAlertDeliverySnapshot(
                LocalStorageCodecs.encodeAlertDeliverySnapshot(snapshot),
            ),
        )
    }

    @Test
    fun roundTripsAudioDirectionSampleSnapshotWithoutPcm() {
        val snapshot = AudioDirectionSampleSnapshot(
            checkedAtMillis = 440L,
            status = AudioDirectionSampleStatus.SAMPLED,
            direction = CallerDirection.LEFT,
            confidence = 0.62f,
            evidenceLevel = AudioDirectionEvidenceLevel.LEFT_RIGHT_USABLE,
            sampleRateHz = 16_000,
            samplesRead = 4096,
            source = "stereo-pcm:energy-balance",
            microphoneInventoryCaptured = true,
            availableMicrophoneCount = 2,
            availablePositionKnownCount = 1,
            availableOrientationKnownCount = 1,
            activeMicrophoneCaptured = true,
            activeMicrophoneCount = 2,
            activeChannelMappingCount = 2,
        )

        assertEquals(
            snapshot,
            LocalStorageCodecs.decodeAudioDirectionSampleSnapshot(
                LocalStorageCodecs.encodeAudioDirectionSampleSnapshot(snapshot),
            ),
        )
    }

    @Test
    fun derivesAlertDeliverySourceFromEventIdWithoutExportingId() {
        assertEquals(
            AlertDeliverySource.TEST_CUE,
            AlertDeliverySnapshot(
                eventId = "alert-test-1",
                checkedAtMillis = 1L,
                deliveries = emptyList(),
            ).source,
        )
        assertEquals(
            AlertDeliverySource.DETECTION_EVENT,
            AlertDeliverySnapshot(
                eventId = "event-1",
                checkedAtMillis = 1L,
                deliveries = emptyList(),
            ).source,
        )
        assertEquals(
            AlertDeliverySource.UNKNOWN,
            AlertDeliverySnapshot(
                eventId = "legacy-1",
                checkedAtMillis = 1L,
                deliveries = emptyList(),
            ).source,
        )
    }

    @Test
    fun roundTripsDirectionValidationTrial() {
        val trial = DirectionValidationTrial(
            id = "trial-1",
            expectedDirection = CallerDirection.BACK,
            observedDirection = CallerDirection.UNKNOWN,
            confidence = 0.23f,
            status = DirectionValidationStatus.NO_STEREO_INPUT,
            sampleRateHz = null,
            samplesRead = 0,
            source = "phone|stereo",
            createdAtMillis = 500L,
        )

        assertEquals(
            trial,
            LocalStorageCodecs.decodeDirectionValidationTrial(
                LocalStorageCodecs.encodeDirectionValidationTrial(trial),
            ),
        )
    }
}
