package com.voicedirection.glass.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class ListeningControlReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == ListeningForegroundService.ACTION_STOP) {
            ListeningForegroundService.stop(context)
        }
    }
}
