package com.voicedirection.glass.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.voicedirection.glass.diagnostics.DiagnosticsLogger
import com.voicedirection.glass.devices.GlassesCuePayload
import com.voicedirection.glass.storage.GlassesCueSnapshot
import com.voicedirection.glass.storage.PreferencesVoiceDirectionRepository
import com.voicedirection.glass.storage.VoiceDirectionRepository
import com.voicedirection.glass.ui.GlassesCueScreen

class GlassesProjectedActivity : ComponentActivity() {
    private var latestCue by mutableStateOf<GlassesCueSnapshot?>(null)
    private val repository: VoiceDirectionRepository by lazy {
        PreferencesVoiceDirectionRepository(this)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        restoreLatestCue()
        DiagnosticsLogger.info("projected_activity_created", "hasCue" to (latestCue != null))
        setContent {
            val cue = latestCue
            GlassesCueScreen(
                payload = GlassesCuePayload.fromSnapshot(cue),
                statusLabel = if (cue == null) "대기 중" else "최근 감지",
            )
        }
    }

    override fun onResume() {
        super.onResume()
        restoreLatestCue()
    }

    private fun restoreLatestCue() {
        latestCue = repository.loadSnapshot().latestGlassesCue
        DiagnosticsLogger.info(
            "projected_cue_loaded",
            "hasCue" to (latestCue != null),
            "direction" to latestCue?.direction,
            "confidence" to latestCue?.let { DiagnosticsLogger.confidenceBucket(it.confidence) },
        )
    }
}
