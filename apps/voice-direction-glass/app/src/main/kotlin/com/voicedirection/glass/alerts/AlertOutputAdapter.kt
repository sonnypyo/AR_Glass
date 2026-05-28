package com.voicedirection.glass.alerts

import com.voicedirection.glass.direction.DirectionCue

interface AlertOutputAdapter {
    val channel: AlertChannel
    fun emit(cue: DirectionCue): AlertDelivery
}

data class AlertDelivery(
    val channel: AlertChannel,
    val delivered: Boolean,
    val message: String,
)
