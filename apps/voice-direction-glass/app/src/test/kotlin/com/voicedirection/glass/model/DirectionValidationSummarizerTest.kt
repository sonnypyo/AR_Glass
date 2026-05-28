package com.voicedirection.glass.model

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class DirectionValidationSummarizerTest {
    @Test
    fun countsMatchMismatchAndUnknownTrials() {
        val summary = DirectionValidationSummarizer.summarize(
            listOf(
                trial("1", CallerDirection.RIGHT, CallerDirection.RIGHT, DirectionValidationStatus.SAMPLED),
                trial("2", CallerDirection.LEFT, CallerDirection.RIGHT, DirectionValidationStatus.SAMPLED),
                trial("3", CallerDirection.FRONT, CallerDirection.UNKNOWN, DirectionValidationStatus.SAMPLED),
                trial("4", CallerDirection.BACK, CallerDirection.UNKNOWN, DirectionValidationStatus.NO_STEREO_INPUT),
            ),
        )

        assertEquals(4, summary.total)
        assertEquals(1, summary.matched)
        assertEquals(1, summary.mismatched)
        assertEquals(2, summary.unknownOrUnusable)
        assertEquals(1, summary.frontTrials)
        assertEquals(1, summary.backTrials)
        assertEquals(1, summary.leftTrials)
        assertEquals(1, summary.rightTrials)
        assertEquals(0, summary.front.matched)
        assertEquals(0, summary.front.mismatched)
        assertEquals(1, summary.front.unknownOrUnusable)
        assertEquals(0, summary.back.matched)
        assertEquals(0, summary.back.mismatched)
        assertEquals(1, summary.back.unknownOrUnusable)
        assertEquals(0, summary.left.matched)
        assertEquals(1, summary.left.mismatched)
        assertEquals(0, summary.left.unknownOrUnusable)
        assertEquals(1, summary.right.matched)
        assertEquals(0, summary.right.mismatched)
        assertEquals(0, summary.right.unknownOrUnusable)
        assertEquals(summary.right, summary.statsFor(CallerDirection.RIGHT))
        assertEquals(20, summary.requiredTrialsPerDirection)
        assertEquals(80, summary.requiredTotalTrials)
        assertEquals(19, summary.missingFrontTrials)
        assertEquals(19, summary.missingBackTrials)
        assertEquals(19, summary.missingLeftTrials)
        assertEquals(19, summary.missingRightTrials)
        assertEquals(76, summary.missingTotalTrials)
        assertFalse(summary.controlledTrialTargetComplete)
    }

    @Test
    fun reportsControlledDirectionTargetProgress() {
        val completeRows = CallerDirection.entries
            .filter { direction -> direction != CallerDirection.UNKNOWN }
            .flatMap { direction ->
                (1..DirectionValidationSummarizer.CONTROLLED_TRIALS_PER_DIRECTION).map { index ->
                    trial("${direction.name}-$index", direction, direction, DirectionValidationStatus.SAMPLED)
                }
            }

        val complete = DirectionValidationSummarizer.summarize(completeRows)

        assertEquals(80, complete.total)
        assertEquals(0, complete.missingTotalTrials)
        assertEquals(0, complete.missingFrontTrials)
        assertEquals(0, complete.missingBackTrials)
        assertEquals(0, complete.missingLeftTrials)
        assertEquals(0, complete.missingRightTrials)
        assertTrue(complete.controlledTrialTargetComplete)

        val incomplete = DirectionValidationSummarizer.summarize(
            completeRows.filterNot { trial -> trial.expectedDirection == CallerDirection.FRONT }.drop(1),
        )

        assertEquals(20, incomplete.missingFrontTrials)
        assertEquals(1, incomplete.missingBackTrials + incomplete.missingLeftTrials + incomplete.missingRightTrials)
        assertEquals(21, incomplete.missingTotalTrials)
        assertFalse(incomplete.controlledTrialTargetComplete)
    }

    private fun trial(
        id: String,
        expected: CallerDirection,
        observed: CallerDirection,
        status: DirectionValidationStatus,
    ): DirectionValidationTrial =
        DirectionValidationTrial(
            id = id,
            expectedDirection = expected,
            observedDirection = observed,
            confidence = 0.7f,
            status = status,
            sampleRateHz = 16_000,
            samplesRead = 400,
            source = "unit-test",
            createdAtMillis = 100L,
        )
}
