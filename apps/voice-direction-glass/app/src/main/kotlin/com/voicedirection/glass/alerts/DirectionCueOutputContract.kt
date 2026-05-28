package com.voicedirection.glass.alerts

import com.voicedirection.glass.devices.GlassesCuePayload
import com.voicedirection.glass.direction.DirectionCue
import com.voicedirection.glass.model.CallerDirection
import com.voicedirection.glass.model.displayLabel

data class DirectionCueOutputContract(
    val direction: CallerDirection,
    val directionLabel: String,
    val confidencePercent: Int,
    val notificationText: String,
    val ttsText: String,
    val vibrationSignature: String,
    val vibrationPulseCount: Int,
    val vibrationTotalDurationMillis: Long,
    val phoneVibrationSideSpecific: Boolean,
    val glassesHapticTarget: GlassesHapticTarget,
    val glassesHapticIntensity: GlassesHapticIntensity,
    val glassesHapticPulseCount: Int,
    val glassesHapticRequiresApiProof: Boolean,
    val glassesHapticFallbackSummary: String,
    val glassesHapticEvidenceSummary: String,
    val displayEvidenceSummary: String,
)

object DirectionCueOutputContracts {
    fun allDirections(confidence: Float = DEFAULT_CONFIDENCE): List<DirectionCueOutputContract> =
        CallerDirection.entries.map { direction ->
            forDirection(direction = direction, confidence = confidence)
        }

    fun cueForDirection(
        direction: CallerDirection,
        confidence: Float = DEFAULT_CONFIDENCE,
    ): DirectionCue {
        val confidencePercent = confidence.toPercent()
        return DirectionCue(
            title = TEST_TITLE,
            body = "${direction.displayLabel()} · 신뢰도 $confidencePercent%",
            direction = direction,
            confidence = confidence,
        )
    }

    fun forDirection(
        direction: CallerDirection,
        confidence: Float = DEFAULT_CONFIDENCE,
    ): DirectionCueOutputContract {
        val cue = cueForDirection(direction = direction, confidence = confidence)
        val confidencePercent = cue.confidence.toPercent()
        val vibration = VibrationPatternMapper.summaryFor(direction)
        val displayPayload = GlassesCuePayload.fromCue(cue)
        val glassesHapticsIntent = GlassesHapticsIntents.forDirection(direction)

        return DirectionCueOutputContract(
            direction = direction,
            directionLabel = direction.displayLabel(),
            confidencePercent = confidencePercent,
            notificationText = "${cue.title}: ${cue.body}",
            ttsText = TtsCueTextFormatter.format(cue),
            vibrationSignature = vibration.signature,
            vibrationPulseCount = vibration.pulseCount,
            vibrationTotalDurationMillis = vibration.totalDurationMillis,
            phoneVibrationSideSpecific = vibration.phoneSideSpecific,
            glassesHapticTarget = glassesHapticsIntent.target,
            glassesHapticIntensity = glassesHapticsIntent.intensity,
            glassesHapticPulseCount = glassesHapticsIntent.pulseCount,
            glassesHapticRequiresApiProof = glassesHapticsIntent.requiresOfficialApiProof,
            glassesHapticFallbackSummary = glassesHapticsIntent.fallbackSummary,
            glassesHapticEvidenceSummary = glassesHapticsIntent.evidenceSummary,
            displayEvidenceSummary = displayPayload.evidenceSummary,
        )
    }

    private const val DEFAULT_CONFIDENCE = 0.82f
    private const val TEST_TITLE = "방향 알림 점검"
}

private fun Float.toPercent(): Int =
    (coerceIn(0f, 1f) * 100).toInt()
