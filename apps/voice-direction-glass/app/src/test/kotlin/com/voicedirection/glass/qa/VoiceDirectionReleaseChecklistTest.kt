package com.voicedirection.glass.qa

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class VoiceDirectionReleaseChecklistTest {
    @Test
    fun idsAreUnique() {
        val ids = VoiceDirectionReleaseChecklist.items.map { item -> item.id }

        assertEquals(ids.toSet().size, ids.size)
    }

    @Test
    fun internalPrototypeIsReady() {
        val summary = VoiceDirectionReleaseChecklist.summaryFor(ReleaseTarget.INTERNAL_PROTOTYPE)

        assertTrue(summary.ready)
        assertTrue(VoiceDirectionReleaseChecklist.isReadyFor(ReleaseTarget.INTERNAL_PROTOTYPE))
        assertEquals(3, summary.totalRequired)
        assertEquals(3, summary.passed)
        assertEquals(0, summary.manualRequired)
        assertEquals(0, summary.blocked)
    }

    @Test
    fun phonePrivateAlphaStillNeedsManualDeviceEvidence() {
        val summary = VoiceDirectionReleaseChecklist.summaryFor(ReleaseTarget.PHONE_PRIVATE_ALPHA)
        val openIds = summary.openBlockingItems.map { item -> item.id }

        assertFalse(summary.ready)
        assertEquals(14, summary.manualRequired)
        assertEquals(0, summary.blocked)
        assertTrue(openIds.contains("physical-phone-smoke"))
        assertTrue(openIds.contains("foreground-service-runtime-loop"))
        assertTrue(openIds.contains("tts-direction-device-qa"))
        assertTrue(openIds.contains("direction-validation-device-qa"))
        assertTrue(openIds.contains("repository-self-check-device-qa"))
        assertTrue(openIds.contains("evidence-snapshot-device-qa"))
        assertTrue(openIds.contains("debug-alert-output-device-qa"))
        assertTrue(openIds.contains("debug-direction-sample-device-qa"))
        assertTrue(openIds.contains("debug-glasses-cue-seed-device-qa"))
        assertTrue(openIds.contains("debug-bluetooth-route-evidence-device-qa"))
        assertTrue(openIds.contains("debug-local-delete-self-check-device-qa"))
        assertTrue(openIds.contains("alert-channel-preferences-device-qa"))
        assertTrue(VoiceDirectionReleaseChecklist.blockedItemsFor(ReleaseTarget.PHONE_PRIVATE_ALPHA).isEmpty())
    }

    @Test
    fun phonePrivateAlphaOpenItemsCarryOperatorEvidenceAndNextActions() {
        val openItems = VoiceDirectionReleaseChecklist.openItemsFor(ReleaseTarget.PHONE_PRIVATE_ALPHA)

        assertTrue(openItems.isNotEmpty())
        assertTrue(openItems.all { item -> item.title.isNotBlank() })
        assertTrue(openItems.all { item -> item.evidence.isNotBlank() })
        assertTrue(openItems.all { item -> item.nextAction.isNotBlank() })
        assertEquals("physical-phone-smoke", openItems.first().id)
        assertTrue(openItems.first().nextAction.contains("android-device-smoke-test.sh"))
    }

    @Test
    fun glassesPrivateAlphaIsBlockedBySdkAndHardwareProofs() {
        val blockedIds = VoiceDirectionReleaseChecklist
            .blockedItemsFor(ReleaseTarget.GLASSES_PRIVATE_ALPHA)
            .map { item -> item.id }

        assertTrue(blockedIds.contains("meta-dat-credentials"))
        assertTrue(blockedIds.contains("meta-display-cue"))
        assertTrue(blockedIds.contains("android-xr-device-proof"))
    }

    @Test
    fun externalBetaStillNeedsEncryptedStorageDeviceProofAndModelWork() {
        val manualIds = VoiceDirectionReleaseChecklist
            .manualItemsFor(ReleaseTarget.EXTERNAL_BETA)
            .map { item -> item.id }
        val blockedIds = VoiceDirectionReleaseChecklist
            .blockedItemsFor(ReleaseTarget.EXTERNAL_BETA)
            .map { item -> item.id }

        assertTrue(manualIds.contains("encrypted-local-storage"))
        assertTrue(manualIds.contains("privacy-consent-copy"))
        assertTrue(blockedIds.contains("production-speaker-model"))
    }

    @Test
    fun productionServiceIncludesDirectionPolicyBlockersAndSupportManualDrill() {
        val blockedIds = VoiceDirectionReleaseChecklist
            .blockedItemsFor(ReleaseTarget.PRODUCTION_SERVICE)
            .map { item -> item.id }
        val manualIds = VoiceDirectionReleaseChecklist
            .manualItemsFor(ReleaseTarget.PRODUCTION_SERVICE)
            .map { item -> item.id }

        assertTrue(blockedIds.contains("front-back-direction-evidence"))
        assertTrue(blockedIds.contains("store-and-sdk-policy-clearance"))
        assertTrue(manualIds.contains("support-incident-process"))
    }
}
