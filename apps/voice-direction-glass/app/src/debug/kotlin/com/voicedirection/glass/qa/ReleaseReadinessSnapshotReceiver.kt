package com.voicedirection.glass.qa

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.voicedirection.glass.diagnostics.DiagnosticsLogger

class ReleaseReadinessSnapshotReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val result = runCatching {
            ReleaseReadinessSnapshotResult.fromChecklist()
        }.getOrElse { error ->
            ReleaseReadinessSnapshotResult(
                passed = false,
                internalReady = false,
                internalTotal = 0,
                internalPassed = 0,
                internalManual = 0,
                internalBlocked = 0,
                phoneReady = false,
                phoneTotal = 0,
                phonePassed = 0,
                phoneManual = 0,
                phoneBlocked = 0,
                phoneOpenIds = "ERROR",
                glassesReady = false,
                glassesManual = 0,
                glassesBlocked = 0,
                externalReady = false,
                externalManual = 0,
                externalBlocked = 0,
                productionReady = false,
                productionManual = 0,
                productionBlocked = 0,
                message = error::class.java.simpleName,
            )
        }

        DiagnosticsLogger.info(
            "release_readiness_snapshot_completed",
            "passed" to result.passed,
            "phoneReady" to result.phoneReady,
            "phoneManual" to result.phoneManual,
            "phoneBlocked" to result.phoneBlocked,
            "glassesBlocked" to result.glassesBlocked,
        )
        setResultCode(if (result.passed) RESULT_CODE_PASS else RESULT_CODE_FAIL)
        setResultData(result.toResultData())
    }

    private data class ReleaseReadinessSnapshotResult(
        val passed: Boolean,
        val internalReady: Boolean,
        val internalTotal: Int,
        val internalPassed: Int,
        val internalManual: Int,
        val internalBlocked: Int,
        val phoneReady: Boolean,
        val phoneTotal: Int,
        val phonePassed: Int,
        val phoneManual: Int,
        val phoneBlocked: Int,
        val phoneOpenIds: String,
        val glassesReady: Boolean,
        val glassesManual: Int,
        val glassesBlocked: Int,
        val externalReady: Boolean,
        val externalManual: Int,
        val externalBlocked: Int,
        val productionReady: Boolean,
        val productionManual: Int,
        val productionBlocked: Int,
        val message: String,
    ) {
        fun toResultData(): String =
            listOf(
                "passed=$passed",
                "internalReady=$internalReady",
                "internalTotal=$internalTotal",
                "internalPassed=$internalPassed",
                "internalManual=$internalManual",
                "internalBlocked=$internalBlocked",
                "phoneReady=$phoneReady",
                "phoneTotal=$phoneTotal",
                "phonePassed=$phonePassed",
                "phoneManual=$phoneManual",
                "phoneBlocked=$phoneBlocked",
                "phoneOpenIds=$phoneOpenIds",
                "glassesReady=$glassesReady",
                "glassesManual=$glassesManual",
                "glassesBlocked=$glassesBlocked",
                "externalReady=$externalReady",
                "externalManual=$externalManual",
                "externalBlocked=$externalBlocked",
                "productionReady=$productionReady",
                "productionManual=$productionManual",
                "productionBlocked=$productionBlocked",
                "message=$message",
            ).joinToString(";")

        companion object {
            fun fromChecklist(): ReleaseReadinessSnapshotResult {
                val internal = VoiceDirectionReleaseChecklist.summaryFor(ReleaseTarget.INTERNAL_PROTOTYPE)
                val phone = VoiceDirectionReleaseChecklist.summaryFor(ReleaseTarget.PHONE_PRIVATE_ALPHA)
                val glasses = VoiceDirectionReleaseChecklist.summaryFor(ReleaseTarget.GLASSES_PRIVATE_ALPHA)
                val external = VoiceDirectionReleaseChecklist.summaryFor(ReleaseTarget.EXTERNAL_BETA)
                val production = VoiceDirectionReleaseChecklist.summaryFor(ReleaseTarget.PRODUCTION_SERVICE)

                return ReleaseReadinessSnapshotResult(
                    passed = true,
                    internalReady = internal.ready,
                    internalTotal = internal.totalRequired,
                    internalPassed = internal.passed,
                    internalManual = internal.manualRequired,
                    internalBlocked = internal.blocked,
                    phoneReady = phone.ready,
                    phoneTotal = phone.totalRequired,
                    phonePassed = phone.passed,
                    phoneManual = phone.manualRequired,
                    phoneBlocked = phone.blocked,
                    phoneOpenIds = phone.openBlockingItems.joinToString(",") { item -> item.id },
                    glassesReady = glasses.ready,
                    glassesManual = glasses.manualRequired,
                    glassesBlocked = glasses.blocked,
                    externalReady = external.ready,
                    externalManual = external.manualRequired,
                    externalBlocked = external.blocked,
                    productionReady = production.ready,
                    productionManual = production.manualRequired,
                    productionBlocked = production.blocked,
                    message = "pass",
                )
            }
        }
    }

    companion object {
        private const val RESULT_CODE_PASS = 100
        private const val RESULT_CODE_FAIL = 101
    }
}
