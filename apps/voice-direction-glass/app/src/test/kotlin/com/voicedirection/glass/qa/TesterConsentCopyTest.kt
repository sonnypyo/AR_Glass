package com.voicedirection.glass.qa

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class TesterConsentCopyTest {
    @Test
    fun microphoneDisclosureCoversPermissionUseStorageAndControls() {
        val copy = VoiceDirectionTesterConsent.microphoneDisclosure
        val combined = (
            copy.microphoneUses +
                copy.dataHandling +
                copy.userControls
            ).joinToString(" ")

        assertTrue(copy.readyForRuntimePermissionPrompt)
        assertTrue(combined.contains("호출 문구"))
        assertTrue(combined.contains("원본 음성"))
        assertTrue(combined.contains("저장하지 않습니다"))
        assertTrue(combined.contains("전경 알림"))
        assertTrue(combined.contains("중지"))
        assertTrue(copy.version.startsWith("microphone-disclosure-"))
    }

    @Test
    fun copyCoversStorageDeletionAndPrototypeLimits() {
        val copy = VoiceDirectionTesterConsent.copy
        val combined = (
            copy.dataStored +
                copy.dataNotStored +
                copy.limitations +
                copy.testerCommitments
            ).joinToString(" ")

        assertTrue(copy.readyForPrivateTesterReview)
        assertTrue(combined.contains("원본 음성"))
        assertTrue(combined.contains("프로토타입"))
        assertTrue(combined.contains("앞/뒤"))
        assertTrue(combined.contains("삭제"))
    }

    @Test
    fun copyDoesNotClaimProductionReadiness() {
        val combined = (
            VoiceDirectionTesterConsent.copy.headline +
                VoiceDirectionTesterConsent.copy.limitations.joinToString(" ")
            )

        assertFalse(combined.contains("정확한 방향을 보장"))
        assertFalse(combined.contains("프로덕션 준비"))
    }
}
