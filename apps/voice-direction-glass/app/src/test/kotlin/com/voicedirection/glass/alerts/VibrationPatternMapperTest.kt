package com.voicedirection.glass.alerts

import com.voicedirection.glass.model.CallerDirection
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class VibrationPatternMapperTest {
    @Test
    fun mapsRightDirectionToDistinctPattern() {
        assertArrayEquals(
            longArrayOf(0, 180, 80, 60),
            VibrationPatternMapper.patternFor(CallerDirection.RIGHT),
        )
    }

    @Test
    fun everyDirectionHasDistinctPhoneFallbackPattern() {
        val signatures = CallerDirection.entries
            .associateWith { direction -> VibrationPatternMapper.summaryFor(direction).signature }

        assertEquals(CallerDirection.entries.size, signatures.values.toSet().size)
    }

    @Test
    fun summaryReportsNonPrivateTimingShape() {
        val summary = VibrationPatternMapper.summaryFor(CallerDirection.LEFT)

        assertEquals(CallerDirection.LEFT, summary.direction)
        assertEquals("0-80-60-80", summary.signature)
        assertEquals(2, summary.pulseCount)
        assertEquals(220, summary.totalDurationMillis)
        assertFalse(summary.phoneSideSpecific)
    }

    @Test
    fun allPatternsAreShortOneShotCues() {
        CallerDirection.entries.forEach { direction ->
            val summary = VibrationPatternMapper.summaryFor(direction)

            assertTrue("${direction.name} should start immediately", summary.timingsMillis.first() == 0L)
            assertTrue("${direction.name} should stay under one second", summary.totalDurationMillis <= 600L)
            assertTrue("${direction.name} should include at least one pulse", summary.pulseCount >= 1)
        }
    }
}
