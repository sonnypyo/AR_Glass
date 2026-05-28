package com.voicedirection.glass.audio

import com.voicedirection.glass.model.displayLabel

object AudioDirectionSampleSummaryFormatter {
    fun format(result: AudioDirectionSampleResult): String {
        val evidence = AudioDirectionEvidenceClassifier.classify(result)
        val directionText = result.estimate?.let { estimate ->
            "${estimate.direction.displayLabel()} · 신뢰도 ${(estimate.confidence * 100).toInt()}%"
        } ?: "방향 불명"
        val inputText = result.sampleRateHz?.let { sampleRate ->
            "${sampleRate / 1000}kHz stereo"
        } ?: "입력 없음"

        return listOf(
            "방향 샘플 점검 완료",
            "상태: ${result.status.displayLabel()}",
            "입력: $inputText",
            "읽은 샘플: ${result.samplesRead}",
            "마이크 메타데이터: ${result.microphoneMetadata.metadataLabel()}",
            "결과: $directionText",
            "판정: ${evidence.label}",
            "지침: ${evidence.guidance}",
            "메시지: ${result.message}",
        ).joinToString("\n")
    }

    private fun AudioDirectionSampleStatus.displayLabel(): String =
        when (this) {
            AudioDirectionSampleStatus.SAMPLED -> "샘플 완료"
            AudioDirectionSampleStatus.NO_PERMISSION -> "권한 필요"
            AudioDirectionSampleStatus.NO_STEREO_INPUT -> "스테레오 입력 없음"
            AudioDirectionSampleStatus.RECORDER_UNAVAILABLE -> "레코더 초기화 실패"
            AudioDirectionSampleStatus.READ_FAILED -> "샘플 읽기 실패"
            AudioDirectionSampleStatus.ERROR -> "오류"
        }

    private fun MicrophoneMetadataSummary.metadataLabel(): String =
        if (!inventoryQuerySucceeded) {
            "inventory unavailable"
        } else {
            val active = if (activeMicrophoneQuerySucceeded) {
                "active ${activeMicrophoneCount ?: 0}, mapping ${activeChannelMappingCount ?: 0}"
            } else {
                "active unavailable"
            }
            "inventory $availableMicrophoneCount, $active"
        }
}
