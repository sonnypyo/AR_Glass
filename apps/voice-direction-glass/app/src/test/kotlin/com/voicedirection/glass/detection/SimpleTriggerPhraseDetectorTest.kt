package com.voicedirection.glass.detection

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SimpleTriggerPhraseDetectorTest {
    private val detector = SimpleTriggerPhraseDetector()

    @Test
    fun matchesKoreanTriggerPhrase() {
        assertTrue(detector.matches("민지가 준표 하고 불렀어", "준표"))
    }

    @Test
    fun ignoresMissingPhrase() {
        assertFalse(detector.matches("다른 이야기를 하고 있어", "준표"))
    }
}
