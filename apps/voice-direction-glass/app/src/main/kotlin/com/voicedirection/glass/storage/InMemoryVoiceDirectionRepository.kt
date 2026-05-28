package com.voicedirection.glass.storage

import com.voicedirection.glass.model.DetectionEvent
import com.voicedirection.glass.model.DetectionFeedback
import com.voicedirection.glass.model.DirectionValidationTrial
import com.voicedirection.glass.model.FalsePositiveRun
import com.voicedirection.glass.model.SpeakerProfile

class InMemoryVoiceDirectionRepository(
    initialProfiles: List<SpeakerProfile> = emptyList(),
    initialEvents: List<DetectionEvent> = emptyList(),
    initialFeedback: List<DetectionFeedback> = emptyList(),
    initialDirectionValidationTrials: List<DirectionValidationTrial> = emptyList(),
    initialFalsePositiveRun: FalsePositiveRun? = null,
    initialSettings: VoiceDirectionSettings = VoiceDirectionSettings(),
    initiallyInitialized: Boolean = initialProfiles.isNotEmpty() ||
        initialEvents.isNotEmpty() ||
        initialFeedback.isNotEmpty() ||
        initialDirectionValidationTrials.isNotEmpty() ||
        initialFalsePositiveRun != null ||
        initialSettings != VoiceDirectionSettings(),
) : VoiceDirectionRepository {
    private var profiles = initialProfiles
    private var events = initialEvents
    private var feedback = initialFeedback
    private var directionValidationTrials = initialDirectionValidationTrials
    private var falsePositiveRun = initialFalsePositiveRun
    private var settings = initialSettings
    private var latestGlassesCue: GlassesCueSnapshot? = null
    private var latestServiceAutomationBridge: ServiceAutomationBridgeSnapshot? = null
    private var latestAudioDirectionSample: AudioDirectionSampleSnapshot? = null
    private var latestAlertDeliverySnapshot: AlertDeliverySnapshot? = null
    private var isInitialized = initiallyInitialized

    override fun loadSnapshot(): VoiceDirectionSnapshot =
        VoiceDirectionSnapshot(
            profiles = profiles,
            events = events,
            feedback = feedback,
            directionValidationTrials = directionValidationTrials,
            falsePositiveRun = falsePositiveRun,
            settings = settings,
            latestGlassesCue = latestGlassesCue,
            latestServiceAutomationBridge = latestServiceAutomationBridge,
            latestAudioDirectionSample = latestAudioDirectionSample,
            latestAlertDeliverySnapshot = latestAlertDeliverySnapshot,
            isInitialized = isInitialized,
        )

    override fun saveProfiles(profiles: List<SpeakerProfile>) {
        isInitialized = true
        this.profiles = profiles
    }

    override fun saveSettings(settings: VoiceDirectionSettings) {
        isInitialized = true
        this.settings = settings
    }

    override fun saveLatestGlassesCue(cue: GlassesCueSnapshot) {
        isInitialized = true
        latestGlassesCue = cue
    }

    override fun saveLatestServiceAutomationBridge(snapshot: ServiceAutomationBridgeSnapshot) {
        isInitialized = true
        latestServiceAutomationBridge = snapshot
    }

    override fun saveLatestAudioDirectionSample(snapshot: AudioDirectionSampleSnapshot) {
        isInitialized = true
        latestAudioDirectionSample = snapshot
    }

    override fun saveLatestAlertDeliverySnapshot(snapshot: AlertDeliverySnapshot) {
        isInitialized = true
        latestAlertDeliverySnapshot = snapshot
    }

    override fun appendEvent(event: DetectionEvent) {
        isInitialized = true
        events = (listOf(event) + events).take(MAX_EVENTS)
    }

    override fun upsertFeedback(feedback: DetectionFeedback) {
        isInitialized = true
        this.feedback = (listOf(feedback) + this.feedback.filterNot { it.eventId == feedback.eventId })
            .take(MAX_FEEDBACK)
    }

    override fun appendDirectionValidationTrial(trial: DirectionValidationTrial) {
        isInitialized = true
        directionValidationTrials = (listOf(trial) + directionValidationTrials).take(MAX_DIRECTION_VALIDATION_TRIALS)
    }

    override fun clearDirectionValidationTrials() {
        isInitialized = true
        directionValidationTrials = emptyList()
    }

    override fun saveFalsePositiveRun(run: FalsePositiveRun?) {
        isInitialized = true
        falsePositiveRun = run
    }

    override fun clearAll() {
        isInitialized = true
        profiles = emptyList()
        events = emptyList()
        feedback = emptyList()
        directionValidationTrials = emptyList()
        falsePositiveRun = null
        settings = VoiceDirectionSettings()
        latestGlassesCue = null
        latestServiceAutomationBridge = null
        latestAudioDirectionSample = null
        latestAlertDeliverySnapshot = null
    }

    companion object {
        const val MAX_EVENTS = 50
        const val MAX_FEEDBACK = 100
        const val MAX_DIRECTION_VALIDATION_TRIALS = 100
    }
}
