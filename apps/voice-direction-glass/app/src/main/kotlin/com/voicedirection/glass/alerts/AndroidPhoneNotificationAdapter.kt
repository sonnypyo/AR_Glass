package com.voicedirection.glass.alerts

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import com.voicedirection.glass.direction.DirectionCue

class AndroidPhoneNotificationAdapter(
    private val context: Context,
) : AlertOutputAdapter {
    override val channel: AlertChannel = AlertChannel.PHONE_NOTIFICATION

    override fun emit(cue: DirectionCue): AlertDelivery {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            return AlertDelivery(channel, delivered = false, message = "notification permission not granted")
        }

        val notificationManager = context.getSystemService(NotificationManager::class.java)
        notificationManager.createVoiceDirectionChannel()

        val notification = Notification.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(cue.title)
            .setContentText(cue.body)
            .setStyle(Notification.BigTextStyle().bigText(cue.body))
            .setAutoCancel(true)
            .build()

        notificationManager.notify(NOTIFICATION_ID, notification)
        return AlertDelivery(channel, delivered = true, message = "${cue.title}: ${cue.body}")
    }

    private fun NotificationManager.createVoiceDirectionChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Voice direction alerts",
                NotificationManager.IMPORTANCE_HIGH,
            )
            createNotificationChannel(channel)
        }
    }

    companion object {
        private const val CHANNEL_ID = "voice_direction_alerts"
        private const val NOTIFICATION_ID = 1001
    }
}
