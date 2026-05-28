package com.voicedirection.glass.alerts

import com.voicedirection.glass.model.CallerDirection
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class DirectionCueOutputContractsTest {
    @Test
    fun rightDirectionContractMatchesAlertAdapters() {
        val contract = DirectionCueOutputContracts.forDirection(
            direction = CallerDirection.RIGHT,
            confidence = 0.82f,
        )

        assertEquals(CallerDirection.RIGHT, contract.direction)
        assertEquals("오른쪽", contract.directionLabel)
        assertEquals(82, contract.confidencePercent)
        assertEquals("방향 알림 점검: 오른쪽 · 신뢰도 82%", contract.notificationText)
        assertEquals("오른쪽에서 호출이 감지됐습니다.", contract.ttsText)
        assertEquals("0-180-80-60", contract.vibrationSignature)
        assertEquals(2, contract.vibrationPulseCount)
        assertEquals(320, contract.vibrationTotalDurationMillis)
        assertFalse(contract.phoneVibrationSideSpecific)
        assertEquals(GlassesHapticTarget.RIGHT, contract.glassesHapticTarget)
        assertEquals(GlassesHapticIntensity.MEDIUM, contract.glassesHapticIntensity)
        assertEquals(2, contract.glassesHapticPulseCount)
        assertTrue(contract.glassesHapticRequiresApiProof)
        assertEquals(
            "direction=RIGHT;target=RIGHT;intensity=MEDIUM;pulseCount=2;perSideIntent=true;apiProofRequired=true;phoneFallbackRequired=true",
            contract.glassesHapticEvidenceSummary,
        )
        assertEquals("direction=RIGHT;confidencePercent=82;labelPresent=false", contract.displayEvidenceSummary)
    }

    @Test
    fun contractEvidenceSummaryDoesNotIncludeSpeakerLabelText() {
        val contract = DirectionCueOutputContracts.forDirection(
            direction = CallerDirection.LEFT,
            confidence = 0.77f,
        )

        assertFalse(contract.displayEvidenceSummary.contains("등록된 사람"))
        assertFalse(contract.displayEvidenceSummary.contains("방향 알림 점검"))
        assertFalse(contract.displayEvidenceSummary.contains("민지"))
        assertFalse(contract.glassesHapticEvidenceSummary.contains("등록된 사람"))
        assertFalse(contract.glassesHapticEvidenceSummary.contains("방향 알림 점검"))
        assertFalse(contract.glassesHapticEvidenceSummary.contains("민지"))
        assertTrue(contract.notificationText.contains("방향 알림 점검"))
    }

    @Test
    fun allDirectionsHaveDistinctVisibleVibrationSignatures() {
        val contracts = DirectionCueOutputContracts.allDirections()

        assertEquals(CallerDirection.entries, contracts.map { contract -> contract.direction })
        assertEquals(
            CallerDirection.entries.size,
            contracts.map { contract -> contract.vibrationSignature }.toSet().size,
        )
    }

    @Test
    fun glassesHapticsIntentMapsDirectionsWithoutClaimingApiProof() {
        val contracts = DirectionCueOutputContracts.allDirections()
            .associateBy { contract -> contract.direction }

        assertEquals(GlassesHapticTarget.BOTH, contracts.getValue(CallerDirection.FRONT).glassesHapticTarget)
        assertEquals(GlassesHapticIntensity.LOW, contracts.getValue(CallerDirection.FRONT).glassesHapticIntensity)
        assertEquals(3, contracts.getValue(CallerDirection.FRONT).glassesHapticPulseCount)
        assertTrue(contracts.getValue(CallerDirection.FRONT).glassesHapticRequiresApiProof)

        assertEquals(GlassesHapticTarget.BOTH, contracts.getValue(CallerDirection.BACK).glassesHapticTarget)
        assertEquals(GlassesHapticIntensity.HIGH, contracts.getValue(CallerDirection.BACK).glassesHapticIntensity)
        assertEquals(2, contracts.getValue(CallerDirection.BACK).glassesHapticPulseCount)
        assertTrue(contracts.getValue(CallerDirection.BACK).glassesHapticRequiresApiProof)

        assertEquals(GlassesHapticTarget.LEFT, contracts.getValue(CallerDirection.LEFT).glassesHapticTarget)
        assertEquals(GlassesHapticTarget.RIGHT, contracts.getValue(CallerDirection.RIGHT).glassesHapticTarget)
        assertEquals(GlassesHapticTarget.NONE, contracts.getValue(CallerDirection.UNKNOWN).glassesHapticTarget)
        assertFalse(contracts.getValue(CallerDirection.UNKNOWN).glassesHapticRequiresApiProof)
    }
}
