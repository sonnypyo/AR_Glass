package com.voicedirection.glass.session

import com.voicedirection.glass.alerts.AlertRouter
import com.voicedirection.glass.alerts.PhoneNotificationAdapter
import com.voicedirection.glass.alerts.PhoneVibrationAdapter
import com.voicedirection.glass.detection.SimpleTriggerPhraseDetector
import com.voicedirection.glass.detection.SimulatedSpeakerVerifier
import com.voicedirection.glass.direction.SimulatedDirectionEstimator
import com.voicedirection.glass.model.CallerDirection
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ListeningSessionEngineTest {
    @Test
    fun emitsPhoneAlertsWhenPhraseAndSpeakerMatch() {
        val engine = ListeningSessionEngine(
            triggerPhraseDetector = SimpleTriggerPhraseDetector(),
            speakerVerifier = SimulatedSpeakerVerifier(),
            directionEstimator = SimulatedDirectionEstimator(),
            alertRouter = AlertRouter(listOf(PhoneNotificationAdapter(), PhoneVibrationAdapter())),
            clockMillis = { 1000L },
        )

        val result = engine.evaluate(
            ListeningSessionState(
                simulatedTranscript = "민지가 준표 하고 오른쪽에서 불렀어",
                simulatedDirection = CallerDirection.RIGHT,
            ),
        )

        assertTrue(result.event.isActionable)
        assertEquals(CallerDirection.RIGHT, result.event.direction)
        assertEquals(2, result.deliveries.size)
    }

    @Test
    fun recordsProcessingLatencyWithoutTranscriptContent() {
        val clockValues = mutableListOf(1_000L, 1_040L, 1_180L)
        val engine = ListeningSessionEngine(
            triggerPhraseDetector = SimpleTriggerPhraseDetector(),
            speakerVerifier = SimulatedSpeakerVerifier(),
            directionEstimator = SimulatedDirectionEstimator(),
            alertRouter = AlertRouter(listOf(PhoneNotificationAdapter())),
            clockMillis = { clockValues.removeAt(0) },
        )

        val result = engine.evaluate(
            ListeningSessionState(
                simulatedTranscript = "민지가 준표 하고 왼쪽에서 불렀어",
                simulatedDirection = CallerDirection.LEFT,
            ),
        )

        assertEquals(180L, result.event.processingLatencyMillis)
        assertEquals(1_040L, result.event.createdAtMillis)
    }
}
