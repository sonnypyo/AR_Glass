package com.voicedirection.glass.detection

import com.voicedirection.glass.model.SpeakerProfile
import com.voicedirection.glass.model.VoiceEmbedding
import com.voicedirection.glass.model.VoiceEmbeddingRefCodec

class PrototypeVoiceMatchChecker(
    private val matchThreshold: Float = 0.80f,
) {
    fun check(
        liveEmbedding: VoiceEmbedding?,
        profiles: List<SpeakerProfile>,
        targetProfileId: String? = null,
    ): PrototypeVoiceMatchResult {
        if (liveEmbedding == null) {
            return PrototypeVoiceMatchResult(
                status = PrototypeVoiceMatchStatus.NO_LIVE_EMBEDDING,
                profile = null,
                similarity = 0f,
            )
        }

        val candidates = profiles.asSequence()
            .filter { profile -> targetProfileId == null || profile.id == targetProfileId }
            .mapNotNull { profile ->
                val enrolledEmbedding = VoiceEmbeddingRefCodec.decode(profile.embeddingRef) ?: return@mapNotNull null
                profile to liveEmbedding.cosineSimilarity(enrolledEmbedding).coerceIn(0f, 1f)
            }
            .toList()

        if (candidates.isEmpty()) {
            return PrototypeVoiceMatchResult(
                status = PrototypeVoiceMatchStatus.NO_ENROLLED_EMBEDDING,
                profile = null,
                similarity = 0f,
            )
        }

        val (profile, similarity) = candidates.maxBy { (_, score) -> score }
        return PrototypeVoiceMatchResult(
            status = if (similarity >= matchThreshold) {
                PrototypeVoiceMatchStatus.MATCHED
            } else {
                PrototypeVoiceMatchStatus.LOW_CONFIDENCE
            },
            profile = profile,
            similarity = similarity,
        )
    }
}

enum class PrototypeVoiceMatchStatus {
    MATCHED,
    LOW_CONFIDENCE,
    NO_ENROLLED_EMBEDDING,
    NO_LIVE_EMBEDDING,
}

data class PrototypeVoiceMatchResult(
    val status: PrototypeVoiceMatchStatus,
    val profile: SpeakerProfile?,
    val similarity: Float,
)
