package com.voicedirection.glass.qa

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.voicedirection.glass.diagnostics.DiagnosticsLogger
import com.voicedirection.glass.model.CallerDirection
import com.voicedirection.glass.model.DirectionValidationStatus
import com.voicedirection.glass.model.DirectionValidationTrial
import com.voicedirection.glass.storage.AndroidKeyStoreStringCipher
import com.voicedirection.glass.storage.PreferencesVoiceDirectionRepository

class RepositorySelfCheckReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val phase = intent.getStringExtra(EXTRA_PHASE).orEmpty().ifBlank { PHASE_RUN }
        val result = runCatching {
            when (phase) {
                PHASE_RESET -> reset(context)
                PHASE_WRITE -> write(context)
                PHASE_VERIFY -> verify(context)
                PHASE_RUN -> {
                    reset(context)
                    write(context)
                    verify(context)
                }
                else -> SelfCheckResult(
                    phase = phase,
                    passed = false,
                    trialRoundTrip = false,
                    encryptedValuePresent = false,
                    plaintextRemoved = false,
                    message = "unknown phase",
                )
            }
        }.getOrElse { error ->
            SelfCheckResult(
                phase = phase,
                passed = false,
                trialRoundTrip = false,
                encryptedValuePresent = false,
                plaintextRemoved = false,
                message = error::class.java.simpleName,
            )
        }

        DiagnosticsLogger.info(
            "repository_self_check_completed",
            "phase" to result.phase,
            "passed" to result.passed,
            "trialRoundTrip" to result.trialRoundTrip,
            "encryptedValuePresent" to result.encryptedValuePresent,
            "plaintextRemoved" to result.plaintextRemoved,
        )
        setResultCode(if (result.passed) RESULT_CODE_PASS else RESULT_CODE_FAIL)
        setResultData(result.toResultData())
    }

    private fun reset(context: Context): SelfCheckResult {
        context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
            .edit()
            .clear()
            .commit()
        return SelfCheckResult(
            phase = PHASE_RESET,
            passed = true,
            trialRoundTrip = false,
            encryptedValuePresent = false,
            plaintextRemoved = true,
            message = "reset",
        )
    }

    private fun write(context: Context): SelfCheckResult {
        val preferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
        val repository = repository(context)
        repository.appendDirectionValidationTrial(EXPECTED_TRIAL)
        return inspect(PHASE_WRITE, preferences, repository)
    }

    private fun verify(context: Context): SelfCheckResult {
        val preferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
        return inspect(PHASE_VERIFY, preferences, repository(context))
    }

    private fun inspect(
        phase: String,
        preferences: android.content.SharedPreferences,
        repository: PreferencesVoiceDirectionRepository,
    ): SelfCheckResult {
        val trials = repository.loadSnapshot().directionValidationTrials
        val trialRoundTrip = trials.firstOrNull() == EXPECTED_TRIAL
        val encryptedValuePresent = preferences.getString("secure:$KEY_DIRECTION_VALIDATION_TRIALS", null)
            ?.startsWith("enc:v1:") == true
        val plaintextRemoved = !preferences.contains(KEY_DIRECTION_VALIDATION_TRIALS)
        val passed = trialRoundTrip && encryptedValuePresent && plaintextRemoved
        return SelfCheckResult(
            phase = phase,
            passed = passed,
            trialRoundTrip = trialRoundTrip,
            encryptedValuePresent = encryptedValuePresent,
            plaintextRemoved = plaintextRemoved,
            message = if (passed) "pass" else "failed",
        )
    }

    private fun repository(context: Context): PreferencesVoiceDirectionRepository =
        PreferencesVoiceDirectionRepository(
            context = context,
            preferencesName = PREFERENCES_NAME,
            cipher = AndroidKeyStoreStringCipher(KEY_ALIAS),
        )

    private data class SelfCheckResult(
        val phase: String,
        val passed: Boolean,
        val trialRoundTrip: Boolean,
        val encryptedValuePresent: Boolean,
        val plaintextRemoved: Boolean,
        val message: String,
    ) {
        fun toResultData(): String =
            listOf(
                "phase=$phase",
                "passed=$passed",
                "trialRoundTrip=$trialRoundTrip",
                "encryptedValuePresent=$encryptedValuePresent",
                "plaintextRemoved=$plaintextRemoved",
                "message=$message",
            ).joinToString(";")
    }

    companion object {
        private const val EXTRA_PHASE = "phase"
        private const val PHASE_RESET = "reset"
        private const val PHASE_WRITE = "write"
        private const val PHASE_VERIFY = "verify"
        private const val PHASE_RUN = "run"
        private const val RESULT_CODE_PASS = 100
        private const val RESULT_CODE_FAIL = 101
        private const val PREFERENCES_NAME = "voice_direction_repository_self_check"
        private const val KEY_ALIAS = "voice_direction_repository_self_check_aes_gcm"
        private const val KEY_DIRECTION_VALIDATION_TRIALS = "direction_validation_trials"
        private val EXPECTED_TRIAL = DirectionValidationTrial(
            id = "debug-direction-trial",
            expectedDirection = CallerDirection.LEFT,
            observedDirection = CallerDirection.LEFT,
            confidence = 0.82f,
            status = DirectionValidationStatus.SAMPLED,
            sampleRateHz = 16_000,
            samplesRead = 400,
            source = "debug-repository-self-check",
            createdAtMillis = 1_000L,
        )
    }
}
