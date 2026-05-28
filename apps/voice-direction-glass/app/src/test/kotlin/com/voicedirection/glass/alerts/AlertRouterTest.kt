package com.voicedirection.glass.alerts

import com.voicedirection.glass.direction.DirectionCue
import com.voicedirection.glass.model.CallerDirection
import org.junit.Assert.assertEquals
import org.junit.Test

class AlertRouterTest {
    @Test
    fun emitsOnlyEnabledChannels() {
        val router = AlertRouter(
            adapters = listOf(
                RecordingAlertAdapter(AlertChannel.PHONE_NOTIFICATION),
                RecordingAlertAdapter(AlertChannel.PHONE_VIBRATION),
                RecordingAlertAdapter(AlertChannel.TTS),
            ),
            enabledChannels = { setOf(AlertChannel.PHONE_NOTIFICATION, AlertChannel.TTS) },
        )

        val deliveries = router.emit(
            DirectionCue(
                title = "민지 호출 감지",
                body = "오른쪽",
                direction = CallerDirection.RIGHT,
                confidence = 0.8f,
            ),
        )

        assertEquals(
            listOf(AlertChannel.PHONE_NOTIFICATION, AlertChannel.TTS),
            deliveries.map { delivery -> delivery.channel },
        )
    }

    private class RecordingAlertAdapter(
        override val channel: AlertChannel,
    ) : AlertOutputAdapter {
        override fun emit(cue: DirectionCue): AlertDelivery =
            AlertDelivery(channel = channel, delivered = true, message = cue.body)
    }
}
