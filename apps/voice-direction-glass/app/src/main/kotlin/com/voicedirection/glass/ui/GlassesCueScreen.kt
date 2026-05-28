package com.voicedirection.glass.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.voicedirection.glass.devices.GlassesCuePayload

@Composable
fun GlassesCueScreen(
    payload: GlassesCuePayload,
    statusLabel: String,
) {
    MaterialTheme {
        Surface(modifier = Modifier.fillMaxSize()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp),
                contentAlignment = Alignment.Center,
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Text(statusLabel, style = MaterialTheme.typography.labelLarge)
                    Text(payload.displayTitle, style = MaterialTheme.typography.titleLarge)
                    Text(payload.directionLabel, style = MaterialTheme.typography.headlineLarge)
                    Text(payload.confidenceLabel)
                }
            }
        }
    }
}
