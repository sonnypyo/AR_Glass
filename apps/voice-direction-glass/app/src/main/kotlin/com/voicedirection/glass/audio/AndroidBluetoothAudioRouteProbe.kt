package com.voicedirection.glass.audio

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.os.Build

class AndroidBluetoothAudioRouteProbe(
    private val context: Context,
    private val clockMillis: () -> Long = { System.currentTimeMillis() },
) : BluetoothAudioRouteProbe {
    override fun probe(): BluetoothAudioRouteReport {
        val audioManager = context.getSystemService(AudioManager::class.java)
        val sdkInt = Build.VERSION.SDK_INT
        val recordAudioGranted = context.checkSelfPermission(
            Manifest.permission.RECORD_AUDIO,
        ) == PackageManager.PERMISSION_GRANTED
        val bluetoothConnectGranted = sdkInt < Build.VERSION_CODES.S ||
            context.checkSelfPermission(
                Manifest.permission.BLUETOOTH_CONNECT,
            ) == PackageManager.PERMISSION_GRANTED

        if (sdkInt < Build.VERSION_CODES.S) {
            return BluetoothAudioRouteReport(
                checkedAtMillis = clockMillis(),
                sdkInt = sdkInt,
                communicationRoutingSupported = false,
                recordAudioPermissionGranted = recordAudioGranted,
                bluetoothConnectPermissionGranted = bluetoothConnectGranted,
                devices = emptyList(),
            )
        }

        if (audioManager == null) {
            return BluetoothAudioRouteReport(
                checkedAtMillis = clockMillis(),
                sdkInt = sdkInt,
                communicationRoutingSupported = true,
                recordAudioPermissionGranted = recordAudioGranted,
                bluetoothConnectPermissionGranted = bluetoothConnectGranted,
                devices = emptyList(),
                error = "audio-manager-unavailable",
            )
        }

        return try {
            val selectedId = audioManager.communicationDevice?.id
            val devices = audioManager.availableCommunicationDevices.map { device ->
                AudioRouteDevice(
                    id = device.id,
                    type = device.routeType(),
                    productName = device.productName?.toString().orEmpty().ifBlank { "unknown" },
                    selected = device.id == selectedId,
                )
            }
            BluetoothAudioRouteReport(
                checkedAtMillis = clockMillis(),
                sdkInt = sdkInt,
                communicationRoutingSupported = true,
                recordAudioPermissionGranted = recordAudioGranted,
                bluetoothConnectPermissionGranted = bluetoothConnectGranted,
                devices = devices,
            )
        } catch (securityException: SecurityException) {
            BluetoothAudioRouteReport(
                checkedAtMillis = clockMillis(),
                sdkInt = sdkInt,
                communicationRoutingSupported = true,
                recordAudioPermissionGranted = recordAudioGranted,
                bluetoothConnectPermissionGranted = false,
                devices = emptyList(),
                error = "bluetooth-connect-permission-required",
            )
        }
    }

    override fun selectBluetoothInput(): BluetoothAudioRouteSelectionResult {
        val report = probe()
        if (!report.communicationRoutingSupported) {
            return BluetoothAudioRouteSelectionResult(
                status = BluetoothAudioRouteSelectionStatus.UNSUPPORTED_SDK,
                selectedDevice = null,
                report = report,
            )
        }
        if (!report.bluetoothConnectPermissionGranted || !report.recordAudioPermissionGranted) {
            return BluetoothAudioRouteSelectionResult(
                status = BluetoothAudioRouteSelectionStatus.PERMISSION_REQUIRED,
                selectedDevice = null,
                report = report,
            )
        }
        val audioManager = context.getSystemService(AudioManager::class.java)
            ?: return BluetoothAudioRouteSelectionResult(
                status = BluetoothAudioRouteSelectionStatus.AUDIO_MANAGER_UNAVAILABLE,
                selectedDevice = null,
                report = report,
            )
        val target = audioManager.availableCommunicationDevices.firstOrNull { device ->
            device.routeType().bluetoothInputCandidate
        } ?: return BluetoothAudioRouteSelectionResult(
            status = BluetoothAudioRouteSelectionStatus.NO_BLUETOOTH_INPUT,
            selectedDevice = null,
            report = report,
        )

        return try {
            val routed = audioManager.setCommunicationDevice(target)
            val updatedReport = probe()
            BluetoothAudioRouteSelectionResult(
                status = if (routed) {
                    BluetoothAudioRouteSelectionStatus.ROUTED
                } else {
                    BluetoothAudioRouteSelectionStatus.FAILED
                },
                selectedDevice = updatedReport.selectedBluetoothInput,
                report = updatedReport,
            )
        } catch (securityException: SecurityException) {
            BluetoothAudioRouteSelectionResult(
                status = BluetoothAudioRouteSelectionStatus.PERMISSION_REQUIRED,
                selectedDevice = null,
                report = report.copy(error = "bluetooth-connect-permission-required"),
            )
        }
    }

    override fun clearSelectedRoute(): BluetoothAudioRouteSelectionResult {
        val report = probe()
        if (!report.communicationRoutingSupported) {
            return BluetoothAudioRouteSelectionResult(
                status = BluetoothAudioRouteSelectionStatus.UNSUPPORTED_SDK,
                selectedDevice = null,
                report = report,
            )
        }
        val audioManager = context.getSystemService(AudioManager::class.java)
            ?: return BluetoothAudioRouteSelectionResult(
                status = BluetoothAudioRouteSelectionStatus.AUDIO_MANAGER_UNAVAILABLE,
                selectedDevice = null,
                report = report,
            )

        return try {
            audioManager.clearCommunicationDevice()
            BluetoothAudioRouteSelectionResult(
                status = BluetoothAudioRouteSelectionStatus.CLEARED,
                selectedDevice = null,
                report = probe(),
            )
        } catch (securityException: SecurityException) {
            BluetoothAudioRouteSelectionResult(
                status = BluetoothAudioRouteSelectionStatus.PERMISSION_REQUIRED,
                selectedDevice = null,
                report = report.copy(error = "bluetooth-connect-permission-required"),
            )
        }
    }

    private fun AudioDeviceInfo.routeType(): AudioRouteDeviceType =
        when (type) {
            AudioDeviceInfo.TYPE_BUILTIN_EARPIECE,
            AudioDeviceInfo.TYPE_BUILTIN_SPEAKER,
            AudioDeviceInfo.TYPE_TELEPHONY -> AudioRouteDeviceType.PHONE
            AudioDeviceInfo.TYPE_BLUETOOTH_SCO -> AudioRouteDeviceType.BLUETOOTH_SCO
            AudioDeviceInfo.TYPE_BLUETOOTH_A2DP -> AudioRouteDeviceType.BLUETOOTH_A2DP
            AudioDeviceInfo.TYPE_WIRED_HEADSET,
            AudioDeviceInfo.TYPE_WIRED_HEADPHONES -> AudioRouteDeviceType.WIRED_HEADSET
            AudioDeviceInfo.TYPE_USB_HEADSET,
            AudioDeviceInfo.TYPE_USB_DEVICE -> AudioRouteDeviceType.USB_HEADSET
            else -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
                type == AudioDeviceInfo.TYPE_BLE_HEADSET
            ) {
                AudioRouteDeviceType.BLE_HEADSET
            } else {
                AudioRouteDeviceType.OTHER
            }
        }
}
