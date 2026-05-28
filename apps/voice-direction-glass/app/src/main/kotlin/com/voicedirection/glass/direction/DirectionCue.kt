package com.voicedirection.glass.direction

import com.voicedirection.glass.model.CallerDirection
import com.voicedirection.glass.model.displayLabel

data class DirectionCue(
    val title: String,
    val body: String,
    val direction: CallerDirection,
    val confidence: Float,
) {
    companion object {
        fun fromEstimate(speakerLabel: String?, estimate: DirectionEstimate): DirectionCue {
            val who = speakerLabel ?: "등록된 사람"
            val confidencePercent = (estimate.confidence * 100).toInt()
            return DirectionCue(
                title = "$who 호출 감지",
                body = "${estimate.direction.displayLabel()} · 신뢰도 $confidencePercent%",
                direction = estimate.direction,
                confidence = estimate.confidence,
            )
        }
    }
}
