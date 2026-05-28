package com.voicedirection.glass.model

enum class SpeakerVerificationMode {
    TRANSCRIPT_LABEL_SIMULATION,
    ON_DEVICE_EMBEDDING,
}

enum class SpeakerEnrollmentStatus {
    LABEL_ONLY,
    SAMPLE_CAPTURE_REQUIRED,
    SAMPLES_CAPTURED_MODEL_PENDING,
    MODEL_READY,
}

data class SpeakerProfile(
    val id: String,
    val displayName: String,
    val consentVersion: String,
    val createdAtMillis: Long,
    val embeddingRef: String,
    val verificationMode: SpeakerVerificationMode = SpeakerVerificationMode.TRANSCRIPT_LABEL_SIMULATION,
    val enrollmentStatus: SpeakerEnrollmentStatus = SpeakerEnrollmentStatus.LABEL_ONLY,
    val sampleCount: Int = 0,
) {
    val canUseTranscriptSimulation: Boolean
        get() = verificationMode == SpeakerVerificationMode.TRANSCRIPT_LABEL_SIMULATION

    val hasEnrollmentSamples: Boolean
        get() = sampleCount > 0

    val hasRealVoiceModel: Boolean
        get() = verificationMode == SpeakerVerificationMode.ON_DEVICE_EMBEDDING &&
            enrollmentStatus == SpeakerEnrollmentStatus.MODEL_READY &&
            embeddingRef.isNotBlank()
}
