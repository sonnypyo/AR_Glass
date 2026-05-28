package com.voicedirection.glass.audio

object BluetoothAudioRouteEvidenceFormatter {
    fun formatProbe(report: BluetoothAudioRouteReport): String =
        listOf(
            "passed=true",
            "mode=probe",
            "sdkInt=${report.sdkInt}",
            "communicationRoutingSupported=${report.communicationRoutingSupported}",
            "recordAudioPermissionGranted=${report.recordAudioPermissionGranted}",
            "bluetoothConnectPermissionGranted=${report.bluetoothConnectPermissionGranted}",
            "deviceCount=${report.devices.size}",
            "bluetoothInputAvailable=${report.bluetoothInputAvailable}",
            "bluetoothInputCandidateCount=${report.bluetoothInputCandidateCount()}",
            "selectedBluetoothInputPresent=${report.selectedBluetoothInput != null}",
            "selectedBluetoothInputType=${report.selectedBluetoothInput?.type?.name ?: "NONE"}",
            "routeTypeCounts=${report.routeTypeCounts()}",
            "errorPresent=${report.error != null}",
            "message=pass",
        ).joinToString(";")

    fun formatSelection(mode: String, result: BluetoothAudioRouteSelectionResult): String =
        listOf(
            "passed=true",
            "mode=$mode",
            "status=${result.status.name}",
            "sdkInt=${result.report.sdkInt}",
            "communicationRoutingSupported=${result.report.communicationRoutingSupported}",
            "recordAudioPermissionGranted=${result.report.recordAudioPermissionGranted}",
            "bluetoothConnectPermissionGranted=${result.report.bluetoothConnectPermissionGranted}",
            "deviceCount=${result.report.devices.size}",
            "bluetoothInputAvailable=${result.report.bluetoothInputAvailable}",
            "bluetoothInputCandidateCount=${result.report.bluetoothInputCandidateCount()}",
            "selectedBluetoothInputPresent=${result.selectedDevice != null}",
            "selectedBluetoothInputType=${result.selectedDevice?.type?.name ?: "NONE"}",
            "routeTypeCounts=${result.report.routeTypeCounts()}",
            "errorPresent=${result.report.error != null}",
            "message=pass",
        ).joinToString(";")

    private fun BluetoothAudioRouteReport.bluetoothInputCandidateCount(): Int =
        devices.count { device -> device.type.bluetoothInputCandidate }

    private fun BluetoothAudioRouteReport.routeTypeCounts(): String =
        AudioRouteDeviceType.entries
            .map { type -> "${type.name}:${devices.count { device -> device.type == type }}" }
            .joinToString(",")
}
