package com.voicedirection.glass.audio

import com.voicedirection.glass.direction.DirectionEstimate

enum class AudioDirectionSampleStatus {
    SAMPLED,
    NO_PERMISSION,
    NO_STEREO_INPUT,
    RECORDER_UNAVAILABLE,
    READ_FAILED,
    ERROR,
}

data class AudioDirectionSampleResult(
    val checkedAtMillis: Long,
    val status: AudioDirectionSampleStatus,
    val sampleRateHz: Int?,
    val minBufferSizeBytes: Int?,
    val samplesRead: Int,
    val estimate: DirectionEstimate?,
    val message: String,
    val microphoneMetadata: MicrophoneMetadataSummary = MicrophoneMetadataSummary(),
)

interface AudioDirectionSampler {
    fun sampleDirection(): AudioDirectionSampleResult
}
