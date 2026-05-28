package com.voicedirection.glass.model

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

class VoiceEmbeddingTest {
    @Test
    fun roundTripsEmbeddingRef() {
        val embedding = VoiceEmbedding(listOf(0.1f, 0.2f, 0.3f))

        val decoded = VoiceEmbeddingRefCodec.decode(VoiceEmbeddingRefCodec.encode(embedding))

        assertEquals(embedding, decoded)
    }

    @Test
    fun cosineSimilarityReturnsOneForSameVector() {
        val embedding = VoiceEmbedding(listOf(0.1f, 0.2f, 0.3f))

        assertEquals(1f, embedding.cosineSimilarity(embedding), 0.0001f)
    }

    @Test
    fun weightedAverageCombinesSameSizedVectors() {
        val first = VoiceEmbedding(listOf(0f, 1f))
        val second = VoiceEmbedding(listOf(1f, 0f))

        val averaged = first.weightedAverage(second, thisWeight = 3, otherWeight = 1)

        assertEquals(VoiceEmbedding(listOf(0.25f, 0.75f)), averaged)
    }

    @Test
    fun decodeRejectsNonEmbeddingRefs() {
        assertNull(VoiceEmbeddingRefCodec.decode("transcript-label-simulator:minji"))
    }

    @Test
    fun decodeAcceptsValidEmbeddingRefs() {
        assertNotNull(VoiceEmbeddingRefCodec.decode("embedding:v1:0.1,0.2,0.3"))
    }
}
