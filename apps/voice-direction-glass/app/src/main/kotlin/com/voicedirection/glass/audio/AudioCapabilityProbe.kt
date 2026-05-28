package com.voicedirection.glass.audio

enum class AudioChannelLayout(
    val displayLabel: String,
) {
    MONO("mono"),
    STEREO("stereo"),
}

data class AudioChannelProbeResult(
    val sampleRateHz: Int,
    val channelLayout: AudioChannelLayout,
    val minBufferSizeBytes: Int,
    val supported: Boolean,
)

data class MicrophoneMetadataSummary(
    val inventoryQuerySucceeded: Boolean = false,
    val availableMicrophoneCount: Int = 0,
    val availablePositionKnownCount: Int = 0,
    val availableOrientationKnownCount: Int = 0,
    val activeMicrophoneQuerySucceeded: Boolean = false,
    val activeMicrophoneCount: Int? = null,
    val activeChannelMappingCount: Int? = null,
)

data class AudioProbeReport(
    val checkedAtMillis: Long,
    val recordAudioPermissionGranted: Boolean,
    val capabilities: List<AudioChannelProbeResult>,
    val microphoneMetadata: MicrophoneMetadataSummary = MicrophoneMetadataSummary(),
) {
    val stereoSupported: Boolean
        get() = capabilities.any { it.supported && it.channelLayout == AudioChannelLayout.STEREO }
}

interface AudioCapabilityProbe {
    fun probe(): AudioProbeReport
}
