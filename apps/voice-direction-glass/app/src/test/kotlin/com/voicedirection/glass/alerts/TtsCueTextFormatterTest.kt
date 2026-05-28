package com.voicedirection.glass.alerts

import com.voicedirection.glass.direction.DirectionCue
import com.voicedirection.glass.model.CallerDirection
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Test

class TtsCueTextFormatterTest {
    @Test
    fun formatsRightDirectionWithoutSpeakerName() {
        val text = TtsCueTextFormatter.format(
            DirectionCue(
                title = "민지 호출 감지",
                body = "오른쪽",
                direction = CallerDirection.RIGHT,
                confidence = 0.8f,
            ),
        )

        assertEquals("오른쪽에서 호출이 감지됐습니다.", text)
        assertFalse(text.contains("민지"))
    }

    @Test
    fun formatsUnknownDirectionConservatively() {
        val text = TtsCueTextFormatter.format(
            DirectionCue(
                title = "호출 감지",
                body = "방향 불명",
                direction = CallerDirection.UNKNOWN,
                confidence = 0.2f,
            ),
        )

        assertEquals("호출이 감지됐습니다. 방향은 확인되지 않았습니다.", text)
    }
}
