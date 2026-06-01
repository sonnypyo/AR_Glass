package com.voicedirection.glass.qa

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.voicedirection.glass.alerts.AlertChannel
import com.voicedirection.glass.alerts.DirectionCueOutputContract
import com.voicedirection.glass.alerts.DirectionCueOutputContracts
import com.voicedirection.glass.alerts.VibrationPatternMapper
import com.voicedirection.glass.diagnostics.DiagnosticsLogger
import com.voicedirection.glass.model.CallerDirection
import com.voicedirection.glass.session.AndroidListeningEngineFactory
import com.voicedirection.glass.storage.AlertDeliverySnapshot
import com.voicedirection.glass.storage.AlertDeliveryStatus
import com.voicedirection.glass.storage.PreferencesVoiceDirectionRepository

class AlertOutputTestReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val result = runCatching {
            val repository = PreferencesVoiceDirectionRepository(context)
            val settings = repository.loadSnapshot().settings
            val enabledChannels = settings.enabledAlertChannels
            val vibrationSummary = VibrationPatternMapper.summaryFor(settings.simulatedDirection)
            val cueContract = DirectionCueOutputContracts.forDirection(
                direction = settings.simulatedDirection,
                confidence = settings.simulatedDirectionConfidence,
            )
            if (enabledChannels.isEmpty()) {
                return@runCatching AlertOutputTestResult(
                    passed = false,
                    enabledAlertChannelCount = 0,
                    deliveryCount = 0,
                    deliveredCount = 0,
                    latestDeliverySource = "MISSING",
                    phoneNotification = AlertDeliveryStatus.MISSING.name,
                    phoneVibration = AlertDeliveryStatus.MISSING.name,
                    tts = AlertDeliveryStatus.MISSING.name,
                    phoneAlertProofReady = false,
                    metaDisplay = AlertDeliveryStatus.MISSING.name,
                    androidXrDisplay = AlertDeliveryStatus.MISSING.name,
                    vibrationPatternDirection = vibrationSummary.direction.name,
                    vibrationPatternSignature = vibrationSummary.signature,
                    vibrationPatternPulseCount = vibrationSummary.pulseCount,
                    vibrationPatternTotalMillis = vibrationSummary.totalDurationMillis,
                    phoneVibrationSideSpecific = vibrationSummary.phoneSideSpecific,
                    cueContractDirection = cueContract.direction.name,
                    cueContractConfidencePercent = cueContract.confidencePercent,
                    cueContractNotificationDirection = cueContract.direction.name,
                    cueContractTtsDirectionOnly = true,
                    cueContractTtsSpeakerLabelIncluded = false,
                    cueContractGlassesHapticTarget = cueContract.glassesHapticTarget.name,
                    cueContractGlassesHapticIntensity = cueContract.glassesHapticIntensity.name,
                    cueContractGlassesHapticPulseCount = cueContract.glassesHapticPulseCount,
                    cueContractGlassesHapticRequiresApiProof = cueContract.glassesHapticRequiresApiProof,
                    cueContractGlassesHapticEvidence = cueContract.resultSafeGlassesHapticEvidence,
                    cueContractDisplayEvidence = cueContract.resultSafeDisplayEvidence,
                    message = "no-enabled-channels",
                )
            }

            val checkedAtMillis = System.currentTimeMillis()
            val cue = DirectionCueOutputContracts.cueForDirection(
                direction = settings.simulatedDirection,
                confidence = settings.simulatedDirectionConfidence,
            )
            val deliveries = AndroidListeningEngineFactory.createAlertRouter(context) { enabledChannels }
                .emit(cue)
            val deliverySnapshot = AlertDeliverySnapshot.from(
                eventId = "alert-test-$checkedAtMillis",
                deliveries = deliveries,
                checkedAtMillis = checkedAtMillis,
            )
            repository.saveLatestAlertDeliverySnapshot(deliverySnapshot)

