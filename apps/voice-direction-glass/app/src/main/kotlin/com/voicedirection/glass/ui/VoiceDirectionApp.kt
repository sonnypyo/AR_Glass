package com.voicedirection.glass.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Checkbox
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.voicedirection.glass.alerts.AlertChannel
import com.voicedirection.glass.alerts.DirectionCueOutputContract
import com.voicedirection.glass.alerts.DirectionCueOutputContracts
import com.voicedirection.glass.alerts.hapticDisplayLabel
import com.voicedirection.glass.devices.GlassesIntegrationReadiness
import com.voicedirection.glass.devices.GlassesPlatform
import com.voicedirection.glass.devices.GlassesReadinessStatus
import com.voicedirection.glass.model.CallerDirection
import com.voicedirection.glass.model.DetectionFeedbackType
import com.voicedirection.glass.model.DetectionFeedbackSummarizer
import com.voicedirection.glass.model.DetectionLatencySummarizer
import com.voicedirection.glass.model.DirectionValidationSummarizer
import com.voicedirection.glass.model.DirectionValidationDirectionStats
import com.voicedirection.glass.model.DirectionValidationTrial
import com.voicedirection.glass.model.FalsePositiveRunSummarizer
import com.voicedirection.glass.model.FalsePositiveRunVerdict
import com.voicedirection.glass.model.SpeakerEnrollmentStatus
import com.voicedirection.glass.model.SpeakerVerificationMode
import com.voicedirection.glass.model.displayLabel
import com.voicedirection.glass.qa.ReleaseReadinessItem
import com.voicedirection.glass.qa.ReleaseReadinessStatus
import com.voicedirection.glass.qa.ReleaseReadinessSummary
import com.voicedirection.glass.qa.ReleaseTarget
import com.voicedirection.glass.qa.VoiceDirectionReleaseChecklist
import com.voicedirection.glass.qa.VoiceDirectionTesterConsent
import com.voicedirection.glass.session.ListeningSessionState
import com.voicedirection.glass.storage.AlertDeliverySource
import com.voicedirection.glass.storage.AlertDeliveryStatus

@Composable
fun VoiceDirectionApp(
    state: ListeningSessionState,
    onStartStop: () -> Unit,
    onMicrophoneDisclosureAcceptedChange: (Boolean) -> Unit,
    onTranscriptChange: (String) -> Unit,
    onTriggerPhraseChange: (String) -> Unit,
    onDirectionChange: (CallerDirection) -> Unit,
    onAlertChannelEnabledChange: (AlertChannel, Boolean) -> Unit,
    onRunAlertOutputTest: () -> Unit,
    onListenOnce: () -> Unit,
    onNewSpeakerNameChange: (String) -> Unit,
    onNewSpeakerConsentChange: (Boolean) -> Unit,
    onAddSpeaker: () -> Unit,
    onCaptureEnrollmentSample: (String) -> Unit,
    onRunPrototypeVoiceMatch: (String) -> Unit,
    onDeleteAllData: () -> Unit,
    onRunSimulation: () -> Unit,
    onOpenGlassesPreview: () -> Unit,
    onRunAudioProbe: () -> Unit,
    onRunAudioDirectionSample: () -> Unit,
    onRunBluetoothAudioRouteProbe: () -> Unit,
    onSelectBluetoothAudioRoute: () -> Unit,
    onClearBluetoothAudioRoute: () -> Unit,
    onDirectionValidationExpectedChange: (CallerDirection) -> Unit,
    onRecordDirectionValidationTrial: () -> Unit,
    onClearDirectionValidationTrials: () -> Unit,
    onMarkEventFeedback: (String, DetectionFeedbackType) -> Unit,
    onStartFalsePositiveRun: () -> Unit,
    onStopFalsePositiveRun: () -> Unit,
    onClearFalsePositiveRun: () -> Unit,
) {
    MaterialTheme {
        Surface(modifier = Modifier.fillMaxSize()) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                Header(state = state, onStartStop = onStartStop)
                MicrophoneDisclosureCard(
                    state = state,
                    onMicrophoneDisclosureAcceptedChange = onMicrophoneDisclosureAcceptedChange,
                )
                SpeakerProfilesCard(
                    state = state,
                    onNewSpeakerNameChange = onNewSpeakerNameChange,
                    onNewSpeakerConsentChange = onNewSpeakerConsentChange,
                    onAddSpeaker = onAddSpeaker,
                    onCaptureEnrollmentSample = onCaptureEnrollmentSample,
                    onRunPrototypeVoiceMatch = onRunPrototypeVoiceMatch,
                )
                SimulatorPanel(
                    state = state,
                    onTranscriptChange = onTranscriptChange,
                    onTriggerPhraseChange = onTriggerPhraseChange,
                    onDirectionChange = onDirectionChange,
                    onListenOnce = onListenOnce,
                    onRunSimulation = onRunSimulation,
                )
                LastEventCard(state)
                ServiceAutomationBridgeCard(state)
                ReleaseReadinessCard()
                GlassesPreviewCard(onOpenGlassesPreview)
                GlassesIntegrationReadinessCard()
                AudioProbeCard(
                    state = state,
                    onRunAudioProbe = onRunAudioProbe,
                    onRunAudioDirectionSample = onRunAudioDirectionSample,
                    onRunBluetoothAudioRouteProbe = onRunBluetoothAudioRouteProbe,
                    onSelectBluetoothAudioRoute = onSelectBluetoothAudioRoute,
                    onClearBluetoothAudioRoute = onClearBluetoothAudioRoute,
                    onDirectionValidationExpectedChange = onDirectionValidationExpectedChange,
                    onRecordDirectionValidationTrial = onRecordDirectionValidationTrial,
                    onClearDirectionValidationTrials = onClearDirectionValidationTrials,
                )
                AlertChannelSettingsCard(
                    state = state,
                    onAlertChannelEnabledChange = onAlertChannelEnabledChange,
                    onRunAlertOutputTest = onRunAlertOutputTest,
                )
                DirectionCueOutputContractCard(state)
                DeliveryCard(state)
                FalsePositiveRunCard(
                    state = state,
                    onStartFalsePositiveRun = onStartFalsePositiveRun,
                    onStopFalsePositiveRun = onStopFalsePositiveRun,
                    onClearFalsePositiveRun = onClearFalsePositiveRun,
                )
                EventHistoryCard(state, onMarkEventFeedback)
                TesterConsentCard(onDeleteAllData)
            }
        }
    }
}

