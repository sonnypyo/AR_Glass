package com.voicedirection.glass.speech

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer

class AndroidSpeechRecognitionController(
    private val context: Context,
) : SpeechRecognitionController {
    private var recognizer: SpeechRecognizer? = null

    override fun listenOnce(
        onResult: (String) -> Unit,
        onError: (String) -> Unit,
    ) {
        if (!SpeechRecognizer.isRecognitionAvailable(context)) {
            onError("이 기기에서 음성 인식을 사용할 수 없습니다")
            return
        }

        val activeRecognizer = recognizer ?: SpeechRecognizer.createSpeechRecognizer(context).also {
            recognizer = it
        }
        activeRecognizer.setRecognitionListener(
            SingleUtteranceRecognitionListener(
                onResult = onResult,
                onError = onError,
            ),
        )
        activeRecognizer.startListening(
            Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false)
            },
        )
    }

    override fun release() {
        recognizer?.destroy()
        recognizer = null
    }

    private class SingleUtteranceRecognitionListener(
        private val onResult: (String) -> Unit,
        private val onError: (String) -> Unit,
    ) : RecognitionListener {
        override fun onReadyForSpeech(params: Bundle?) = Unit
        override fun onBeginningOfSpeech() = Unit
        override fun onRmsChanged(rmsdB: Float) = Unit
        override fun onBufferReceived(buffer: ByteArray?) = Unit
        override fun onEndOfSpeech() = Unit
        override fun onPartialResults(partialResults: Bundle?) = Unit
        override fun onEvent(eventType: Int, params: Bundle?) = Unit

        override fun onError(error: Int) {
            onError(error.toUserMessage())
        }

        override fun onResults(results: Bundle?) {
            val text = results
                ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                ?.firstOrNull()
                .orEmpty()

            if (text.isBlank()) {
                onError("인식된 문장이 없습니다")
            } else {
                onResult(text)
            }
        }

        private fun Int.toUserMessage(): String =
            when (this) {
                SpeechRecognizer.ERROR_AUDIO -> "오디오 입력 오류"
                SpeechRecognizer.ERROR_CLIENT -> "음성 인식 클라이언트 오류"
                SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "마이크 권한이 필요합니다"
                SpeechRecognizer.ERROR_NETWORK -> "네트워크 오류"
                SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "네트워크 시간 초과"
                SpeechRecognizer.ERROR_NO_MATCH -> "일치하는 음성을 찾지 못했습니다"
                SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "음성 인식기가 사용 중입니다"
                SpeechRecognizer.ERROR_SERVER -> "음성 인식 서버 오류"
                SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "음성이 감지되지 않았습니다"
                else -> "음성 인식 오류: $this"
            }
    }
}
