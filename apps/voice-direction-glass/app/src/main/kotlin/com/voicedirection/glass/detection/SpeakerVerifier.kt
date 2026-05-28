package com.voicedirection.glass.detection

import com.voicedirection.glass.model.SpeakerMatch
import com.voicedirection.glass.model.SpeakerProfile
import com.voicedirection.glass.model.VoiceEmbedding
import com.voicedirection.glass.model.VoiceEmbeddingRefCodec

data class SpeakerVerificationInput(
    val transcript: String,
    val liveEmbedding: VoiceEmbedding? = null,
)

interface SpeakerVerifier {
    fun match(input: SpeakerVerificationInput, profiles: List<SpeakerProfile>): SpeakerMatch
}

class SimulatedSpeakerVerifier : SpeakerVerifier {
    override fun match(input: SpeakerVerificationInput, profiles: List<SpeakerProfile>): SpeakerMatch {
        val normalized = input.transcript.lowercase()
        val simulationProfiles = profiles.filter { it.canUseTranscriptSimulation }
        val profile = simulationProfiles.firstOrNull { profile ->
            normalized.contains(profile.displayName.lowercase())
        } ?: simulationProfiles.firstOrNull()

        return if (profile == null) {
            SpeakerMatch.unknown()
        } else {
            SpeakerMatch(profile = profile, confidence = 0.84f)
        }
    }
}

class EmbeddingSpeakerVerifier(
    private val trustedThreshold: Float = SpeakerMatch.TRUSTED_THRESHOLD,
) : SpeakerVerifier {
    override fun match(input: SpeakerVerificationInput, profiles: List<SpeakerProfile>): SpeakerMatch {
        val liveEmbedding = input.liveEmbedding ?: return SpeakerMatch.unknown()
        val bestMatch = profiles.asSequence()
            .filter { it.hasRealVoiceModel }
            .mapNotNull { profile ->
                val enrolledEmbedding = VoiceEmbeddingRefCodec.decode(profile.embeddingRef) ?: return@mapNotNull null
                profile to liveEmbedding.cosineSimilarity(enrolledEmbedding)
            }
            .maxByOrNull { (_, similarity) -> similarity }
            ?: return SpeakerMatch.unknown()

        val (profile, similarity) = bestMatch
        return if (similarity >= trustedThreshold) {
            SpeakerMatch(profile = profile, confidence = similarity.coerceIn(0f, 1f))
        } else {
            SpeakerMatch.unknown()
        }
    }
}
