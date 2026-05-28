package com.voicedirection.glass.detection

import com.voicedirection.glass.model.SpeakerProfile
import com.voicedirection.glass.model.VoiceEmbedding
import com.voicedirection.glass.model.VoiceEmbeddingRefCodec
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class PrototypeVoiceMatchCheckerTest {
    private val checker = PrototypeVoiceMatchChecker(matchThreshold = 0.80f)

    @Test
    fun matchesTargetProfileWithStoredPrototypeEmbedding() {
        val profile = profile("speaker-1", VoiceEmbedding(listOf(0.2f, 0.8f, 0.1f)))

        val result = checker.check(
            liveEmbedding = VoiceEmbedding(listOf(0.21f, 0.79f, 0.1f)),
            profiles = listOf(profile),
            targetProfileId = "speaker-1",
        )

        assertEquals(PrototypeVoiceMatchStatus.MATCHED, result.status)
        assertEquals(profile, result.profile)
    }

    @Test
    fun rejectsWhenTargetHasNoEmbeddingRef() {
        val profile = profile("speaker-1", null)

        val result = checker.check(
            liveEmbedding = VoiceEmbedding(listOf(0.21f, 0.79f, 0.1f)),
            profiles = listOf(profile),
            targetProfileId = "speaker-1",
        )

        assertEquals(PrototypeVoiceMatchStatus.NO_ENROLLED_EMBEDDING, result.status)
        assertNull(result.profile)
    }

    @Test
    fun rejectsLowSimilarity() {
        val profile = profile("speaker-1", VoiceEmbedding(listOf(1f, 0f, 0f)))

        val result = checker.check(
            liveEmbedding = VoiceEmbedding(listOf(0f, 1f, 0f)),
            profiles = listOf(profile),
            targetProfileId = "speaker-1",
        )

        assertEquals(PrototypeVoiceMatchStatus.LOW_CONFIDENCE, result.status)
    }

    @Test
    fun rejectsMissingLiveEmbedding() {
        val profile = profile("speaker-1", VoiceEmbedding(listOf(1f, 0f, 0f)))

        val result = checker.check(
            liveEmbedding = null,
            profiles = listOf(profile),
            targetProfileId = "speaker-1",
        )

        assertEquals(PrototypeVoiceMatchStatus.NO_LIVE_EMBEDDING, result.status)
    }

    private fun profile(id: String, embedding: VoiceEmbedding?): SpeakerProfile =
        SpeakerProfile(
            id = id,
            displayName = "민지",
            consentVersion = "test-v1",
            createdAtMillis = 10L,
            embeddingRef = embedding?.let(VoiceEmbeddingRefCodec::encode).orEmpty(),
            sampleCount = if (embedding == null) 0 else 1,
        )
}
