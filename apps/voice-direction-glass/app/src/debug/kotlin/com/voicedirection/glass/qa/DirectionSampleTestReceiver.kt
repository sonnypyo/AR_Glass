package com.voicedirection.glass.qa

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.voicedirection.glass.audio.AndroidAudioCapabilityProbe
import com.voicedirection.glass.audio.AndroidStereoDirectionSampler
import com.voicedirection.glass.audio.AudioDirectionEvidenceClassifier
import com.voicedirection.glass.audio.AudioDirectionSampleStatus
import com.voicedirection.glass.diagnostics.DiagnosticsLogger
import com.voicedirection.glass.model.CallerDirection
import com.voicedirection.glass.storage.AudioDirectionSampleSnapshot
import com.voicedirection.glass.storage.PreferencesVoiceDirectionRepository

class DirectionSampleTestReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val result = runCatching {
            val sampler = AndroidStereoDirectionSampler(AndroidAudioCapabilityProbe(context))
            val sample = sampler.sampleDirection()
            PreferencesVoiceDirectionRepository(context)
                .saveLatestAudioDirectionSample(AudioDirectionSampleSnapshot.from(sample))
            val evidence = AudioDirectionEvidenceClassifier.classify(sample)
            DirectionSampleTestResult(
                passed = sample.status != AudioDirectionSampleStatus.NO_PERMISSION,
                status = sample.status.name,
                evidenceLevel = evidence.level.name,
                direction = sample.estimate?.direction ?: CallerDirection.UNKNOWN,
                confidenceBucket = sample.estimate
                    ?.let { estimate -> DiagnosticsLogger.confidenceBucket(estimate.confidence) }
                    ?: "MISSING",
                sampleRateHz = sample.sampleRateHz ?: -1,
                samplesRead = sample.samplesRead,
                microphoneInventoryCaptured = sample.microphoneMetadata.inventoryQuerySucceeded,
                availableMicrophoneCount = sample.microphoneMetadata.availableMicrophoneCount,
                availablePositionKnownCount = sample.microphoneMetadata.availablePositionKnownCount,
                availableOrientationKnownCount = sample.microphoneMetadata.availableOrientationKnownCount,
                activeMicrophoneCaptured = sample.microphoneMetadata.activeMicrophoneQuerySucceeded,
                activeMicrophoneCount = sample.microphoneMetadata.activeMicrophoneCount ?: -1,
                activeChannelMappingCount = sample.microphoneMetadata.activeChannelMappingCount ?: -1,
                message = sample.message.ifBlank { "pass" },
            )
        }.getOrElse { error ->
            DirectionSampleTestResult(
                passed = false,
                status = "ERROR",
                evidenceLevel = "UNAVAILABLE",
                direction = CallerDirection.UNKNOWN,
                confidenceBucket = "MISSING",
                sampleRateHz = -1,
                samplesRead = 0,
                microphoneInventoryCaptured = false,
                availableMicrophoneCount = 0,
                availablePositionKnownCount = 0,
                availableOrientationKnownCount = 0,
                activeMicrophoneCaptured = false,
                activeMicrophoneCount = -1,
                activeChannelMappingCount = -1,
                message = error::class.java.simpleName,
            )
        }

        DiagnosticsLogger.info(
            "direction_sample_test_completed",
            "passed" to result.passed,
            "status" to result.status,
            "evidenceLevel" to result.evidenceLevel,
            "direction" to result.direction,
            "confidence" to result.confidenceBucket,
            "microphoneInventoryCaptured" to result.microphoneInventoryCaptured,
            "activeMicrophoneCaptured" to result.activeMicrophoneCaptured,
        )
        setResultCode(if (result.passed) RESULT_CODE_PASS else RESULT_CODE_FAIL)
        setResultData(result.toResultData())
    }

    private data class DirectionSampleTestResult(
        val passed: Boolean,
        val status: String,
        val evidenceLevel: String,
        val direction: CallerDirection,
        val confidenceBucket: String,
        val sampleRateHz: Int,
        val samplesRead: Int,
        val microphoneInventoryCaptured: Boolean,
        val availableMicrophoneCount: Int,
        val availablePositionKnownCount: Int,
        val availableOrientationKnownCount: Int,
        val activeMicrophoneCaptured: Boolean,
        val activeMicrophoneCount: Int,
        val activeChannelMappingCount: Int,
        val message: String,
    ) {
        fun toResultData(): String =
            listOf(
                "passed=$passed",
                "status=$status",
                "evidenceLevel=$evidenceLevel",
                "direction=${direction.name}",
                "confidenceBucket=$confidenceBucket",
                "sampleRateHz=$sampleRateHz",
                "samplesRead=$samplesRead",
                "microphoneInventoryCaptured=$microphoneInventoryCaptured",
                "availableMicrophoneCount=$availableMicrophoneCount",
                "availablePositionKnownCount=$availablePositionKnownCount",
                "availableOrientationKnownCount=$availableOrientationKnownCount",
                "activeMicrophoneCaptured=$activeMicrophoneCaptured",
                "activeMicrophoneCount=$activeMicrophoneCount",
                "activeChannelMappingCount=$activeChannelMappingCount",
                "message=$message",
            ).joinToString(";")
    }

    companion object {
        private const val RESULT_CODE_PASS = 100
        private const val RESULT_CODE_FAIL = 101
    }
}
