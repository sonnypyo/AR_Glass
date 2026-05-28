package com.voicedirection.glass.direction

import com.voicedirection.glass.model.CallerDirection
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class StereoPcmDirectionEstimatorTest {
    private val estimator = StereoPcmDirectionEstimator()

    @Test
    fun estimatesRightWhenRightChannelHasMoreEnergy() {
        val estimate = estimator.estimate(
            StereoPcmFrame(
                samples = shortArrayOf(
                    100, 900,
                    -120, -850,
                    90, 800,
                ),
                channelCount = 2,
                sampleRateHz = 16_000,
            ),
        )

        assertEquals(CallerDirection.RIGHT, estimate.direction)
        assertTrue(estimate.confidence > 0.7f)
    }

    @Test
    fun estimatesLeftWhenLeftChannelHasMoreEnergy() {
        val estimate = estimator.estimate(
            StereoPcmFrame(
                samples = shortArrayOf(
                    900, 100,
                    -850, -120,
                    800, 90,
                ),
                channelCount = 2,
                sampleRateHz = 16_000,
            ),
        )

        assertEquals(CallerDirection.LEFT, estimate.direction)
        assertTrue(estimate.confidence > 0.7f)
    }

    @Test
    fun returnsUnknownWhenChannelsAreBalanced() {
        val estimate = estimator.estimate(
            StereoPcmFrame(
                samples = shortArrayOf(
                    300, 310,
                    -320, -300,
                    290, 295,
                ),
                channelCount = 2,
                sampleRateHz = 16_000,
            ),
        )

        assertEquals(CallerDirection.UNKNOWN, estimate.direction)
    }

    @Test
    fun returnsUnknownForMonoInput() {
        val estimate = estimator.estimate(
            StereoPcmFrame(
                samples = shortArrayOf(500, -500, 400),
                channelCount = 1,
                sampleRateHz = 16_000,
            ),
        )

        assertEquals(CallerDirection.UNKNOWN, estimate.direction)
    }
}
