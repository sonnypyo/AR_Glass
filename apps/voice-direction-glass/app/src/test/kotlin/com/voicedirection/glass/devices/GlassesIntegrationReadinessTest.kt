package com.voicedirection.glass.devices

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class GlassesIntegrationReadinessTest {
    @Test
    fun glassesAlphaIsNotReadyWhileRealAdaptersAreStubbed() {
        assertFalse(GlassesIntegrationReadiness.isReadyForGlassesAlpha())

        val openIds = GlassesIntegrationReadiness
            .openItemsForGlassesAlpha()
            .map { item -> item.id }

        assertTrue(openIds.contains("meta-dat-real-adapter"))
        assertTrue(openIds.contains("android-xr-real-adapter"))
    }

    @Test
    fun metaReadinessIncludesCredentialsDisplayProofAndWearableEvidence() {
        val openIds = GlassesIntegrationReadiness
            .summaryFor(GlassesPlatform.META_DAT)
            .openItems
            .map { item -> item.id }

        assertTrue(openIds.contains("meta-dat-credentials"))
        assertTrue(openIds.contains("meta-rayban-display-proof"))
        assertTrue(openIds.contains("rayban-bluetooth-hfp-route-proof"))
        assertTrue(openIds.contains("wearable-direction-evidence"))
        assertTrue(openIds.contains("glasses-haptics-api-proof"))
    }

    @Test
    fun androidXrPreviewDoesNotCloseRuntimeOrRealAdapterGate() {
        val summary = GlassesIntegrationReadiness.summaryFor(GlassesPlatform.ANDROID_XR)
        val openIds = summary.openItems.map { item -> item.id }

        assertTrue(summary.passed > 0)
        assertTrue(openIds.contains("android-xr-runtime-proof"))
        assertTrue(openIds.contains("android-xr-real-adapter"))
        assertTrue(openIds.contains("android-xr-bluetooth-hfp-route-proof"))
    }
}
