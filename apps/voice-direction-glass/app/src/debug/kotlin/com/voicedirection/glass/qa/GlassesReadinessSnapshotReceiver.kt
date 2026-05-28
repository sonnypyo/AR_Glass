package com.voicedirection.glass.qa

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.voicedirection.glass.devices.GlassesIntegrationReadiness
import com.voicedirection.glass.devices.GlassesPlatform
import com.voicedirection.glass.diagnostics.DiagnosticsLogger

class GlassesReadinessSnapshotReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val result = runCatching {
            GlassesReadinessSnapshotResult.fromReadiness()
        }.getOrElse { error ->
            GlassesReadinessSnapshotResult(
                passed = false,
                glassesAlphaReady = false,
                openItemCount = 0,
                metaReady = false,
                metaTotal = 0,
                metaPassed = 0,
                metaManual = 0,
                metaBlocked = 0,
                metaOpenIds = "ERROR",
                androidXrReady = false,
                androidXrTotal = 0,
                androidXrPassed = 0,
                androidXrManual = 0,
                androidXrBlocked = 0,
                androidXrOpenIds = "ERROR",
                message = error::class.java.simpleName,
            )
        }

        DiagnosticsLogger.info(
            "glasses_readiness_snapshot_completed",
            "passed" to result.passed,
            "glassesAlphaReady" to result.glassesAlphaReady,
            "openItemCount" to result.openItemCount,
            "metaBlocked" to result.metaBlocked,
            "androidXrBlocked" to result.androidXrBlocked,
        )
        setResultCode(if (result.passed) RESULT_CODE_PASS else RESULT_CODE_FAIL)
        setResultData(result.toResultData())
    }

    private data class GlassesReadinessSnapshotResult(
        val passed: Boolean,
        val glassesAlphaReady: Boolean,
        val openItemCount: Int,
        val metaReady: Boolean,
        val metaTotal: Int,
        val metaPassed: Int,
        val metaManual: Int,
        val metaBlocked: Int,
        val metaOpenIds: String,
        val androidXrReady: Boolean,
        val androidXrTotal: Int,
        val androidXrPassed: Int,
        val androidXrManual: Int,
        val androidXrBlocked: Int,
        val androidXrOpenIds: String,
        val message: String,
    ) {
        fun toResultData(): String =
            listOf(
                "passed=$passed",
                "glassesAlphaReady=$glassesAlphaReady",
                "openItemCount=$openItemCount",
                "metaReady=$metaReady",
                "metaTotal=$metaTotal",
                "metaPassed=$metaPassed",
                "metaManual=$metaManual",
                "metaBlocked=$metaBlocked",
                "metaOpenIds=$metaOpenIds",
                "androidXrReady=$androidXrReady",
                "androidXrTotal=$androidXrTotal",
                "androidXrPassed=$androidXrPassed",
                "androidXrManual=$androidXrManual",
                "androidXrBlocked=$androidXrBlocked",
                "androidXrOpenIds=$androidXrOpenIds",
                "message=$message",
            ).joinToString(";")

        companion object {
            fun fromReadiness(): GlassesReadinessSnapshotResult {
                val meta = GlassesIntegrationReadiness.summaryFor(GlassesPlatform.META_DAT)
                val androidXr = GlassesIntegrationReadiness.summaryFor(GlassesPlatform.ANDROID_XR)
                return GlassesReadinessSnapshotResult(
                    passed = true,
                    glassesAlphaReady = GlassesIntegrationReadiness.isReadyForGlassesAlpha(),
                    openItemCount = GlassesIntegrationReadiness.openItemsForGlassesAlpha().size,
                    metaReady = meta.readyForGlassesAlpha,
                    metaTotal = meta.totalItems,
                    metaPassed = meta.passed,
                    metaManual = meta.manualRequired,
                    metaBlocked = meta.blocked,
                    metaOpenIds = meta.openItems.joinToString(",") { item -> item.id },
                    androidXrReady = androidXr.readyForGlassesAlpha,
                    androidXrTotal = androidXr.totalItems,
                    androidXrPassed = androidXr.passed,
                    androidXrManual = androidXr.manualRequired,
                    androidXrBlocked = androidXr.blocked,
                    androidXrOpenIds = androidXr.openItems.joinToString(",") { item -> item.id },
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
