package com.voicedirection.glass.audio

import android.content.Context
import android.media.AudioManager
import android.media.AudioRecord
import android.media.MicrophoneInfo

internal object AndroidMicrophoneMetadataReader {
    fun availableMicrophones(context: Context): MicrophoneMetadataSummary {
        val microphones = runCatching {
            context.getSystemService(AudioManager::class.java)?.microphones.orEmpty()
        }.getOrElse {
            return MicrophoneMetadataSummary(inventoryQuerySucceeded = false)
        }

        return microphones.toSummary(
            inventoryQuerySucceeded = true,
            activeMicrophoneQuerySucceeded = false,
        )
    }

    fun withActiveMicrophones(
        base: MicrophoneMetadataSummary,
        recorder: AudioRecord,
    ): MicrophoneMetadataSummary {
        val activeMicrophones = runCatching {
            recorder.activeMicrophones
        }.getOrElse {
            return base.copy(activeMicrophoneQuerySucceeded = false)
        }

        val active = activeMicrophones.toSummary(
            inventoryQuerySucceeded = base.inventoryQuerySucceeded,
            activeMicrophoneQuerySucceeded = true,
        )
        return base.copy(
            activeMicrophoneQuerySucceeded = active.activeMicrophoneQuerySucceeded,
            activeMicrophoneCount = active.activeMicrophoneCount,
            activeChannelMappingCount = active.activeChannelMappingCount,
        )
    }

    private fun List<MicrophoneInfo>.toSummary(
        inventoryQuerySucceeded: Boolean,
        activeMicrophoneQuerySucceeded: Boolean,
    ): MicrophoneMetadataSummary =
        MicrophoneMetadataSummary(
            inventoryQuerySucceeded = inventoryQuerySucceeded,
            availableMicrophoneCount = if (activeMicrophoneQuerySucceeded) 0 else size,
            availablePositionKnownCount = if (activeMicrophoneQuerySucceeded) {
                0
            } else {
                count { microphone -> microphone.position != MicrophoneInfo.POSITION_UNKNOWN }
            },
            availableOrientationKnownCount = if (activeMicrophoneQuerySucceeded) {
                0
            } else {
                count { microphone -> microphone.orientation != MicrophoneInfo.ORIENTATION_UNKNOWN }
            },
            activeMicrophoneQuerySucceeded = activeMicrophoneQuerySucceeded,
            activeMicrophoneCount = if (activeMicrophoneQuerySucceeded) size else null,
            activeChannelMappingCount = if (activeMicrophoneQuerySucceeded) {
                sumOf { microphone -> microphone.channelMapping.size }
            } else {
                null
            },
        )
}
