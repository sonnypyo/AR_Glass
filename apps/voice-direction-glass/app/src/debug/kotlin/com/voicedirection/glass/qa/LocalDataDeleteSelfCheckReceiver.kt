package com.voicedirection.glass.qa

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.voicedirection.glass.alerts.AlertChannel
import com.voicedirection.glass.audio.AudioDirectionEvidenceLevel
import com.voicedirection.glass.audio.AudioDirectionSampleStatus
import com.voicedirection.glass.detection.PrototypeVoiceMatchStatus
import com.voicedirection.glass.diagnostics.DiagnosticsLogger
import com.voicedirection.glass.model.CallerDirection
import com.voicedirection.glass.model.DetectionEvent
import com.voicedirection.glass.model.DetectionFeedback
import com.voicedirection.glass.model.DetectionFeedbackType
import com.voicedirection.glass.model.DirectionValidationStatus
import com.voicedirection.glass.model.DirectionValidationTrial
import com.voicedirection.glass.model.FalsePositiveRun
import com.voicedirection.glass.model.SpeakerEnrollmentStatus
import com.voicedirection.glass.model.SpeakerProfile
import com.voicedirection.glass.model.SpeakerVerificationMode
import com.voicedirection.glass.storage.AlertDeliveryRecord
import com.voicedirection.glass.storage.AlertDeliverySnapshot
import com.voicedirection.glass.storage.AndroidKeyStoreStringCipher
import com.voicedirection.glass.storage.AudioDirectionSampleSnapshot
import com.voicedirection.glass.storage.GlassesCueSnapshot
import com.voicedirection.glass.storage.PreferencesVoiceDirectionRepository
import com.voicedirection.glass.storage.ServiceAutomationBridgeSnapshot

class LocalDataDeleteSelfCheckReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val result = runCatching {
            val repository = repository(context)
            repository.clearAll()
            seed(repository)
            val before = repository.loadSnapshot()
            repository.clearAll()
            val after = repository.loadSnapshot()
            val countsCleared = after.profiles.isEmpty() &&
                after.events.isEmpty() &&
                after.feedback.isEmpty() &&
                after.directionValidationTrials.isEmpty()
            val snapshotsCleared = after.latestGlassesCue == null &&
                after.latestServiceAutomationBridge == null &&
                after.latestAudioDirectionSample == null &&
                after.latestAlertDeliverySnapshot == null &&
                after.falsePositiveRun == null
            val settingsReset = !after.settings.microphoneDisclosureAccepted &&
                after.settings.microphoneDisclosureVersion.isBlank()

