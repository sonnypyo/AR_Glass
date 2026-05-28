package com.voicedirection.glass.alerts

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import com.voicedirection.glass.direction.DirectionCue

class AndroidPhoneVibrationAdapter(
    private val context: Context,
) : AlertOutputAdapter {
    override val channel: AlertChannel = AlertChannel.PHONE_VIBRATION

    override fun emit(cue: DirectionCue): AlertDelivery {
        val summary = VibrationPatternMapper.summaryFor(cue.direction)
        val pattern = summary.timingsMillis.toLongArray()
        val vibrator = context.findVibrator()

        return if (vibrator == null || !vibrator.hasVibrator()) {
            AlertDelivery(channel, delivered = false, message = "phone vibrator unavailable")
        } else {
            vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1))
            AlertDelivery(
                channel = channel,
                delivered = true,
                message = "phone vibration ${summary.direction.name} pattern ${summary.signature}",
            )
        }
    }

    @Suppress("DEPRECATION")
    private fun Context.findVibrator(): Vibrator? =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            getSystemService(VibratorManager::class.java)?.defaultVibrator
        } else {
            getSystemService(Vibrator::class.java)
        }
}
