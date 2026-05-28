package com.voicedirection.glass.audio

import com.voicedirection.glass.model.CallerDirection

data class AudioDirectionEvidence(
    val level: AudioDirectionEvidenceLevel,
    val label: String,
    val guidance: String,
)

enum class AudioDirectionEvidenceLevel {
    LEFT_RIGHT_USABLE,
    LOW_CONFIDENCE,
    FRONT_BACK_UNPROVEN,
    UNAVAILABLE,
}

object AudioDirectionEvidenceClassifier {
    fun classify(result: AudioDirectionSampleResult): AudioDirectionEvidence {
        val estimate = result.estimate
        if (result.status != AudioDirectionSampleStatus.SAMPLED || estimate == null) {
            return AudioDirectionEvidence(
                level = AudioDirectionEvidenceLevel.UNAVAILABLE,
                label = "실측 불가",
                guidance = "스테레오 샘플이 없어서 방향을 제품 기능으로 주장하지 않습니다.",
            )
        }

        if (estimate.direction == CallerDirection.FRONT || estimate.direction == CallerDirection.BACK) {
            return AudioDirectionEvidence(
                level = AudioDirectionEvidenceLevel.FRONT_BACK_UNPROVEN,
                label = "전후 미검증",
                guidance = "현재 스테레오 에너지 방식만으로 앞/뒤 방향을 확정하지 않습니다.",
            )
        }

        if (estimate.direction == CallerDirection.UNKNOWN || estimate.confidence < LOW_CONFIDENCE_THRESHOLD) {
            return AudioDirectionEvidence(
                level = AudioDirectionEvidenceLevel.LOW_CONFIDENCE,
                label = "불확실",
                guidance = "방향 알림은 약하게 처리하고 UNKNOWN도 유효한 증거로 기록합니다.",
            )
        }

        return AudioDirectionEvidence(
            level = AudioDirectionEvidenceLevel.LEFT_RIGHT_USABLE,
            label = "좌우 참고 가능",
            guidance = "현재 증거는 좌/우 참고용이며, 앞/뒤 방향은 별도 하드웨어 검증이 필요합니다.",
        )
    }

    private const val LOW_CONFIDENCE_THRESHOLD = 0.45f
}
