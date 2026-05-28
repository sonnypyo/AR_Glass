package com.voicedirection.glass.detection

object PrototypeVoiceMatchSummaryFormatter {
    fun format(result: PrototypeVoiceMatchResult): String =
        when (result.status) {
            PrototypeVoiceMatchStatus.MATCHED ->
                "프로토타입 매칭 통과: ${result.profile?.displayName ?: "알 수 없음"} · 유사도 ${(result.similarity * 100).toInt()}%"
            PrototypeVoiceMatchStatus.LOW_CONFIDENCE ->
                "프로토타입 매칭 낮음: ${result.profile?.displayName ?: "알 수 없음"} · 유사도 ${(result.similarity * 100).toInt()}%"
            PrototypeVoiceMatchStatus.NO_ENROLLED_EMBEDDING ->
                "프로토타입 매칭 불가: 저장된 embedding reference가 없습니다"
            PrototypeVoiceMatchStatus.NO_LIVE_EMBEDDING ->
                "프로토타입 매칭 불가: 현재 샘플 embedding을 만들지 못했습니다"
        }
}
