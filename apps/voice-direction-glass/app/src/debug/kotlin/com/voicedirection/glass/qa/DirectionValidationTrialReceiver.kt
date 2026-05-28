package com.voicedirection.glass.qa

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.voicedirection.glass.diagnostics.DiagnosticsLogger
import com.voicedirection.glass.model.CallerDirection
import com.voicedirection.glass.model.DirectionValidationStatus
import com.voicedirection.glass.model.DirectionValidationSummarizer
import com.voicedirection.glass.model.DirectionValidationTrial
import com.voicedirection.glass.storage.PreferencesVoiceDirectionRepository
import java.util.Locale
import kotlin.math.max

class DirectionValidationTrialReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val result = runCatching {
            val repository = PreferencesVoiceDirectionRepository(context)
            if (intent.getBooleanExtra(EXTRA_CLEAR, false)) {
                repository.clearDirectionValidationTrials()
                return@runCatching DirectionValidationTrialResult.cleared()
            }

            val expectedDirection = parseDirection(
                value = intent.getStringExtra(EXTRA_EXPECTED),
                fallback = null,
            ) ?: return@runCatching DirectionValidationTrialResult.failed("missing expected direction")
            val observedDirection = parseDirection(
                value = intent.getStringExtra(EXTRA_OBSERVED),
                fallback = CallerDirection.UNKNOWN,
            ) ?: CallerDirection.UNKNOWN
            val status = parseStatus(intent.getStringExtra(EXTRA_STATUS))
            val confidence = intent.getFloatExtra(
                EXTRA_CONFIDENCE,
                if (observedDirection == CallerDirection.UNKNOWN) 0f else DEFAULT_CONFIDENCE,
            ).coerceIn(0f, 1f)
            val sampleRateHz = if (intent.hasExtra(EXTRA_SAMPLE_RATE_HZ)) {
                intent.getIntExtra(EXTRA_SAMPLE_RATE_HZ, -1).takeIf { value -> value > 0 }
            } else {
                null
            }
            val samplesRead = max(intent.getIntExtra(EXTRA_SAMPLES_READ, 0), 0)
            val source = allowedSource(intent.getStringExtra(EXTRA_SOURCE))
            val now = System.currentTimeMillis()
            val trial = DirectionValidationTrial(
                id = "adb-direction-${now}-${expectedDirection.name.lowercase(Locale.US)}",
                expectedDirection = expectedDirection,
                observedDirection = observedDirection,
                confidence = confidence,
                status = status,
                sampleRateHz = sampleRateHz,
                samplesRead = samplesRead,
                source = source,
                createdAtMillis = now,
            )

