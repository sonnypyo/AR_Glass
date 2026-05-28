package com.voicedirection.glass.alerts

import com.voicedirection.glass.devices.GlassesAdapter
import com.voicedirection.glass.direction.DirectionCue

class GlassesAlertOutputAdapter(
    private val adapter: GlassesAdapter,
    override val channel: AlertChannel,
) : AlertOutputAdapter {
    override fun emit(cue: DirectionCue): AlertDelivery = adapter.emitCue(cue)
}
