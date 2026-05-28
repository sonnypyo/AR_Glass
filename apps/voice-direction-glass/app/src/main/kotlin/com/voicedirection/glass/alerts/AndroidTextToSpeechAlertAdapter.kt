package com.voicedirection.glass.alerts

import android.content.Context
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import com.voicedirection.glass.direction.DirectionCue
import java.util.Locale

class AndroidTextToSpeechAlertAdapter(
    context: Context,
) : AlertOutputAdapter {
    private val appContext = context.applicationContext

    override val channel: AlertChannel = AlertChannel.TTS

    override fun emit(cue: DirectionCue): AlertDelivery {
        val text = TtsCueTextFormatter.format(cue)
        val utteranceId = "voice-direction-${System.currentTimeMillis()}"
        var tts: TextToSpeech? = null
        tts = TextToSpeech(appContext) { status ->
            val engine = tts ?: return@TextToSpeech
            if (status != TextToSpeech.SUCCESS) {
                engine.shutdown()
                return@TextToSpeech
            }
            engine.language = Locale.KOREAN
            engine.setOnUtteranceProgressListener(
                object : UtteranceProgressListener() {
                    override fun onStart(utteranceId: String?) = Unit

                    override fun onDone(utteranceId: String?) {
                        engine.shutdown()
                    }

                    @Deprecated("Deprecated in Java")
                    override fun onError(utteranceId: String?) {
                        engine.shutdown()
                    }

                    override fun onError(utteranceId: String?, errorCode: Int) {
                        engine.shutdown()
                    }
                },
            )
            val speakResult = engine.speak(
                text,
                TextToSpeech.QUEUE_FLUSH,
                null,
                utteranceId,
            )
            if (speakResult == TextToSpeech.ERROR) {
                engine.shutdown()
            }
        }

        return AlertDelivery(
            channel = channel,
            delivered = true,
            message = "tts queued: $text",
        )
    }
}
