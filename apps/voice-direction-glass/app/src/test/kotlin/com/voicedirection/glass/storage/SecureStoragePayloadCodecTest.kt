package com.voicedirection.glass.storage

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class SecureStoragePayloadCodecTest {
    @Test
    fun roundTripsEncryptedPayloadEnvelope() {
        val payload = SecureStoragePayload(
            iv = byteArrayOf(1, 2, 3, 4),
            ciphertext = byteArrayOf(5, 6, 7, 8),
        )

        val encoded = SecureStoragePayloadCodec.encode(payload)
        val decoded = SecureStoragePayloadCodec.decode(encoded)

        assertNotEquals("plain text", encoded)
        assertTrue(SecureStoragePayloadCodec.isEncrypted(encoded))
        assertArrayEquals(payload.iv, decoded?.iv)
        assertArrayEquals(payload.ciphertext, decoded?.ciphertext)
    }

    @Test
    fun rejectsPlainOrMalformedValues() {
        assertFalse(SecureStoragePayloadCodec.isEncrypted("speaker-1|민지"))
        assertNull(SecureStoragePayloadCodec.decode("speaker-1|민지"))
        assertNull(SecureStoragePayloadCodec.decode("enc:v1:not-valid"))
    }
}
