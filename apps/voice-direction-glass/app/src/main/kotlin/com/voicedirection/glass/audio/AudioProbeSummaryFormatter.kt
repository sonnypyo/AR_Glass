package com.voicedirection.glass.audio

object AudioProbeSummaryFormatter {
    fun format(report: AudioProbeReport): String {
        val supported = report.capabilities.filter { it.supported }
        val permission = if (report.recordAudioPermissionGranted) "승인됨" else "필요"
        val stereo = if (report.stereoSupported) "가능성 있음" else "확인 안 됨"
        val supportedText = if (supported.isEmpty()) {
            "지원 조합 없음"
        } else {
            supported.joinToString { result ->
                "${result.sampleRateHz / 1000}kHz ${result.channelLayout.displayLabel}"
            }
        }

        return "마이크 채널 점검 완료\n권한: $permission\n스테레오: $stereo\n지원: $supportedText"
            .plus("\n마이크 메타데이터: ${report.microphoneMetadata.metadataLabel()}")
    }

    private fun MicrophoneMetadataSummary.metadataLabel(): String =
        if (!inventoryQuerySucceeded) {
            "inventory unavailable"
        } else {
            "inventory $availableMicrophoneCount, position $availablePositionKnownCount, orientation $availableOrientationKnownCount"
        }
}
