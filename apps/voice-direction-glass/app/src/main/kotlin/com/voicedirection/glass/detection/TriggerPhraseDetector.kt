package com.voicedirection.glass.detection

interface TriggerPhraseDetector {
    fun matches(transcript: String, triggerPhrase: String): Boolean
}

class SimpleTriggerPhraseDetector : TriggerPhraseDetector {
    override fun matches(transcript: String, triggerPhrase: String): Boolean {
        val normalizedTranscript = transcript.normalizeForMatching()
        val normalizedTrigger = triggerPhrase.normalizeForMatching()

        return normalizedTrigger.isNotBlank() &&
            (
                normalizedTranscript.split(" ").any { token -> token == normalizedTrigger } ||
                    normalizedTranscript.contains(normalizedTrigger)
            )
    }

    private fun String.normalizeForMatching(): String =
        lowercase()
            .replace(Regex("[^a-z0-9가-힣\\s]"), " ")
            .replace(Regex("\\s+"), " ")
            .trim()
}
