package com.voicedirection.glass.direction

import com.voicedirection.glass.model.CallerDirection

data class DirectionEstimate(
    val direction: CallerDirection,
    val confidence: Float,
    val source: String,
)

interface DirectionEstimator {
    fun estimate(input: DirectionInput): DirectionEstimate
}

data class DirectionInput(
    val simulatedDirection: CallerDirection,
    val simulatedConfidence: Float,
)
