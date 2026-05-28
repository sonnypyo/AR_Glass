package com.voicedirection.glass.enrollment

import kotlin.math.abs
import kotlin.math.sqrt

class VoiceEnrollmentSampleAnalyzer(
    private val minimumRms: Float = 0.018f,
    private val minimumPeak: Float = 0.08f,
    private val maximumClippedRatio: Float = 0.04f,
) {
    fun analyze(samples: ShortArray, readCount: Int, sampleRateHz: Int): VoiceEnrollmentSampleAnalysis {
        if (readCount <= 0 || sampleRateHz <= 0) {
            return VoiceEnrollmentSampleAnalysis(
                status = VoiceEnrollmentSampleStatus.READ_FAILED,
                metrics = null,
            )
        }

        val boundedReadCount = minOf(readCount, samples.size)
        var sumSquares = 0.0
        var peak = 0f
        var clipped = 0

        for (index in 0 until boundedReadCount) {
            val normalized = abs(samples[index].toFloat() / Short.MAX_VALUE.toFloat())
            sumSquares += normalized * normalized
            if (normalized > peak) {
                peak = normalized
            }
            if (normalized >= CLIPPING_THRESHOLD) {
                clipped += 1
            }
        }

        val rms = sqrt(sumSquares / boundedReadCount).toFloat()
        val clippedRatio = clipped.toFloat() / boundedReadCount.toFloat()
        val metrics = VoiceEnrollmentSampleMetrics(
            rms = rms,
            peak = peak,
            clippedRatio = clippedRatio,
            durationMillis = boundedReadCount * MILLIS_PER_SECOND / sampleRateHz,
        )

        val status = when {
            clippedRatio > maximumClippedRatio -> VoiceEnrollmentSampleStatus.CLIPPED
            rms < minimumRms || peak < minimumPeak -> VoiceEnrollmentSampleStatus.TOO_QUIET
            else -> VoiceEnrollmentSampleStatus.SAMPLED
        }

        return VoiceEnrollmentSampleAnalysis(status = status, metrics = metrics)
    }

    companion object {
        private const val CLIPPING_THRESHOLD = 0.98f
        private const val MILLIS_PER_SECOND = 1000
    }
}

data class VoiceEnrollmentSampleAnalysis(
    val status: VoiceEnrollmentSampleStatus,
    val metrics: VoiceEnrollmentSampleMetrics?,
)
