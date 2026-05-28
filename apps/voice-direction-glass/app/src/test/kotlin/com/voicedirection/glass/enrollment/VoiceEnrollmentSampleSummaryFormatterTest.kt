package com.voicedirection.glass.enrollment

import org.junit.Assert.assertTrue
import org.junit.Test
import com.voicedirection.glass.model.VoiceEmbedding

class VoiceEnrollmentSampleSummaryFormatterTest {
    @Test
    fun formatsAcceptedSampleWithoutRawAudio() {
        val result = VoiceEnrollmentSampleResult(
            checkedAtMillis = 10L,
            status = VoiceEnrollmentSampleStatus.SAMPLED,
            sampleRateHz = 16_000,
            samplesRead = 1600,
            embedding = VoiceEmbedding(listOf(0.1f, 0.2f, 0.3f)),
            metrics = VoiceEnrollmentSampleMetrics(
                rms = 0.12f,
                peak = 0.3f,
                clippedRatio = 0f,
                durationMillis = 100,
            ),
            message = "원본 PCM 저장 없이 샘플 품질만 분석했습니다",
        )

        val summary = VoiceEnrollmentSampleSummaryFormatter.format(result)

        assertTrue(summary.contains("샘플 품질 통과"))
        assertTrue(summary.contains("RMS"))
    }
}
