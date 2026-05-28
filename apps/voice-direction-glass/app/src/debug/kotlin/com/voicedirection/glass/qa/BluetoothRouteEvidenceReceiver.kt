package com.voicedirection.glass.qa

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.voicedirection.glass.audio.AndroidBluetoothAudioRouteProbe
import com.voicedirection.glass.audio.BluetoothAudioRouteEvidenceFormatter
import com.voicedirection.glass.diagnostics.DiagnosticsLogger

class BluetoothRouteEvidenceReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val result = runCatching {
            val mode = intent.getStringExtra(EXTRA_MODE)
                ?.trim()
                ?.lowercase()
                ?: MODE_PROBE
            val probe = AndroidBluetoothAudioRouteProbe(context)
            when (mode) {
                MODE_SELECT -> BluetoothAudioRouteEvidenceFormatter.formatSelection(
                    mode = MODE_SELECT,
                    result = probe.selectBluetoothInput(),
                )
                MODE_CLEAR -> BluetoothAudioRouteEvidenceFormatter.formatSelection(
                    mode = MODE_CLEAR,
                    result = probe.clearSelectedRoute(),
                )
                else -> BluetoothAudioRouteEvidenceFormatter.formatProbe(probe.probe())
            }
        }.getOrElse { error ->
            listOf(
                "passed=false",
                "mode=probe",
                "deviceCount=0",
                "bluetoothInputAvailable=false",
                "bluetoothInputCandidateCount=0",
                "selectedBluetoothInputPresent=false",
                "selectedBluetoothInputType=NONE",
                "errorPresent=true",
                "message=${error::class.java.simpleName}",
            ).joinToString(";")
        }

        DiagnosticsLogger.info(
            "bluetooth_route_evidence_completed",
            "passed" to result.contains("passed=true"),
            "mode" to result.substringAfter("mode=", "missing").substringBefore(";"),
            "bluetoothInputAvailable" to result.substringAfter("bluetoothInputAvailable=", "missing")
                .substringBefore(";"),
            "candidateCount" to result.substringAfter("bluetoothInputCandidateCount=", "missing")
                .substringBefore(";"),
        )
        setResultCode(if (result.contains("passed=true")) RESULT_CODE_PASS else RESULT_CODE_FAIL)
        setResultData(result)
    }

    companion object {
        private const val EXTRA_MODE = "mode"
        private const val MODE_PROBE = "probe"
        private const val MODE_SELECT = "select"
        private const val MODE_CLEAR = "clear"
        private const val RESULT_CODE_PASS = 100
        private const val RESULT_CODE_FAIL = 101
    }
}
