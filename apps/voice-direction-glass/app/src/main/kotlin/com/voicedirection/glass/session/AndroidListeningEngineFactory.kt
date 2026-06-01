package com.voicedirection.glass.session

import android.content.Context
import com.voicedirection.glass.alerts.AlertChannel
import com.voicedirection.glass.alerts.AlertRouter
import com.voicedirection.glass.alerts.AndroidPhoneNotificationAdapter
import com.voicedirection.glass.alerts.AndroidPhoneVibrationAdapter
import com.voicedirection.glass.alerts.AndroidTextToSpeechAlertAdapter
import com.voicedirection.glass.alerts.GlassesAlertOutputAdapter
import com.voicedirection.glass.detection.SimpleTriggerPhraseDetector
import com.voicedirection.glass.detection.PrototypeVoiceMatchChecker
import com.voicedirection.glass.detection.SimulatedSpeakerVerifier
import com.voicedirection.glass.devices.AndroidXrDisplayStubAdapter
import com.voicedirection.glass.devices.MetaDatDisplayStubAdapter
import com.voicedirection.glass.direction.SimulatedDirectionEstimator

object AndroidListeningEngineFactory {
    fun create(
        context: Context,
        enabledAlertChannels: () -> Set<AlertChannel> = { AlertChannel.PHONE_MVP_DEFAULTS },
    ): ListeningSessionEngine =
        ListeningSessionEngine(
            triggerPhraseDetector = SimpleTriggerPhraseDetector(),
            speakerVerifier = SimulatedSpeakerVerifier(),
            directionEstimator = SimulatedDirectionEstimator(),
            alertRouter = createAlertRouter(context, enabledAlertChannels),
        )

    fun createPrototypeVoiceSessionEngine(
        context: Context,
        enabledAlertChannels: () -> Set<AlertChannel> = { AlertChannel.PHONE_MVP_DEFAULTS },
    ): PrototypeVoiceSessionEngine =
        PrototypeVoiceSessionEngine(
            triggerPhraseDetector = SimpleTriggerPhraseDetector(),
            voiceMatchChecker = PrototypeVoiceMatchChecker(),
            directionEstimator = SimulatedDirectionEstimator(),
            alertRouter = createAlertRouter(context, enabledAlertChannels),
        )

    fun createAlertRouter(
        context: Context,
        enabledAlertChannels: () -> Set<AlertChannel> = { AlertChannel.PHONE_MVP_DEFAULTS },
    ): AlertRouter =
        AlertRouter(
            listOf(
                AndroidPhoneNotificationAdapter(context),
                AndroidPhoneVibrationAdapter(context),
                AndroidTextToSpeechAlertAdapter(context),
                GlassesAlertOutputAdapter(MetaDatDisplayStubAdapter(), AlertChannel.META_DISPLAY),
                GlassesAlertOutputAdapter(AndroidXrDisplayStubAdapter(), AlertChannel.ANDROID_XR_DISPLAY),
            ),
            enabledChannels = enabledAlertChannels,
        )
}
