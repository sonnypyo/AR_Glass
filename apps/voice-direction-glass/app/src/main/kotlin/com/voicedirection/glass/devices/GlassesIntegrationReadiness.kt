package com.voicedirection.glass.devices

enum class GlassesPlatform {
    META_DAT,
    ANDROID_XR,
}

enum class GlassesReadinessStatus {
    PASS,
    MANUAL_REQUIRED,
    BLOCKED,
}

data class GlassesReadinessItem(
    val id: String,
    val platform: GlassesPlatform,
    val status: GlassesReadinessStatus,
    val title: String,
    val evidence: String,
    val nextAction: String,
    val blocksGlassesAlpha: Boolean = true,
)

data class GlassesReadinessSummary(
    val platform: GlassesPlatform,
    val totalItems: Int,
    val passed: Int,
    val manualRequired: Int,
    val blocked: Int,
    val openItems: List<GlassesReadinessItem>,
) {
    val readyForGlassesAlpha: Boolean = openItems.isEmpty()
}

object GlassesIntegrationReadiness {
    val items: List<GlassesReadinessItem> = listOf(
        GlassesReadinessItem(
            id = "phone-projected-preview",
            platform = GlassesPlatform.ANDROID_XR,
            status = GlassesReadinessStatus.PASS,
            title = "Phone-hosted projected cue preview exists",
            evidence = "GlassesProjectedActivity renders the latest locally stored actionable cue.",
            nextAction = "Run it on projected Android XR hardware or emulator.",
            blocksGlassesAlpha = false,
        ),
        GlassesReadinessItem(
            id = "meta-dat-credentials",
            platform = GlassesPlatform.META_DAT,
            status = GlassesReadinessStatus.BLOCKED,
            title = "Meta DAT credentials and package access",
            evidence = "No Meta app id or GitHub package token is configured in this workspace.",
            nextAction = "Add credentials outside source control, then replace MetaDatDisplayStubAdapter.",
        ),
        GlassesReadinessItem(
            id = "meta-dat-real-adapter",
            platform = GlassesPlatform.META_DAT,
            status = GlassesReadinessStatus.BLOCKED,
            title = "Real Meta DAT display adapter",
            evidence = "MetaDatDisplayStubAdapter is still the active adapter.",
            nextAction = "Implement DAT registration, session lifecycle, and display cue emission.",
        ),
        GlassesReadinessItem(
            id = "meta-rayban-display-proof",
            platform = GlassesPlatform.META_DAT,
            status = GlassesReadinessStatus.MANUAL_REQUIRED,
            title = "Ray-Ban Display cue proof",
            evidence = "No physical Ray-Ban Display evidence report exists yet; docs/25-glasses-hardware-evidence.md defines the strict hardware evidence gate.",
            nextAction = "Run a device session, record cue rendering or a documented SDK/device limitation, and pass scripts/validate-glasses-hardware-evidence.mjs --require-glasses-alpha-ready --json before claiming glasses alpha.",
        ),
        GlassesReadinessItem(
            id = "rayban-bluetooth-hfp-route-proof",
            platform = GlassesPlatform.META_DAT,
            status = GlassesReadinessStatus.MANUAL_REQUIRED,
            title = "Ray-Ban Bluetooth microphone route proof",
            evidence = "The app can probe Android communication devices, but no Ray-Ban HFP/BLE route evidence exists yet; docs/25-glasses-hardware-evidence.md tracks fallback evidence.",
            nextAction = "Pair Ray-Ban glasses, run the Bluetooth microphone route probe, record SCO/BLE headset visibility, and update the glasses hardware evidence manifest.",
        ),
        GlassesReadinessItem(
            id = "android-xr-runtime-proof",
            platform = GlassesPlatform.ANDROID_XR,
            status = GlassesReadinessStatus.MANUAL_REQUIRED,
            title = "Android XR projected runtime proof",
            evidence = "Projected activity compiles, but no Android XR runtime evidence exists yet; docs/25-glasses-hardware-evidence.md tracks projected display proof.",
            nextAction = "Run on Android XR hardware/emulator, record projected display behavior, and update the glasses hardware evidence manifest.",
        ),
        GlassesReadinessItem(
            id = "android-xr-real-adapter",
            platform = GlassesPlatform.ANDROID_XR,
            status = GlassesReadinessStatus.BLOCKED,
            title = "Real Android XR projected integration",
            evidence = "AndroidXrDisplayStubAdapter is still the active adapter.",
            nextAction = "Add Jetpack XR projected dependencies and replace the stub adapter.",
        ),
        GlassesReadinessItem(
            id = "android-xr-bluetooth-hfp-route-proof",
            platform = GlassesPlatform.ANDROID_XR,
            status = GlassesReadinessStatus.MANUAL_REQUIRED,
            title = "Android XR Bluetooth microphone fallback proof",
            evidence = "The app can probe Android communication devices, but no Android XR HFP/BLE route evidence exists yet.",
            nextAction = "Pair Android XR audio/display glasses, run the Bluetooth route probe, and compare with projected-context microphone behavior.",
        ),
        GlassesReadinessItem(
            id = "wearable-direction-evidence",
            platform = GlassesPlatform.META_DAT,
            status = GlassesReadinessStatus.BLOCKED,
            title = "Wearable microphone direction evidence",
            evidence = "No Meta or Android XR hardware has proven usable direction-of-arrival data; docs/25 separates hardware proof from docs/22 direction accuracy proof.",
            nextAction = "Record whether official APIs expose mic/channel data useful for direction, then keep docs/22 strict direction validation blocked until controlled trials pass.",
        ),
        GlassesReadinessItem(
            id = "glasses-haptics-api-proof",
            platform = GlassesPlatform.META_DAT,
            status = GlassesReadinessStatus.BLOCKED,
            title = "Glasses-side haptics API proof",
            evidence = "Per-side glasses vibration is not confirmed by current implementation evidence; docs/25 records haptics as documented_not_available.",
            nextAction = "Use phone vibration until an official glasses haptics path is verified and captured in the glasses hardware evidence manifest.",
        ),
    )

    fun itemsFor(platform: GlassesPlatform): List<GlassesReadinessItem> =
        items.filter { item -> item.platform == platform }

    fun summaryFor(platform: GlassesPlatform): GlassesReadinessSummary {
        val platformItems = itemsFor(platform)
        val openItems = platformItems.filter { item ->
            item.blocksGlassesAlpha && item.status != GlassesReadinessStatus.PASS
        }
        return GlassesReadinessSummary(
            platform = platform,
            totalItems = platformItems.size,
            passed = platformItems.count { item -> item.status == GlassesReadinessStatus.PASS },
            manualRequired = platformItems.count { item -> item.status == GlassesReadinessStatus.MANUAL_REQUIRED },
            blocked = platformItems.count { item -> item.status == GlassesReadinessStatus.BLOCKED },
            openItems = openItems,
        )
    }

    fun openItemsForGlassesAlpha(): List<GlassesReadinessItem> =
        GlassesPlatform.entries.flatMap { platform -> summaryFor(platform).openItems }

    fun isReadyForGlassesAlpha(): Boolean =
        openItemsForGlassesAlpha().isEmpty()
}