@Composable
private fun FalsePositiveRunCard(
    state: ListeningSessionState,
    onStartFalsePositiveRun: () -> Unit,
    onStopFalsePositiveRun: () -> Unit,
    onClearFalsePositiveRun: () -> Unit,
) {
    val summary = FalsePositiveRunSummarizer.summarize(
        run = state.falsePositiveRun,
        feedback = state.feedbackHistory,
        nowMillis = System.currentTimeMillis(),
    )
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text("30분 오탐 테스트", style = MaterialTheme.typography.titleMedium)
            if (summary.run == null) {
                Text("아직 테스트 세션이 없습니다.")
            } else {
                Text(if (summary.run.active) "진행 중" else "종료됨")
                Text("경과: ${summary.elapsedMillis.durationLabel()} / ${summary.targetDurationMillis.durationLabel()}")
                Text("목표 달성: ${if (summary.targetReached) "예" else "아니오"}")
                Text("판정: ${summary.verdict.displayLabel()}")
                Text("오탐률: ${summary.falsePositiveRatePerHour.rateLabel()} / 시간")
                Text(
                    "구간 피드백 ${summary.feedbackSummary.total}개 · 오탐 ${summary.feedbackSummary.falsePositive} · 방향 오류 ${summary.feedbackSummary.wrongDirection}",
                    style = MaterialTheme.typography.bodySmall,
                )
            }
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Button(
                    onClick = onStartFalsePositiveRun,
                    enabled = state.falsePositiveRun?.active != true,
                ) {
                    Text("테스트 시작")
                }
                Button(
                    onClick = onStopFalsePositiveRun,
                    enabled = state.falsePositiveRun?.active == true,
                ) {
                    Text("테스트 종료")
                }
                Button(
                    onClick = onClearFalsePositiveRun,
                    enabled = state.falsePositiveRun != null,
                ) {
                    Text("초기화")
                }
            }
        }
    }
}

private fun Long.durationLabel(): String {
    val totalSeconds = (this / 1000L).coerceAtLeast(0L)
    val minutes = totalSeconds / 60L
    val seconds = totalSeconds % 60L
    return "${minutes}분 ${seconds}초"
}

private fun Float.rateLabel(): String =
    String.format(java.util.Locale.US, "%.2f", this)

private fun FalsePositiveRunVerdict.displayLabel(): String =
    when (this) {
        FalsePositiveRunVerdict.NOT_STARTED -> "미시작"
        FalsePositiveRunVerdict.IN_PROGRESS -> "진행 중"
        FalsePositiveRunVerdict.PASS -> "통과"
        FalsePositiveRunVerdict.FAIL_DURATION -> "시간 부족"
        FalsePositiveRunVerdict.FAIL_FALSE_POSITIVE -> "오탐 실패"
        FalsePositiveRunVerdict.FAIL_DIRECTION -> "방향 오류 실패"
        FalsePositiveRunVerdict.FAIL_SPEAKER -> "화자 오류 실패"
    }

