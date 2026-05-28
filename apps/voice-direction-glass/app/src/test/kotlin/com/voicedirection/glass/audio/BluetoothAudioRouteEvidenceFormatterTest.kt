package com.voicedirection.glass.audio

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class BluetoothAudioRouteEvidenceFormatterTest {
    @Test
    fun probeEvidenceContainsOnlyRouteTypesAndCounts() {
        val evidence = BluetoothAudioRouteEvidenceFormatter.formatProbe(
            BluetoothAudioRouteReport(
                checkedAtMillis = 10L,
                sdkInt = 36,
                communicationRoutingSupported = true,
                recordAudioPermissionGranted = true,
                bluetoothConnectPermissionGranted = true,
                devices = listOf(
                    AudioRouteDevice(
                        id = 7,
                        type = AudioRouteDeviceType.BLUETOOTH_SCO,
                        productName = "Junpyo Private Ray-Ban",
                        selected = true,
                    ),
                    AudioRouteDevice(
                        id = 8,
                        type = AudioRouteDeviceType.PHONE,
                        productName = "Phone Speaker",
                        selected = false,
                    ),
                ),
            ),
        )

        assertTrue(evidence.contains("mode=probe"))
        assertTrue(evidence.contains("deviceCount=2"))
        assertTrue(evidence.contains("bluetoothInputAvailable=true"))
        assertTrue(evidence.contains("bluetoothInputCandidateCount=1"))
        assertTrue(evidence.contains("selectedBluetoothInputType=BLUETOOTH_SCO"))
        assertTrue(evidence.contains("BLUETOOTH_SCO:1"))
        assertFalse(evidence.contains("Junpyo"))
        assertFalse(evidence.contains("Ray-Ban"))
        assertFalse(evidence.contains("#7"))
    }

    @Test
    fun selectionEvidenceKeepsStatusWithoutDeviceName() {
        val selected = AudioRouteDevice(
            id = 9,
            type = AudioRouteDeviceType.BLE_HEADSET,
            productName = "Private XR Headset",
            selected = true,
        )

        val evidence = BluetoothAudioRouteEvidenceFormatter.formatSelection(
            mode = "select",
            result = BluetoothAudioRouteSelectionResult(
                status = BluetoothAudioRouteSelectionStatus.ROUTED,
                selectedDevice = selected,
                report = BluetoothAudioRouteReport(
                    checkedAtMillis = 12L,
                    sdkInt = 36,
                    communicationRoutingSupported = true,
                    recordAudioPermissionGranted = true,
                    bluetoothConnectPermissionGranted = true,
                    devices = listOf(selected),
                ),
            ),
        )

        assertTrue(evidence.contains("mode=select"))
        assertTrue(evidence.contains("status=ROUTED"))
        assertTrue(evidence.contains("selectedBluetoothInputType=BLE_HEADSET"))
        assertFalse(evidence.contains("Private XR Headset"))
        assertFalse(evidence.contains("#9"))
    }
}
