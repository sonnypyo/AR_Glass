package com.voicedirection.glass.qa

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.voicedirection.glass.diagnostics.DiagnosticsLogger
import com.voicedirection.glass.storage.AndroidKeyStoreStringCipher
import com.voicedirection.glass.storage.SecurePreferencesStringStore

class StorageSelfCheckReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val phase = intent.getStringExtra(EXTRA_PHASE).orEmpty().ifBlank { PHASE_RUN }
        val result = runCatching {
            when (phase) {
                PHASE_RESET -> reset(context)
                PHASE_WRITE -> write(context)
                PHASE_VERIFY -> verify(context)
                PHASE_RUN -> {
                    reset(context)
                    write(context)
                    verify(context)
                }
                else -> SelfCheckResult(
                    phase = phase,
                    passed = false,
                    encryptedValuePresent = false,
                    plaintextRemoved = false,
                    decryptedMatches = false,
                    message = "unknown phase",
                )
            }
        }.getOrElse { error ->
            SelfCheckResult(
                phase = phase,
                passed = false,
                encryptedValuePresent = false,
                plaintextRemoved = false,
                decryptedMatches = false,
                message = error::class.java.simpleName,
            )
        }

        DiagnosticsLogger.info(
            "storage_self_check_completed",
            "phase" to result.phase,
            "passed" to result.passed,
            "encryptedValuePresent" to result.encryptedValuePresent,
            "plaintextRemoved" to result.plaintextRemoved,
            "decryptedMatches" to result.decryptedMatches,
        )
        setResultCode(if (result.passed) RESULT_CODE_PASS else RESULT_CODE_FAIL)
        setResultData(result.toResultData())
    }

    private fun reset(context: Context): SelfCheckResult {
        context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
            .edit()
            .clear()
            .commit()
        return SelfCheckResult(
            phase = PHASE_RESET,
            passed = true,
            encryptedValuePresent = false,
            plaintextRemoved = true,
            decryptedMatches = false,
            message = "reset",
        )
    }

    private fun write(context: Context): SelfCheckResult {
        val preferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
        preferences.edit().putString(KEY_PAYLOAD, LEGACY_SENTINEL).commit()
        val store = secureStore(preferences)
        store.putString(KEY_PAYLOAD, EXPECTED_VALUE)
        return inspect(PHASE_WRITE, preferences, store)
    }

    private fun verify(context: Context): SelfCheckResult {
        val preferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
        return inspect(PHASE_VERIFY, preferences, secureStore(preferences))
    }

    private fun inspect(
        phase: String,
        preferences: android.content.SharedPreferences,
        store: SecurePreferencesStringStore,
    ): SelfCheckResult {
        val encryptedValuePresent = store.hasEncryptedValue(KEY_PAYLOAD)
        val plaintextRemoved = !preferences.contains(KEY_PAYLOAD)
        val decryptedMatches = store.getString(KEY_PAYLOAD) == EXPECTED_VALUE
        val passed = encryptedValuePresent && plaintextRemoved && decryptedMatches
        return SelfCheckResult(
            phase = phase,
            passed = passed,
            encryptedValuePresent = encryptedValuePresent,
            plaintextRemoved = plaintextRemoved,
            decryptedMatches = decryptedMatches,
            message = if (passed) "pass" else "failed",
        )
    }

    private fun secureStore(preferences: android.content.SharedPreferences): SecurePreferencesStringStore =
        SecurePreferencesStringStore(
            preferences = preferences,
            cipher = AndroidKeyStoreStringCipher(KEY_ALIAS),
        )

    private data class SelfCheckResult(
        val phase: String,
        val passed: Boolean,
        val encryptedValuePresent: Boolean,
        val plaintextRemoved: Boolean,
        val decryptedMatches: Boolean,
        val message: String,
    ) {
        fun toResultData(): String =
            listOf(
                "phase=$phase",
                "passed=$passed",
                "encryptedValuePresent=$encryptedValuePresent",
                "plaintextRemoved=$plaintextRemoved",
                "decryptedMatches=$decryptedMatches",
                "message=$message",
            ).joinToString(";")
    }

    companion object {
        private const val EXTRA_PHASE = "phase"
        private const val PHASE_RESET = "reset"
        private const val PHASE_WRITE = "write"
        private const val PHASE_VERIFY = "verify"
        private const val PHASE_RUN = "run"
        private const val RESULT_CODE_PASS = 100
        private const val RESULT_CODE_FAIL = 101
        private const val PREFERENCES_NAME = "voice_direction_storage_self_check"
        private const val KEY_PAYLOAD = "self_check_payload"
        private const val LEGACY_SENTINEL = "legacy-plaintext-sentinel"
        private const val EXPECTED_VALUE = "voice-direction-secure-self-check-v1"
        private const val KEY_ALIAS = "voice_direction_storage_self_check_aes_gcm"
    }
}
