package com.voicedirection.glass.alerts

enum class AlertChannel {
    PHONE_NOTIFICATION,
    PHONE_VIBRATION,
    META_DISPLAY,
    ANDROID_XR_DISPLAY,
    TTS,
    ;

    companion object {
        val PHONE_MVP_DEFAULTS: Set<AlertChannel> = setOf(
            PHONE_NOTIFICATION,
            PHONE_VIBRATION,
            TTS,
        )
    }
}
