package com.voicedirection.glass.model

import org.junit.Assert.assertEquals
import org.junit.Test

class DetectionFeedbackSummarizerTest {
    @Test
    fun countsFeedbackTypesForFalsePositiveRuns() {
        val summary = DetectionFeedbackSummarizer.summarize(
            listOf(
                DetectionFeedback("event-1", DetectionFeedbackType.CORRECT, 10L),
                DetectionFeedback("event-2", DetectionFeedbackType.FALSE_POSITIVE, 11L),
                DetectionFeedback("event-3", DetectionFeedbackType.WRONG_DIRECTION, 12L),
                DetectionFeedback("event-4", DetectionFeedbackType.WRONG_SPEAKER, 13L),
                DetectionFeedback("event-5", DetectionFeedbackType.FALSE_POSITIVE, 14L),
            ),
        )

        assertEquals(5, summary.total)
        assertEquals(1, summary.correct)
        assertEquals(2, summary.falsePositive)
        assertEquals(1, summary.wrongDirection)
        assertEquals(1, summary.wrongSpeaker)
    }

    @Test
    fun summarizesFeedbackInsideFalsePositiveRunWindow() {
        val run = FalsePositiveRun(
            id = "run-1",
            startedAtMillis = 100L,
            targetDurationMillis = 1_000L,
            endedAtMillis = 900L,
        )

        val summary = FalsePositiveRunSummarizer.summarize(
            run = run,
            feedback = listOf(
                DetectionFeedback("before", DetectionFeedbackType.FALSE_POSITIVE, 99L),
                DetectionFeedback("inside-1", DetectionFeedbackType.FALSE_POSITIVE, 200L),
                DetectionFeedback("inside-2", DetectionFeedbackType.WRONG_DIRECTION, 300L),
                DetectionFeedback("after", DetectionFeedbackType.FALSE_POSITIVE, 901L),
            ),
            nowMillis = 1_100L,
        )

        assertEquals(800L, summary.elapsedMillis)
        assertEquals(false, summary.targetReached)
        assertEquals(2, summary.feedbackSummary.total)
        assertEquals(1, summary.feedbackSummary.falsePositive)
        assertEquals(1, summary.feedbackSummary.wrongDirection)
        assertEquals(FalsePositiveRunVerdict.FAIL_DURATION, summary.verdict)
    }

    @Test
    fun passesWhenRunReachedTargetWithoutNegativeFeedback() {
        val summary = FalsePositiveRunSummarizer.summarize(
            run = FalsePositiveRun(
                id = "run-1",
                startedAtMillis = 0L,
                targetDurationMillis = 1_000L,
                endedAtMillis = 1_000L,
            ),
            feedback = listOf(
                DetectionFeedback("event-1", DetectionFeedbackType.CORRECT, 500L),
            ),
            nowMillis = 1_000L,
        )

        assertEquals(true, summary.targetReached)
        assertEquals(FalsePositiveRunVerdict.PASS, summary.verdict)
        assertEquals(0f, summary.falsePositiveRatePerHour)
    }

    @Test
    fun failsReachedRunWhenFalsePositiveExists() {
        val summary = FalsePositiveRunSummarizer.summarize(
            run = FalsePositiveRun(
                id = "run-1",
                startedAtMillis = 0L,
                targetDurationMillis = 30L * 60L * 1000L,
                endedAtMillis = 30L * 60L * 1000L,
            ),
            feedback = listOf(
                DetectionFeedback("event-1", DetectionFeedbackType.FALSE_POSITIVE, 10L),
            ),
            nowMillis = 30L * 60L * 1000L,
        )

        assertEquals(FalsePositiveRunVerdict.FAIL_FALSE_POSITIVE, summary.verdict)
        assertEquals(2.0f, summary.falsePositiveRatePerHour)
    }
}
