package com.voicedirection.glass.devices

import com.voicedirection.glass.direction.DirectionCue
import com.voicedirection.glass.model.CallerDirection
import com.voicedirection.glass.storage.GlassesCueSnapshot
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class GlassesCuePayloadTest {
    @Test
    fun snapshotPayloadKeepsDisplayLabelButRedactsEvidenceSummary() {
        val payload = GlassesCuePayload.fromSnapshot(
            GlassesCueSnapshot(
                speakerLabel = "민지",
                direction = CallerDirection.RIGHT,
                confidence = 0.82f,
                createdAtMillis = 123L,
            ),
        )

        assertEquals("민지 호출 감지", payload.displayTitle)
        assertEquals("오른쪽", payload.directionLabel)
        assertEquals("신뢰도 82%", payload.confidenceLabel)
        assertTrue(payload.speakerLabelPresent)
        assertFalse(payload.evidenceSummary.contains("민지"))
        assertEquals(
            "direction=RIGHT;confidencePercent=82;labelPresent=true",
            payload.evidenceSummary,
        )
    }

    @Test
    fun nullSnapshotPayloadIsIdleAndNonPrivate() {
        val payload = GlassesCuePayload.fromSnapshot(null)

        assertEquals("최근 호출 없음", payload.displayTitle)
        assertEquals(CallerDirection.UNKNOWN, payload.direction)
        assertEquals("direction=UNKNOWN;confidencePercent=0;labelPresent=false", payload.evidenceSummary)
    }

    @Test
    fun stubAdaptersDoNotEchoSpeakerLabelInDeliveryMessage() {
        val cue = DirectionCue(
            title = "민지 호출 감지",
            body = "오른쪽 · 신뢰도 82%",
            direction = CallerDirection.RIGHT,
            confidence = 0.82f,
        )
        val meta = MetaDatDisplayStubAdapter(GlassesConnectionState.CONNECTED).emitCue(cue)
        val xr = AndroidXrDisplayStubAdapter(GlassesConnectionState.CONNECTED).emitCue(cue)

        assertTrue(meta.delivered)
        assertTrue(xr.delivered)
        assertFalse(meta.message.contains("민지"))
        assertFalse(xr.message.contains("민지"))
        assertTrue(meta.message.contains("direction=RIGHT"))
        assertTrue(xr.message.contains("labelPresent=true"))
    }
}
