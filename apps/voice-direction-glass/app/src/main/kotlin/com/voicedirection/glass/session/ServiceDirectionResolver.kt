package com.voicedirection.glass.session

import com.voicedirection.glass.audio.AudioDirectionSampleStatus
import com.voicedirection.glass.audio.AudioDirectionSampler
import com.voicedirection.glass.direction.DirectionEstimate
import com.voicedirection.glass.direction.DirectionEstimator
import com.voicedirection.glass.direction.DirectionInput

class ServiceDirectionResolver(
    private val audioDirectionSampler: AudioDirectionSampler,
    private val fallbackDirectionEstimator: DirectionEstimator,
) {
    fun resolve(input: DirectionInput): ServiceDirectionResolution {
        val sample = audioDirectionSampler.sampleDirection()
        val sampledEstimate = sample.estimate
        if (sample.status == AudioDirectionSampleStatus.SAMPLED && sampledEstimate != null) {
            return ServiceDirectionResolution(
                estimate = sampledEstimate,
                audioStatus = sample.status,
                usedAudioEstimate = true,
            )
        }

        return ServiceDirectionResolution(
            estimate = fallbackDirectionEstimator.estimate(input),
            audioStatus = sample.status,
            usedAudioEstimate = false,
        )
    }
}

data class ServiceDirectionResolution(
    val estimate: DirectionEstimate,
    val audioStatus: AudioDirectionSampleStatus?,
    val usedAudioEstimate: Boolean,
)
