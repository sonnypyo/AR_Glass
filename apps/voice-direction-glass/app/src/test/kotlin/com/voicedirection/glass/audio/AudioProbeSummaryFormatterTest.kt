package com.voicedirection.glass.audio

import org.junit.Assert.assertTrue
import org.junit.Test

class AudioProbeSummaryFormatterTest {
    @Test
    fun describesStereoSupportWhenStereoCapabilityExists() {
        val summary = AudioProbeSummaryFormatter.format(
            AudioProbeReport(
                checkedAtMillis = 1L,
                recordAudioPermissionGranted = true,
                capabilities = listOf(
                    AudioChannelProbeResult(
                        sampleRateHz = 16_000,
                        channelLayout = AudioChannelLayout.MONO,
                        minBufferSizeBytes = 1024,
                        supported = true,
                    ),
                    AudioChannelProbeResult(
                        sampleRateHz = 16_000,
                        channelLayout = AudioChannelLayout.STEREO,
                        minBufferSizeBytes = 2048,
                        supported = true,
                    ),
                ),
                microphoneMetadata = MicrophoneMetadataSummary(
                    inventoryQuerySucceeded = true,
                    availableMicrophoneCount = 2,
                    availablePositionKnownCount = 1,
                    availableOrientationKnownCount = 1,
                ),
            ),
        )

        assertTrue(summary.contains("스테레오: 가능성 있음"))
        assertTrue(summary.contains("16kHz stereo"))
        assertTrue(summary.contains("inventory 2"))
    }

    @Test
    fun describesMissingPermissionAndNoSupportedCombination() {
        val summary = AudioProbeSummaryFormatter.format(
            AudioProbeReport(
                checkedAtMillis = 1L,
                recordAudioPermissionGranted = false,
                capabilities = listOf(
                    AudioChannelProbeResult(
                        sampleRateHz = 16_000,
                        channelLayout = AudioChannelLayout.STEREO,
                        minBufferSizeBytes = -2,
                        supported = false,
                    ),
                ),
            ),
        )

        assertTrue(summary.contains("권한: 필요"))
        assertTrue(summary.contains("지원 조합 없음"))
    }
}
