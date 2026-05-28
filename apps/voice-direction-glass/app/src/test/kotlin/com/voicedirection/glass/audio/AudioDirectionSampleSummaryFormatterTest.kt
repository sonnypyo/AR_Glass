package com.voicedirection.glass.audio

import com.voicedirection.glass.direction.DirectionEstimate
import com.voicedirection.glass.model.CallerDirection
import org.junit.Assert.assertTrue
import org.junit.Test

class AudioDirectionSampleSummaryFormatterTest {
    @Test
    fun describesSampledDirection() {
        val summary = AudioDirectionSampleSummaryFormatter.format(
            AudioDirectionSampleResult(
                checkedAtMillis = 1L,
                status = AudioDirectionSampleStatus.SAMPLED,
                sampleRateHz = 16_000,
                minBufferSizeBytes = 1024,
                samplesRead = 4096,
                estimate = DirectionEstimate(
                    direction = CallerDirection.RIGHT,
                    confidence = 0.84f,
                    source = "test",
                ),
                message = "sampled",
                microphoneMetadata = MicrophoneMetadataSummary(
                    inventoryQuerySucceeded = true,
                    availableMicrophoneCount = 2,
                    activeMicrophoneQuerySucceeded = true,
                    activeMicrophoneCount = 2,
                    activeChannelMappingCount = 2,
                ),
            ),
        )

        assertTrue(summary.contains("샘플 완료"))
        assertTrue(summary.contains("오른쪽"))
        assertTrue(summary.contains("84%"))
        assertTrue(summary.contains("좌우 참고 가능"))
        assertTrue(summary.contains("active 2"))
    }

    @Test
    fun describesUnavailableStereoInput() {
        val summary = AudioDirectionSampleSummaryFormatter.format(
            AudioDirectionSampleResult(
                checkedAtMillis = 1L,
                status = AudioDirectionSampleStatus.NO_STEREO_INPUT,
                sampleRateHz = null,
                minBufferSizeBytes = null,
                samplesRead = 0,
                estimate = null,
                message = "no stereo",
            ),
        )

        assertTrue(summary.contains("스테레오 입력 없음"))
        assertTrue(summary.contains("입력 없음"))
        assertTrue(summary.contains("실측 불가"))
    }

    @Test
    fun describesUnknownSampleAsLowConfidenceEvidence() {
        val summary = AudioDirectionSampleSummaryFormatter.format(
            AudioDirectionSampleResult(
                checkedAtMillis = 1L,
                status = AudioDirectionSampleStatus.SAMPLED,
                sampleRateHz = 16_000,
                minBufferSizeBytes = 1024,
                samplesRead = 4096,
                estimate = DirectionEstimate(
                    direction = CallerDirection.UNKNOWN,
                    confidence = 0.12f,
                    source = "test",
                ),
                message = "balanced",
            ),
        )

        assertTrue(summary.contains("불확실"))
        assertTrue(summary.contains("UNKNOWN도 유효한 증거"))
    }

    @Test
    fun describesFrontBackSampleAsUnproven() {
        val summary = AudioDirectionSampleSummaryFormatter.format(
            AudioDirectionSampleResult(
                checkedAtMillis = 1L,
                status = AudioDirectionSampleStatus.SAMPLED,
                sampleRateHz = 16_000,
                minBufferSizeBytes = 1024,
                samplesRead = 4096,
                estimate = DirectionEstimate(
                    direction = CallerDirection.FRONT,
                    confidence = 0.82f,
                    source = "test",
                ),
                message = "front",
            ),
        )

        assertTrue(summary.contains("전후 미검증"))
        assertTrue(summary.contains("앞/뒤 방향을 확정하지 않습니다"))
    }
}
