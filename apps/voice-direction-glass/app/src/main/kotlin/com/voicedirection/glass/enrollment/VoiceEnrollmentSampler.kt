package com.voicedirection.glass.enrollment

import com.voicedirection.glass.model.VoiceEmbedding

enum class VoiceEnrollmentSampleStatus {
    SAMPLED,
    NO_PERMISSION,
    RECORDER_UNAVAILABLE,
    READ_FAILED,
    TOO_QUIET,
    CLIPPED,
    ERROR,
}

data class VoiceEnrollmentSampleMetrics(
    val rms: Float,
    val peak: Float,
    val clippedRatio: Float,
    val durationMillis: Int,
)

data class VoiceEnrollmentSampleResult(
    val checkedAtMillis: Long,
    val status: VoiceEnrollmentSampleStatus,
    val sampleRateHz: Int?,
    val samplesRead: Int,
    val metrics: VoiceEnrollmentSampleMetrics?,
    val embedding: VoiceEmbedding?,
    val message: String,
) {
    val accepted: Boolean
        get() = status == VoiceEnrollmentSampleStatus.SAMPLED
}

interface VoiceEnrollmentSampler {
    fun captureSample(): VoiceEnrollmentSampleResult
}
