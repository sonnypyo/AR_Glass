package com.voicedirection.glass.service

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.drawable.Icon
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import com.voicedirection.glass.app.MainActivity
import com.voicedirection.glass.audio.AndroidAudioCapabilityProbe
import com.voicedirection.glass.audio.AndroidStereoDirectionSampler
import com.voicedirection.glass.audio.AudioDirectionSampler
import com.voicedirection.glass.diagnostics.DiagnosticsLogger
import com.voicedirection.glass.direction.DirectionInput
import com.voicedirection.glass.direction.SimulatedDirectionEstimator
import com.voicedirection.glass.enrollment.AndroidVoiceEnrollmentSampler
import com.voicedirection.glass.enrollment.VoiceEnrollmentSampleResult
import com.voicedirection.glass.enrollment.VoiceEnrollmentSampler
import com.voicedirection.glass.model.displayLabel
import com.voicedirection.glass.session.AndroidListeningEngineFactory
import com.voicedirection.glass.session.ListeningSessionEngine
import com.voicedirection.glass.session.ListeningSessionResult
import com.voicedirection.glass.session.ListeningSessionState
import com.voicedirection.glass.session.PrototypeVoiceSessionEngine
import com.voicedirection.glass.session.PrototypeVoiceSessionResult
import com.voicedirection.glass.session.ServiceDirectionResolver
import com.voicedirection.glass.speech.AndroidSpeechRecognitionController
import com.voicedirection.glass.speech.SpeechRecognitionController
import com.voicedirection.glass.storage.AlertDeliverySnapshot
import com.voicedirection.glass.storage.GlassesCueSnapshot
import com.voicedirection.glass.storage.ServiceAutomationBridgeSnapshot
import com.voicedirection.glass.storage.VoiceDirectionSnapshot
import com.voicedirection.glass.storage.PreferencesVoiceDirectionRepository
import com.voicedirection.glass.storage.VoiceDirectionRepository

