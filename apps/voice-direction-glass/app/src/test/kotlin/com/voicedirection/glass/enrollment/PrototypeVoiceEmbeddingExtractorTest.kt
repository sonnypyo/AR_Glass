package com.voicedirection.glass.enrollment

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

class PrototypeVoiceEmbeddingExtractorTest {
    private val extractor = PrototypeVoiceEmbeddingExtractor()

    @Test
    fun extractsFixedWidthEmbeddingFromPcm() {
        val samples = ShortArray(1600) { index ->
            if (index % 2 == 0) 5000 else -5000
        }

        val embedding = extractor.extract(samples, samples.size, sampleRateHz = 16_000)

        assertNotNull(embedding)
        assertEquals(11, embedding?.values?.size)
    }

    @Test
    fun returnsNullForEmptyRead() {
        assertNull(extractor.extract(ShortArray(0), readCount = 0, sampleRateHz = 16_000))
    }
}
