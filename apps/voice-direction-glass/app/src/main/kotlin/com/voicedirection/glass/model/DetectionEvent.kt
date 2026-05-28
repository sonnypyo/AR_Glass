package com.voicedirection.glass.model

data class DetectionEvent(
    val id: String,
    val speakerProfileId: String?,
    val speakerLabel: String?,
    val phraseMatched: Boolean,
    val speakerConfidence: Float,
    val direction: CallerDirection,
    val directionConfidence: Float,
    val sourceAdapter: String,
    val createdAtMillis: Long,
    val processingLatencyMillis: Long? = null,
) {
    val isActionable: Boolean
        get() = phraseMatched && speakerProfileId != null && speakerConfidence >= 0.70f
}

data class DetectionLatencySummary(
    val totalEvents: Int,
    val eventsWithLatency: Int,
    val latestLatencyMillis: Long?,
    val averageLatencyMillis: Long?,
    val overTargetCount: Int,
    val targetMillis: Long,
) {
    val targetMetRate: Float
        get() = if (eventsWithLatency == 0) {
            0f
        } else {
            (eventsWithLatency - overTargetCount).toFloat() / eventsWithLatency.toFloat()
        }
}

object DetectionLatencySummarizer {
    const val DEFAULT_TARGET_MILLIS: Long = 1_500L

    fun summarize(
        events: List<DetectionEvent>,
        targetMillis: Long = DEFAULT_TARGET_MILLIS,
    ): DetectionLatencySummary {
        val latencies = events.mapNotNull { event ->
            event.processingLatencyMillis?.takeIf { latency -> latency >= 0L }
        }
        val latest = events.firstNotNullOfOrNull { event ->
            event.processingLatencyMillis?.takeIf { latency -> latency >= 0L }
        }
        return DetectionLatencySummary(
            totalEvents = events.size,
            eventsWithLatency = latencies.size,
            latestLatencyMillis = latest,
            averageLatencyMillis = if (latencies.isEmpty()) null else latencies.sum() / latencies.size,
            overTargetCount = latencies.count { latency -> latency > targetMillis },
            targetMillis = targetMillis,
        )
    }
}
