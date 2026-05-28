package com.voicedirection.glass.alerts

import com.voicedirection.glass.direction.DirectionCue
import com.voicedirection.glass.model.CallerDirection

object TtsCueTextFormatter {
    fun format(cue: DirectionCue): String =
        when (cue.direction) {
            CallerDirection.FRONT -> "앞쪽에서 호출이 감지됐습니다."
            CallerDirection.BACK -> "뒤쪽에서 호출이 감지됐습니다."
            CallerDirection.LEFT -> "왼쪽에서 호출이 감지됐습니다."
            CallerDirection.RIGHT -> "오른쪽에서 호출이 감지됐습니다."
            CallerDirection.UNKNOWN -> "호출이 감지됐습니다. 방향은 확인되지 않았습니다."
        }
}
