package com.voicedirection.glass.qa

enum class ReleaseTarget {
    INTERNAL_PROTOTYPE,
    PHONE_PRIVATE_ALPHA,
    GLASSES_PRIVATE_ALPHA,
    EXTERNAL_BETA,
    PRODUCTION_SERVICE,
}

enum class ReleaseReadinessStatus {
    PASS,
    MANUAL_REQUIRED,
    BLOCKED,
}

data class ReleaseReadinessItem(
    val id: String,
    val requiredFor: ReleaseTarget,
    val status: ReleaseReadinessStatus,
    val title: String,
    val evidence: String,
    val nextAction: String,
    val blocksTargetWhenUnmet: Boolean = true,
)

data class ReleaseReadinessSummary(
    val target: ReleaseTarget,
    val totalRequired: Int,
    val passed: Int,
    val manualRequired: Int,
    val blocked: Int,
    val openBlockingItems: List<ReleaseReadinessItem>,
) {
    val ready: Boolean = openBlockingItems.isEmpty()
}

object VoiceDirectionReleaseChecklist {
    val items: List<ReleaseReadinessItem> = listOf(
        ReleaseReadinessItem(
            id = "gradle-test-assemble-debug",
            requiredFor = ReleaseTarget.INTERNAL_PROTOTYPE,
            status = ReleaseReadinessStatus.PASS,
            title = "Gradle unit tests and debug APK build pass",
            evidence = "./gradlew --no-daemon test assembleDebug passed on 2026-05-28 KST.",
            nextAction = "Keep this command green before every hardware test.",
        ),
        ReleaseReadinessItem(
            id = "foreground-listening-service",
            requiredFor = ReleaseTarget.INTERNAL_PROTOTYPE,
            status = ReleaseReadinessStatus.PASS,
            title = "Foreground microphone service compiles with visible stop control",
            evidence = "ListeningForegroundService is declared with microphone service type and notification stop action.",
            nextAction = "Validate runtime behavior on a physical phone.",
        ),
        ReleaseReadinessItem(
            id = "local-privacy-baseline",
            requiredFor = ReleaseTarget.INTERNAL_PROTOTYPE,
            status = ReleaseReadinessStatus.PASS,
            title = "No raw PCM persistence in prototype flows",
            evidence = "Enrollment and direction samples are transient in memory; repository stores labels, metadata, cue snapshots, and embedding refs.",
            nextAction = "Re-check this rule whenever the audio pipeline changes.",
        ),
        ReleaseReadinessItem(
            id = "adb-smoke-evidence-script",
            requiredFor = ReleaseTarget.PHONE_PRIVATE_ALPHA,
            status = ReleaseReadinessStatus.PASS,
            title = "ADB smoke test can generate an evidence report",
            evidence = "scripts/android-device-smoke-test.sh supports --write-evidence, runs device-evidence validation when Node.js is available, and has a documented no-device failure path.",
            nextAction = "Run it with a connected Android phone.",
        ),
        ReleaseReadinessItem(
            id = "physical-phone-smoke",
            requiredFor = ReleaseTarget.PHONE_PRIVATE_ALPHA,
            status = ReleaseReadinessStatus.MANUAL_REQUIRED,
            title = "Physical Android phone smoke test",
            evidence = "No ADB device was attached during the current build session.",
            nextAction = "Connect a phone and run scripts/android-device-smoke-test.sh --write-evidence.",
        ),
        ReleaseReadinessItem(
            id = "foreground-service-runtime-loop",
            requiredFor = ReleaseTarget.PHONE_PRIVATE_ALPHA,
            status = ReleaseReadinessStatus.MANUAL_REQUIRED,
            title = "Foreground speech loop behaves correctly on device",
            evidence = "The loop compiles, but Android SpeechRecognizer callback behavior is not yet observed on hardware.",
            nextAction = "Record start, recognition result, backoff, stop action, and logcat evidence.",
        ),
        ReleaseReadinessItem(
            id = "tts-direction-device-qa",
            requiredFor = ReleaseTarget.PHONE_PRIVATE_ALPHA,
            status = ReleaseReadinessStatus.MANUAL_REQUIRED,
            title = "Direction-only TTS cue is audible on device",
            evidence = "The TTS formatter and adapter compile, but audible behavior is not yet observed on a physical phone or Bluetooth glasses route.",
            nextAction = "Trigger an actionable cue and record whether the direction-only spoken cue is heard.",
        ),
        ReleaseReadinessItem(
            id = "direction-validation-device-qa",
            requiredFor = ReleaseTarget.PHONE_PRIVATE_ALPHA,
            status = ReleaseReadinessStatus.MANUAL_REQUIRED,
            title = "Direction validation trial counts are recorded on device",
            evidence = "The validation recorder, ADB trial receiver, helper script, per-direction summary, and unit tests pass, but no physical phone or glasses-route trial counts have been recorded.",
            nextAction = "Run expected-vs-observed front/back/left/right trials with the app UI or scripts/record-direction-validation-trial.sh and record only per-direction matched, mismatched, unknown/unusable counts and confidence buckets.",
        ),
        ReleaseReadinessItem(
            id = "repository-self-check-device-qa",
            requiredFor = ReleaseTarget.PHONE_PRIVATE_ALPHA,
            status = ReleaseReadinessStatus.MANUAL_REQUIRED,
            title = "Repository direction-validation self-check passes on device",
            evidence = "The debug receiver and smoke script path compile, but no physical phone script-pass evidence has been recorded.",
            nextAction = "Run scripts/android-device-smoke-test.sh --write-evidence and confirm the repository self-check row is script-pass.",
        ),
        ReleaseReadinessItem(
            id = "evidence-snapshot-device-qa",
            requiredFor = ReleaseTarget.PHONE_PRIVATE_ALPHA,
            status = ReleaseReadinessStatus.MANUAL_REQUIRED,
            title = "Non-PII evidence snapshot is collected on device",
            evidence = "The debug receiver and smoke script path compile, but no physical phone evidence snapshot has been recorded.",
            nextAction = "Run scripts/android-device-smoke-test.sh --write-evidence and confirm the snapshot contains only counts, statuses, booleans, and enums.",
        ),
        ReleaseReadinessItem(
            id = "debug-alert-output-device-qa",
            requiredFor = ReleaseTarget.PHONE_PRIVATE_ALPHA,
            status = ReleaseReadinessStatus.MANUAL_REQUIRED,
            title = "Debug alert output test records TEST_CUE evidence on device",
            evidence = "The debug alert output receiver, cue contract markers, and smoke script path compile, but no physical phone script-pass evidence has been recorded.",
            nextAction = "Run scripts/android-device-smoke-test.sh --write-evidence and confirm the debug alert output row is script-pass, includes cue contract markers, and the following snapshot shows latestDeliverySource=TEST_CUE.",
        ),
        ReleaseReadinessItem(
            id = "debug-direction-sample-device-qa",
            requiredFor = ReleaseTarget.PHONE_PRIVATE_ALPHA,
            status = ReleaseReadinessStatus.MANUAL_REQUIRED,
            title = "Debug direction sample test records microphone metadata on device",
            evidence = "The debug direction sample receiver and smoke script path compile, but no physical phone script-pass evidence has been recorded.",
            nextAction = "Run scripts/android-device-smoke-test.sh --write-evidence and confirm the debug direction sample row is script-pass with status, evidence label, sample counts, and microphone metadata counts only.",
        ),
        ReleaseReadinessItem(
            id = "debug-glasses-cue-seed-device-qa",
            requiredFor = ReleaseTarget.PHONE_PRIVATE_ALPHA,
            status = ReleaseReadinessStatus.MANUAL_REQUIRED,
            title = "Debug glasses cue seed prepares projected preview evidence on device",
            evidence = "The debug glasses cue seed receiver and smoke script path compile, but no physical phone script-pass evidence has been recorded.",
            nextAction = "Run scripts/android-device-smoke-test.sh --write-evidence and confirm the debug glasses cue seed row is script-pass before projected cue launch.",
        ),
        ReleaseReadinessItem(
            id = "debug-bluetooth-route-evidence-device-qa",
            requiredFor = ReleaseTarget.PHONE_PRIVATE_ALPHA,
            status = ReleaseReadinessStatus.MANUAL_REQUIRED,
            title = "Debug Bluetooth route evidence records non-PII route metadata on device",
            evidence = "The debug Bluetooth route evidence receiver and smoke script path compile, but no physical phone script-pass evidence has been recorded.",
            nextAction = "Run scripts/android-device-smoke-test.sh --write-evidence and confirm the debug Bluetooth route evidence row is script-pass without Bluetooth product names or MAC addresses.",
        ),
        ReleaseReadinessItem(
            id = "debug-local-delete-self-check-device-qa",
            requiredFor = ReleaseTarget.PHONE_PRIVATE_ALPHA,
            status = ReleaseReadinessStatus.MANUAL_REQUIRED,
            title = "Debug local delete self-check clears local data shape on device",
            evidence = "The debug local delete receiver uses a separate debug store and compiles, but no physical phone script-pass evidence has been recorded.",
            nextAction = "Run scripts/android-device-smoke-test.sh --write-evidence and confirm the debug local delete row is script-pass with post-delete counts at zero.",
        ),
        ReleaseReadinessItem(
            id = "alert-channel-preferences-device-qa",
            requiredFor = ReleaseTarget.PHONE_PRIVATE_ALPHA,
            status = ReleaseReadinessStatus.MANUAL_REQUIRED,
            title = "Alert channel preferences filter device outputs",
            evidence = "Alert channel filtering and storage codec unit tests pass, but no physical phone observation has confirmed delivery rows match enabled outputs.",
            nextAction = "Toggle each alert channel on a physical phone and record enabled channel names plus delivered counts only.",
        ),
        ReleaseReadinessItem(
            id = "prototype-enrollment-device-qa",
            requiredFor = ReleaseTarget.PHONE_PRIVATE_ALPHA,
            status = ReleaseReadinessStatus.MANUAL_REQUIRED,
            title = "Prototype enrollment and live match are tested with real voices",
            evidence = "Quality analyzer, prototype embedding, and match diagnostic are unit tested only.",
            nextAction = "Test same-speaker and different-speaker runs and record only result buckets, not audio.",
        ),
        ReleaseReadinessItem(
            id = "false-positive-run",
            requiredFor = ReleaseTarget.PHONE_PRIVATE_ALPHA,
            status = ReleaseReadinessStatus.MANUAL_REQUIRED,
            title = "Thirty-minute false-positive run",
            evidence = "The app now stores per-event feedback and shows false-positive/wrong-direction counts, but no continuous room test has been recorded yet.",
            nextAction = "Run at least 30 minutes indoors with enrolled labels and record feedback summary counts.",
        ),
        ReleaseReadinessItem(
            id = "meta-dat-credentials",
            requiredFor = ReleaseTarget.GLASSES_PRIVATE_ALPHA,
            status = ReleaseReadinessStatus.BLOCKED,
            title = "Meta DAT credentials and package access",
            evidence = "Real DAT dependencies are not configured; Meta adapter is still a stub.",
            nextAction = "Provide Meta app ID and GitHub package token, then implement the real DAT adapter.",
        ),
        ReleaseReadinessItem(
            id = "meta-display-cue",
            requiredFor = ReleaseTarget.GLASSES_PRIVATE_ALPHA,
            status = ReleaseReadinessStatus.BLOCKED,
            title = "Ray-Ban Display cue proof",
            evidence = "No Ray-Ban Display runtime session has been captured.",
            nextAction = "Render the latest actionable cue through DAT and record device evidence.",
        ),
        ReleaseReadinessItem(
            id = "android-xr-device-proof",
            requiredFor = ReleaseTarget.GLASSES_PRIVATE_ALPHA,
            status = ReleaseReadinessStatus.BLOCKED,
            title = "Android XR projected cue proof",
            evidence = "GlassesProjectedActivity compiles, but XR runtime launch is not verified.",
            nextAction = "Run on an Android XR emulator/device and record projected display evidence.",
        ),
        ReleaseReadinessItem(
            id = "encrypted-local-storage",
            requiredFor = ReleaseTarget.EXTERNAL_BETA,
            status = ReleaseReadinessStatus.MANUAL_REQUIRED,
            title = "Encrypted local storage migration",
            evidence = "PreferencesVoiceDirectionRepository now writes sensitive local strings through AndroidKeyStore AES-GCM envelopes and keeps legacy plaintext read-only migration.",
            nextAction = "Run scripts/android-device-smoke-test.sh --write-evidence on a physical phone and complete the encrypted storage rows.",
        ),
        ReleaseReadinessItem(
            id = "production-speaker-model",
            requiredFor = ReleaseTarget.EXTERNAL_BETA,
            status = ReleaseReadinessStatus.BLOCKED,
            title = "Production-grade on-device speaker verification",
            evidence = "Prototype acoustic embeddings are diagnostic only; docs/21-production-speaker-model-evaluation.md defines the model, threshold, anti-spoofing, latency, and privacy evidence gate, but no model candidate or aggregate evaluation results exist.",
            nextAction = "Select or implement an on-device model, run the evaluation protocol, record aggregate metrics, and pass scripts/validate-production-speaker-model-readiness.mjs --require-model-ready --json.",
        ),
        ReleaseReadinessItem(
            id = "privacy-consent-copy",
            requiredFor = ReleaseTarget.EXTERNAL_BETA,
            status = ReleaseReadinessStatus.MANUAL_REQUIRED,
            title = "Tester-facing consent and limitation copy",
            evidence = "VoiceDirectionTesterConsent.copy, microphoneDisclosure, and docs/16-privacy-policy-data-safety-draft.md cover current local data handling, but tester/policy/legal review and a hosted public privacy URL are not complete.",
            nextAction = "Review the copy and draft, replace TBD fields, host a public privacy policy URL, complete Play Data Safety, and record physical-device disclosure evidence before external beta.",
        ),
        ReleaseReadinessItem(
            id = "front-back-direction-evidence",
            requiredFor = ReleaseTarget.PRODUCTION_SERVICE,
            status = ReleaseReadinessStatus.BLOCKED,
            title = "Front/back caller direction evidence",
            evidence = "Current estimator only proves rough left/right on controlled stereo PCM; docs/22-direction-accuracy-evidence.md defines the four-direction hardware evidence gate, but no controlled phone or wearable direction evaluation exists.",
            nextAction = "Collect device-specific microphone metadata, controlled front/back/left/right trials, route evidence, and pass scripts/validate-direction-accuracy-evidence.mjs --require-production-direction-ready --json before claiming front/back direction.",
        ),
        ReleaseReadinessItem(
            id = "store-and-sdk-policy-clearance",
            requiredFor = ReleaseTarget.PRODUCTION_SERVICE,
            status = ReleaseReadinessStatus.BLOCKED,
            title = "Store, SDK, and wearable distribution policy clearance",
            evidence = "docs/15-policy-clearance-matrix.md tracks Meta, Android XR, Google Play, voice, recording, and wearable distribution requirements; docs/16 through docs/24 are drafts/runbooks only, and no external clearance, upload-signed AAB, release-track notes/media evidence, model evaluation evidence, direction accuracy evidence, support drill evidence, glasses credential proof, or submission has been performed.",
            nextAction = "Complete Meta logged-in review, Google Play Console privacy/Data Safety/listing/release artifact/release notes/screenshot review, Android XR packaging review, voice/recording legal review, production speaker model review, production direction accuracy review, support drill review, and glasses credential setup.",
        ),
        ReleaseReadinessItem(
            id = "support-incident-process",
            requiredFor = ReleaseTarget.PRODUCTION_SERVICE,
            status = ReleaseReadinessStatus.MANUAL_REQUIRED,
            title = "Support and incident process for mistaken alerts",
            evidence = "docs/14-support-incident-process.md defines support intake, deletion verification, mistaken-alert triage, severity, and incident response; docs/23-support-drill-evidence.md and apps/voice-direction-glass/support-drills/manifest.json define the drill evidence gate.",
            nextAction = "Configure a real support channel, run deletion verification and mistaken-alert incident drills, then pass scripts/validate-support-drill-evidence.mjs --require-drills-ready --json.",
        ),
    )

