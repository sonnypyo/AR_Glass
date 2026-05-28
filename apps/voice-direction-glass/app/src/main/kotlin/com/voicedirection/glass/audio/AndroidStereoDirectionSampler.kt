package com.voicedirection.glass.audio

import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import com.voicedirection.glass.direction.StereoPcmDirectionEstimator
import com.voicedirection.glass.direction.StereoPcmFrame

class AndroidStereoDirectionSampler(
    private val capabilityProbe: AudioCapabilityProbe,
    private val estimator: StereoPcmDirectionEstimator = StereoPcmDirectionEstimator(),
    private val clockMillis: () -> Long = { System.currentTimeMillis() },
    private val sampleDurationMillis: Int = 250,
) : AudioDirectionSampler {
    override fun sampleDirection(): AudioDirectionSampleResult {
        val probeReport = capabilityProbe.probe()
        if (!probeReport.recordAudioPermissionGranted) {
            return result(
                status = AudioDirectionSampleStatus.NO_PERMISSION,
                message = "마이크 권한이 필요합니다",
            )
        }

        val candidate = probeReport.capabilities
            .filter { it.supported && it.channelLayout == AudioChannelLayout.STEREO }
            .minByOrNull { it.sampleRateHz }
            ?: return result(
                status = AudioDirectionSampleStatus.NO_STEREO_INPUT,
                message = "지원되는 스테레오 PCM 조합이 없습니다",
                microphoneMetadata = probeReport.microphoneMetadata,
            )

        return sampleStereo(candidate, probeReport.microphoneMetadata)
    }

    private fun sampleStereo(
        candidate: AudioChannelProbeResult,
        baseMicrophoneMetadata: MicrophoneMetadataSummary,
    ): AudioDirectionSampleResult {
        val bufferSizeBytes = maxOf(
            candidate.minBufferSizeBytes * 2,
            candidate.sampleRateHz * STEREO_CHANNELS * BYTES_PER_SAMPLE * sampleDurationMillis / MILLIS_PER_SECOND,
        )
        val recorder = try {
            AudioRecord.Builder()
                .setAudioSource(MediaRecorder.AudioSource.MIC)
                .setAudioFormat(
                    AudioFormat.Builder()
                        .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                        .setSampleRate(candidate.sampleRateHz)
                        .setChannelMask(AudioFormat.CHANNEL_IN_STEREO)
                        .build(),
                )
                .setBufferSizeInBytes(bufferSizeBytes)
                .build()
        } catch (error: SecurityException) {
            return result(
                status = AudioDirectionSampleStatus.NO_PERMISSION,
                sampleRateHz = candidate.sampleRateHz,
                minBufferSizeBytes = candidate.minBufferSizeBytes,
                message = error.message ?: "마이크 권한이 필요합니다",
                microphoneMetadata = baseMicrophoneMetadata,
            )
        } catch (error: RuntimeException) {
            return result(
                status = AudioDirectionSampleStatus.RECORDER_UNAVAILABLE,
                sampleRateHz = candidate.sampleRateHz,
                minBufferSizeBytes = candidate.minBufferSizeBytes,
                message = error.message ?: "AudioRecord 초기화 실패",
                microphoneMetadata = baseMicrophoneMetadata,
            )
        }

        var started = false
        var microphoneMetadata = baseMicrophoneMetadata
        return try {
            if (recorder.state != AudioRecord.STATE_INITIALIZED) {
                return result(
                    status = AudioDirectionSampleStatus.RECORDER_UNAVAILABLE,
                    sampleRateHz = candidate.sampleRateHz,
                    minBufferSizeBytes = candidate.minBufferSizeBytes,
                    message = "AudioRecord가 초기화되지 않았습니다",
                    microphoneMetadata = microphoneMetadata,
                )
            }

            val samples = ShortArray(bufferSizeBytes / BYTES_PER_SAMPLE)
            recorder.startRecording()
            started = true
            microphoneMetadata = AndroidMicrophoneMetadataReader.withActiveMicrophones(
                base = baseMicrophoneMetadata,
                recorder = recorder,
            )
            val readCount = recorder.read(samples, 0, samples.size, AudioRecord.READ_BLOCKING)
            if (readCount <= 0) {
                return result(
                    status = AudioDirectionSampleStatus.READ_FAILED,
                    sampleRateHz = candidate.sampleRateHz,
                    minBufferSizeBytes = candidate.minBufferSizeBytes,
                    samplesRead = readCount,
                    message = "AudioRecord read returned $readCount",
                    microphoneMetadata = microphoneMetadata,
                )
            }

            val estimate = estimator.estimate(
                StereoPcmFrame(
                    samples = samples.copyOf(readCount),
                    channelCount = STEREO_CHANNELS,
                    sampleRateHz = candidate.sampleRateHz,
                ),
            )
            result(
                status = AudioDirectionSampleStatus.SAMPLED,
                sampleRateHz = candidate.sampleRateHz,
                minBufferSizeBytes = candidate.minBufferSizeBytes,
                samplesRead = readCount,
                estimate = estimate,
                message = "원본 PCM 저장 없이 메모리 샘플만 분석했습니다",
                microphoneMetadata = microphoneMetadata,
            )
        } catch (error: RuntimeException) {
            result(
                status = AudioDirectionSampleStatus.ERROR,
                sampleRateHz = candidate.sampleRateHz,
                minBufferSizeBytes = candidate.minBufferSizeBytes,
                message = error.message ?: "방향 샘플 점검 오류",
                microphoneMetadata = microphoneMetadata,
            )
        } finally {
            if (started) {
                runCatching { recorder.stop() }
            }
            recorder.release()
        }
    }

    private fun result(
        status: AudioDirectionSampleStatus,
        sampleRateHz: Int? = null,
        minBufferSizeBytes: Int? = null,
        samplesRead: Int = 0,
        estimate: com.voicedirection.glass.direction.DirectionEstimate? = null,
        message: String,
        microphoneMetadata: MicrophoneMetadataSummary = MicrophoneMetadataSummary(),
    ): AudioDirectionSampleResult =
        AudioDirectionSampleResult(
            checkedAtMillis = clockMillis(),
            status = status,
            sampleRateHz = sampleRateHz,
            minBufferSizeBytes = minBufferSizeBytes,
            samplesRead = samplesRead,
            estimate = estimate,
            message = message,
            microphoneMetadata = microphoneMetadata,
        )

    companion object {
        private const val STEREO_CHANNELS = 2
        private const val BYTES_PER_SAMPLE = 2
        private const val MILLIS_PER_SECOND = 1000
    }
}
