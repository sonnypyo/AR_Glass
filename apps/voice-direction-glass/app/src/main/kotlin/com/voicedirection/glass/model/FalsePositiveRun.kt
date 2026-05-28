package com.voicedirection.glass.model

data class FalsePositiveRun(
    val id: String,
    val startedAtMillis: Long,
    val targetDurationMillis: Long = DEFAULT_TARGET_DURATION_MILLIS,
    val endedAtMillis: Long? = null,
) {
    val active: Boolean = endedAtMillis == null

    fun elapsedMillis(nowMillis: Long): Long =
        ((endedAtMillis ?: nowMillis) - startedAtMillis).coerceAtLeast(0L)

    fun contains(feedback: DetectionFeedback, nowMillis: Long): Boolean {
        val end = endedAtMillis ?: nowMillis
        return feedback.createdAtMillis in startedAtMillis..end
    }

    companion object {
        const val DEFAULT_TARGET_DURATION_MILLIS = 30L * 60L * 1000L
    }
}

data class FalsePositiveRunSummary(
    val run: FalsePositiveRun?,
    val elapsedMillis: Long,
    val targetDurationMillis: Long,
    val targetReached: Boolean,
    val falsePositiveRatePerHour: Float,
    val feedbackSummary: DetectionFeedbackSummary,
) {
    val verdict: FalsePositiveRunVerdict
        get() = when {
            run == null -> FalsePositiveRunVerdict.NOT_STARTED
            run.active -> FalsePositiveRunVerdict.IN_PROGRESS
            !targetReached -> FalsePositiveRunVerdict.FAIL_DURATION
            feedbackSummary.falsePositive > 0 -> FalsePositiveRunVerdict.FAIL_FALSE_POSITIVE
            feedbackSummary.wrongSpeaker > 0 -> FalsePositiveRunVerdict.FAIL_SPEAKER
            feedbackSummary.wrongDirection > 0 -> FalsePositiveRunVerdict.FAIL_DIRECTION
            else -> FalsePositiveRunVerdict.PASS
        }
}

enum class FalsePositiveRunVerdict {
    NOT_STARTED,
    IN_PROGRESS,
    PASS,
    FAIL_DURATION,
    FAIL_FALSE_POSITIVE,
    FAIL_DIRECTION,
    FAIL_SPEAKER,
}

object FalsePositiveRunSummarizer {
    fun summarize(
        run: FalsePositiveRun?,
        feedback: List<DetectionFeedback>,
        nowMillis: Long,
    ): FalsePositiveRunSummary {
        if (run == null) {
            return FalsePositiveRunSummary(
                run = null,
                elapsedMillis = 0L,
                targetDurationMillis = FalsePositiveRun.DEFAULT_TARGET_DURATION_MILLIS,
                targetReached = false,
                falsePositiveRatePerHour = 0f,
                feedbackSummary = DetectionFeedbackSummarizer.summarize(emptyList()),
            )
        }
        val runFeedback = feedback.filter { item -> run.contains(item, nowMillis) }
        val elapsed = run.elapsedMillis(nowMillis)
        return FalsePositiveRunSummary(
            run = run,
            elapsedMillis = elapsed,
            targetDurationMillis = run.targetDurationMillis,
            targetReached = elapsed >= run.targetDurationMillis,
            falsePositiveRatePerHour = falsePositiveRatePerHour(
                falsePositiveCount = runFeedback.count { it.type == DetectionFeedbackType.FALSE_POSITIVE },
                elapsedMillis = elapsed,
            ),
            feedbackSummary = DetectionFeedbackSummarizer.summarize(runFeedback),
        )
    }

    private fun falsePositiveRatePerHour(
        falsePositiveCount: Int,
        elapsedMillis: Long,
    ): Float {
        if (elapsedMillis <= 0L) return 0f
        val hours = elapsedMillis.toFloat() / ONE_HOUR_MILLIS.toFloat()
        return falsePositiveCount / hours
    }

    private const val ONE_HOUR_MILLIS = 60L * 60L * 1000L
}
