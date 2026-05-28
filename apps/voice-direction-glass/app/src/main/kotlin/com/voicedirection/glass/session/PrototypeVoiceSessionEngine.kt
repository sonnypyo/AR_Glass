package com.voicedirection.glass.session

import com.voicedirection.glass.alerts.AlertRouter
import com.voicedirection.glass.detection.PrototypeVoiceMatchChecker
import com.voicedirection.glass.detection.PrototypeVoiceMatchResult
import com.voicedirection.glass.detection.PrototypeVoiceMatchStatus
import com.voicedirection.glass.detection.TriggerPhraseDetector
import com.voicedirection.glass.direction.DirectionCue
import com.voicedirection.glass.direction.DirectionEstimate
import com.voicedirection.glass.direction.DirectionInput
import com.voicedirection.glass.direction.DirectionEstimator
import com.voicedirection.glass.enrollment.VoiceEnrollmentSampleResult
import com.voicedirection.glass.model.DetectionEvent
import com.voicedirection.glass.model.SpeakerProfile
import com.voicedirection.glass.model.VoiceEmbeddingRefCodec

class PrototypeVoiceSessionEngine(
    private val triggerPhraseDetector: TriggerPhraseDetector,
    private val voiceMatchChecker: PrototypeVoiceMatchChecker,
    private val directionEstimator: DirectionEstimator,
    private val alertRouter: AlertRouter,
    private val clockMillis: () -> Long = { System.currentTimeMillis() },
) {
    fun shouldCaptureLiveSample(
        transcript: String,
        triggerPhrase: String,
        profiles: List<SpeakerProfile>,
    ): Boolean =
        triggerPhraseDetector.matches(transcript, triggerPhrase) &&
            profiles.any { profile -> VoiceEmbeddingRefCodec.decode(profile.embeddingRef) != null }

    fun evaluate(
        transcript: String,
        triggerPhrase: String,
        liveSample: VoiceEnrollmentSampleResult?,
        profiles: List<SpeakerProfile>,
        directionInput: DirectionInput,
        directionEstimate: DirectionEstimate? = null,
    ): PrototypeVoiceSessionResult {
        val startedAtMillis = clockMillis()
        val phraseMatched = triggerPhraseDetector.matches(transcript, triggerPhrase)
        val match = if (phraseMatched && liveSample?.accepted == true) {
            voiceMatchChecker.check(liveEmbedding = liveSample.embedding, profiles = profiles)
        } else {
            PrototypeVoiceMatchResult(
                status = PrototypeVoiceMatchStatus.NO_LIVE_EMBEDDING,
                profile = null,
                similarity = 0f,
            )
        }
        val matchedProfile = match.profile.takeIf { match.status == PrototypeVoiceMatchStatus.MATCHED }
        val direction = directionEstimate ?: directionEstimator.estimate(directionInput)
        val eventCreatedAtMillis = clockMillis()
        val eventBeforeDelivery = DetectionEvent(
            id = "event-$eventCreatedAtMillis",
            speakerProfileId = matchedProfile?.id,
            speakerLabel = matchedProfile?.displayName,
            phraseMatched = phraseMatched,
            speakerConfidence = if (matchedProfile != null) match.similarity.coerceIn(0f, 1f) else 0f,
            direction = direction.direction,
            directionConfidence = direction.confidence,
            sourceAdapter = "prototype_voice:${direction.source}",
            createdAtMillis = eventCreatedAtMillis,
        )
        val cue = if (eventBeforeDelivery.isActionable) {
            DirectionCue.fromEstimate(eventBeforeDelivery.speakerLabel, direction)
        } else {
            null
        }
        val deliveries = cue?.let(alertRouter::emit).orEmpty()
        val event = eventBeforeDelivery.copy(
            processingLatencyMillis = (clockMillis() - startedAtMillis).coerceAtLeast(0L),
        )

        return PrototypeVoiceSessionResult(
            event = event,
            deliveries = deliveries,
            cue = cue,
            match = match,
            sampleStatus = liveSample?.status,
        )
    }
}

data class PrototypeVoiceSessionResult(
    val event: DetectionEvent,
    val deliveries: List<com.voicedirection.glass.alerts.AlertDelivery>,
    val cue: DirectionCue?,
    val match: PrototypeVoiceMatchResult,
    val sampleStatus: com.voicedirection.glass.enrollment.VoiceEnrollmentSampleStatus?,
)
