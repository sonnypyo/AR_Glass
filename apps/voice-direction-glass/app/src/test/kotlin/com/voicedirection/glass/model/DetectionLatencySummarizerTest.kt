package com.voicedirection.glass.model

import org.junit.Assert.assertEquals
import org.junit.Test

class DetectionLatencySummarizerTest {
    @Test
    fun summarizesOnlyEventsWithLatency() {
        val summary = DetectionLatencySummarizer.summarize(
            events = listOf(
                event("latest", latency = 420L),
                event("slow", latency = 1_800L),
                event("legacy", latency = null),
            ),
        )

        assertEquals(3, summary.totalEvents)
        assertEquals(2, summary.eventsWithLatency)
        assertEquals(420L, summary.latestLatencyMillis)
        assertEquals(1_110L, summary.averageLatencyMillis)
        assertEquals(1, summary.overTargetCount)
    }

    @Test
    fun returnsEmptySummaryWhenNoLatencyExists() {
        val summary = DetectionLatencySummarizer.summarize(
            events = listOf(event("legacy", latency = null)),
        )

        assertEquals(1, summary.totalEvents)
        assertEquals(0, summary.eventsWithLatency)
        assertEquals(null, summary.latestLatencyMillis)
        assertEquals(null, summary.averageLatencyMillis)
        assertEquals(0, summary.overTargetCount)
        assertEquals(0f, summary.targetMetRate)
    }

    private fun event(id: String, latency: Long?): DetectionEvent =
        DetectionEvent(
            id = id,
            speakerProfileId = "speaker-1",
            speakerLabel = "민지",
            phraseMatched = true,
            speakerConfidence = 0.9f,
            direction = CallerDirection.LEFT,
            directionConfidence = 0.8f,
            sourceAdapter = "test",
            createdAtMillis = 1L,
            processingLatencyMillis = latency,
        )
}
