package com.voicedirection.glass.diagnostics

import android.util.Log
import com.voicedirection.glass.model.DetectionEvent

object DiagnosticsLogger {
    private const val TAG = "VoiceDirectionGlass"

    fun info(event: String, vararg details: Pair<String, Any?>) {
        Log.i(TAG, format(event, details.asIterable()))
    }

    fun warn(event: String, vararg details: Pair<String, Any?>) {
        Log.w(TAG, format(event, details.asIterable()))
    }

    fun detection(eventName: String, event: DetectionEvent, deliveryCount: Int, cueSaved: Boolean) {
        info(
            eventName,
            "actionable" to event.isActionable,
            "phraseMatched" to event.phraseMatched,
            "speakerMatched" to (event.speakerProfileId != null),
            "speakerConfidence" to confidenceBucket(event.speakerConfidence),
            "direction" to event.direction.name,
            "directionConfidence" to confidenceBucket(event.directionConfidence),
            "source" to event.sourceAdapter,
            "deliveryCount" to deliveryCount,
            "cueSaved" to cueSaved,
            "processingLatencyMillis" to (event.processingLatencyMillis ?: -1L),
            "latencyTargetMet" to (event.processingLatencyMillis?.let { latency -> latency <= 1_500L } ?: false),
        )
    }

    fun confidenceBucket(confidence: Float): String =
        when {
            confidence >= 0.85f -> "high"
            confidence >= 0.70f -> "medium"
            confidence > 0f -> "low"
            else -> "none"
        }

    private fun format(event: String, details: Iterable<Pair<String, Any?>>): String {
        val payload = details.joinToString(separator = " ") { (key, value) ->
            "$key=${sanitize(value)}"
        }
        return if (payload.isBlank()) {
            "event=$event"
        } else {
            "event=$event $payload"
        }
    }

    private fun sanitize(value: Any?): String =
        when (value) {
            null -> "null"
            is Boolean, is Number -> value.toString()
            is Enum<*> -> value.name
            else -> value.toString()
                .replace(Regex("[^A-Za-z0-9._:-]"), "_")
                .take(80)
        }
}
