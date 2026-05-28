package com.voicedirection.glass.storage

import java.util.Base64

data class SecureStoragePayload(
    val iv: ByteArray,
    val ciphertext: ByteArray,
) {
    override fun equals(other: Any?): Boolean =
        other is SecureStoragePayload &&
            iv.contentEquals(other.iv) &&
            ciphertext.contentEquals(other.ciphertext)

    override fun hashCode(): Int =
        31 * iv.contentHashCode() + ciphertext.contentHashCode()
}

object SecureStoragePayloadCodec {
    private const val PREFIX = "enc:v1:"
    private const val PART_SEPARATOR = ":"

    fun encode(payload: SecureStoragePayload): String =
        PREFIX +
            base64(payload.iv) +
            PART_SEPARATOR +
            base64(payload.ciphertext)

    fun decode(value: String): SecureStoragePayload? {
        if (!value.startsWith(PREFIX)) return null
        val body = value.removePrefix(PREFIX)
        val parts = body.split(PART_SEPARATOR)
        if (parts.size != 2) return null
        return runCatching {
            SecureStoragePayload(
                iv = Base64.getDecoder().decode(parts[0]),
                ciphertext = Base64.getDecoder().decode(parts[1]),
            )
        }.getOrNull()
    }

    fun isEncrypted(value: String): Boolean =
        value.startsWith(PREFIX) && decode(value) != null

    private fun base64(bytes: ByteArray): String =
        Base64.getEncoder().withoutPadding().encodeToString(bytes)
}
