package com.voicedirection.glass.direction

import com.voicedirection.glass.model.CallerDirection
import kotlin.math.abs

data class StereoPcmFrame(
    val samples: ShortArray,
    val channelCount: Int,
    val sampleRateHz: Int,
)

class StereoPcmDirectionEstimator(
    private val balanceThreshold: Double = 0.12,
) {
    fun estimate(frame: StereoPcmFrame): DirectionEstimate {
        if (frame.channelCount < REQUIRED_CHANNELS || frame.samples.size < frame.channelCount) {
            return unknown("stereo-pcm:insufficient")
        }

        var leftEnergy = 0.0
        var rightEnergy = 0.0
        var frameCount = 0
        var sampleIndex = 0

        while (sampleIndex + 1 < frame.samples.size) {
            val left = frame.samples[sampleIndex].toDouble()
            val right = frame.samples[sampleIndex + 1].toDouble()
            leftEnergy += left * left
            rightEnergy += right * right
            frameCount += 1
            sampleIndex += frame.channelCount
        }

        if (frameCount == 0 || leftEnergy + rightEnergy <= 0.0) {
            return unknown("stereo-pcm:silence")
        }

        val balance = (rightEnergy - leftEnergy) / (rightEnergy + leftEnergy)
        val confidence = abs(balance).coerceIn(0.0, 1.0).toFloat()
        if (confidence < balanceThreshold) {
            return DirectionEstimate(
                direction = CallerDirection.UNKNOWN,
                confidence = confidence,
                source = "stereo-pcm:balanced",
            )
        }

        return DirectionEstimate(
            direction = if (balance > 0.0) CallerDirection.RIGHT else CallerDirection.LEFT,
            confidence = confidence,
            source = "stereo-pcm:energy-balance",
        )
    }

    private fun unknown(source: String): DirectionEstimate =
        DirectionEstimate(
            direction = CallerDirection.UNKNOWN,
            confidence = 0f,
            source = source,
        )

    companion object {
        private const val REQUIRED_CHANNELS = 2
    }
}
