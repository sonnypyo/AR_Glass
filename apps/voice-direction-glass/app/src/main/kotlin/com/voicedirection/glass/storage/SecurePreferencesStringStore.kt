package com.voicedirection.glass.storage

import android.content.SharedPreferences

class SecurePreferencesStringStore(
    private val preferences: SharedPreferences,
    private val cipher: StringCipher,
) {
    fun getString(key: String): String? {
        val encryptedValue = preferences.getString(encryptedKey(key), null)
        if (encryptedValue != null) {
            return cipher.decrypt(encryptedValue)
        }
        return preferences.getString(key, null)
    }

    fun putString(key: String, value: String) {
        preferences.edit()
            .putString(encryptedKey(key), cipher.encrypt(value))
            .remove(key)
            .apply()
    }

    fun removeString(key: String) {
        preferences.edit()
            .remove(encryptedKey(key))
            .remove(key)
            .apply()
    }

    fun hasEncryptedValue(key: String): Boolean {
        val value = preferences.getString(encryptedKey(key), null) ?: return false
        return SecureStoragePayloadCodec.isEncrypted(value)
    }

    private fun encryptedKey(key: String): String = "$ENCRYPTED_KEY_PREFIX$key"

    companion object {
        private const val ENCRYPTED_KEY_PREFIX = "secure:"
    }
}
