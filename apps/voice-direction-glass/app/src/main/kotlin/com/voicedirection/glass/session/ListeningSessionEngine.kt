package com.voicedirection.glass.session

import com.voicedirection.glass.alerts.AlertRouter
import com.voicedirection.glass.detection.SpeakerVerificationInput
import com.voicedirection.glass.detection.SpeakerVerifier
import com.voicedirection.glass.detection.TriggerPhraseDetector
import com.voicedirection.glass.direction.DirectionCue
import com.voicedirection.glass.direction.DirectionEstimator
import com.voicedirection.glass.direction.DirectionInput
import com.voicedirection.glass.model.DetectionEvent

class ListeningSessionEngine(
    private val triggerPhraseDetector: TriggerPhraseDetector,
    private val speakerVerifier: SpeakerVerifier,
    private val directionEstimator: DirectionEstimator,
    private val alertRouter: AlertRouter,
    private val clockMillis: () -> Long = { System.currentTimeMillis() },
) {
    fun evaluate(state: ListeningSessionState): ListeningSessionResult {
        val startedAtMillis = clockMillis()
        val phraseMatched = triggerPhraseDetector.matches(
            transcript = state.simulatedTranscript,
            triggerPhrase = state.triggerPhrase,
        )
        val speakerMatch = speakerVerifier.match(
            input = SpeakerVerificationInput(transcript = state.simulatedTranscript),
            profiles = state.enrolledProfiles,
        )
        val direction = directionEstimator.estimate(
            DirectionInput(
                simulatedDirection = state.simulatedDirection,
                simulatedConfidence = state.simulatedDirectionConfidence,
            ),
        )

        val eventCreatedAtMillis = clockMillis()
        val eventBeforeDelivery = DetectionEvent(
            id = "event-$eventCreatedAtMillis",
            speakerProfileId = speakerMatch.profile?.id,
            speakerLabel = speakerMatch.profile?.displayName,
            phraseMatched = phraseMatched,
            speakerConfidence = speakerMatch.confidence,
            direction = direction.direction,
            directionConfidence = direction.confidence,
            sourceAdapter = direction.source,
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

        return ListeningSessionResult(event = event, deliveries = deliveries, cue = cue)
    }
}

data class ListeningSessionResult(
    val event: DetectionEvent,
    val deliveries: List<com.voicedirection.glass.alerts.AlertDelivery>,
    val cue: DirectionCue?,
)