@Composable
private fun Header(
    state: ListeningSessionState,
    onStartStop: () -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Voice Direction Glass", style = MaterialTheme.typography.headlineMedium)
        Text(state.statusMessage, style = MaterialTheme.typography.bodyLarge)
        Button(
            onClick = onStartStop,
            enabled = state.isListening || state.microphoneDisclosureAccepted,
        ) {
            Text(if (state.isListening) "세션 중지" else "세션 시작")
        }
    }
}

@Composable
private fun MicrophoneDisclosureCard(
    state: ListeningSessionState,
    onMicrophoneDisclosureAcceptedChange: (Boolean) -> Unit,
) {
    val copy = VoiceDirectionTesterConsent.microphoneDisclosure
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text("마이크 사용 안내", style = MaterialTheme.typography.titleMedium)
            Text(copy.headline)
            ConsentSection("사용", copy.microphoneUses)
            ConsentSection("처리", copy.dataHandling)
            ConsentSection("제어", copy.userControls)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Checkbox(
                    checked = state.microphoneDisclosureAccepted,
                    onCheckedChange = onMicrophoneDisclosureAcceptedChange,
                )
                Text(
                    if (state.microphoneDisclosureAccepted) {
                        "확인됨 · ${state.microphoneDisclosureVersion}"
                    } else {
                        "마이크 권한 요청 전에 확인합니다."
                    },
                    style = MaterialTheme.typography.bodySmall,
                )
            }
        }
    }
}

@Composable
private fun SpeakerProfilesCard(
    state: ListeningSessionState,
    onNewSpeakerNameChange: (String) -> Unit,
    onNewSpeakerConsentChange: (Boolean) -> Unit,
    onAddSpeaker: () -> Unit,
    onCaptureEnrollmentSample: (String) -> Unit,
    onRunPrototypeVoiceMatch: (String) -> Unit,
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text("저장된 목소리", style = MaterialTheme.typography.titleMedium)
            if (state.enrolledProfiles.isEmpty()) {
                Text("등록된 화자가 없습니다.")
            } else {
                state.enrolledProfiles.forEach { profile ->
                    Text("${profile.displayName} · ${profile.consentVersion}")
                    Text(
                        "${profile.verificationMode.displayLabel()} · ${profile.enrollmentStatus.displayLabel()} · 샘플 ${profile.sampleCount}개",
                        style = MaterialTheme.typography.bodySmall,
                    )
                    Button(
                        onClick = { onCaptureEnrollmentSample(profile.id) },
                        enabled = !state.isListening,
                    ) {
                        Text("음성 샘플 품질 수집")
                    }
                    Button(
                        onClick = { onRunPrototypeVoiceMatch(profile.id) },
                        enabled = !state.isListening && profile.hasEnrollmentSamples,
                    ) {
                        Text("프로토타입 음성 매칭 점검")
                    }
                }
            }
            state.voiceEnrollmentSampleSummary?.let { summary ->
                Text(summary, style = MaterialTheme.typography.bodySmall)
            }
            state.prototypeVoiceMatchSummary?.let { summary ->
                Text(summary, style = MaterialTheme.typography.bodySmall)
            }
            HorizontalDivider()
            OutlinedTextField(
                value = state.newSpeakerName,
                onValueChange = onNewSpeakerNameChange,
                label = { Text("화자 이름") },
                modifier = Modifier.fillMaxWidth(),
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Checkbox(
                    checked = state.newSpeakerConsentConfirmed,
                    onCheckedChange = onNewSpeakerConsentChange,
                )
                Text(
                    "화자 본인 또는 보호자가 이 로컬 테스트 등록에 동의했습니다.",
                    style = MaterialTheme.typography.bodySmall,
                )
            }
            Button(
                onClick = onAddSpeaker,
                enabled = state.newSpeakerName.isNotBlank() && state.newSpeakerConsentConfirmed,
            ) {
                Text("동의받은 화자 라벨 저장")
            }
        }
    }
}

private fun SpeakerVerificationMode.displayLabel(): String =
    when (this) {
        SpeakerVerificationMode.TRANSCRIPT_LABEL_SIMULATION -> "라벨 시뮬레이션"
        SpeakerVerificationMode.ON_DEVICE_EMBEDDING -> "온디바이스 음성 모델"
    }

private fun SpeakerEnrollmentStatus.displayLabel(): String =
    when (this) {
        SpeakerEnrollmentStatus.LABEL_ONLY -> "음성 모델 대기"
        SpeakerEnrollmentStatus.SAMPLE_CAPTURE_REQUIRED -> "샘플 필요"
        SpeakerEnrollmentStatus.SAMPLES_CAPTURED_MODEL_PENDING -> "모델 생성 대기"
        SpeakerEnrollmentStatus.MODEL_READY -> "모델 준비"
    }

