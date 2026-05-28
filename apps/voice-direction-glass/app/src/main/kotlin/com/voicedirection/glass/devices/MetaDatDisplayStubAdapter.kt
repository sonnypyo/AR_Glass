package com.voicedirection.glass.devices

import com.voicedirection.glass.alerts.AlertChannel
import com.voicedirection.glass.alerts.AlertDelivery
import com.voicedirection.glass.direction.DirectionCue

class MetaDatDisplayStubAdapter(
    override val state: GlassesConnectionState = GlassesConnectionState.DISCONNECTED,
) : GlassesAdapter {
    override val name: String = "Meta DAT Display Stub"

    override fun emitCue(cue: DirectionCue): AlertDelivery {
        val payload = GlassesCuePayload.fromCue(cue)
        return AlertDelivery(
            channel = AlertChannel.META_DISPLAY,
            delivered = state == GlassesConnectionState.CONNECTED,
            message = if (state == GlassesConnectionState.CONNECTED) {
                "Meta display cue queued; ${payload.evidenceSummary}"
            } else {
                "Meta DAT not connected; cue kept on phone"
            },
        )
    }
}
