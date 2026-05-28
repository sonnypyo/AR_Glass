package com.voicedirection.glass.enrollment

import com.voicedirection.glass.model.VoiceEmbedding
import kotlin.math.abs
import kotlin.math.sqrt

class PrototypeVoiceEmbeddingExtractor {
    fun extract(samples: ShortArray, readCount: Int, sampleRateHz: Int): VoiceEmbedding? {
        if (readCount <= 1 || sampleRateHz <= 0) return null

        val boundedReadCount = minOf(readCount, samples.size)
        var sum = 0.0
        var sumAbs = 0.0
        var sumSquares = 0.0
        var peak = 0f
        var zeroCrossings = 0
        var deltaAbs = 0.0
        var positiveCount = 0
        var previous = samples[0].toInt()
        val segmentEnergy = DoubleArray(SEGMENT_COUNT)

        for (index in 0 until boundedReadCount) {
            val raw = samples[index].toInt()
            val normalized = raw.toDouble() / Short.MAX_VALUE.toDouble()
            val absValue = abs(normalized)
            val segmentIndex = (index * SEGMENT_COUNT / boundedReadCount).coerceIn(0, SEGMENT_COUNT - 1)

            sum += normalized
            sumAbs += absValue
            sumSquares += normalized * normalized
            segmentEnergy[segmentIndex] += normalized * normalized
            if (absValue > peak) {
                peak = absValue.toFloat()
            }
            if (raw > 0) {
                positiveCount += 1
            }
            if (index > 0) {
                if ((raw >= 0 && previous < 0) || (raw < 0 && previous >= 0)) {
                    zeroCrossings += 1
                }
                deltaAbs += abs(raw - previous).toDouble() / Short.MAX_VALUE.toDouble()
            }
            previous = raw
        }

        val rms = sqrt(sumSquares / boundedReadCount)
        val mean = sum / boundedReadCount
        val meanAbs = sumAbs / boundedReadCount
        val zeroCrossingRate = zeroCrossings.toDouble() / (boundedReadCount - 1).toDouble()
        val meanDelta = deltaAbs / (boundedReadCount - 1).toDouble()
        val positiveRatio = positiveCount.toDouble() / boundedReadCount.toDouble()
        val totalEnergy = segmentEnergy.sum().takeIf { it > 0.0 } ?: 1.0

        return VoiceEmbedding(
            values = listOf(
                rms.toFloat(),
                mean.toFloat(),
                meanAbs.toFloat(),
                peak,
                zeroCrossingRate.toFloat(),
                meanDelta.toFloat(),
                positiveRatio.toFloat(),
                (segmentEnergy[0] / totalEnergy).toFloat(),
                (segmentEnergy[1] / totalEnergy).toFloat(),
                (segmentEnergy[2] / totalEnergy).toFloat(),
                (segmentEnergy[3] / totalEnergy).toFloat(),
            ),
        )
    }

    companion object {
        private const val SEGMENT_COUNT = 4
    }
}
