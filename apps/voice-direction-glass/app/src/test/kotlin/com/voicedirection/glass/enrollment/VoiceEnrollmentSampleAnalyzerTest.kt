package com.voicedirection.glass.enrollment

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Test

class VoiceEnrollmentSampleAnalyzerTest {
    private val analyzer = VoiceEnrollmentSampleAnalyzer()

    @Test
    fun acceptsAudibleUnclippedSample() {
        val samples = ShortArray(1600) { index ->
            if (index % 2 == 0) 5000 else -5000
        }

        val result = analyzer.analyze(samples, samples.size, sampleRateHz = 16_000)

        assertEquals(VoiceEnrollmentSampleStatus.SAMPLED, result.status)
        assertNotNull(result.metrics)
    }

    @Test
    fun rejectsQuietSample() {
        val samples = ShortArray(1600) { 100 }

        val result = analyzer.analyze(samples, samples.size, sampleRateHz = 16_000)

        assertEquals(VoiceEnrollmentSampleStatus.TOO_QUIET, result.status)
    }

    @Test
    fun rejectsClippedSample() {
        val samples = ShortArray(1600) { Short.MAX_VALUE }

        val result = analyzer.analyze(samples, samples.size, sampleRateHz = 16_000)

        assertEquals(VoiceEnrollmentSampleStatus.CLIPPED, result.status)
    }

    @Test
    fun rejectsEmptyRead() {
        val result = analyzer.analyze(ShortArray(0), readCount = 0, sampleRateHz = 16_000)

        assertEquals(VoiceEnrollmentSampleStatus.READ_FAILED, result.status)
    }
}
