package com.voicedirection.glass.model

data class DirectionValidationTrial(
    val id: String,
    val expectedDirection: CallerDirection,
    val observedDirection: CallerDirection,
    val confidence: Float,
    val status: DirectionValidationStatus,
    val sampleRateHz: Int?,
    val samplesRead: Int,
    val source: String,
    val createdAtMillis: Long,
) {
    val matched: Boolean =
        status == DirectionValidationStatus.SAMPLED &&
            expectedDirection != CallerDirection.UNKNOWN &&
            observedDirection == expectedDirection

    val unknownOrUnusable: Boolean =
        status != DirectionValidationStatus.SAMPLED ||
            expectedDirection == CallerDirection.UNKNOWN ||
            observedDirection == CallerDirection.UNKNOWN

    val mismatched: Boolean =
        status == DirectionValidationStatus.SAMPLED &&
            expectedDirection != CallerDirection.UNKNOWN &&
            observedDirection != CallerDirection.UNKNOWN &&
            observedDirection != expectedDirection
}

enum class DirectionValidationStatus {
    SAMPLED,
    NO_PERMISSION,
    NO_STEREO_INPUT,
    RECORDER_UNAVAILABLE,
    READ_FAILED,
    ERROR,
}

data class DirectionValidationSummary(
    val total: Int,
    val matched: Int,
    val mismatched: Int,
    val unknownOrUnusable: Int,
    val front: DirectionValidationDirectionStats,
    val back: DirectionValidationDirectionStats,
    val left: DirectionValidationDirectionStats,
    val right: DirectionValidationDirectionStats,
    val frontTrials: Int,
    val backTrials: Int,
    val leftTrials: Int,
    val rightTrials: Int,
) {
    val matchRate: Float =
        if (total == 0) 0f else matched.toFloat() / total.toFloat()

    val requiredTrialsPerDirection: Int =
        DirectionValidationSummarizer.CONTROLLED_TRIALS_PER_DIRECTION

    val requiredTotalTrials: Int =
        requiredTrialsPerDirection * 4

    val missingFrontTrials: Int =
        missingTrialsFor(front)

    val missingBackTrials: Int =
        missingTrialsFor(back)

    val missingLeftTrials: Int =
        missingTrialsFor(left)

    val missingRightTrials: Int =
        missingTrialsFor(right)

    val missingTotalTrials: Int =
        missingFrontTrials + missingBackTrials + missingLeftTrials + missingRightTrials

    val controlledTrialTargetComplete: Boolean =
        missingTotalTrials == 0

    private fun missingTrialsFor(stats: DirectionValidationDirectionStats): Int =
        (requiredTrialsPerDirection - stats.total).coerceAtLeast(0)

    fun statsFor(direction: CallerDirection): DirectionValidationDirectionStats =
        when (direction) {
            CallerDirection.FRONT -> front
            CallerDirection.BACK -> back
            CallerDirection.LEFT -> left
            CallerDirection.RIGHT -> right
            CallerDirection.UNKNOWN -> DirectionValidationDirectionStats(CallerDirection.UNKNOWN, 0, 0, 0, 0)
        }
}

data class DirectionValidationDirectionStats(
    val direction: CallerDirection,
    val total: Int,
    val matched: Int,
    val mismatched: Int,
    val unknownOrUnusable: Int,
) {
    val matchRate: Float =
        if (total == 0) 0f else matched.toFloat() / total.toFloat()
}

object DirectionValidationSummarizer {
    const val CONTROLLED_TRIALS_PER_DIRECTION: Int = 20

    fun summarize(trials: List<DirectionValidationTrial>): DirectionValidationSummary {
        val front = statsFor(trials, CallerDirection.FRONT)
        val back = statsFor(trials, CallerDirection.BACK)
        val left = statsFor(trials, CallerDirection.LEFT)
        val right = statsFor(trials, CallerDirection.RIGHT)
        return DirectionValidationSummary(
            total = trials.size,
            matched = trials.count { trial -> trial.matched },
            mismatched = trials.count { trial -> trial.mismatched },
            unknownOrUnusable = trials.count { trial -> trial.unknownOrUnusable },
            front = front,
            back = back,
            left = left,
            right = right,
            frontTrials = front.total,
            backTrials = back.total,
            leftTrials = left.total,
            rightTrials = right.total,
        )
    }

    private fun statsFor(
        trials: List<DirectionValidationTrial>,
        direction: CallerDirection,
    ): DirectionValidationDirectionStats {
        val directionTrials = trials.filter { trial -> trial.expectedDirection == direction }
        return DirectionValidationDirectionStats(
            direction = direction,
            total = directionTrials.size,
            matched = directionTrials.count { trial -> trial.matched },
            mismatched = directionTrials.count { trial -> trial.mismatched },
            unknownOrUnusable = directionTrials.count { trial -> trial.unknownOrUnusable },
        )
    }
}
