package com.voicedirection.glass.model

import kotlin.math.sqrt

data class VoiceEmbedding(
    val values: List<Float>,
) {
    init {
        require(values.isNotEmpty()) { "Voice embedding must not be empty" }
    }

    fun cosineSimilarity(other: VoiceEmbedding): Float {
        if (values.size != other.values.size) return 0f

        var dot = 0.0
        var leftMagnitude = 0.0
        var rightMagnitude = 0.0
        values.indices.forEach { index ->
            val left = values[index].toDouble()
            val right = other.values[index].toDouble()
            dot += left * right
            leftMagnitude += left * left
            rightMagnitude += right * right
        }

        if (leftMagnitude == 0.0 || rightMagnitude == 0.0) return 0f
        return (dot / (sqrt(leftMagnitude) * sqrt(rightMagnitude))).toFloat()
            .coerceIn(-1f, 1f)
    }

    fun weightedAverage(
        other: VoiceEmbedding,
        thisWeight: Int,
        otherWeight: Int,
    ): VoiceEmbedding {
        if (values.size != other.values.size || thisWeight <= 0 || otherWeight <= 0) {
            return other
        }

        val totalWeight = thisWeight + otherWeight
        return VoiceEmbedding(
            values = values.indices.map { index ->
                ((values[index] * thisWeight) + (other.values[index] * otherWeight)) / totalWeight
            },
        )
    }
}

object VoiceEmbeddingRefCodec {
    private const val PREFIX = "embedding:v1:"

    fun encode(embedding: VoiceEmbedding): String =
        PREFIX + embedding.values.joinToString(separator = ",") { value ->
            value.toString()
        }

    fun decode(ref: String): VoiceEmbedding? {
        if (!ref.startsWith(PREFIX)) return null
        val values = ref.removePrefix(PREFIX)
            .split(",")
            .map { value -> value.toFloatOrNull() ?: return null }
            .takeIf { it.isNotEmpty() }
            ?: return null

        return runCatching { VoiceEmbedding(values) }.getOrNull()
    }
}
