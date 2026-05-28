package com.voicedirection.glass.qa

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.voicedirection.glass.devices.GlassesCuePayload
import com.voicedirection.glass.diagnostics.DiagnosticsLogger
import com.voicedirection.glass.model.CallerDirection
import com.voicedirection.glass.storage.GlassesCueSnapshot
import com.voicedirection.glass.storage.PreferencesVoiceDirectionRepository

class GlassesCueSeedReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val result = runCatching {
            val repository = PreferencesVoiceDirectionRepository(context)
            val settings = repository.loadSnapshot().settings
            val direction = intent.directionExtra(settings.simulatedDirection)
            val confidence = intent.confidenceExtra(settings.simulatedDirectionConfidence)
            val cue = GlassesCueSnapshot(
                speakerLabel = null,
                direction = direction,
                confidence = confidence,
                createdAtMillis = System.currentTimeMillis(),
            )
            repository.saveLatestGlassesCue(cue)
            val payload = GlassesCuePayload.fromSnapshot(cue)

            GlassesCueSeedResult(
                passed = payload.direction == direction && !payload.speakerLabelPresent,
                direction = direction.name,
                confidenceBucket = DiagnosticsLogger.confidenceBucket(confidence),
                confidencePercent = payload.confidencePercent,
                labelPresent = payload.speakerLabelPresent,
                payloadEvidence = payload.evidenceSummary.replace(';', ','),
                message = "pass",
            )
        }.getOrElse { error ->
            GlassesCueSeedResult(
                passed = false,
                direction = CallerDirection.UNKNOWN.name,
                confidenceBucket = "none",
                confidencePercent = 0,
                labelPresent = false,
                payloadEvidence = "missing",
                message = error::class.java.simpleName,
            )
        }

        DiagnosticsLogger.info(
            "glasses_cue_seed_completed",
            "passed" to result.passed,
            "direction" to result.direction,
            "confidence" to result.confidenceBucket,
            "labelPresent" to result.labelPresent,
        )
        setResultCode(if (result.passed) RESULT_CODE_PASS else RESULT_CODE_FAIL)
        setResultData(result.toResultData())
    }

    private data class GlassesCueSeedResult(
        val passed: Boolean,
        val direction: String,
        val confidenceBucket: String,
        val confidencePercent: Int,
        val labelPresent: Boolean,
        val payloadEvidence: String,
        val message: String,
    ) {
        fun toResultData(): String =
            listOf(
                "passed=$passed",
                "direction=$direction",
                "confidenceBucket=$confidenceBucket",
                "confidencePercent=$confidencePercent",
                "labelPresent=$labelPresent",
                "payloadEvidence=$payloadEvidence",
                "message=$message",
            ).joinToString(";")
    }

    private fun Intent.directionExtra(defaultDirection: CallerDirection): CallerDirection =
        getStringExtra(EXTRA_DIRECTION)
            ?.trim()
            ?.uppercase()
            ?.let { raw -> runCatching { CallerDirection.valueOf(raw) }.getOrNull() }
            ?: defaultDirection

    private fun Intent.confidenceExtra(defaultConfidence: Float): Float =
        if (hasExtra(EXTRA_CONFIDENCE)) {
            getFloatExtra(EXTRA_CONFIDENCE, defaultConfidence)
        } else {
            defaultConfidence
        }.coerceIn(0f, 1f)

    companion object {
        private const val EXTRA_DIRECTION = "direction"
        private const val EXTRA_CONFIDENCE = "confidence"
        private const val RESULT_CODE_PASS = 100
        private const val RESULT_CODE_FAIL = 101
    }
}
