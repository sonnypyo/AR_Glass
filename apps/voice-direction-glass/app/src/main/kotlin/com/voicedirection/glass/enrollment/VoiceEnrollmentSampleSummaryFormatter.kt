package com.voicedirection.glass.enrollment

object VoiceEnrollmentSampleSummaryFormatter {
    fun format(result: VoiceEnrollmentSampleResult): String {
        val metrics = result.metrics
        val metricLine = if (metrics == null) {
            ""
        } else {
            " · RMS ${(metrics.rms * 100).toInt()}% · peak ${(metrics.peak * 100).toInt()}% · clipping ${(metrics.clippedRatio * 100).toInt()}%"
        }
        return when (result.status) {
            VoiceEnrollmentSampleStatus.SAMPLED ->
                "샘플 품질 통과: ${result.samplesRead} samples$metricLine · prototype embedding ${if (result.embedding == null) "미생성" else "갱신"}"
            VoiceEnrollmentSampleStatus.NO_PERMISSION ->
                "샘플 수집 실패: 마이크 권한 필요"
            VoiceEnrollmentSampleStatus.RECORDER_UNAVAILABLE ->
                "샘플 수집 실패: 녹음 장치 초기화 불가"
            VoiceEnrollmentSampleStatus.READ_FAILED ->
                "샘플 수집 실패: 오디오 읽기 실패"
            VoiceEnrollmentSampleStatus.TOO_QUIET ->
                "샘플 재시도 필요: 음성이 너무 작습니다$metricLine"
            VoiceEnrollmentSampleStatus.CLIPPED ->
                "샘플 재시도 필요: 입력이 과하게 큽니다$metricLine"
            VoiceEnrollmentSampleStatus.ERROR ->
                "샘플 수집 실패: ${result.message}"
        }
    }
}
