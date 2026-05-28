package com.voicedirection.glass.detection

import com.voicedirection.glass.model.SpeakerEnrollmentStatus
import com.voicedirection.glass.model.SpeakerProfile
import com.voicedirection.glass.model.SpeakerVerificationMode
import com.voicedirection.glass.model.VoiceEmbedding
import com.voicedirection.glass.model.VoiceEmbeddingRefCodec
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class EmbeddingSpeakerVerifierTest {
    private val verifier = EmbeddingSpeakerVerifier(trustedThreshold = 0.80f)

    @Test
    fun matchesModelReadyProfileByCosineSimilarity() {
        val profile = profileWithEmbedding("speaker-1", VoiceEmbedding(listOf(0.1f, 0.9f, 0.2f)))

        val match = verifier.match(
            input = SpeakerVerificationInput(
                transcript = "",
                liveEmbedding = VoiceEmbedding(listOf(0.1f, 0.88f, 0.21f)),
            ),
            profiles = listOf(profile),
        )

        assertEquals(profile, match.profile)
        assertTrue(match.confidence >= 0.80f)
    }

    @Test
    fun rejectsWhenLiveEmbeddingIsMissing() {
        val profile = profileWithEmbedding("speaker-1", VoiceEmbedding(listOf(1f, 0f, 0f)))

        val match = verifier.match(
            input = SpeakerVerificationInput(transcript = "민지가 준표 하고 불렀어"),
            profiles = listOf(profile),
        )

        assertNull(match.profile)
        assertEquals(0f, match.confidence)
    }

    @Test
    fun ignoresProfilesThatAreNotModelReady() {
        val profile = SpeakerProfile(
            id = "speaker-1",
            displayName = "민지",
            consentVersion = "test-v1",
            createdAtMillis = 10L,
            embeddingRef = VoiceEmbeddingRefCodec.encode(VoiceEmbedding(listOf(1f, 0f, 0f))),
            verificationMode = SpeakerVerificationMode.ON_DEVICE_EMBEDDING,
            enrollmentStatus = SpeakerEnrollmentStatus.SAMPLES_CAPTURED_MODEL_PENDING,
            sampleCount = 3,
        )

        val match = verifier.match(
            input = SpeakerVerificationInput(
                transcript = "",
                liveEmbedding = VoiceEmbedding(listOf(1f, 0f, 0f)),
            ),
            profiles = listOf(profile),
        )

        assertNull(match.profile)
    }

    @Test
    fun rejectsLowSimilarity() {
        val profile = profileWithEmbedding("speaker-1", VoiceEmbedding(listOf(1f, 0f, 0f)))

        val match = verifier.match(
            input = SpeakerVerificationInput(
                transcript = "",
                liveEmbedding = VoiceEmbedding(listOf(0f, 1f, 0f)),
            ),
            profiles = listOf(profile),
        )

        assertNull(match.profile)
        assertEquals(0f, match.confidence)
    }

    private fun profileWithEmbedding(id: String, embedding: VoiceEmbedding): SpeakerProfile =
        SpeakerProfile(
            id = id,
            displayName = "민지",
            consentVersion = "test-v1",
            createdAtMillis = 10L,
            embeddingRef = VoiceEmbeddingRefCodec.encode(embedding),
            verificationMode = SpeakerVerificationMode.ON_DEVICE_EMBEDDING,
            enrollmentStatus = SpeakerEnrollmentStatus.MODEL_READY,
            sampleCount = 3,
        )
}