@Composable
private fun SimulatorPanel(
    state: ListeningSessionState,
    onTranscriptChange: (String) -> Unit,
    onTriggerPhraseChange: (String) -> Unit,
    onDirectionChange: (CallerDirection) -> Unit,
    onListenOnce: () -> Unit,
    onRunSimulation: () -> Unit,
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text("시뮬레이터", style = MaterialTheme.typography.titleMedium)
            OutlinedTextField(
                value = state.triggerPhrase,
                onValueChange = onTriggerPhraseChange,
                label = { Text("호출 문구") },
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = state.simulatedTranscript,
                onValueChange = onTranscriptChange,
                label = { Text("감지된 문장") },
                modifier = Modifier.fillMaxWidth(),
            )
            DirectionPicker(state.simulatedDirection, onDirectionChange)
            Button(onClick = onListenOnce, enabled = !state.isListening) {
                Text("음성 인식 1회 테스트")
            }
            Button(onClick = onRunSimulation, enabled = state.isListening) {
                Text("호출 감지 시뮬레이션")
            }
        }
    }
}

@Composable
private fun EventHistoryCard(
    state: ListeningSessionState,
    onMarkEventFeedback: (String, DetectionFeedbackType) -> Unit,
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text("감지 기록", style = MaterialTheme.typography.titleMedium)
            val summary = DetectionFeedbackSummarizer.summarize(state.feedbackHistory)
            val latencySummary = DetectionLatencySummarizer.summarize(state.eventHistory)
            Text(
                "피드백 ${summary.total}개 · 정확 ${summary.correct} · 오탐 ${summary.falsePositive} · 방향 오류 ${summary.wrongDirection}",
                style = MaterialTheme.typography.bodySmall,
            )
            Text(
                "처리 지연 기록 ${latencySummary.eventsWithLatency}/${latencySummary.totalEvents} · 최근 ${latencySummary.latestLatencyMillis.latencyLabel()} · 평균 ${latencySummary.averageLatencyMillis.latencyLabel()}",
                style = MaterialTheme.typography.bodySmall,
            )
            if (state.eventHistory.isEmpty()) {
                Text("저장된 감지 기록이 없습니다.")
            } else {
                state.eventHistory.take(5).forEach { event ->
                    val feedback = state.feedbackHistory.firstOrNull { it.eventId == event.id }
                    Text("${event.speakerLabel ?: "알 수 없음"} · ${event.direction.displayLabel()} · ${(event.directionConfidence * 100).toInt()}%")
                    Text("원천: ${event.sourceAdapter}", style = MaterialTheme.typography.bodySmall)
                    Text("피드백: ${feedback?.type?.displayLabel() ?: "미기록"}", style = MaterialTheme.typography.bodySmall)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        FeedbackButton("정확") {
                            onMarkEventFeedback(event.id, DetectionFeedbackType.CORRECT)
                        }
                        FeedbackButton("오탐") {
                            onMarkEventFeedback(event.id, DetectionFeedbackType.FALSE_POSITIVE)
                        }
                        FeedbackButton("방향 오류") {
                            onMarkEventFeedback(event.id, DetectionFeedbackType.WRONG_DIRECTION)
                        }
                        FeedbackButton("화자 오류") {
                            onMarkEventFeedback(event.id, DetectionFeedbackType.WRONG_SPEAKER)
                        }
                    }
                    HorizontalDivider()
                }
            }
        }
    }
}

@Composable
private fun FeedbackButton(
    label: String,
    onClick: () -> Unit,
) {
    Button(onClick = onClick) {
        Text(label)
    }
}

private fun DetectionFeedbackType.displayLabel(): String =
    when (this) {
        DetectionFeedbackType.CORRECT -> "정확"
        DetectionFeedbackType.FALSE_POSITIVE -> "오탐"
        DetectionFeedbackType.WRONG_DIRECTION -> "방향 오류"
        DetectionFeedbackType.WRONG_SPEAKER -> "화자 오류"
    }

@Composable
private fun TesterConsentCard(onDeleteAllData: () -> Unit) {
    val copy = VoiceDirectionTesterConsent.copy
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text("테스터 동의와 한계", style = MaterialTheme.typography.titleMedium)
            Text(copy.headline)
            ConsentSection("저장됨", copy.dataStored)
            ConsentSection("저장 안 함", copy.dataNotStored)
            ConsentSection("한계", copy.limitations)
            ConsentSection("테스터 확인", copy.testerCommitments)
            Button(onClick = onDeleteAllData) {
                Text(copy.deleteActionLabel)
            }
        }
    }
}

