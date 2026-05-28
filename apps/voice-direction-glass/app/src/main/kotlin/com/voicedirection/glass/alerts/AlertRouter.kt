package com.voicedirection.glass.alerts

import com.voicedirection.glass.direction.DirectionCue

class AlertRouter(
    private val adapters: List<AlertOutputAdapter>,
    private val enabledChannels: () -> Set<AlertChannel> = {
        adapters.map { adapter -> adapter.channel }.toSet()
    },
) {
    fun emit(cue: DirectionCue): List<AlertDelivery> {
        val activeChannels = enabledChannels()
        return adapters
            .asSequence()
            .filter { adapter -> adapter.channel in activeChannels }
            .map { adapter -> adapter.emit(cue) }
            .toList()
    }
}