            DeleteSelfCheckResult(
                passed = before.profiles.isNotEmpty() &&
                    before.events.isNotEmpty() &&
                    before.feedback.isNotEmpty() &&
                    before.directionValidationTrials.isNotEmpty() &&
                    countsCleared &&
                    snapshotsCleared &&
                    settingsReset,
                seededBeforeDelete = before.profiles.isNotEmpty() && before.events.isNotEmpty(),
                profileCountBefore = before.profiles.size,
                eventCountBefore = before.events.size,
                feedbackCountBefore = before.feedback.size,
                directionTrialCountBefore = before.directionValidationTrials.size,
                profileCountAfter = after.profiles.size,
                eventCountAfter = after.events.size,
                feedbackCountAfter = after.feedback.size,
                directionTrialCountAfter = after.directionValidationTrials.size,
                latestCuePresentAfter = after.latestGlassesCue != null,
                latestDeliveryPresentAfter = after.latestAlertDeliverySnapshot != null,
                serviceBridgePresentAfter = after.latestServiceAutomationBridge != null,
                audioDirectionSamplePresentAfter = after.latestAudioDirectionSample != null,
                falsePositiveRunPresentAfter = after.falsePositiveRun != null,
                settingsResetAfter = settingsReset,
                message = "pass",
            )
        }.getOrElse { error ->
            DeleteSelfCheckResult(
                passed = false,
                seededBeforeDelete = false,
                profileCountBefore = 0,
                eventCountBefore = 0,
                feedbackCountBefore = 0,
                directionTrialCountBefore = 0,
                profileCountAfter = -1,
                eventCountAfter = -1,
                feedbackCountAfter = -1,
                directionTrialCountAfter = -1,
                latestCuePresentAfter = true,
                latestDeliveryPresentAfter = true,
                serviceBridgePresentAfter = true,
                audioDirectionSamplePresentAfter = true,
                falsePositiveRunPresentAfter = true,
                settingsResetAfter = false,
                message = error::class.java.simpleName,
            )
        }

        DiagnosticsLogger.info(
            "local_data_delete_self_check_completed",
            "passed" to result.passed,
            "profileCountAfter" to result.profileCountAfter,
            "eventCountAfter" to result.eventCountAfter,
            "snapshotsCleared" to (!result.latestCuePresentAfter && !result.latestDeliveryPresentAfter),
        )
        setResultCode(if (result.passed) RESULT_CODE_PASS else RESULT_CODE_FAIL)
        setResultData(result.toResultData())
    }

    private fun seed(repository: PreferencesVoiceDirectionRepository) {
        val profile = SpeakerProfile(
            id = "debug-delete-profile",
            displayName = "debug-delete-profile",
            consentVersion = "debug-consent-v1",
            createdAtMillis = 1_000L,
            embeddingRef = "debug-delete-ref",
            verificationMode = SpeakerVerificationMode.TRANSCRIPT_LABEL_SIMULATION,
            enrollmentStatus = SpeakerEnrollmentStatus.LABEL_ONLY,
            sampleCount = 0,
        )
        val event = DetectionEvent(
            id = "debug-delete-event",
            speakerProfileId = profile.id,
            speakerLabel = null,
            phraseMatched = true,
            speakerConfidence = 0.8f,
            direction = CallerDirection.RIGHT,
            directionConfidence = 0.82f,
            sourceAdapter = "debug-delete-self-check",
            createdAtMillis = 1_100L,
            processingLatencyMillis = 400L,
        )
        repository.saveProfiles(listOf(profile))
        repository.appendEvent(event)
        repository.upsertFeedback(
            DetectionFeedback(
                eventId = event.id,
                type = DetectionFeedbackType.CORRECT,
                createdAtMillis = 1_200L,
            ),
        )
        repository.appendDirectionValidationTrial(
            DirectionValidationTrial(
                id = "debug-delete-trial",
                expectedDirection = CallerDirection.RIGHT,
                observedDirection = CallerDirection.RIGHT,
                confidence = 0.82f,
                status = DirectionValidationStatus.SAMPLED,
                sampleRateHz = 16_000,
                samplesRead = 400,
                source = "debug-delete-self-check",
                createdAtMillis = 1_300L,
            ),
        )
        repository.saveLatestGlassesCue(
            GlassesCueSnapshot(
                speakerLabel = null,
                direction = CallerDirection.RIGHT,
                confidence = 0.82f,
                createdAtMillis = 1_400L,
            ),
        )
        repository.saveLatestAlertDeliverySnapshot(
            AlertDeliverySnapshot(
                eventId = "alert-test-1400",
                checkedAtMillis = 1_400L,
                deliveries = listOf(
                    AlertDeliveryRecord(
                        channel = AlertChannel.PHONE_NOTIFICATION,
                        delivered = true,
                    ),
                ),
            ),
        )
        repository.saveLatestServiceAutomationBridge(
            ServiceAutomationBridgeSnapshot(
                eventId = event.id,
                checkedAtMillis = 1_500L,
                actionable = true,
                sampleStatus = null,
                matchStatus = PrototypeVoiceMatchStatus.MATCHED,
                similarity = 0.82f,
                audioDirectionStatus = AudioDirectionSampleStatus.SAMPLED,
                usedAudioDirection = true,
                direction = CallerDirection.RIGHT,
                directionConfidence = 0.82f,
                sourceAdapter = "debug-delete-self-check",
            ),
        )
        repository.saveLatestAudioDirectionSample(
            AudioDirectionSampleSnapshot(
                checkedAtMillis = 1_600L,
                status = AudioDirectionSampleStatus.SAMPLED,
                direction = CallerDirection.RIGHT,
                confidence = 0.82f,
                evidenceLevel = AudioDirectionEvidenceLevel.LEFT_RIGHT_USABLE,
                sampleRateHz = 16_000,
                samplesRead = 400,
                source = "debug-delete-self-check",
            ),
        )
        repository.saveFalsePositiveRun(
            FalsePositiveRun(
                id = "debug-delete-run",
                startedAtMillis = 1_700L,
            ),
        )
    }

    private fun repository(context: Context): PreferencesVoiceDirectionRepository =
        PreferencesVoiceDirectionRepository(
            context = context,
            preferencesName = PREFERENCES_NAME,
            cipher = AndroidKeyStoreStringCipher(KEY_ALIAS),
        )

    private data class DeleteSelfCheckResult(
        val passed: Boolean,
        val seededBeforeDelete: Boolean,
        val profileCountBefore: Int,
        val eventCountBefore: Int,
        val feedbackCountBefore: Int,
        val directionTrialCountBefore: Int,
        val profileCountAfter: Int,
        val eventCountAfter: Int,
        val feedbackCountAfter: Int,
        val directionTrialCountAfter: Int,
        val latestCuePresentAfter: Boolean,
        val latestDeliveryPresentAfter: Boolean,
        val serviceBridgePresentAfter: Boolean,
        val audioDirectionSamplePresentAfter: Boolean,
        val falsePositiveRunPresentAfter: Boolean,
        val settingsResetAfter: Boolean,
        val message: String,
    ) {
        fun toResultData(): String =
            listOf(
                "passed=$passed",
                "seededBeforeDelete=$seededBeforeDelete",
                "profileCountBefore=$profileCountBefore",
                "eventCountBefore=$eventCountBefore",
                "feedbackCountBefore=$feedbackCountBefore",
                "directionTrialCountBefore=$directionTrialCountBefore",
                "profileCountAfter=$profileCountAfter",
                "eventCountAfter=$eventCountAfter",
                "feedbackCountAfter=$feedbackCountAfter",
                "directionTrialCountAfter=$directionTrialCountAfter",
                "latestCuePresentAfter=$latestCuePresentAfter",
                "latestDeliveryPresentAfter=$latestDeliveryPresentAfter",
                "serviceBridgePresentAfter=$serviceBridgePresentAfter",
                "audioDirectionSamplePresentAfter=$audioDirectionSamplePresentAfter",
                "falsePositiveRunPresentAfter=$falsePositiveRunPresentAfter",
                "settingsResetAfter=$settingsResetAfter",
                "message=$message",
            ).joinToString(";")
    }

    companion object {
        private const val RESULT_CODE_PASS = 100
        private const val RESULT_CODE_FAIL = 101
        private const val PREFERENCES_NAME = "voice_direction_delete_self_check"
        private const val KEY_ALIAS = "voice_direction_delete_self_check_aes_gcm"
    }
}