@Composable
private fun ConsentSection(
    title: String,
    items: List<String>,
) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(title, style = MaterialTheme.typography.labelLarge)
        items.forEach { item ->
            Text("- $item", style = MaterialTheme.typography.bodySmall)
        }
    }
}

@Composable
private fun DirectionPicker(
    selected: CallerDirection,
    onDirectionChange: (CallerDirection) -> Unit,
    includeUnknown: Boolean = true,
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("방향")
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            buildList {
                add(CallerDirection.FRONT)
                add(CallerDirection.BACK)
                add(CallerDirection.LEFT)
                add(CallerDirection.RIGHT)
                if (includeUnknown) {
                    add(CallerDirection.UNKNOWN)
                }
            }.forEach { direction ->
                FilterChip(
                    selected = selected == direction,
                    onClick = { onDirectionChange(direction) },
                    label = { Text(direction.displayLabel()) },
                )
            }
        }
    }
}

@Composable
private fun GlassesIntegrationReadinessCard() {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text("글래스 연동 준비", style = MaterialTheme.typography.titleMedium)
            GlassesPlatform.entries.forEach { platform ->
                val summary = GlassesIntegrationReadiness.summaryFor(platform)
                Text("${platform.displayLabel()} · ${summary.statusLabel()}")
                summary.openItems.take(3).forEach { item ->
                    Text("${item.status.displayLabel()} · ${item.title}", style = MaterialTheme.typography.bodySmall)
                }
            }
        }
    }
}

private fun GlassesPlatform.displayLabel(): String =
    when (this) {
        GlassesPlatform.META_DAT -> "Meta Ray-Ban/DAT"
        GlassesPlatform.ANDROID_XR -> "Android XR"
    }

private fun GlassesReadinessStatus.displayLabel(): String =
    when (this) {
        GlassesReadinessStatus.PASS -> "통과"
        GlassesReadinessStatus.MANUAL_REQUIRED -> "기기 확인 필요"
        GlassesReadinessStatus.BLOCKED -> "차단"
    }

private fun com.voicedirection.glass.devices.GlassesReadinessSummary.statusLabel(): String =
    if (readyForGlassesAlpha) {
        "글래스 알파 가능"
    } else {
        "열린 항목 ${openItems.size}개"
}

@Composable
private fun ReleaseReadinessCard() {
    val summaries = ReleaseTarget.entries.map { target ->
        VoiceDirectionReleaseChecklist.summaryFor(target)
    }

    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text("릴리스 준비", style = MaterialTheme.typography.titleMedium)
            summaries.forEach { summary ->
                ReleaseReadinessSummaryRow(summary)
            }
            val openPhoneAlphaItems = VoiceDirectionReleaseChecklist
                .openItemsFor(ReleaseTarget.PHONE_PRIVATE_ALPHA)
            val nextItems = openPhoneAlphaItems.take(3)
            if (nextItems.isNotEmpty()) {
                HorizontalDivider()
                Text(
                    "다음 phone alpha 증거 ${nextItems.size}/${openPhoneAlphaItems.size}",
                    style = MaterialTheme.typography.bodySmall,
                )
                nextItems.forEach { item ->
                    ReleaseReadinessOpenItemRow(item)
                }
            }
        }
    }
}

@Composable
private fun ReleaseReadinessSummaryRow(summary: ReleaseReadinessSummary) {
    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Text(
            "${summary.target.displayLabel()}: ${summary.statusLabel()}",
            style = MaterialTheme.typography.bodySmall,
        )
        Text(
            "통과 ${summary.passed}/${summary.totalRequired} · 기기확인 ${summary.manualRequired} · 차단 ${summary.blocked}",
            style = MaterialTheme.typography.bodySmall,
        )
    }
}

@Composable
private fun ReleaseReadinessOpenItemRow(item: ReleaseReadinessItem) {
    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Text(
            "${item.status.displayLabel()} · ${item.title}",
            style = MaterialTheme.typography.bodySmall,
        )
        Text("증거: ${item.evidence}", style = MaterialTheme.typography.bodySmall)
        Text("다음: ${item.nextAction}", style = MaterialTheme.typography.bodySmall)
        Text("id: ${item.id}", style = MaterialTheme.typography.bodySmall)
    }
}

private fun ReleaseReadinessSummary.statusLabel(): String =
    if (ready) {
        "준비됨"
    } else if (blocked > 0) {
        "차단"
    } else {
        "기기 확인 필요"
    }

private fun ReleaseTarget.displayLabel(): String =
    when (this) {
        ReleaseTarget.INTERNAL_PROTOTYPE -> "Internal prototype"
        ReleaseTarget.PHONE_PRIVATE_ALPHA -> "Phone private alpha"
        ReleaseTarget.GLASSES_PRIVATE_ALPHA -> "Glasses private alpha"
        ReleaseTarget.EXTERNAL_BETA -> "External beta"
        ReleaseTarget.PRODUCTION_SERVICE -> "Production"
    }

