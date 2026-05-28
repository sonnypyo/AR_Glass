package com.voicedirection.glass.devices

import com.voicedirection.glass.alerts.AlertDelivery
import com.voicedirection.glass.direction.DirectionCue

interface GlassesAdapter {
    val name: String
    val state: GlassesConnectionState
    fun emitCue(cue: DirectionCue): AlertDelivery
}
