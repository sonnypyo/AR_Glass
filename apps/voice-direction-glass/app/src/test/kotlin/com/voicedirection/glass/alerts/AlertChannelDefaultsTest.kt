package com.voicedirection.glass.alerts

import com.voicedirection.glass.session.ListeningSessionState
import com.voicedirection.glass.storage.VoiceDirectionSettings
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Test

class AlertChannelDefaultsTest {
    @Test
    fun phoneMvpDefaultsExcludeUnprovenGlassesOutputs() {
        assertEquals(
            setOf(AlertChannel.PHONE_NOTIFICATION, AlertChannel.PHONE_VIBRATION, AlertChannel.TTS),
            AlertChannel.PHONE_MVP_DEFAULTS,
        )
        assertFalse(AlertChannel.META_DISPLAY in AlertChannel.PHONE_MVP_DEFAULTS)
        assertFalse(AlertChannel.ANDROID_XR_DISPLAY in AlertChannel.PHONE_MVP_DEFAULTS)
    }

    @Test
    fun appDefaultsStartWithPhoneMvpOutputsOnly() {
        assertEquals(AlertChannel.PHONE_MVP_DEFAULTS, VoiceDirectionSettings().enabledAlertChannels)
        assertEquals(AlertChannel.PHONE_MVP_DEFAULTS, ListeningSessionState().enabledAlertChannels)
    }
}
