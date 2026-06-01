package com.voicedirection.glass.alerts

import android.content.Context
import android.os.Looper
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import com.voicedirection.glass.direction.DirectionCue
import java.util.Locale

class AndroidTextToSpeechAlertAdapter(
    context: Context,
) : AlertOutputAdapter {
    private val appContext = context.applicationContext
    @Suppress("PLATFORM_CLASS_MAPPED_TO_KOTLIN")
    private val initLock = Object()
    private var tts: TextToSpeech? = null
    private var initStarted = false
    private var initComplete = false
    private var ready = false
    private var pendingInitStatus: Int? = null
    private var unavailableReason = "tts not initialized"

    override val channel: AlertChannel = AlertChannel.TTS

    override fun emit(cue: DirectionCue): AlertDelivery {
        val text = TtsCueTextFormatter.format(cue)
        val utteranceId = "voice-direction-${System.currentTimeMillis()}"
        startTtsIfNeeded()

        val engine = readyEngineOrNull()
            ?: return AlertDelivery(channel, delivered = false, message = currentUnavailableReason())
        engine.setOnUtteranceProgressListener(
            object : UtteranceProgressListener() {
                override fun onStart(utteranceId: String?) = Unit

                override fun onDone(utteranceId: String?) = Unit

                @Deprecated("Deprecated in Java")
                override fun onError(utteranceId: String?) = Unit

                override fun onError(utteranceId: String?, errorCode: Int) = Unit
            },
        )
        val speakResult = engine.speak(
            text,
            TextToSpeech.QUEUE_FLUSH,
            null,
            utteranceId,
        )
        if (speakResult == TextToSpeech.ERROR) {
            return AlertDelivery(channel, delivered = false, message = "tts speak failed")
        }

        return AlertDelivery(
            channel = channel,
            delivered = true,
            message = "tts queued: $text",
        )
    }

    private fun startTtsIfNeeded() {
        synchronized(initLock) {
            if (initStarted) return
            initStarted = true
            unavailableReason = "tts initializing"
        }

        runCatching {
            TextToSpeech(appContext) { status ->
                handleInit(status)
            }
        }.onSuccess { engine ->
            synchronized(initLock) {
                tts = engine
                pendingInitStatus?.let { status ->
                    pendingInitStatus = null
                    applyInitStatusLocked(engine, status)
                }
            }
        }.onFailure {
            synchronized(initLock) {
                initComplete = true
                ready = false
                unavailableReason = "tts initialization failed"
                initLock.notifyAll()
            }
        }
    }

    private fun handleInit(status: Int) {
        synchronized(initLock) {
            val engine = tts
            if (engine == null) {
                pendingInitStatus = status
                return
            }
            applyInitStatusLocked(engine, status)
        }
    }

    private fun applyInitStatusLocked(engine: TextToSpeech, status: Int) {
        if (status != TextToSpeech.SUCCESS) {
            engine.shutdown()
            ready = false
            unavailableReason = "tts initialization failed"
        } else {
            val languageResult = engine.setLanguage(Locale.KOREAN)
            ready = languageResult != TextToSpeech.LANG_MISSING_DATA &&
                languageResult != TextToSpeech.LANG_NOT_SUPPORTED
            unavailableReason = if (ready) {
                ""
            } else {
                engine.shutdown()
                "korean tts unavailable"
            }
        }
        initComplete = true
        initLock.notifyAll()
    }

    private fun readyEngineOrNull(): TextToSpeech? =
        synchronized(initLock) {
            if (!ready && Looper.myLooper() != Looper.getMainLooper()) {
                val deadline = System.currentTimeMillis() + TTS_INIT_TIMEOUT_MILLIS
                while (!initComplete && System.currentTimeMillis() < deadline) {
                    initLock.wait((deadline - System.currentTimeMillis()).coerceAtLeast(1L))
                }
                if (!ready && !initComplete) unavailableReason = "tts initialization timed out"
            }
            tts.takeIf { ready }
        }

    private fun currentUnavailableReason(): String =
        synchronized(initLock) { unavailableReason }

    companion object {
        private const val TTS_INIT_TIMEOUT_MILLIS = 2_000L
    }
}
