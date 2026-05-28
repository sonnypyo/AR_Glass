package com.voicedirection.glass.speech

interface SpeechRecognitionController {
    fun listenOnce(
        onResult: (String) -> Unit,
        onError: (String) -> Unit,
    )

    fun release()
}