private fun ReleaseReadinessStatus.displayLabel(): String =
    when (this) {
        ReleaseReadinessStatus.PASS -> "통과"
        ReleaseReadinessStatus.MANUAL_REQUIRED -> "기기확인"
        ReleaseReadinessStatus.BLOCKED -> "차단"
    }

@Composable
private fun ServiceAutomationBridgeCard(state: ListeningSessionState) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text("서비스 자동화 진단", style = MaterialTheme.typography.titleMedium)
            val snapshot = state.latestServiceAutomationBridge
            if (snapshot == null) {
                Text("아직 서비스 자동화 결과가 없습니다.")
            } else {
                Text("결과: ${if (snapshot.actionable) "알림 가능" else "조건 미충족"}")
                Text("화자 샘플: ${snapshot.sampleStatus?.name ?: "없음"}")
                Text("화자 매칭: ${snapshot.matchStatus.name} · ${snapshot.similarity.percentLabel()}")
                Text("방향: ${snapshot.direction.displayLabel()} · ${snapshot.directionConfidence.percentLabel()}")
                Text("방향 샘플: ${snapshot.audioDirectionStatus?.name ?: "없음"}")
                Text("실측 방향 사용: ${if (snapshot.usedAudioDirection) "예" else "아니오"}")
                Text("원천: ${snapshot.sourceAdapter}", style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}

@Composable
private fun LastEventCard(state: ListeningSessionState) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text("마지막 감지", style = MaterialTheme.typography.titleMedium)
            val event = state.lastEvent
            if (event == null) {
                Text("아직 감지 결과가 없습니다.")
            } else {
                Text("화자: ${event.speakerLabel ?: "알 수 없음"}")
                Text("호출 문구 일치: ${if (event.phraseMatched) "예" else "아니오"}")
                Text("방향: ${event.direction.displayLabel()}")
                Text("화자 신뢰도: ${(event.speakerConfidence * 100).toInt()}%")
                Text("방향 신뢰도: ${(event.directionConfidence * 100).toInt()}%")
                Text("처리 지연: ${event.processingLatencyMillis.latencyLabel()}")
            }
        }
    }
}

private fun Long?.latencyLabel(): String =
    this?.let { "${it}ms" } ?: "미기록"

private fun Float.percentLabel(): String = "${(coerceIn(0f, 1f) * 100).toInt()}%"

@Composable
private fun AudioProbeCard(
    state: ListeningSessionState,
    onRunAudioProbe: () -> Unit,
    onRunAudioDirectionSample: () -> Unit,
    onRunBluetoothAudioRouteProbe: () -> Unit,
    onSelectBluetoothAudioRoute: () -> Unit,
    onClearBluetoothAudioRoute: () -> Unit,
    onDirectionValidationExpectedChange: (CallerDirection) -> Unit,
    onRecordDirectionValidationTrial: () -> Unit,
    onClearDirectionValidationTrials: () -> Unit,
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text("마이크 채널", style = MaterialTheme.typography.titleMedium)
            Button(onClick = onRunAudioProbe, enabled = !state.isListening) {
                Text("마이크 채널 점검")
            }
            Button(onClick = onRunAudioDirectionSample, enabled = !state.isListening) {
                Text("방향 샘플 점검")
            }
            Button(onClick = onRunBluetoothAudioRouteProbe, enabled = !state.isListening) {
                Text("블루투스 마이크 경로 점검")
            }
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Button(onClick = onSelectBluetoothAudioRoute, enabled = !state.isListening) {
                    Text("블루투스 입력 선택")
                }
                Button(onClick = onClearBluetoothAudioRoute, enabled = !state.isListening) {
                    Text("통신 경로 해제")
                }
            }
            state.audioProbeSummary?.let { summary ->
                Text(summary, style = MaterialTheme.typography.bodySmall)
            }
            state.audioDirectionSampleSummary?.let { summary ->
                Text(summary, style = MaterialTheme.typography.bodySmall)
            }
            state.bluetoothAudioRouteSummary?.let { summary ->
                Text(summary, style = MaterialTheme.typography.bodySmall)
            }
            HorizontalDivider()
            DirectionValidationPanel(
                state = state,
                onDirectionValidationExpectedChange = onDirectionValidationExpectedChange,
                onRecordDirectionValidationTrial = onRecordDirectionValidationTrial,
                onClearDirectionValidationTrials = onClearDirectionValidationTrials,
            )
        }
    }
}