class ListeningForegroundService : Service() {
    private val mainHandler = Handler(Looper.getMainLooper())
    private lateinit var repository: VoiceDirectionRepository
    private lateinit var speechRecognitionController: SpeechRecognitionController
    private lateinit var voiceEnrollmentSampler: VoiceEnrollmentSampler
    private lateinit var audioDirectionSampler: AudioDirectionSampler
    private lateinit var serviceDirectionResolver: ServiceDirectionResolver
    private lateinit var engine: ListeningSessionEngine
    private lateinit var prototypeVoiceEngine: PrototypeVoiceSessionEngine
    private var loopActive = false

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        repository = PreferencesVoiceDirectionRepository(this)
        speechRecognitionController = AndroidSpeechRecognitionController(this)
        voiceEnrollmentSampler = AndroidVoiceEnrollmentSampler(this)
        audioDirectionSampler = AndroidStereoDirectionSampler(AndroidAudioCapabilityProbe(this))
        serviceDirectionResolver = ServiceDirectionResolver(
            audioDirectionSampler = audioDirectionSampler,
            fallbackDirectionEstimator = SimulatedDirectionEstimator(),
        )
        engine = AndroidListeningEngineFactory.create(this) {
            repository.loadSnapshot().settings.enabledAlertChannels
        }
        prototypeVoiceEngine = AndroidListeningEngineFactory.createPrototypeVoiceSessionEngine(this) {
            repository.loadSnapshot().settings.enabledAlertChannels
        }
        createNotificationChannel()
        DiagnosticsLogger.info("service_created")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            DiagnosticsLogger.info("service_stop_action_received")
            stopSelf()
            return START_NOT_STICKY
        }

        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            DiagnosticsLogger.warn("service_start_blocked", "reason" to "missing_record_audio")
            startForeground(NOTIFICATION_ID, buildNotification("마이크 권한이 필요합니다."))
            stopSelf()
            return START_NOT_STICKY
        }

        startForeground(NOTIFICATION_ID, buildNotification("저장된 화자의 호출을 감지하는 세션입니다."))
        isRunning = true
        DiagnosticsLogger.info("service_foreground_started")
        startRecognitionLoop()
        return START_STICKY
    }

    override fun onDestroy() {
        loopActive = false
        mainHandler.removeCallbacksAndMessages(null)
        speechRecognitionController.release()
        isRunning = false
        stopForegroundCompat()
        DiagnosticsLogger.info("service_destroyed")
        super.onDestroy()
    }

    private fun startRecognitionLoop() {
        if (loopActive) {
            DiagnosticsLogger.info("recognition_loop_already_active")
            return
        }
        loopActive = true
        DiagnosticsLogger.info("recognition_loop_started")
        scheduleNextListen(delayMillis = 0L)
    }

    private fun scheduleNextListen(delayMillis: Long) {
        mainHandler.postDelayed(
            {
                if (loopActive) {
                    listenOnceFromService()
                }
            },
            delayMillis,
        )
    }

    private fun listenOnceFromService() {
        updateNotification("음성 호출 대기 중")
        DiagnosticsLogger.info("service_recognition_listen_started")
        speechRecognitionController.listenOnce(
            onResult = { transcript ->
                if (loopActive) {
                    handleRecognizedTranscript(transcript)
                }
            },
            onError = { message ->
                if (loopActive) {
                    DiagnosticsLogger.warn(
                        "service_recognition_error",
                        "messagePresent" to message.isNotBlank(),
                    )
                    updateNotification(message)
                    scheduleNextListen(LISTEN_ERROR_BACKOFF_MILLIS)
                }
            },
        )
    }

    private fun handleRecognizedTranscript(transcript: String) {
        val snapshot = repository.loadSnapshot()
        if (prototypeVoiceEngine.shouldCaptureLiveSample(
                transcript = transcript,
                triggerPhrase = snapshot.settings.triggerPhrase,
                profiles = snapshot.profiles,
            )
        ) {
            updateNotification("호출 문구 감지 · 화자 샘플 확인 중")
            DiagnosticsLogger.info(
                "service_prototype_voice_sample_started",
                "profileCount" to snapshot.profiles.size,
            )
            Thread {
                val sample = voiceEnrollmentSampler.captureSample()
                mainHandler.post {
                    if (loopActive) {
                        val refreshedSnapshot = repository.loadSnapshot()
                        evaluatePrototypeVoiceAndContinue(
                            transcript = transcript,
                            snapshot = refreshedSnapshot,
                            sample = sample,
                        )
                    }
                }
            }.start()
        } else {
            evaluateTranscriptSimulationAndContinue(transcript)
        }
    }

    private fun evaluateTranscriptSimulationAndContinue(transcript: String) {
        val result = engine.evaluate(buildState(transcript))
        persistResult(result)
        DiagnosticsLogger.detection(
            eventName = "service_evaluation_completed",
            event = result.event,
            deliveryCount = result.deliveries.size,
            cueSaved = result.event.isActionable,
        )
        updateNotificationForEvent(result.event)
        scheduleNextListen(LISTEN_RESTART_DELAY_MILLIS)
    }

    private fun evaluatePrototypeVoiceAndContinue(
        transcript: String,
        snapshot: VoiceDirectionSnapshot,
        sample: VoiceEnrollmentSampleResult,
    ) {
        val directionInput = DirectionInput(
            simulatedDirection = snapshot.settings.simulatedDirection,
            simulatedConfidence = snapshot.settings.simulatedDirectionConfidence,
        )
        val directionResolution = serviceDirectionResolver.resolve(directionInput)
        val result = prototypeVoiceEngine.evaluate(
            transcript = transcript,
            triggerPhrase = snapshot.settings.triggerPhrase,
            liveSample = sample,
            profiles = snapshot.profiles,
            directionInput = directionInput,
            directionEstimate = directionResolution.estimate,
        )
        persistResult(result)
        repository.saveLatestServiceAutomationBridge(
            ServiceAutomationBridgeSnapshot.from(
                result = result,
                audioDirectionStatus = directionResolution.audioStatus,
                usedAudioDirection = directionResolution.usedAudioEstimate,
            ),
        )
        DiagnosticsLogger.detection(
            eventName = "service_prototype_voice_evaluation_completed",
            event = result.event,
            deliveryCount = result.deliveries.size,
            cueSaved = result.event.isActionable,
        )
        DiagnosticsLogger.info(
            "service_prototype_voice_match_completed",
            "sampleStatus" to result.sampleStatus,
            "matchStatus" to result.match.status,
            "similarity" to DiagnosticsLogger.confidenceBucket(result.match.similarity),
            "audioDirectionStatus" to directionResolution.audioStatus,
            "usedAudioDirection" to directionResolution.usedAudioEstimate,
        )
        updateNotificationForEvent(result.event)
        scheduleNextListen(LISTEN_RESTART_DELAY_MILLIS)
    }

    private fun persistResult(result: ListeningSessionResult) {
        repository.appendEvent(result.event)
        repository.saveLatestAlertDeliverySnapshot(
            AlertDeliverySnapshot.from(
                eventId = result.event.id,
                deliveries = result.deliveries,
                checkedAtMillis = System.currentTimeMillis(),
            ),
        )
        if (result.event.isActionable) {
            repository.saveLatestGlassesCue(GlassesCueSnapshot.fromEvent(result.event))
        }
    }

    private fun persistResult(result: PrototypeVoiceSessionResult) {
        repository.appendEvent(result.event)
        repository.saveLatestAlertDeliverySnapshot(
            AlertDeliverySnapshot.from(
                eventId = result.event.id,
                deliveries = result.deliveries,
                checkedAtMillis = System.currentTimeMillis(),
            ),
        )
        if (result.event.isActionable) {
            repository.saveLatestGlassesCue(GlassesCueSnapshot.fromEvent(result.event))
        }
    }

    private fun updateNotificationForEvent(event: com.voicedirection.glass.model.DetectionEvent) {
        updateNotification(
            if (event.isActionable) {
                "${event.speakerLabel ?: "등록 화자"} · ${event.direction.displayLabel()}"
            } else {
                "감지했지만 조건 미충족"
            },
        )
    }

    private fun buildState(transcript: String): ListeningSessionState {
        val snapshot = repository.loadSnapshot()
        return ListeningSessionState(
            triggerPhrase = snapshot.settings.triggerPhrase,
            simulatedTranscript = transcript,
            simulatedDirection = snapshot.settings.simulatedDirection,
            simulatedDirectionConfidence = snapshot.settings.simulatedDirectionConfidence,
            enabledAlertChannels = snapshot.settings.enabledAlertChannels,
            enrolledProfiles = snapshot.profiles,
            eventHistory = snapshot.events,
        )
    }

    private fun updateNotification(message: String) {
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(NOTIFICATION_ID, buildNotification(message))
    }

    private fun buildNotification(message: String): Notification {
        val openAppIntent = Intent(this, MainActivity::class.java)
            .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
        val openAppPendingIntent = PendingIntent.getActivity(
            this,
            0,
            openAppIntent,
            pendingIntentFlags(),
        )
        val stopIntent = Intent(this, ListeningControlReceiver::class.java)
            .setAction(ACTION_STOP)
        val stopPendingIntent = PendingIntent.getBroadcast(
            this,
            1,
            stopIntent,
            pendingIntentFlags(),
        )

        val builder = Notification.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentTitle("Voice Direction Glass 실행 중")
            .setContentText(message)
            .setStyle(
                Notification.BigTextStyle()
                    .bigText(message),
            )
            .setCategory(Notification.CATEGORY_SERVICE)
            .setContentIntent(openAppPendingIntent)
            .setOngoing(true)
            .addAction(
                Notification.Action.Builder(
                    Icon.createWithResource(this, android.R.drawable.ic_media_pause),
                    "중지",
                    stopPendingIntent,
                ).build(),
            )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            builder.setForegroundServiceBehavior(Notification.FOREGROUND_SERVICE_IMMEDIATE)
        }

        return builder.build()
    }

    private fun createNotificationChannel() {
        val notificationManager = getSystemService(NotificationManager::class.java)
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Voice direction listening",
            NotificationManager.IMPORTANCE_LOW,
        ).apply {
            description = "Visible microphone session for Voice Direction Glass"
        }
        notificationManager.createNotificationChannel(channel)
    }

    private fun stopForegroundCompat() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } else {
            @Suppress("DEPRECATION")
            stopForeground(true)
        }
    }

    private fun pendingIntentFlags(): Int =
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE

    companion object {
        const val ACTION_STOP = "com.voicedirection.glass.action.STOP_LISTENING"
        private const val ACTION_START = "com.voicedirection.glass.action.START_LISTENING"
        private const val CHANNEL_ID = "voice_direction_listening"
        private const val NOTIFICATION_ID = 2001
        private const val LISTEN_RESTART_DELAY_MILLIS = 2500L
        private const val LISTEN_ERROR_BACKOFF_MILLIS = 4500L
        var isRunning: Boolean = false
            private set

        fun start(context: Context) {
            val intent = Intent(context, ListeningForegroundService::class.java)
                .setAction(ACTION_START)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, ListeningForegroundService::class.java))
        }
    }
}
