package com.voicedirection.glass.devices

import com.voicedirection.glass.alerts.AlertChannel
import com.voicedirection.glass.alerts.AlertDelivery
import com.voicedirection.glass.direction.DirectionCue

class AndroidXrDisplayStubAdapter(
    override val state: GlassesConnectionState = GlassesConnectionState.DISCONNECTED,
) : GlassesAdapter {
    override val name: String = "Android XR Projected Stub"

    override fun emitCue(cue: DirectionCue): AlertDelivery {
        val payload = GlassesCuePayload.fromCue(cue)
        return AlertDelivery(
            channel = AlertChannel.ANDROID_XR_DISPLAY,
            delivered = state == GlassesConnectionState.CONNECTED,
            message = if (state == GlassesConnectionState.CONNECTED) {
                "Android XR projected cue queued; ${payload.evidenceSummary}"
            } else {
                "Android XR projected device not connected; cue kept on phone"
            },
        )
    }
}
