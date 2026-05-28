package com.voicedirection.glass.enrollment

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder

class AndroidVoiceEnrollmentSampler(
    private val context: Context,
    private val analyzer: VoiceEnrollmentSampleAnalyzer = VoiceEnrollmentSampleAnalyzer(),
    private val embeddingExtractor: PrototypeVoiceEmbeddingExtractor = PrototypeVoiceEmbeddingExtractor(),
    private val clockMillis: () -> Long = { System.currentTimeMillis() },
    private val sampleRateHz: Int = DEFAULT_SAMPLE_RATE_HZ,
    private val sampleDurationMillis: Int = DEFAULT_SAMPLE_DURATION_MILLIS,
) : VoiceEnrollmentSampler {
    override fun captureSample(): VoiceEnrollmentSampleResult {
        if (context.checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            return result(
                status = VoiceEnrollmentSampleStatus.NO_PERMISSION,
                message = "마이크 권한이 필요합니다",
            )
        }

        val minBufferSize = AudioRecord.getMinBufferSize(
            sampleRateHz,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT,
        )
        if (minBufferSize <= 0) {
            return result(
                status = VoiceEnrollmentSampleStatus.RECORDER_UNAVAILABLE,
                sampleRateHz = sampleRateHz,
                message = "지원되는 mono PCM 조합이 없습니다",
            )
        }

        val bufferSizeBytes = maxOf(
            minBufferSize * 2,
            sampleRateHz * BYTES_PER_SAMPLE * sampleDurationMillis / MILLIS_PER_SECOND,
        )
        val recorder = try {
            AudioRecord.Builder()
                .setAudioSource(MediaRecorder.AudioSource.MIC)
                .setAudioFormat(
                    AudioFormat.Builder()
                        .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                        .setSampleRate(sampleRateHz)
                        .setChannelMask(AudioFormat.CHANNEL_IN_MONO)
                        .build(),
                )
                .setBufferSizeInBytes(bufferSizeBytes)
                .build()
        } catch (error: SecurityException) {
            return result(
                status = VoiceEnrollmentSampleStatus.NO_PERMISSION,
                sampleRateHz = sampleRateHz,
                message = error.message ?: "마이크 권한이 필요합니다",
            )
        } catch (error: RuntimeException) {
            return result(
                status = VoiceEnrollmentSampleStatus.RECORDER_UNAVAILABLE,
                sampleRateHz = sampleRateHz,
                message = error.message ?: "AudioRecord 초기화 실패",
            )
        }

        var started = false
        return try {
            if (recorder.state != AudioRecord.STATE_INITIALIZED) {
                return result(
                    status = VoiceEnrollmentSampleStatus.RECORDER_UNAVAILABLE,
                    sampleRateHz = sampleRateHz,
                    message = "AudioRecord가 초기화되지 않았습니다",
                )
            }

            val samples = ShortArray(bufferSizeBytes / BYTES_PER_SAMPLE)
            recorder.startRecording()
            started = true
            val readCount = recorder.read(samples, 0, samples.size, AudioRecord.READ_BLOCKING)
            val analysis = analyzer.analyze(samples, readCount, sampleRateHz)
            val embedding = if (analysis.status == VoiceEnrollmentSampleStatus.SAMPLED) {
                embeddingExtractor.extract(samples, readCount, sampleRateHz)
            } else {
                null
            }
            result(
                status = analysis.status,
                sampleRateHz = sampleRateHz,
                samplesRead = readCount,
                metrics = analysis.metrics,
                embedding = embedding,
                message = "원본 PCM 저장 없이 샘플 품질만 분석했습니다",
            )
        } catch (error: RuntimeException) {
            result(
                status = VoiceEnrollmentSampleStatus.ERROR,
                sampleRateHz = sampleRateHz,
                message = error.message ?: "음성 샘플 수집 오류",
            )
        } finally {
            if (started) {
                runCatching { recorder.stop() }
            }
            recorder.release()
        }
    }

    private fun result(
        status: VoiceEnrollmentSampleStatus,
        sampleRateHz: Int? = null,
        samplesRead: Int = 0,
        metrics: VoiceEnrollmentSampleMetrics? = null,
        embedding: com.voicedirection.glass.model.VoiceEmbedding? = null,
        message: String,
    ): VoiceEnrollmentSampleResult =
        VoiceEnrollmentSampleResult(
            checkedAtMillis = clockMillis(),
            status = status,
            sampleRateHz = sampleRateHz,
            samplesRead = samplesRead,
            metrics = metrics,
            embedding = embedding,
            message = message,
        )

    companion object {
        private const val DEFAULT_SAMPLE_RATE_HZ = 16_000
        private const val DEFAULT_SAMPLE_DURATION_MILLIS = 800
        private const val BYTES_PER_SAMPLE = 2
        private const val MILLIS_PER_SECOND = 1000
    }
}