            val phoneNotification = deliverySnapshot.statusFor(AlertChannel.PHONE_NOTIFICATION)
            val phoneVibration = deliverySnapshot.statusFor(AlertChannel.PHONE_VIBRATION)
            val tts = deliverySnapshot.statusFor(AlertChannel.TTS)
            val phoneAlertProofReady = listOf(phoneNotification, phoneVibration, tts)
                .all { status -> status == AlertDeliveryStatus.DELIVERED }
            val passed = deliverySnapshot.totalCount == enabledChannels.size &&
                deliverySnapshot.source.name == "TEST_CUE" &&
                phoneAlertProofReady
            AlertOutputTestResult(
                passed = passed,
                enabledAlertChannelCount = enabledChannels.size,
                deliveryCount = deliverySnapshot.totalCount,
                deliveredCount = deliverySnapshot.deliveredCount,
                latestDeliverySource = deliverySnapshot.source.name,
                phoneNotification = phoneNotification.name,
                phoneVibration = phoneVibration.name,
                tts = tts.name,
                phoneAlertProofReady = phoneAlertProofReady,
                metaDisplay = deliverySnapshot.statusFor(AlertChannel.META_DISPLAY).name,
                androidXrDisplay = deliverySnapshot.statusFor(AlertChannel.ANDROID_XR_DISPLAY).name,
                vibrationPatternDirection = vibrationSummary.direction.name,
                vibrationPatternSignature = vibrationSummary.signature,
                vibrationPatternPulseCount = vibrationSummary.pulseCount,
                vibrationPatternTotalMillis = vibrationSummary.totalDurationMillis,
                phoneVibrationSideSpecific = vibrationSummary.phoneSideSpecific,
                cueContractDirection = cueContract.direction.name,
                cueContractConfidencePercent = cueContract.confidencePercent,
                cueContractNotificationDirection = cueContract.direction.name,
                cueContractTtsDirectionOnly = true,
                cueContractTtsSpeakerLabelIncluded = false,
                cueContractGlassesHapticTarget = cueContract.glassesHapticTarget.name,
                cueContractGlassesHapticIntensity = cueContract.glassesHapticIntensity.name,
                cueContractGlassesHapticPulseCount = cueContract.glassesHapticPulseCount,
                cueContractGlassesHapticRequiresApiProof = cueContract.glassesHapticRequiresApiProof,
                cueContractGlassesHapticEvidence = cueContract.resultSafeGlassesHapticEvidence,
                cueContractDisplayEvidence = cueContract.resultSafeDisplayEvidence,
                message = when {
                    passed -> "pass"
                    !phoneAlertProofReady -> "phone-alert-proof-not-delivered"
                    else -> "delivery-count-mismatch"
                },
            )
        }.getOrElse { error ->
            val fallbackSummary = VibrationPatternMapper.summaryFor(CallerDirection.UNKNOWN)
            val fallbackContract = DirectionCueOutputContracts.forDirection(CallerDirection.UNKNOWN)
            AlertOutputTestResult(
                passed = false,
                enabledAlertChannelCount = 0,
                deliveryCount = 0,
                deliveredCount = 0,
                latestDeliverySource = "MISSING",
                phoneNotification = AlertDeliveryStatus.MISSING.name,
                phoneVibration = AlertDeliveryStatus.MISSING.name,
                tts = AlertDeliveryStatus.MISSING.name,
                phoneAlertProofReady = false,
                metaDisplay = AlertDeliveryStatus.MISSING.name,
                androidXrDisplay = AlertDeliveryStatus.MISSING.name,
                vibrationPatternDirection = fallbackSummary.direction.name,
                vibrationPatternSignature = fallbackSummary.signature,
                vibrationPatternPulseCount = fallbackSummary.pulseCount,
                vibrationPatternTotalMillis = fallbackSummary.totalDurationMillis,
                phoneVibrationSideSpecific = fallbackSummary.phoneSideSpecific,
                cueContractDirection = fallbackContract.direction.name,
                cueContractConfidencePercent = fallbackContract.confidencePercent,
                cueContractNotificationDirection = fallbackContract.direction.name,
                cueContractTtsDirectionOnly = true,
                cueContractTtsSpeakerLabelIncluded = false,
                cueContractGlassesHapticTarget = fallbackContract.glassesHapticTarget.name,
                cueContractGlassesHapticIntensity = fallbackContract.glassesHapticIntensity.name,
                cueContractGlassesHapticPulseCount = fallbackContract.glassesHapticPulseCount,
                cueContractGlassesHapticRequiresApiProof = fallbackContract.glassesHapticRequiresApiProof,
                cueContractGlassesHapticEvidence = fallbackContract.resultSafeGlassesHapticEvidence,
                cueContractDisplayEvidence = fallbackContract.resultSafeDisplayEvidence,
                message = error::class.java.simpleName,
            )
        }

        DiagnosticsLogger.info(
            "alert_output_test_completed",
            "passed" to result.passed,
            "enabledChannelCount" to result.enabledAlertChannelCount,
            "deliveryCount" to result.deliveryCount,
            "deliveredCount" to result.deliveredCount,
            "source" to result.latestDeliverySource,
        )
        setResultCode(if (result.passed) RESULT_CODE_PASS else RESULT_CODE_FAIL)
        setResultData(result.toResultData())
    }

    private data class AlertOutputTestResult(
        val passed: Boolean,
        val enabledAlertChannelCount: Int,
        val deliveryCount: Int,
        val deliveredCount: Int,
        val latestDeliverySource: String,
        val phoneNotification: String,
        val phoneVibration: String,
        val tts: String,
        val phoneAlertProofReady: Boolean,
        val metaDisplay: String,
        val androidXrDisplay: String,
        val vibrationPatternDirection: String,
        val vibrationPatternSignature: String,
        val vibrationPatternPulseCount: Int,
        val vibrationPatternTotalMillis: Long,
        val phoneVibrationSideSpecific: Boolean,
        val cueContractDirection: String,
        val cueContractConfidencePercent: Int,
        val cueContractNotificationDirection: String,
        val cueContractTtsDirectionOnly: Boolean,
        val cueContractTtsSpeakerLabelIncluded: Boolean,
        val cueContractGlassesHapticTarget: String,
        val cueContractGlassesHapticIntensity: String,
        val cueContractGlassesHapticPulseCount: Int,
        val cueContractGlassesHapticRequiresApiProof: Boolean,
        val cueContractGlassesHapticEvidence: String,
        val cueContractDisplayEvidence: String,
        val message: String,
    ) {
        fun toResultData(): String =
            listOf(
                "passed=$passed",
                "enabledAlertChannelCount=$enabledAlertChannelCount",
                "deliveryCount=$deliveryCount",
                "deliveredCount=$deliveredCount",
                "latestDeliverySource=$latestDeliverySource",
                "phoneNotification=$phoneNotification",
                "phoneVibration=$phoneVibration",
                "tts=$tts",
                "phoneAlertProofReady=$phoneAlertProofReady",
                "metaDisplay=$metaDisplay",
                "androidXrDisplay=$androidXrDisplay",
                "vibrationPatternDirection=$vibrationPatternDirection",
                "vibrationPatternSignature=$vibrationPatternSignature",
                "vibrationPatternPulseCount=$vibrationPatternPulseCount",
                "vibrationPatternTotalMillis=$vibrationPatternTotalMillis",
                "phoneVibrationSideSpecific=$phoneVibrationSideSpecific",
                "cueContractDirection=$cueContractDirection",
                "cueContractConfidencePercent=$cueContractConfidencePercent",
                "cueContractNotificationDirection=$cueContractNotificationDirection",
                "cueContractTtsDirectionOnly=$cueContractTtsDirectionOnly",
                "cueContractTtsSpeakerLabelIncluded=$cueContractTtsSpeakerLabelIncluded",
                "cueContractGlassesHapticTarget=$cueContractGlassesHapticTarget",
                "cueContractGlassesHapticIntensity=$cueContractGlassesHapticIntensity",
                "cueContractGlassesHapticPulseCount=$cueContractGlassesHapticPulseCount",
                "cueContractGlassesHapticRequiresApiProof=$cueContractGlassesHapticRequiresApiProof",
                "cueContractGlassesHapticEvidence=$cueContractGlassesHapticEvidence",
                "cueContractDisplayEvidence=$cueContractDisplayEvidence",
                "message=$message",
            ).joinToString(";")
    }

    private val DirectionCueOutputContract.resultSafeDisplayEvidence: String
        get() = displayEvidenceSummary.replace(";", ",")

    private val DirectionCueOutputContract.resultSafeGlassesHapticEvidence: String
        get() = glassesHapticEvidenceSummary.replace(";", ",")

    companion object {
        private const val RESULT_CODE_PASS = 100
        private const val RESULT_CODE_FAIL = 101
    }
}
