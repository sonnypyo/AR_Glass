package com.voicedirection.glass.model

enum class CallerDirection {
    FRONT,
    BACK,
    LEFT,
    RIGHT,
    UNKNOWN,
}

fun CallerDirection.displayLabel(): String =
    when (this) {
        CallerDirection.FRONT -> "앞쪽"
        CallerDirection.BACK -> "뒤쪽"
        CallerDirection.LEFT -> "왼쪽"
        CallerDirection.RIGHT -> "오른쪽"
        CallerDirection.UNKNOWN -> "방향 불명"
    }
