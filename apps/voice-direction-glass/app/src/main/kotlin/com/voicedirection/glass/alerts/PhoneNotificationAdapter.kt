package com.voicedirection.glass.alerts

import com.voicedirection.glass.direction.DirectionCue

class PhoneNotificationAdapter : AlertOutputAdapter {
    override val channel: AlertChannel = AlertChannel.PHONE_NOTIFICATION

    override fun emit(cue: DirectionCue): AlertDelivery =
        AlertDelivery(
            channel = channel,
            delivered = true,
            message = "${cue.title}: ${cue.body}",
        )
}
