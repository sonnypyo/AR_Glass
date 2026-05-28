package com.voicedirection.glass.audio

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord

class AndroidAudioCapabilityProbe(
    private val context: Context,
    private val clockMillis: () -> Long = { System.currentTimeMillis() },
) : AudioCapabilityProbe {
    override fun probe(): AudioProbeReport {
        val capabilities = SAMPLE_RATES.flatMap { sampleRate ->
            CHANNELS.map { channel ->
                val minBufferSize = AudioRecord.getMinBufferSize(
                    sampleRate,
                    channel.androidChannelMask,
                    AudioFormat.ENCODING_PCM_16BIT,
                )
                AudioChannelProbeResult(
                    sampleRateHz = sampleRate,
                    channelLayout = channel.layout,
                    minBufferSizeBytes = minBufferSize,
                    supported = minBufferSize > 0,
                )
            }
        }

        return AudioProbeReport(
            checkedAtMillis = clockMillis(),
            recordAudioPermissionGranted = context.checkSelfPermission(
                Manifest.permission.RECORD_AUDIO,
            ) == PackageManager.PERMISSION_GRANTED,
            capabilities = capabilities,
            microphoneMetadata = AndroidMicrophoneMetadataReader.availableMicrophones(context),
        )
    }

    private data class ChannelCandidate(
        val layout: AudioChannelLayout,
        val androidChannelMask: Int,
    )

    companion object {
        private val SAMPLE_RATES = listOf(16_000, 44_100, 48_000)
        private val CHANNELS = listOf(
            ChannelCandidate(AudioChannelLayout.MONO, AudioFormat.CHANNEL_IN_MONO),
            ChannelCandidate(AudioChannelLayout.STEREO, AudioFormat.CHANNEL_IN_STEREO),
        )
    }
}
