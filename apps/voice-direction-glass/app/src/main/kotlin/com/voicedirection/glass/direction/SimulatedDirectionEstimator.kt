package com.voicedirection.glass.direction

import com.voicedirection.glass.model.CallerDirection

class SimulatedDirectionEstimator : DirectionEstimator {
    override fun estimate(input: DirectionInput): DirectionEstimate {
        val confidence = input.simulatedConfidence.coerceIn(0f, 1f)
        return DirectionEstimate(
            direction = if (confidence < 0.35f) CallerDirection.UNKNOWN else input.simulatedDirection,
            confidence = confidence,
            source = "simulator",
        )
    }
}
