package com.voicedirection.glass.audio

enum class AudioRouteDeviceType(
    val displayLabel: String,
    val bluetoothInputCandidate: Boolean,
) {
    PHONE("phone", false),
    BLUETOOTH_SCO("bluetooth-sco", true),
    BLUETOOTH_A2DP("bluetooth-a2dp", false),
    BLE_HEADSET("ble-headset", true),
    WIRED_HEADSET("wired-headset", false),
    USB_HEADSET("usb-headset", false),
    OTHER("other", false),
}

data class AudioRouteDevice(
    val id: Int,
    val type: AudioRouteDeviceType,
    val productName: String,
    val selected: Boolean,
)

data class BluetoothAudioRouteReport(
    val checkedAtMillis: Long,
    val sdkInt: Int,
    val communicationRoutingSupported: Boolean,
    val recordAudioPermissionGranted: Boolean,
    val bluetoothConnectPermissionGranted: Boolean,
    val devices: List<AudioRouteDevice>,
    val error: String? = null,
) {
    val bluetoothInputAvailable: Boolean
        get() = devices.any { it.type.bluetoothInputCandidate }

    val selectedBluetoothInput: AudioRouteDevice?
        get() = devices.firstOrNull { it.selected && it.type.bluetoothInputCandidate }
}

interface BluetoothAudioRouteProbe {
    fun probe(): BluetoothAudioRouteReport

    fun selectBluetoothInput(): BluetoothAudioRouteSelectionResult

    fun clearSelectedRoute(): BluetoothAudioRouteSelectionResult
}

enum class BluetoothAudioRouteSelectionStatus {
    ROUTED,
    CLEARED,
    NO_BLUETOOTH_INPUT,
    UNSUPPORTED_SDK,
    PERMISSION_REQUIRED,
    AUDIO_MANAGER_UNAVAILABLE,
    FAILED,
}

data class BluetoothAudioRouteSelectionResult(
    val status: BluetoothAudioRouteSelectionStatus,
    val selectedDevice: AudioRouteDevice?,
    val report: BluetoothAudioRouteReport,
)
