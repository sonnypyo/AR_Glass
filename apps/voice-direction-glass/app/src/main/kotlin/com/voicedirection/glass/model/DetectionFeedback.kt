package com.voicedirection.glass.model

enum class DetectionFeedbackType {
    CORRECT,
    FALSE_POSITIVE,
    WRONG_DIRECTION,
    WRONG_SPEAKER,
}

data class DetectionFeedback(
    val eventId: String,
    val type: DetectionFeedbackType,
    val createdAtMillis: Long,
)

data class DetectionFeedbackSummary(
    val total: Int,
    val correct: Int,
    val falsePositive: Int,
    val wrongDirection: Int,
    val wrongSpeaker: Int,
)

object DetectionFeedbackSummarizer {
    fun summarize(feedback: List<DetectionFeedback>): DetectionFeedbackSummary =
        DetectionFeedbackSummary(
            total = feedback.size,
            correct = feedback.count { it.type == DetectionFeedbackType.CORRECT },
            falsePositive = feedback.count { it.type == DetectionFeedbackType.FALSE_POSITIVE },
            wrongDirection = feedback.count { it.type == DetectionFeedbackType.WRONG_DIRECTION },
            wrongSpeaker = feedback.count { it.type == DetectionFeedbackType.WRONG_SPEAKER },
        )
}
