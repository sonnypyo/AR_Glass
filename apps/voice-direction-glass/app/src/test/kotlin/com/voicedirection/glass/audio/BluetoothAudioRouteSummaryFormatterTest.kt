package com.voicedirection.glass.audio

import org.junit.Assert.assertTrue
import org.junit.Test

class BluetoothAudioRouteSummaryFormatterTest {
    @Test
    fun describesSelectedBluetoothScoInput() {
        val summary = BluetoothAudioRouteSummaryFormatter.format(
            BluetoothAudioRouteReport(
                checkedAtMillis = 1L,
                sdkInt = 36,
                communicationRoutingSupported = true,
                recordAudioPermissionGranted = true,
                bluetoothConnectPermissionGranted = true,
                devices = listOf(
                    AudioRouteDevice(
                        id = 10,
                        type = AudioRouteDeviceType.BLUETOOTH_SCO,
                        productName = "Ray-Ban",
                        selected = true,
                    ),
                ),
            ),
        )

        assertTrue(summary.contains("블루투스 입력: 선택됨"))
        assertTrue(summary.contains("bluetooth-sco#10 Ray-Ban selected"))
    }

    @Test
    fun describesUnsupportedCommunicationRouting() {
        val summary = BluetoothAudioRouteSummaryFormatter.format(
            BluetoothAudioRouteReport(
                checkedAtMillis = 1L,
                sdkInt = 30,
                communicationRoutingSupported = false,
                recordAudioPermissionGranted = true,
                bluetoothConnectPermissionGranted = true,
                devices = emptyList(),
            ),
        )

        assertTrue(summary.contains("통신 라우팅: 미지원"))
        assertTrue(summary.contains("통신 장치 없음"))
    }

    @Test
    fun describesMissingBluetoothPermissionError() {
        val summary = BluetoothAudioRouteSummaryFormatter.format(
            BluetoothAudioRouteReport(
                checkedAtMillis = 1L,
                sdkInt = 36,
                communicationRoutingSupported = true,
                recordAudioPermissionGranted = true,
                bluetoothConnectPermissionGranted = false,
                devices = emptyList(),
                error = "bluetooth-connect-permission-required",
            ),
        )

        assertTrue(summary.contains("블루투스 권한: 필요"))
        assertTrue(summary.contains("오류: bluetooth-connect-permission-required"))
    }

    @Test
    fun describesRouteSelectionResult() {
        val selected = AudioRouteDevice(
            id = 10,
            type = AudioRouteDeviceType.BLUETOOTH_SCO,
            productName = "Ray-Ban",
            selected = true,
        )
        val summary = BluetoothAudioRouteSummaryFormatter.formatSelection(
            BluetoothAudioRouteSelectionResult(
                status = BluetoothAudioRouteSelectionStatus.ROUTED,
                selectedDevice = selected,
                report = BluetoothAudioRouteReport(
                    checkedAtMillis = 1L,
                    sdkInt = 36,
                    communicationRoutingSupported = true,
                    recordAudioPermissionGranted = true,
                    bluetoothConnectPermissionGranted = true,
                    devices = listOf(selected),
                ),
            ),
        )

        assertTrue(summary.contains("선택 완료: bluetooth-sco#10 Ray-Ban"))
        assertTrue(summary.contains("블루투스 마이크 경로 점검 완료"))
    }

    @Test
    fun describesRouteClearResult() {
        val summary = BluetoothAudioRouteSummaryFormatter.formatSelection(
            BluetoothAudioRouteSelectionResult(
                status = BluetoothAudioRouteSelectionStatus.CLEARED,
                selectedDevice = null,
                report = BluetoothAudioRouteReport(
                    checkedAtMillis = 1L,
                    sdkInt = 36,
                    communicationRoutingSupported = true,
                    recordAudioPermissionGranted = true,
                    bluetoothConnectPermissionGranted = true,
                    devices = emptyList(),
                ),
            ),
        )

        assertTrue(summary.contains("통신 경로 해제"))
    }
}
