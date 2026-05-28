package com.voicedirection.glass.alerts

import com.voicedirection.glass.direction.DirectionCue

class PhoneVibrationAdapter : AlertOutputAdapter {
    override val channel: AlertChannel = AlertChannel.PHONE_VIBRATION

    override fun emit(cue: DirectionCue): AlertDelivery {
        val summary = VibrationPatternMapper.summaryFor(cue.direction)
        return AlertDelivery(
            channel = channel,
            delivered = true,
            message = "phone vibration ${summary.direction.name} pattern ${summary.signature}",
        )
    }
}
