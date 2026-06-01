package com.voicedirection.glass.alerts

import android.content.Context
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import com.voicedirection.glass.direction.DirectionCue
import java.util.Locale
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

class AndroidTextToSpeechAlertAdapter(
    context: Context,
) : AlertOutputAdapter {
    private val appContext = context.applicationContext

    override val channel: AlertChannel = AlertChannel.TTS

    override fun emit(cue: DirectionCue): AlertDelivery {
        val text = TtsCueTextFormatter.format(cue)
        val utteranceId = "voice-direction-${System.currentTimeMillis()}"
        val initLatch = CountDownLatch(1)
        var initStatus = TextToSpeech.ERROR
        val tts = TextToSpeech(appContext) { status ->
            initStatus = status
            initLatch.countDown()
        }

        if (!initLatch.await(TTS_INIT_TIMEOUT_MILLIS, TimeUnit.MILLISECONDS)) {
            tts.shutdown()
            return AlertDelivery(channel, delivered = false, message = "tts initialization timed out")
        }
        if (initStatus != TextToSpeech.SUCCESS) {
            tts.shutdown()
            return AlertDelivery(channel, delivered = false, message = "tts initialization failed")
        }
        val languageResult = tts.setLanguage(Locale.KOREAN)
        if (
            languageResult == TextToSpeech.LANG_MISSING_DATA ||
            languageResult == TextToSpeech.LANG_NOT_SUPPORTED
        ) {
            tts.shutdown()
            return AlertDelivery(channel, delivered = false, message = "korean tts unavailable")
        }

        tts.setOnUtteranceProgressListener(
            object : UtteranceProgressListener() {
                override fun onStart(utteranceId: String?) = Unit

                override fun onDone(utteranceId: String?) {
                    tts.shutdown()
                }

                @Deprecated("Deprecated in Java")
                override fun onError(utteranceId: String?) {
                    tts.shutdown()
                }

                override fun onError(utteranceId: String?, errorCode: Int) {
                    tts.shutdown()
                }
            },
        )
        val speakResult = tts.speak(
            text,
            TextToSpeech.QUEUE_FLUSH,
            null,
            utteranceId,
        )
        if (speakResult == TextToSpeech.ERROR) {
            tts.shutdown()
            return AlertDelivery(channel, delivered = false, message = "tts speak failed")
        }

        return AlertDelivery(
            channel = channel,
            delivered = true,
            message = "tts queued: $text",
        )
    }

    companion object {
        private const val TTS_INIT_TIMEOUT_MILLIS = 2_000L
    }
}
