package com.voicedirection.glass.alerts

import com.voicedirection.glass.model.CallerDirection

data class VibrationPatternSummary(
    val direction: CallerDirection,
    val timingsMillis: List<Long>,
) {
    val signature: String
        get() = timingsMillis.joinToString("-")

    val pulseCount: Int
        get() = timingsMillis
            .filterIndexed { index, duration -> index % 2 == 1 && duration > 0 }
            .size

    val totalDurationMillis: Long
        get() = timingsMillis.sum()

    val phoneSideSpecific: Boolean = false
}

object VibrationPatternMapper {
    fun patternFor(direction: CallerDirection): LongArray =
        when (direction) {
            CallerDirection.LEFT -> longArrayOf(0, 80, 60, 80)
            CallerDirection.RIGHT -> longArrayOf(0, 180, 80, 60)
            CallerDirection.FRONT -> longArrayOf(0, 70, 50, 70, 50, 70)
            CallerDirection.BACK -> longArrayOf(0, 220, 120, 220)
            CallerDirection.UNKNOWN -> longArrayOf(0, 120)
        }

    fun summaryFor(direction: CallerDirection): VibrationPatternSummary =
        VibrationPatternSummary(
            direction = direction,
            timingsMillis = patternFor(direction).toList(),
        )
}
