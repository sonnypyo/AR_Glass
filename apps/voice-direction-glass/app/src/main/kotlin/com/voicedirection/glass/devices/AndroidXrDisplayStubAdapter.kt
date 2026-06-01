package com.voicedirection.glass.devices

import android.content.Context
import androidx.xr.projected.ProjectedContext
import androidx.xr.projected.experimental.ExperimentalProjectedApi
import com.voicedirection.glass.alerts.AlertChannel
import com.voicedirection.glass.alerts.AlertDelivery
import com.voicedirection.glass.direction.DirectionCue

@OptIn(ExperimentalProjectedApi::class)
class AndroidXrDisplayStubAdapter(
    override val state: GlassesConnectionState = GlassesConnectionState.DISCONNECTED,
    private val context: Context? = null,
) : GlassesAdapter {
    override val name: String = "Android XR Projected Stub"

    override fun emitCue(cue: DirectionCue): AlertDelivery {
        val payload = GlassesCuePayload.fromCue(cue)
        val projectedDeviceContextReady = projectedDeviceContextReady()
        return AlertDelivery(
            channel = AlertChannel.ANDROID_XR_DISPLAY,
            delivered = state == GlassesConnectionState.CONNECTED && projectedDeviceContextReady,
            message = if (state == GlassesConnectionState.CONNECTED && projectedDeviceContextReady) {
                "Android XR projected cue queued; ${payload.evidenceSummary}"
            } else if (state == GlassesConnectionState.CONNECTED) {
                "Android XR projected context unavailable; cue kept on phone"
            } else {
                "Android XR projected device not connected; cue kept on phone"
            },
        )
    }

    private fun projectedDeviceContextReady(): Boolean {
        val hostContext = context ?: return state == GlassesConnectionState.CONNECTED
        return runCatching {
            val projectedContext = ProjectedContext.createProjectedDeviceContext(hostContext)
            ProjectedContext.isProjectedDeviceContext(projectedContext)
        }.getOrDefault(false)
    }
}
