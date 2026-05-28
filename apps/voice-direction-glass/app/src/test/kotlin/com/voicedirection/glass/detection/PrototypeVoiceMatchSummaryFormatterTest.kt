package com.voicedirection.glass.detection

import org.junit.Assert.assertTrue
import org.junit.Test

class PrototypeVoiceMatchSummaryFormatterTest {
    @Test
    fun formatsMissingEmbedding() {
        val summary = PrototypeVoiceMatchSummaryFormatter.format(
            PrototypeVoiceMatchResult(
                status = PrototypeVoiceMatchStatus.NO_ENROLLED_EMBEDDING,
                profile = null,
                similarity = 0f,
            ),
        )

        assertTrue(summary.contains("embedding reference"))
    }
}