@Composable
private fun DirectionValidationPanel(
    state: ListeningSessionState,
    onDirectionValidationExpectedChange: (CallerDirection) -> Unit,
    onRecordDirectionValidationTrial: () -> Unit,
    onClearDirectionValidationTrials: () -> Unit,
) {
    val summary = DirectionValidationSummarizer.summarize(state.directionValidationTrials)
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("방향 검증 기록", style = MaterialTheme.typography.titleSmall)
        DirectionPicker(
            selected = state.directionValidationExpectedDirection,
            onDirectionChange = onDirectionValidationExpectedChange,
            includeUnknown = false,
        )
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Button(onClick = onRecordDirectionValidationTrial, enabled = !state.isListening) {
                Text("현재 방향 기록")
            }
            Button(
                onClick = onClearDirectionValidationTrials,
                enabled = !state.isListening && state.directionValidationTrials.isNotEmpty(),
            ) {
                Text("기록 초기화")
            }
        }
        Text(
            "총 ${summary.total}회 · 일치 ${summary.matched} · 불일치 ${summary.mismatched} · 불명/불가 ${summary.unknownOrUnusable} · 일치율 ${summary.matchRate.percentLabel()}",
            style = MaterialTheme.typography.bodySmall,
        )
        Text(
            "앞 ${summary.frontTrials} · 뒤 ${summary.backTrials} · 왼쪽 ${summary.leftTrials} · 오른쪽 ${summary.rightTrials}",
            style = MaterialTheme.typography.bodySmall,
        )
        Text(
            "목표 ${summary.requiredTrialsPerDirection}회/방향 · 진행 ${summary.total}/${summary.requiredTotalTrials} · 남은 ${summary.missingTotalTrials} · ${if (summary.controlledTrialTargetComplete) "목표 충족" else "진행 중"}",
            style = MaterialTheme.typography.bodySmall,
        )
        Text(
            "남은 앞 ${summary.missingFrontTrials} · 뒤 ${summary.missingBackTrials} · 왼쪽 ${summary.missingLeftTrials} · 오른쪽 ${summary.missingRightTrials}",
            style = MaterialTheme.typography.bodySmall,
        )
        DirectionValidationStatsRow(summary.front)
        DirectionValidationStatsRow(summary.back)
        DirectionValidationStatsRow(summary.left)
        DirectionValidationStatsRow(summary.right)
        state.directionValidationTrials.take(3).forEach { trial ->
            DirectionValidationTrialRow(trial)
        }
    }
}

@Composable
private fun DirectionValidationStatsRow(stats: DirectionValidationDirectionStats) {
    Text(
        "${stats.direction.displayLabel()} 일치 ${stats.matched}/${stats.total} · 불일치 ${stats.mismatched} · 불명/불가 ${stats.unknownOrUnusable}",
        style = MaterialTheme.typography.bodySmall,
    )
}

@Composable
private fun DirectionValidationTrialRow(trial: DirectionValidationTrial) {
    Text(
        "${trial.expectedDirection.displayLabel()} -> ${trial.observedDirection.displayLabel()} · ${trial.status.name} · ${trial.confidence.percentLabel()}",
        style = MaterialTheme.typography.bodySmall,
    )
}

@Composable
private fun GlassesPreviewCard(
    onOpenGlassesPreview: () -> Unit,
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text("글래스 큐", style = MaterialTheme.typography.titleMedium)
            Button(onClick = onOpenGlassesPreview) {
                Text("글래스 큐 미리보기")
            }
        }
    }
}

@Composable
private fun DirectionCueOutputContractCard(state: ListeningSessionState) {
    val selected = DirectionCueOutputContracts.forDirection(
        direction = state.simulatedDirection,
        confidence = state.simulatedDirectionConfidence,
    )
    val allDirections = DirectionCueOutputContracts.allDirections(
        confidence = state.simulatedDirectionConfidence,
    )

    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text("방향 큐 계약", style = MaterialTheme.typography.titleMedium)
            Text(
                "현재 선택: ${selected.directionLabel} · 신뢰도 ${selected.confidencePercent}%",
                style = MaterialTheme.typography.bodySmall,
            )
            DirectionCueOutputContractSummary(selected)
            HorizontalDivider()
            Text("방향별 진동 서명", style = MaterialTheme.typography.bodySmall)
            allDirections.forEach { contract ->
                Text(
                    "${contract.directionLabel}: ${contract.vibrationSignature} · 폰 ${contract.vibrationPulseCount}회 · 글래스 ${contract.glassesHapticTarget.hapticDisplayLabel()} ${contract.glassesHapticPulseCount}회",
                    style = MaterialTheme.typography.bodySmall,
                )
            }
        }
    }
}

