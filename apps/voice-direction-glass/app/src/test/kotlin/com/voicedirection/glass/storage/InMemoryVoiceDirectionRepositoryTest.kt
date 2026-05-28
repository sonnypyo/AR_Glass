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
import com.voicedirection.glass.model.SpeakerProfile
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class InMemoryVoiceDirectionRepositoryTest {
    @Test
    fun storesProfilesAndEvents() {
        val repository = InMemoryVoiceDirectionRepository()
        val profile = SpeakerProfile(
            id = "speaker-1",
            displayName = "민지",
            consentVersion = "test-v1",
            createdAtMillis = 10L,
            embeddingRef = "simulated:minji",
        )
        val event = DetectionEvent(
            id = "event-1",
            speakerProfileId = "speaker-1",
            speakerLabel = "민지",
            phraseMatched = true,
            speakerConfidence = 0.9f,
            direction = CallerDirection.RIGHT,
            directionConfidence = 0.8f,
            sourceAdapter = "test",
            createdAtMillis = 20L,
        )

        repository.saveProfiles(listOf(profile))
        repository.appendEvent(event)

        val snapshot = repository.loadSnapshot()
        assertEquals(listOf(profile), snapshot.profiles)
        assertEquals(listOf(event), snapshot.events)
    }

    @Test
    fun clearsAllLocalData() {
        val repository = InMemoryVoiceDirectionRepository(
            initialProfiles = listOf(
                SpeakerProfile("speaker-1", "민지", "test-v1", 10L, "simulated:minji"),
            ),
            initialSettings = VoiceDirectionSettings(
                triggerPhrase = "테스트",
                simulatedDirection = CallerDirection.LEFT,
                simulatedDirectionConfidence = 0.7f,
            ),
        )

        repository.clearAll()

        val snapshot = repository.loadSnapshot()
        assertTrue(snapshot.profiles.isEmpty())
        assertTrue(snapshot.events.isEmpty())
        assertTrue(snapshot.feedback.isEmpty())
        assertTrue(snapshot.directionValidationTrials.isEmpty())
        assertEquals(null, snapshot.falsePositiveRun)
        assertEquals(VoiceDirectionSettings(), snapshot.settings)
        assertEquals(null, snapshot.latestGlassesCue)
        assertEquals(null, snapshot.latestServiceAutomationBridge)
        assertEquals(null, snapshot.latestAudioDirectionSample)
        assertEquals(null, snapshot.latestAlertDeliverySnapshot)
    }

    @Test
    fun storesSettingsForServiceOwnedDetection() {
        val repository = InMemoryVoiceDirectionRepository()
        val settings = VoiceDirectionSettings(
            triggerPhrase = "준표야",
            simulatedDirection = CallerDirection.BACK,
            simulatedDirectionConfidence = 0.61f,
            microphoneDisclosureAccepted = true,
            microphoneDisclosureVersion = "microphone-disclosure-v1",
        )

        repository.saveSettings(settings)

        assertEquals(settings, repository.loadSnapshot().settings)
    }

    @Test
    fun storesLatestGlassesCue() {
        val repository = InMemoryVoiceDirectionRepository()
        val cue = GlassesCueSnapshot(
            speakerLabel = "민지",
            direction = CallerDirection.RIGHT,
            confidence = 0.8f,
            createdAtMillis = 30L,
        )

        repository.saveLatestGlassesCue(cue)

        assertEquals(cue, repository.loadSnapshot().latestGlassesCue)
    }

    @Test
    fun storesLatestServiceAutomationBridgeSnapshot() {
        val repository = InMemoryVoiceDirectionRepository()
        val bridge = ServiceAutomationBridgeSnapshot(
            eventId = "event-1",
            checkedAtMillis = 40L,
            actionable = false,
            sampleStatus = VoiceEnrollmentSampleStatus.SAMPLED,
            matchStatus = PrototypeVoiceMatchStatus.LOW_CONFIDENCE,
            similarity = 0.42f,
            audioDirectionStatus = AudioDirectionSampleStatus.NO_STEREO_INPUT,
            usedAudioDirection = false,
            direction = CallerDirection.UNKNOWN,
            directionConfidence = 0.1f,
            sourceAdapter = "prototype_voice:simulator",
        )

        repository.saveLatestServiceAutomationBridge(bridge)

        assertEquals(bridge, repository.loadSnapshot().latestServiceAutomationBridge)
    }

    @Test
    fun storesLatestAlertDeliverySnapshot() {
        val repository = InMemoryVoiceDirectionRepository()
        val snapshot = AlertDeliverySnapshot(
            eventId = "event-1",
            checkedAtMillis = 45L,
            deliveries = listOf(
                AlertDeliveryRecord(AlertChannel.PHONE_NOTIFICATION, delivered = true),
                AlertDeliveryRecord(AlertChannel.META_DISPLAY, delivered = false),
            ),
        )

        repository.saveLatestAlertDeliverySnapshot(snapshot)

        assertEquals(snapshot, repository.loadSnapshot().latestAlertDeliverySnapshot)
    }

    @Test
    fun storesLatestAudioDirectionSampleSnapshot() {
        val repository = InMemoryVoiceDirectionRepository()
        val snapshot = AudioDirectionSampleSnapshot(
            checkedAtMillis = 44L,
            status = AudioDirectionSampleStatus.SAMPLED,
            direction = CallerDirection.RIGHT,
            confidence = 0.73f,
            evidenceLevel = AudioDirectionEvidenceLevel.LEFT_RIGHT_USABLE,
            sampleRateHz = 16_000,
            samplesRead = 1024,
            source = "unit-test",
            microphoneInventoryCaptured = true,
            availableMicrophoneCount = 2,
            availablePositionKnownCount = 1,
            availableOrientationKnownCount = 1,
            activeMicrophoneCaptured = true,
            activeMicrophoneCount = 2,
            activeChannelMappingCount = 2,
        )

        repository.saveLatestAudioDirectionSample(snapshot)

        assertEquals(snapshot, repository.loadSnapshot().latestAudioDirectionSample)
    }

    @Test
    fun upsertsFeedbackByEventId() {
        val repository = InMemoryVoiceDirectionRepository()
        val first = DetectionFeedback(
            eventId = "event-1",
            type = DetectionFeedbackType.FALSE_POSITIVE,
            createdAtMillis = 50L,
        )
        val replacement = DetectionFeedback(
            eventId = "event-1",
            type = DetectionFeedbackType.WRONG_DIRECTION,
            createdAtMillis = 60L,
        )

        repository.upsertFeedback(first)
        repository.upsertFeedback(replacement)

        assertEquals(listOf(replacement), repository.loadSnapshot().feedback)
    }

    @Test
    fun storesFalsePositiveRun() {
        val repository = InMemoryVoiceDirectionRepository()
        val run = FalsePositiveRun(
            id = "run-1",
            startedAtMillis = 100L,
            targetDurationMillis = 1_000L,
        )

        repository.saveFalsePositiveRun(run)
        assertEquals(run, repository.loadSnapshot().falsePositiveRun)

        repository.saveFalsePositiveRun(null)
        assertEquals(null, repository.loadSnapshot().falsePositiveRun)
    }

    @Test
    fun storesAndClearsDirectionValidationTrials() {
        val repository = InMemoryVoiceDirectionRepository()
        val trial = DirectionValidationTrial(
            id = "trial-1",
            expectedDirection = CallerDirection.LEFT,
            observedDirection = CallerDirection.LEFT,
            confidence = 0.82f,
            status = DirectionValidationStatus.SAMPLED,
            sampleRateHz = 16_000,
            samplesRead = 400,
            source = "unit-test",
            createdAtMillis = 70L,
        )

        repository.appendDirectionValidationTrial(trial)
        assertEquals(listOf(trial), repository.loadSnapshot().directionValidationTrials)

        repository.clearDirectionValidationTrials()
        assertTrue(repository.loadSnapshot().directionValidationTrials.isEmpty())
    }
}
