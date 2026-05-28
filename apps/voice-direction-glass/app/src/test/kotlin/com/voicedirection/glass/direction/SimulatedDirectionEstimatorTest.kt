package com.voicedirection.glass.direction

import com.voicedirection.glass.model.CallerDirection
import org.junit.Assert.assertEquals
import org.junit.Test

class SimulatedDirectionEstimatorTest {
    private val estimator = SimulatedDirectionEstimator()

    @Test
    fun returnsDirectionWhenConfidenceIsUseful() {
        val estimate = estimator.estimate(
            DirectionInput(
                simulatedDirection = CallerDirection.RIGHT,
                simulatedConfidence = 0.82f,
            ),
        )

        assertEquals(CallerDirection.RIGHT, estimate.direction)
    }

    @Test
    fun returnsUnknownWhenConfidenceIsLow() {
        val estimate = estimator.estimate(
            DirectionInput(
                simulatedDirection = CallerDirection.LEFT,
                simulatedConfidence = 0.20f,
            ),
        )

        assertEquals(CallerDirection.UNKNOWN, estimate.direction)
    }
}