            repository.appendDirectionValidationTrial(trial)
            val summary = DirectionValidationSummarizer.summarize(
                repository.loadSnapshot().directionValidationTrials,
            )
            DirectionValidationTrialResult.recorded(
                trial = trial,
                total = summary.total,
                matched = summary.matched,
                mismatched = summary.mismatched,
                unknownOrUnusable = summary.unknownOrUnusable,
            )
        }.getOrElse { error ->
            DirectionValidationTrialResult.failed(error::class.java.simpleName)
        }

        DiagnosticsLogger.info(
            "direction_validation_trial_adb_completed",
            "passed" to result.passed,
            "cleared" to result.cleared,
            "expectedDirection" to result.expectedDirection,
            "observedDirection" to result.observedDirection,
            "status" to result.status,
            "confidence" to result.confidenceBucket,
            "total" to result.total,
        )
        setResultCode(if (result.passed) RESULT_CODE_PASS else RESULT_CODE_FAIL)
        setResultData(result.toResultData())
    }

    private fun parseDirection(
        value: String?,
        fallback: CallerDirection?,
    ): CallerDirection? {
        val normalized = value?.trim()?.replace("-", "_")?.uppercase(Locale.US)
        if (normalized.isNullOrBlank()) return fallback
        return CallerDirection.entries.firstOrNull { direction -> direction.name == normalized }
    }

    private fun parseStatus(value: String?): DirectionValidationStatus {
        val normalized = value?.trim()?.replace("-", "_")?.uppercase(Locale.US)
        if (normalized.isNullOrBlank()) return DirectionValidationStatus.SAMPLED
        return DirectionValidationStatus.entries.firstOrNull { status -> status.name == normalized }
            ?: DirectionValidationStatus.ERROR
    }

    private fun allowedSource(value: String?): String {
        val normalized = value?.trim()?.replace("_", "-")?.lowercase(Locale.US)
        return when (normalized) {
            "controlled-phone" -> "controlled-phone"
            "bluetooth-route" -> "bluetooth-route"
            "rayban-display" -> "rayban-display"
            "rayban-gen1-fallback" -> "rayban-gen1-fallback"
            "android-xr-projected" -> "android-xr-projected"
            else -> "manual-adb-direction-validation"
        }
    }

    private data class DirectionValidationTrialResult(
        val passed: Boolean,
        val cleared: Boolean,
        val expectedDirection: String,
        val observedDirection: String,
        val status: String,
        val confidenceBucket: String,
        val source: String,
        val total: Int,
        val matched: Int,
        val mismatched: Int,
        val unknownOrUnusable: Int,
        val message: String,
    ) {
        fun toResultData(): String =
            listOf(
                "passed=$passed",
                "cleared=$cleared",
                "expectedDirection=$expectedDirection",
                "observedDirection=$observedDirection",
                "status=$status",
                "confidenceBucket=$confidenceBucket",
                "source=$source",
                "total=$total",
                "matched=$matched",
                "mismatched=$mismatched",
                "unknownOrUnusable=$unknownOrUnusable",
                "message=$message",
            ).joinToString(";")

        companion object {
            fun recorded(
                trial: DirectionValidationTrial,
                total: Int,
                matched: Int,
                mismatched: Int,
                unknownOrUnusable: Int,
            ): DirectionValidationTrialResult =
                DirectionValidationTrialResult(
                    passed = true,
                    cleared = false,
                    expectedDirection = trial.expectedDirection.name,
                    observedDirection = trial.observedDirection.name,
                    status = trial.status.name,
                    confidenceBucket = DiagnosticsLogger.confidenceBucket(trial.confidence),
                    source = trial.source,
                    total = total,
                    matched = matched,
                    mismatched = mismatched,
                    unknownOrUnusable = unknownOrUnusable,
                    message = "pass",
                )

            fun cleared(): DirectionValidationTrialResult =
                DirectionValidationTrialResult(
                    passed = true,
                    cleared = true,
                    expectedDirection = "NONE",
                    observedDirection = "NONE",
                    status = "CLEARED",
                    confidenceBucket = "MISSING",
                    source = "manual-adb-direction-validation",
                    total = 0,
                    matched = 0,
                    mismatched = 0,
                    unknownOrUnusable = 0,
                    message = "cleared",
                )

            fun failed(message: String): DirectionValidationTrialResult =
                DirectionValidationTrialResult(
                    passed = false,
                    cleared = false,
                    expectedDirection = "MISSING",
                    observedDirection = "MISSING",
                    status = "ERROR",
                    confidenceBucket = "MISSING",
                    source = "manual-adb-direction-validation",
                    total = 0,
                    matched = 0,
                    mismatched = 0,
                    unknownOrUnusable = 0,
                    message = message,
                )
        }
    }

    companion object {
        private const val EXTRA_CLEAR = "clear"
        private const val EXTRA_EXPECTED = "expected"
        private const val EXTRA_OBSERVED = "observed"
        private const val EXTRA_STATUS = "status"
        private const val EXTRA_CONFIDENCE = "confidence"
        private const val EXTRA_SAMPLE_RATE_HZ = "sampleRateHz"
        private const val EXTRA_SAMPLES_READ = "samplesRead"
        private const val EXTRA_SOURCE = "source"
        private const val DEFAULT_CONFIDENCE = 0.5f
        private const val RESULT_CODE_PASS = 100
        private const val RESULT_CODE_FAIL = 101
    }
}
