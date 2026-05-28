package com.voicedirection.glass.detection

import com.voicedirection.glass.model.SpeakerEnrollmentStatus
import com.voicedirection.glass.model.SpeakerProfile
import com.voicedirection.glass.model.SpeakerVerificationMode
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class SimulatedSpeakerVerifierTest {
    private val verifier = SimulatedSpeakerVerifier()

    @Test
    fun matchesTranscriptLabelSimulationProfiles() {
        val profile = SpeakerProfile(
            id = "speaker-1",
            displayName = "민지",
            consentVersion = "test-v1",
            createdAtMillis = 10L,
            embeddingRef = "transcript-label-simulator:minji",
            verificationMode = SpeakerVerificationMode.TRANSCRIPT_LABEL_SIMULATION,
            enrollmentStatus = SpeakerEnrollmentStatus.LABEL_ONLY,
        )

        val match = verifier.match(
            SpeakerVerificationInput(transcript = "민지가 준표 하고 불렀어"),
            listOf(profile),
        )

        assertEquals(profile, match.profile)
        assertEquals(0.84f, match.confidence)
    }

    @Test
    fun doesNotPretendModelRequiredProfilesAreVerifiedByTranscript() {
        val profile = SpeakerProfile(
            id = "speaker-2",
            displayName = "민지",
            consentVersion = "test-v1",
            createdAtMillis = 10L,
            embeddingRef = "",
            verificationMode = SpeakerVerificationMode.ON_DEVICE_EMBEDDING,
            enrollmentStatus = SpeakerEnrollmentStatus.SAMPLE_CAPTURE_REQUIRED,
        )

        val match = verifier.match(
            SpeakerVerificationInput(transcript = "민지가 준표 하고 불렀어"),
            listOf(profile),
        )

        assertNull(match.profile)
        assertEquals(0f, match.confidence)
    }
}
