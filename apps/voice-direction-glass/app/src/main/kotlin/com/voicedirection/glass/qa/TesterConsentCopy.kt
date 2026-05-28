package com.voicedirection.glass.qa

data class TesterConsentCopy(
    val version: String,
    val headline: String,
    val dataStored: List<String>,
    val dataNotStored: List<String>,
    val limitations: List<String>,
    val testerCommitments: List<String>,
    val deleteActionLabel: String,
) {
    val readyForPrivateTesterReview: Boolean =
        dataStored.isNotEmpty() &&
            dataNotStored.isNotEmpty() &&
            limitations.isNotEmpty() &&
        testerCommitments.isNotEmpty()
}

data class MicrophoneDisclosureCopy(
    val version: String,
    val headline: String,
    val microphoneUses: List<String>,
    val dataHandling: List<String>,
    val userControls: List<String>,
) {
    val readyForRuntimePermissionPrompt: Boolean =
        microphoneUses.isNotEmpty() &&
            dataHandling.isNotEmpty() &&
            userControls.isNotEmpty()
}

object VoiceDirectionTesterConsent {
    val microphoneDisclosure = MicrophoneDisclosureCopy(
        version = "microphone-disclosure-v1",
        headline = "마이크는 저장한 목소리 호출과 방향 알림 테스트에만 사용됩니다.",
        microphoneUses = listOf(
            "세션 시작 중 호출 문구 감지",
            "동의받은 화자 샘플 품질 확인",
            "프로토타입 음성 매칭 점검",
            "짧은 방향 샘플과 블루투스 입력 경로 점검",
        ),
        dataHandling = listOf(
            "원본 음성, PCM, 전체 인식 문장은 저장하지 않습니다.",
            "저장되는 항목은 로컬 프로필 상태, 샘플 수, 방향/알림 메타데이터입니다.",
            "클라우드 업로드는 현재 빌드에서 사용하지 않습니다.",
        ),
        userControls = listOf(
            "전경 알림이 표시되는 동안에만 세션 청취를 실행합니다.",
            "알림의 중지 동작 또는 앱의 세션 중지로 청취를 멈출 수 있습니다.",
            "로컬 데이터 삭제로 프로필과 감지 기록을 지울 수 있습니다.",
        ),
    )

    val copy = TesterConsentCopy(
        version = "tester-consent-v1",
        headline = "이 빌드는 저장한 목소리와 방향 알림을 검증하는 내부 테스트입니다.",
        dataStored = listOf(
            "동의받은 화자 라벨",
            "프로토타입 음성 특징 참조값",
            "호출 문구와 방향 설정",
            "감지 결과 메타데이터와 최신 글래스 cue",
        ),
        dataNotStored = listOf(
            "원본 음성 또는 PCM",
            "전체 음성 인식 문장",
            "연락처, 위치, 클라우드 업로드 데이터",
        ),
        limitations = listOf(
            "현재 음성 매칭은 프로토타입이며 사람 식별을 보장하지 않습니다.",
            "앞/뒤 방향은 아직 검증되지 않았고, 좌/우도 실제 기기 증거가 필요합니다.",
            "글래스 진동과 실제 Meta DAT/Android XR 출력은 아직 하드웨어 gate가 닫혀 있습니다.",
        ),
        testerCommitments = listOf(
            "본인 또는 명시적으로 동의한 사람의 목소리만 등록합니다.",
            "오탐이나 잘못된 방향은 안전 판단에 사용하지 않습니다.",
            "필요하면 앱의 로컬 데이터 삭제 기능으로 프로필과 기록을 지웁니다.",
        ),
        deleteActionLabel = "로컬 데이터 삭제",
    )
}
