package com.voicedirection.glass.audio

object BluetoothAudioRouteSummaryFormatter {
    fun format(report: BluetoothAudioRouteReport): String {
        val routing = if (report.communicationRoutingSupported) "지원" else "미지원"
        val audioPermission = if (report.recordAudioPermissionGranted) "승인됨" else "필요"
        val bluetoothPermission = if (report.bluetoothConnectPermissionGranted) "승인됨" else "필요"
        val input = when {
            report.selectedBluetoothInput != null -> "선택됨: ${report.selectedBluetoothInput!!.safeLabel()}"
            report.bluetoothInputAvailable -> "후보 있음"
            else -> "확인 안 됨"
        }
        val deviceText = if (report.devices.isEmpty()) {
            "통신 장치 없음"
        } else {
            report.devices.joinToString { device ->
                val selected = if (device.selected) " selected" else ""
                "${device.safeLabel()}$selected"
            }
        }
        val errorText = report.error?.let { "\n오류: $it" }.orEmpty()

        return "블루투스 마이크 경로 점검 완료" +
            "\nSDK: ${report.sdkInt}" +
            "\n통신 라우팅: $routing" +
            "\n마이크 권한: $audioPermission" +
            "\n블루투스 권한: $bluetoothPermission" +
            "\n블루투스 입력: $input" +
            "\n장치: $deviceText" +
            errorText
    }

    fun formatSelection(result: BluetoothAudioRouteSelectionResult): String {
        val action = when (result.status) {
            BluetoothAudioRouteSelectionStatus.ROUTED ->
                "선택 완료: ${result.selectedDevice?.safeLabel() ?: "확인 필요"}"
            BluetoothAudioRouteSelectionStatus.CLEARED -> "통신 경로 해제"
            BluetoothAudioRouteSelectionStatus.NO_BLUETOOTH_INPUT -> "블루투스 입력 후보 없음"
            BluetoothAudioRouteSelectionStatus.UNSUPPORTED_SDK -> "통신 라우팅 미지원"
            BluetoothAudioRouteSelectionStatus.PERMISSION_REQUIRED -> "권한 필요"
            BluetoothAudioRouteSelectionStatus.AUDIO_MANAGER_UNAVAILABLE -> "오디오 매니저 없음"
            BluetoothAudioRouteSelectionStatus.FAILED -> "선택 실패"
        }
        return "$action\n${format(result.report)}"
    }

    private fun AudioRouteDevice.safeLabel(): String =
        "${type.displayLabel}#$id ${productName.ifBlank { "unknown" }}"
}