    fun itemsRequiredFor(target: ReleaseTarget): List<ReleaseReadinessItem> =
        items.filter { item -> item.requiredFor.ordinal <= target.ordinal }

    fun openItemsFor(target: ReleaseTarget): List<ReleaseReadinessItem> =
        itemsRequiredFor(target).filter { item ->
            item.blocksTargetWhenUnmet && item.status != ReleaseReadinessStatus.PASS
        }

    fun blockedItemsFor(target: ReleaseTarget): List<ReleaseReadinessItem> =
        openItemsFor(target).filter { item -> item.status == ReleaseReadinessStatus.BLOCKED }

    fun manualItemsFor(target: ReleaseTarget): List<ReleaseReadinessItem> =
        openItemsFor(target).filter { item -> item.status == ReleaseReadinessStatus.MANUAL_REQUIRED }

    fun isReadyFor(target: ReleaseTarget): Boolean =
        openItemsFor(target).isEmpty()

    fun summaryFor(target: ReleaseTarget): ReleaseReadinessSummary {
        val required = itemsRequiredFor(target)
        return ReleaseReadinessSummary(
            target = target,
            totalRequired = required.size,
            passed = required.count { item -> item.status == ReleaseReadinessStatus.PASS },
            manualRequired = required.count { item -> item.status == ReleaseReadinessStatus.MANUAL_REQUIRED },
            blocked = required.count { item -> item.status == ReleaseReadinessStatus.BLOCKED },
            openBlockingItems = openItemsFor(target),
        )
    }
}