@Composable
private fun DirectionCueOutputContractSummary(contract: DirectionCueOutputContract) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text("폰 알림: ${contract.notificationText}", style = MaterialTheme.typography.bodySmall)
        Text(
            "진동: ${contract.vibrationSignature} · ${contract.vibrationPulseCount}회 · ${contract.vibrationTotalDurationMillis}ms",
            style = MaterialTheme.typography.bodySmall,
        )
        Text(
            "폰 좌우 개별 모터: ${if (contract.phoneVibrationSideSpecific) "있음" else "없음"}",
            style = MaterialTheme.typography.bodySmall,
        )
        Text(
            "글래스 햅틱 의도: ${contract.glassesHapticTarget.hapticDisplayLabel()} · ${contract.glassesHapticIntensity.hapticDisplayLabel()} · ${contract.glassesHapticPulseCount}회",
            style = MaterialTheme.typography.bodySmall,
        )
        Text(
            "글래스 햅틱 API 증거: ${if (contract.glassesHapticRequiresApiProof) "필요" else "불필요"}",
            style = MaterialTheme.typography.bodySmall,
        )
        Text("TTS: ${contract.ttsText}", style = MaterialTheme.typography.bodySmall)
        Text("글래스 증거: ${contract.displayEvidenceSummary}", style = MaterialTheme.typography.bodySmall)
    }
}

@Composable
private fun AlertChannelSettingsCard(
    state: ListeningSessionState,
    onAlertChannelEnabledChange: (AlertChannel, Boolean) -> Unit,
    onRunAlertOutputTest: () -> Unit,
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text("알림 채널", style = MaterialTheme.typography.titleMedium)
            AlertChannel.entries.forEach { channel ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Checkbox(
                        checked = channel in state.enabledAlertChannels,
                        onCheckedChange = { enabled ->
                            onAlertChannelEnabledChange(channel, enabled)
                        },
                    )
                    Text(channel.displayLabel())
                }
            }
            Button(
                onClick = onRunAlertOutputTest,
                enabled = state.enabledAlertChannels.isNotEmpty(),
            ) {
                Text("알림 출력 점검")
            }
        }
    }
}

@Composable
private fun DeliveryCard(state: ListeningSessionState) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text("알림 출력", style = MaterialTheme.typography.titleMedium)
            state.latestAlertDeliverySnapshot?.let { snapshot ->
                Text(
                    "최근 저장 결과: ${snapshot.deliveredCount}/${snapshot.totalCount}개 전송",
                    style = MaterialTheme.typography.bodySmall,
                )
                Text(
                    "최근 출처: ${snapshot.source.displayLabel()}",
                    style = MaterialTheme.typography.bodySmall,
                )
                Text(
                    "폰알림 ${snapshot.statusFor(AlertChannel.PHONE_NOTIFICATION).displayLabel()} · 진동 ${snapshot.statusFor(AlertChannel.PHONE_VIBRATION).displayLabel()} · TTS ${snapshot.statusFor(AlertChannel.TTS).displayLabel()}",
                    style = MaterialTheme.typography.bodySmall,
                )
                Text(
                    "Meta ${snapshot.statusFor(AlertChannel.META_DISPLAY).displayLabel()} · Android XR ${snapshot.statusFor(AlertChannel.ANDROID_XR_DISPLAY).displayLabel()}",
                    style = MaterialTheme.typography.bodySmall,
                )
            }
            if (state.lastDeliveries.isEmpty()) {
                Text("전송된 알림이 없습니다.")
            } else {
                state.lastDeliveries.forEach { delivery ->
                    Row {
                        Text(delivery.channel.name)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(if (delivery.delivered) "전송" else "대기")
                    }
                    Text(delivery.message, style = MaterialTheme.typography.bodySmall)
                    Spacer(modifier = Modifier.height(4.dp))
                }
            }
        }
    }
}

private fun AlertDeliveryStatus.displayLabel(): String =
    when (this) {
        AlertDeliveryStatus.DELIVERED -> "전송"
        AlertDeliveryStatus.FAILED -> "실패"
        AlertDeliveryStatus.MISSING -> "없음"
    }

private fun AlertDeliverySource.displayLabel(): String =
    when (this) {
        AlertDeliverySource.TEST_CUE -> "알림 출력 점검"
        AlertDeliverySource.DETECTION_EVENT -> "감지 이벤트"
        AlertDeliverySource.UNKNOWN -> "알 수 없음"
    }

private fun AlertChannel.displayLabel(): String =
    when (this) {
        AlertChannel.PHONE_NOTIFICATION -> "폰 알림"
        AlertChannel.PHONE_VIBRATION -> "진동"
        AlertChannel.META_DISPLAY -> "Meta Display"
        AlertChannel.ANDROID_XR_DISPLAY -> "Android XR Display"
        AlertChannel.TTS -> "TTS"
    }
