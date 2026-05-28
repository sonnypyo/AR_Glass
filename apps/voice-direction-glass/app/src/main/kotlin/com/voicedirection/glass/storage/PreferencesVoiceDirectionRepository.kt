package com.voicedirection.glass.storage

import android.content.Context
import com.voicedirection.glass.model.DetectionEvent
import com.voicedirection.glass.model.SpeakerProfile

class PreferencesVoiceDirectionRepository(
    context: Context,
    preferencesName: String = PREFERENCES_NAME,
    cipher: StringCipher = AndroidKeyStoreStringCipher(),
) : VoiceDirectionRepository {
    private val preferences = context.getSharedPreferences(preferencesName, Context.MODE_PRIVATE)
    private val secureStore = SecurePreferencesStringStore(
        preferences = preferences,
        cipher = cipher,
    )

    override fun loadSnapshot(): VoiceDirectionSnapshot =
        VoiceDirectionSnapshot(
            profiles = readLines(KEY_PROFILES).mapNotNull(LocalStorageCodecs::decodeProfile),
            events = readLines(KEY_EVENTS).mapNotNull(LocalStorageCodecs::decodeEvent),
            feedback = readLines(KEY_FEEDBACK).mapNotNull(LocalStorageCodecs::decodeFeedback),
            directionValidationTrials = readLines(KEY_DIRECTION_VALIDATION_TRIALS)
                .mapNotNull(LocalStorageCodecs::decodeDirectionValidationTrial),
            falsePositiveRun = secureStore.getString(KEY_FALSE_POSITIVE_RUN)
                ?.let(LocalStorageCodecs::decodeFalsePositiveRun),
            settings = VoiceDirectionSettings(
                triggerPhrase = secureStore.getString(KEY_TRIGGER_PHRASE)
                    ?.takeIf { it.isNotBlank() }
                    ?: VoiceDirectionSettings().triggerPhrase,
                simulatedDirection = secureStore.getString(KEY_SIMULATED_DIRECTION)
                    ?.let(LocalStorageCodecs::decodeDirection)
                    ?: VoiceDirectionSettings().simulatedDirection,
                simulatedDirectionConfidence = readFloat(
                    key = KEY_SIMULATED_DIRECTION_CONFIDENCE,
                    defaultValue = VoiceDirectionSettings().simulatedDirectionConfidence,
                ),
                enabledAlertChannels = secureStore.getString(KEY_ENABLED_ALERT_CHANNELS)
                    ?.let(LocalStorageCodecs::decodeAlertChannels)
                    ?.takeIf { channels -> channels.isNotEmpty() }
                    ?: VoiceDirectionSettings().enabledAlertChannels,
                microphoneDisclosureAccepted = secureStore.getString(KEY_MICROPHONE_DISCLOSURE_ACCEPTED)
                    ?.toBooleanStrictOrNull()
                    ?: VoiceDirectionSettings().microphoneDisclosureAccepted,
                microphoneDisclosureVersion = secureStore.getString(KEY_MICROPHONE_DISCLOSURE_VERSION)
                    ?.takeIf { it.isNotBlank() }
                    ?: VoiceDirectionSettings().microphoneDisclosureVersion,
            ),
            latestGlassesCue = secureStore.getString(KEY_LATEST_GLASSES_CUE)
                ?.let(LocalStorageCodecs::decodeCue),
            latestServiceAutomationBridge = secureStore.getString(KEY_LATEST_SERVICE_AUTOMATION_BRIDGE)
                ?.let(LocalStorageCodecs::decodeServiceAutomationBridge),
            latestAudioDirectionSample = secureStore.getString(KEY_LATEST_AUDIO_DIRECTION_SAMPLE)
                ?.let(LocalStorageCodecs::decodeAudioDirectionSampleSnapshot),
            latestAlertDeliverySnapshot = secureStore.getString(KEY_LATEST_ALERT_DELIVERY_SNAPSHOT)
                ?.let(LocalStorageCodecs::decodeAlertDeliverySnapshot),
            isInitialized = preferences.getBoolean(KEY_INITIALIZED, false),
        )

    override fun saveProfiles(profiles: List<SpeakerProfile>) {
        secureStore.putString(
            KEY_PROFILES,
            profiles.joinToString(LINE_SEPARATOR, transform = LocalStorageCodecs::encodeProfile),
        )
        markInitialized()
    }

    override fun saveSettings(settings: VoiceDirectionSettings) {
        secureStore.putString(KEY_TRIGGER_PHRASE, settings.triggerPhrase)
        secureStore.putString(KEY_SIMULATED_DIRECTION, LocalStorageCodecs.encodeDirection(settings.simulatedDirection))
        secureStore.putString(KEY_SIMULATED_DIRECTION_CONFIDENCE, settings.simulatedDirectionConfidence.toString())
        secureStore.putString(KEY_ENABLED_ALERT_CHANNELS, LocalStorageCodecs.encodeAlertChannels(settings.enabledAlertChannels))
        secureStore.putString(KEY_MICROPHONE_DISCLOSURE_ACCEPTED, settings.microphoneDisclosureAccepted.toString())
        secureStore.putString(KEY_MICROPHONE_DISCLOSURE_VERSION, settings.microphoneDisclosureVersion)
        preferences.edit().remove(KEY_SIMULATED_DIRECTION_CONFIDENCE).apply()
        markInitialized()
    }

    override fun saveLatestGlassesCue(cue: GlassesCueSnapshot) {
        secureStore.putString(KEY_LATEST_GLASSES_CUE, LocalStorageCodecs.encodeCue(cue))
        markInitialized()
    }

    override fun saveLatestServiceAutomationBridge(snapshot: ServiceAutomationBridgeSnapshot) {
        secureStore.putString(
            KEY_LATEST_SERVICE_AUTOMATION_BRIDGE,
            LocalStorageCodecs.encodeServiceAutomationBridge(snapshot),
        )
        markInitialized()
    }

    override fun saveLatestAudioDirectionSample(snapshot: AudioDirectionSampleSnapshot) {
        secureStore.putString(
            KEY_LATEST_AUDIO_DIRECTION_SAMPLE,
            LocalStorageCodecs.encodeAudioDirectionSampleSnapshot(snapshot),
        )
        markInitialized()
    }

    override fun saveLatestAlertDeliverySnapshot(snapshot: AlertDeliverySnapshot) {
        secureStore.putString(
            KEY_LATEST_ALERT_DELIVERY_SNAPSHOT,
            LocalStorageCodecs.encodeAlertDeliverySnapshot(snapshot),
        )
        markInitialized()
    }

    override fun appendEvent(event: DetectionEvent) {
        val events = (listOf(event) + loadSnapshot().events).take(MAX_EVENTS)
        secureStore.putString(KEY_EVENTS, events.joinToString(LINE_SEPARATOR, transform = LocalStorageCodecs::encodeEvent))
        markInitialized()
    }

    override fun upsertFeedback(feedback: com.voicedirection.glass.model.DetectionFeedback) {
        val feedbackItems = (
            listOf(feedback) +
                loadSnapshot().feedback.filterNot { existing -> existing.eventId == feedback.eventId }
            ).take(MAX_FEEDBACK)
        secureStore.putString(
            KEY_FEEDBACK,
            feedbackItems.joinToString(LINE_SEPARATOR, transform = LocalStorageCodecs::encodeFeedback),
        )
        markInitialized()
    }

    override fun appendDirectionValidationTrial(trial: com.voicedirection.glass.model.DirectionValidationTrial) {
        val trials = (listOf(trial) + loadSnapshot().directionValidationTrials).take(MAX_DIRECTION_VALIDATION_TRIALS)
        secureStore.putString(
            KEY_DIRECTION_VALIDATION_TRIALS,
            trials.joinToString(LINE_SEPARATOR, transform = LocalStorageCodecs::encodeDirectionValidationTrial),
        )
        markInitialized()
    }

    override fun clearDirectionValidationTrials() {
        secureStore.removeString(KEY_DIRECTION_VALIDATION_TRIALS)
        markInitialized()
    }

    override fun saveFalsePositiveRun(run: com.voicedirection.glass.model.FalsePositiveRun?) {
        if (run == null) {
            secureStore.removeString(KEY_FALSE_POSITIVE_RUN)
        } else {
            secureStore.putString(KEY_FALSE_POSITIVE_RUN, LocalStorageCodecs.encodeFalsePositiveRun(run))
        }
        markInitialized()
    }

    override fun clearAll() {
        preferences.edit().clear().putBoolean(KEY_INITIALIZED, true).apply()
    }

    private fun readLines(key: String): List<String> =
        secureStore.getString(key)
            ?.lineSequence()
            ?.filter { it.isNotBlank() }
            ?.toList()
            .orEmpty()

    private fun readFloat(key: String, defaultValue: Float): Float =
        secureStore.getString(key)?.toFloatOrNull()
            ?: if (preferences.contains(key)) preferences.getFloat(key, defaultValue) else defaultValue

    private fun markInitialized() {
        preferences.edit().putBoolean(KEY_INITIALIZED, true).apply()
    }

    companion object {
        private const val PREFERENCES_NAME = "voice_direction_local_store"
        private const val KEY_INITIALIZED = "initialized"
        private const val KEY_PROFILES = "speaker_profiles"
        private const val KEY_EVENTS = "detection_events"
        private const val KEY_FEEDBACK = "detection_feedback"
        private const val KEY_DIRECTION_VALIDATION_TRIALS = "direction_validation_trials"
        private const val KEY_FALSE_POSITIVE_RUN = "false_positive_run"
        private const val KEY_TRIGGER_PHRASE = "trigger_phrase"
        private const val KEY_SIMULATED_DIRECTION = "simulated_direction"
        private const val KEY_SIMULATED_DIRECTION_CONFIDENCE = "simulated_direction_confidence"
        private const val KEY_ENABLED_ALERT_CHANNELS = "enabled_alert_channels"
        private const val KEY_MICROPHONE_DISCLOSURE_ACCEPTED = "microphone_disclosure_accepted"
        private const val KEY_MICROPHONE_DISCLOSURE_VERSION = "microphone_disclosure_version"
        private const val KEY_LATEST_GLASSES_CUE = "latest_glasses_cue"
        private const val KEY_LATEST_SERVICE_AUTOMATION_BRIDGE = "latest_service_automation_bridge"
        private const val KEY_LATEST_AUDIO_DIRECTION_SAMPLE = "latest_audio_direction_sample"
        private const val KEY_LATEST_ALERT_DELIVERY_SNAPSHOT = "latest_alert_delivery_snapshot"
        private const val LINE_SEPARATOR = "\n"
        private const val MAX_EVENTS = 50
        private const val MAX_FEEDBACK = 100
        private const val MAX_DIRECTION_VALIDATION_TRIALS = 100
    }
}
