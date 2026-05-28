package com.voicedirection.glass.model

data class SpeakerMatch(
    val profile: SpeakerProfile?,
    val confidence: Float,
) {
    val isTrusted: Boolean
        get() = profile != null && confidence >= TRUSTED_THRESHOLD

    companion object {
        const val TRUSTED_THRESHOLD = 0.70f

        fun unknown(): SpeakerMatch = SpeakerMatch(profile = null, confidence = 0f)
    }
}
