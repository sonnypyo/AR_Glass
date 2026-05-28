package com.voicedirection.glass.devices

import com.voicedirection.glass.direction.DirectionCue
import com.voicedirection.glass.model.CallerDirection
import com.voicedirection.glass.model.displayLabel
import com.voicedirection.glass.storage.GlassesCueSnapshot

data class GlassesCuePayload(
    val displayTitle: String,
    val direction: CallerDirection,
    val directionLabel: String,
    val confidencePercent: Int,
    val confidenceLabel: String,
    val speakerLabelPresent: Boolean,
) {
    val evidenceSummary: String
        get() = listOf(
            "direction=${direction.name}",
            "confidencePercent=$confidencePercent",
            "labelPresent=$speakerLabelPresent",
        ).joinToString(";")

    companion object {
        fun fromCue(cue: DirectionCue): GlassesCuePayload =
            GlassesCuePayload(
                displayTitle = cue.title,
                direction = cue.direction,
                directionLabel = cue.direction.displayLabel(),
                confidencePercent = cue.confidence.toPercent(),
                confidenceLabel = "신뢰도 ${cue.confidence.toPercent()}%",
                speakerLabelPresent = cue.title.endsWith("호출 감지") && cue.title != DEFAULT_TITLE,
            )

        fun fromSnapshot(snapshot: GlassesCueSnapshot?): GlassesCuePayload =
            if (snapshot == null) {
                GlassesCuePayload(
                    displayTitle = "최근 호출 없음",
                    direction = CallerDirection.UNKNOWN,
                    directionLabel = CallerDirection.UNKNOWN.displayLabel(),
                    confidencePercent = 0,
                    confidenceLabel = "신뢰도 0%",
                    speakerLabelPresent = false,
                )
            } else {
                val label = snapshot.speakerLabel ?: DEFAULT_SPEAKER
                GlassesCuePayload(
                    displayTitle = "$label 호출 감지",
                    direction = snapshot.direction,
                    directionLabel = snapshot.direction.displayLabel(),
                    confidencePercent = snapshot.confidence.toPercent(),
                    confidenceLabel = "신뢰도 ${snapshot.confidence.toPercent()}%",
                    speakerLabelPresent = snapshot.speakerLabel != null,
                )
            }

        private const val DEFAULT_TITLE = "등록된 사람 호출 감지"
        private const val DEFAULT_SPEAKER = "등록된 사람"
    }
}

private fun Float.toPercent(): Int =
    (coerceIn(0f, 1f) * 100).toInt()
