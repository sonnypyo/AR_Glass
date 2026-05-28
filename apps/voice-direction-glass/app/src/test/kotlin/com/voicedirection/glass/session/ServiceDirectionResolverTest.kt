package com.voicedirection.glass.session

import com.voicedirection.glass.audio.AudioDirectionSampleResult
import com.voicedirection.glass.audio.AudioDirectionSampleStatus
import com.voicedirection.glass.audio.AudioDirectionSampler
import com.voicedirection.glass.direction.DirectionEstimate
import com.voicedirection.glass.direction.DirectionInput
import com.voicedirection.glass.direction.SimulatedDirectionEstimator
import com.voicedirection.glass.model.CallerDirection
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ServiceDirectionResolverTest {
    @Test
    fun usesSampledAudioDirectionWhenAvailable() {
        val resolver = ServiceDirectionResolver(
            audioDirectionSampler = FakeAudioDirectionSampler(
                status = AudioDirectionSampleStatus.SAMPLED,
                estimate = DirectionEstimate(
                    direction = CallerDirection.LEFT,
                    confidence = 0.78f,
                    source = "stereo_pcm",
                ),
            ),
            fallbackDirectionEstimator = SimulatedDirectionEstimator(),
        )

        val result = resolver.resolve(
            DirectionInput(
                simulatedDirection = CallerDirection.RIGHT,
                simulatedConfidence = 0.9f,
            ),
        )

        assertTrue(result.usedAudioEstimate)
        assertEquals(AudioDirectionSampleStatus.SAMPLED, result.audioStatus)
        assertEquals(CallerDirection.LEFT, result.estimate.direction)
        assertEquals("stereo_pcm", result.estimate.source)
    }

    @Test
    fun preservesSampledUnknownInsteadOfInventingFallbackDirection() {
        val resolver = ServiceDirectionResolver(
            audioDirectionSampler = FakeAudioDirectionSampler(
                status = AudioDirectionSampleStatus.SAMPLED,
                estimate = DirectionEstimate(
                    direction = CallerDirection.UNKNOWN,
                    confidence = 0.12f,
                    source = "stereo_pcm",
                ),
            ),
            fallbackDirectionEstimator = SimulatedDirectionEstimator(),
        )

        val result = resolver.resolve(
            DirectionInput(
                simulatedDirection = CallerDirection.RIGHT,
                simulatedConfidence = 0.9f,
            ),
        )

        assertTrue(result.usedAudioEstimate)
        assertEquals(CallerDirection.UNKNOWN, result.estimate.direction)
        assertEquals("stereo_pcm", result.estimate.source)
    }

    @Test
    fun fallsBackWhenStereoDirectionSampleIsUnavailable() {
        val resolver = ServiceDirectionResolver(
            audioDirectionSampler = FakeAudioDirectionSampler(
                status = AudioDirectionSampleStatus.NO_STEREO_INPUT,
                estimate = null,
            ),
            fallbackDirectionEstimator = SimulatedDirectionEstimator(),
        )

        val result = resolver.resolve(
            DirectionInput(
                simulatedDirection = CallerDirection.RIGHT,
                simulatedConfidence = 0.9f,
            ),
        )

        assertFalse(result.usedAudioEstimate)
        assertEquals(AudioDirectionSampleStatus.NO_STEREO_INPUT, result.audioStatus)
        assertEquals(CallerDirection.RIGHT, result.estimate.direction)
        assertEquals("simulator", result.estimate.source)
    }

    private class FakeAudioDirectionSampler(
        private val status: AudioDirectionSampleStatus,
        private val estimate: DirectionEstimate?,
    ) : AudioDirectionSampler {
        override fun sampleDirection(): AudioDirectionSampleResult =
            AudioDirectionSampleResult(
                checkedAtMillis = 1L,
                status = status,
                sampleRateHz = 16_000,
                minBufferSizeBytes = 1024,
                samplesRead = if (status == AudioDirectionSampleStatus.SAMPLED) 1600 else 0,
                estimate = estimate,
                message = "fake",
            )
    }
}
