package com.voicedirection.glass.alerts

import com.voicedirection.glass.model.CallerDirection

enum class GlassesHapticTarget {
    LEFT,
    RIGHT,
    BOTH,
    NONE,
}

enum class GlassesHapticIntensity {
    LOW,
    MEDIUM,
    HIGH,
    NONE,
}

data class GlassesHapticsIntent(
    val direction: CallerDirection,
    val target: GlassesHapticTarget,
    val intensity: GlassesHapticIntensity,
    val pulseCount: Int,
    val requiresOfficialApiProof: Boolean,
    val phoneFallbackRequired: Boolean,
    val fallbackSummary: String,
) {
    val perSideIntent: Boolean
        get() = target == GlassesHapticTarget.LEFT || target == GlassesHapticTarget.RIGHT

    val evidenceSummary: String
        get() = listOf(
            "direction=${direction.name}",
            "target=${target.name}",
            "intensity=${intensity.name}",
            "pulseCount=$pulseCount",
            "perSideIntent=$perSideIntent",
            "apiProofRequired=$requiresOfficialApiProof",
            "phoneFallbackRequired=$phoneFallbackRequired",
        ).joinToString(";")
}

object GlassesHapticsIntents {
    fun forDirection(direction: CallerDirection): GlassesHapticsIntent =
        when (direction) {
            CallerDirection.LEFT -> directional(
                direction = direction,
                target = GlassesHapticTarget.LEFT,
                intensity = GlassesHapticIntensity.MEDIUM,
                pulseCount = 2,
                fallbackSummary = PHONE_DIRECTION_VIBRATION_FALLBACK,
            )
            CallerDirection.RIGHT -> directional(
                direction = direction,
                target = GlassesHapticTarget.RIGHT,
                intensity = GlassesHapticIntensity.MEDIUM,
                pulseCount = 2,
                fallbackSummary = PHONE_DIRECTION_VIBRATION_FALLBACK,
            )
            CallerDirection.FRONT -> directional(
                direction = direction,
                target = GlassesHapticTarget.BOTH,
                intensity = GlassesHapticIntensity.LOW,
                pulseCount = 3,
                fallbackSummary = PHONE_DIRECTION_VIBRATION_FALLBACK,
            )
            CallerDirection.BACK -> directional(
                direction = direction,
                target = GlassesHapticTarget.BOTH,
                intensity = GlassesHapticIntensity.HIGH,
                pulseCount = 2,
                fallbackSummary = PHONE_DIRECTION_VIBRATION_FALLBACK,
            )
            CallerDirection.UNKNOWN -> GlassesHapticsIntent(
                direction = direction,
                target = GlassesHapticTarget.NONE,
                intensity = GlassesHapticIntensity.NONE,
                pulseCount = 0,
                requiresOfficialApiProof = false,
                phoneFallbackRequired = true,
                fallbackSummary = "Use phone notification and generic vibration because direction is unknown.",
            )
        }

    private fun directional(
        direction: CallerDirection,
        target: GlassesHapticTarget,
        intensity: GlassesHapticIntensity,
        pulseCount: Int,
        fallbackSummary: String,
    ): GlassesHapticsIntent =
        GlassesHapticsIntent(
            direction = direction,
            target = target,
            intensity = intensity,
            pulseCount = pulseCount,
            requiresOfficialApiProof = true,
            phoneFallbackRequired = true,
            fallbackSummary = fallbackSummary,
        )

    private const val PHONE_DIRECTION_VIBRATION_FALLBACK =
        "Use phone vibration, notification, TTS, and visual cue until official glasses haptics are proven."
}

fun GlassesHapticTarget.hapticDisplayLabel(): String =
    when (this) {
        GlassesHapticTarget.LEFT -> "왼쪽 렌즈/템플"
        GlassesHapticTarget.RIGHT -> "오른쪽 렌즈/템플"
        GlassesHapticTarget.BOTH -> "양쪽"
        GlassesHapticTarget.NONE -> "없음"
    }

fun GlassesHapticIntensity.hapticDisplayLabel(): String =
    when (this) {
        GlassesHapticIntensity.LOW -> "낮음"
        GlassesHapticIntensity.MEDIUM -> "중간"
        GlassesHapticIntensity.HIGH -> "높음"
        GlassesHapticIntensity.NONE -> "없음"
    }
