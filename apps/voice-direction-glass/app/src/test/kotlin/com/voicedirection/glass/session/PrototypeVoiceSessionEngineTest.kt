package com.voicedirection.glass.session

import com.voicedirection.glass.alerts.AlertRouter
import com.voicedirection.glass.alerts.PhoneNotificationAdapter
import com.voicedirection.glass.detection.PrototypeVoiceMatchChecker
import com.voicedirection.glass.detection.PrototypeVoiceMatchStatus
import com.voicedirection.glass.detection.SimpleTriggerPhraseDetector
import com.voicedirection.glass.direction.DirectionEstimate
import com.voicedirection.glass.direction.DirectionInput
import com.voicedirection.glass.direction.SimulatedDirectionEstimator
import com.voicedirection.glass.enrollment.VoiceEnrollmentSampleMetrics
import com.voicedirection.glass.enrollment.VoiceEnrollmentSampleResult
import com.voicedirection.glass.enrollment.VoiceEnrollmentSampleStatus
import com.voicedirection.glass.model.CallerDirection
import com.voicedirection.glass.model.SpeakerProfile
import com.voicedirection.glass.model.VoiceEmbedding
import com.voicedirection.glass.model.VoiceEmbeddingRefCodec
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class PrototypeVoiceSessionEngineTest {
    private val engine = PrototypeVoiceSessionEngine(
        triggerPhraseDetector = SimpleTriggerPhraseDetector(),
        voiceMatchChecker = PrototypeVoiceMatchChecker(matchThreshold = 0.80f),
        directionEstimator = SimulatedDirectionEstimator(),
        alertRouter = AlertRouter(listOf(PhoneNotificationAdapter())),
        clockMillis = { 2000L },
    )

    @Test
    fun requestsLiveSampleOnlyAfterTriggerPhraseAndEnrolledEmbedding() {
        assertTrue(
            engine.shouldCaptureLiveSample(
                transcript = "준표 하고 불렀어",
                triggerPhrase = "준표",
                profiles = listOf(profile("speaker-1", embedding = VoiceEmbedding(listOf(1f, 0f)))),
            ),
        )
        assertFalse(
            engine.shouldCaptureLiveSample(
                transcript = "그냥 대화",
                triggerPhrase = "준표",
                profiles = listOf(profile("speaker-1", embedding = VoiceEmbedding(listOf(1f, 0f)))),
            ),
        )
        assertFalse(
            engine.shouldCaptureLiveSample(
                transcript = "준표 하고 불렀어",
                triggerPhrase = "준표",
                profiles = listOf(profileWithoutEmbedding("speaker-1")),
            ),
        )
    }

    @Test
    fun emitsAlertWhenTriggerPhraseAndPrototypeVoiceMatch() {
        val result = engine.evaluate(
            transcript = "준표 여기 봐",
            triggerPhrase = "준표",
            liveSample = sample(VoiceEmbedding(listOf(1f, 0f))),
            profiles = listOf(profile("speaker-1", embedding = VoiceEmbedding(listOf(1f, 0f)))),
            directionInput = DirectionInput(
                simulatedDirection = CallerDirection.LEFT,
                simulatedConfidence = 0.88f,
            ),
        )

        assertTrue(result.event.isActionable)
        assertEquals("speaker-1", result.event.speakerProfileId)
        assertEquals(CallerDirection.LEFT, result.event.direction)
        assertEquals(PrototypeVoiceMatchStatus.MATCHED, result.match.status)
        assertEquals(1, result.deliveries.size)
    }

    @Test
    fun doesNotAlertWhenPrototypeVoiceSimilarityIsLow() {
        val result = engine.evaluate(
            transcript = "준표 여기 봐",
            triggerPhrase = "준표",
            liveSample = sample(VoiceEmbedding(listOf(0f, 1f))),
            profiles = listOf(profile("speaker-1", embedding = VoiceEmbedding(listOf(1f, 0f)))),
            directionInput = DirectionInput(
                simulatedDirection = CallerDirection.RIGHT,
                simulatedConfidence = 0.88f,
            ),
        )

        assertFalse(result.event.isActionable)
        assertEquals(null, result.event.speakerProfileId)
        assertEquals(PrototypeVoiceMatchStatus.LOW_CONFIDENCE, result.match.status)
        assertTrue(result.deliveries.isEmpty())
    }

    @Test
    fun doesNotAlertWithoutTriggerPhraseEvenWhenSampleMatches() {
        val result = engine.evaluate(
            transcript = "오늘 날씨 좋아",
            triggerPhrase = "준표",
            liveSample = sample(VoiceEmbedding(listOf(1f, 0f))),
            profiles = listOf(profile("speaker-1", embedding = VoiceEmbedding(listOf(1f, 0f)))),
            directionInput = DirectionInput(
                simulatedDirection = CallerDirection.FRONT,
                simulatedConfidence = 0.88f,
            ),
        )

        assertFalse(result.event.isActionable)
        assertFalse(result.event.phraseMatched)
        assertEquals(PrototypeVoiceMatchStatus.NO_LIVE_EMBEDDING, result.match.status)
        assertTrue(result.deliveries.isEmpty())
    }

    @Test
    fun usesProvidedDirectionEstimateWhenServiceResolvedAudioDirection() {
        val result = engine.evaluate(
            transcript = "준표 여기 봐",
            triggerPhrase = "준표",
            liveSample = sample(VoiceEmbedding(listOf(1f, 0f))),
            profiles = listOf(profile("speaker-1", embedding = VoiceEmbedding(listOf(1f, 0f)))),
            directionInput = DirectionInput(
                simulatedDirection = CallerDirection.RIGHT,
                simulatedConfidence = 0.88f,
            ),
            directionEstimate = DirectionEstimate(
                direction = CallerDirection.LEFT,
                confidence = 0.77f,
                source = "stereo_pcm",
            ),
        )

        assertTrue(result.event.isActionable)
        assertEquals(CallerDirection.LEFT, result.event.direction)
        assertEquals("prototype_voice:stereo_pcm", result.event.sourceAdapter)
    }

    @Test
    fun recordsProcessingLatencyForPrototypeVoicePath() {
        val clockValues = mutableListOf(3_000L, 3_060L, 3_330L)
        val latencyEngine = PrototypeVoiceSessionEngine(
            triggerPhraseDetector = SimpleTriggerPhraseDetector(),
            voiceMatchChecker = PrototypeVoiceMatchChecker(matchThreshold = 0.80f),
            directionEstimator = SimulatedDirectionEstimator(),
            alertRouter = AlertRouter(listOf(PhoneNotificationAdapter())),
            clockMillis = { clockValues.removeAt(0) },
        )

        val result = latencyEngine.evaluate(
            transcript = "준표 여기 봐",
            triggerPhrase = "준표",
            liveSample = sample(VoiceEmbedding(listOf(1f, 0f))),
            profiles = listOf(profile("speaker-1", embedding = VoiceEmbedding(listOf(1f, 0f)))),
            directionInput = DirectionInput(
                simulatedDirection = CallerDirection.RIGHT,
                simulatedConfidence = 0.88f,
            ),
        )

        assertEquals(330L, result.event.processingLatencyMillis)
        assertEquals(3_060L, result.event.createdAtMillis)
    }

    private fun profile(id: String, embedding: VoiceEmbedding): SpeakerProfile =
        SpeakerProfile(
            id = id,
            displayName = "민지",
            consentVersion = "test",
            createdAtMillis = 1L,
            embeddingRef = VoiceEmbeddingRefCodec.encode(embedding),
            sampleCount = 3,
        )

    private fun profileWithoutEmbedding(id: String): SpeakerProfile =
        SpeakerProfile(
            id = id,
            displayName = "민지",
            consentVersion = "test",
            createdAtMillis = 1L,
            embeddingRef = "transcript-label-simulator:minji",
        )

    private fun sample(embedding: VoiceEmbedding): VoiceEnrollmentSampleResult =
        VoiceEnrollmentSampleResult(
            checkedAtMillis = 2L,
            status = VoiceEnrollmentSampleStatus.SAMPLED,
            sampleRateHz = 16_000,
            samplesRead = 1600,
            metrics = VoiceEnrollmentSampleMetrics(
                rms = 0.4f,
                peak = 0.7f,
                clippedRatio = 0f,
                durationMillis = 100,
            ),
            embedding = embedding,
            message = "sampled",
        )
}
