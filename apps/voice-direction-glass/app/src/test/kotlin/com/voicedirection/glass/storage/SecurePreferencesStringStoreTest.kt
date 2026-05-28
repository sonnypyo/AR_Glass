package com.voicedirection.glass.storage

import android.content.SharedPreferences
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class SecurePreferencesStringStoreTest {
    @Test
    fun readsLegacyPlaintextWhenEncryptedValueIsAbsent() {
        val preferences = FakeSharedPreferences(mapOf("speaker_profiles" to "legacy-plain"))
        val store = SecurePreferencesStringStore(preferences, FakeStringCipher())

        assertEquals("legacy-plain", store.getString("speaker_profiles"))
    }

    @Test
    fun writesEncryptedValueAndRemovesLegacyPlaintext() {
        val preferences = FakeSharedPreferences(mapOf("speaker_profiles" to "legacy-plain"))
        val store = SecurePreferencesStringStore(preferences, FakeStringCipher())

        store.putString("speaker_profiles", "profile-secret")

        assertEquals("profile-secret", store.getString("speaker_profiles"))
        assertNull(preferences.getString("speaker_profiles", null))
        assertTrue(store.hasEncryptedValue("speaker_profiles"))
        assertFalse(
            preferences.getString("secure:speaker_profiles", "")
                .orEmpty()
                .contains("profile-secret"),
        )
    }

    @Test
    fun doesNotFallBackToLegacyWhenEncryptedValueExistsButCannotDecrypt() {
        val preferences = FakeSharedPreferences(
            mapOf(
                "speaker_profiles" to "legacy-plain",
                "secure:speaker_profiles" to "enc:v1:not-valid",
            ),
        )
        val store = SecurePreferencesStringStore(preferences, FakeStringCipher())

        assertNull(store.getString("speaker_profiles"))
    }

    private class FakeStringCipher : StringCipher {
        override fun encrypt(plainText: String): String =
            SecureStoragePayloadCodec.encode(
                SecureStoragePayload(
                    iv = "test-iv".toByteArray(),
                    ciphertext = plainText.toByteArray(),
                ),
            )

        override fun decrypt(encryptedText: String): String? =
            SecureStoragePayloadCodec.decode(encryptedText)
                ?.let { payload -> String(payload.ciphertext) }
    }

    private class FakeSharedPreferences(
        initialValues: Map<String, Any?> = emptyMap(),
    ) : SharedPreferences {
        private val values = initialValues.toMutableMap()

        override fun getAll(): MutableMap<String, *> = values.toMutableMap()

        override fun getString(key: String?, defValue: String?): String? =
            values[key] as? String ?: defValue

        @Suppress("UNCHECKED_CAST")
        override fun getStringSet(key: String?, defValues: MutableSet<String>?): MutableSet<String>? =
            values[key] as? MutableSet<String> ?: defValues

        override fun getInt(key: String?, defValue: Int): Int =
            values[key] as? Int ?: defValue

        override fun getLong(key: String?, defValue: Long): Long =
            values[key] as? Long ?: defValue

        override fun getFloat(key: String?, defValue: Float): Float =
            values[key] as? Float ?: defValue

        override fun getBoolean(key: String?, defValue: Boolean): Boolean =
            values[key] as? Boolean ?: defValue

        override fun contains(key: String?): Boolean =
            values.containsKey(key)

        override fun edit(): SharedPreferences.Editor =
            FakeEditor(values)

        override fun registerOnSharedPreferenceChangeListener(
            listener: SharedPreferences.OnSharedPreferenceChangeListener?,
        ) = Unit

        override fun unregisterOnSharedPreferenceChangeListener(
            listener: SharedPreferences.OnSharedPreferenceChangeListener?,
        ) = Unit
    }

    private class FakeEditor(
        private val values: MutableMap<String, Any?>,
    ) : SharedPreferences.Editor {
        private val pending = mutableMapOf<String, Any?>()
        private val removals = mutableSetOf<String>()
        private var clearRequested = false

        override fun putString(key: String?, value: String?): SharedPreferences.Editor =
            applyPending(key, value)

        override fun putStringSet(key: String?, values: MutableSet<String>?): SharedPreferences.Editor =
            applyPending(key, values)

        override fun putInt(key: String?, value: Int): SharedPreferences.Editor =
            applyPending(key, value)

        override fun putLong(key: String?, value: Long): SharedPreferences.Editor =
            applyPending(key, value)

        override fun putFloat(key: String?, value: Float): SharedPreferences.Editor =
            applyPending(key, value)

        override fun putBoolean(key: String?, value: Boolean): SharedPreferences.Editor =
            applyPending(key, value)

        override fun remove(key: String?): SharedPreferences.Editor = apply {
            key?.let {
                removals += it
                pending.remove(it)
            }
        }

        override fun clear(): SharedPreferences.Editor = apply {
            clearRequested = true
            pending.clear()
            removals.clear()
        }

        override fun commit(): Boolean {
            if (clearRequested) values.clear()
            removals.forEach(values::remove)
            pending.forEach { (key, value) ->
                if (value == null) values.remove(key) else values[key] = value
            }
            return true
        }

        override fun apply() {
            commit()
        }

        private fun applyPending(key: String?, value: Any?): SharedPreferences.Editor = apply {
            key?.let {
                pending[it] = value
                removals.remove(it)
            }
        }
    }
}
