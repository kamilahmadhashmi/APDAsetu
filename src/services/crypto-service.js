/* ==========================================================================
   AEGIS-MESH / AAPDASETU - BROWSER NATIVE AES-256-GCM CRYPTOGRAPHY SERVICE
   Uses W3C Web Crypto API (crypto.subtle) for hardware-accelerated, genuine
   military-grade 256-bit AES-GCM authenticated encryption and decryption.
   Zero external libraries required.
   ========================================================================== */

const EMERGENCY_PASSPHRASE = 'AEGIS-RESQNET-DISASTER-EMERGENCY-2026-KEY';

class WebCryptoService {
  constructor() {
    this.cryptoKey = null;
    this.keyPromise = this.initKey();
  }

  async initKey() {
    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
      console.warn('[WebCrypto] SubtleCrypto not available in this environment');
      return null;
    }

    try {
      // Derive 256-bit AES-GCM key from emergency operational passphrase using SHA-256
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.digest('SHA-256', encoder.encode(EMERGENCY_PASSPHRASE));
      this.cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyMaterial,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
      );
      return this.cryptoKey;
    } catch (err) {
      console.error('[WebCrypto] Key initialization failed:', err);
      return null;
    }
  }

  /* --------------------------------------------------------------------------
     REAL AES-256-GCM ENCRYPTION
     -------------------------------------------------------------------------- */
  async encryptPayload(data) {
    const key = await this.keyPromise;
    if (!key) {
      throw new Error('WebCrypto AES key unavailable');
    }

    // 12-byte (96-bit) cryptographically random IV (NIST SP 800-38D standard)
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const plaintextBytes = encoder.encode(JSON.stringify(data));

    // AES-GCM encryption with 128-bit authentication tag appended
    const cipherBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv, tagLength: 128 },
      key,
      plaintextBytes
    );

    return {
      iv: this.arrayBufferToBase64(iv.buffer),
      ciphertext: this.arrayBufferToBase64(cipherBuffer),
      algorithm: 'AES-256-GCM'
    };
  }

  /* --------------------------------------------------------------------------
     REAL AES-256-GCM DECRYPTION & AUTHENTICATION
     -------------------------------------------------------------------------- */
  async decryptPayload(ivBase64, ciphertextBase64) {
    const key = await this.keyPromise;
    if (!key) {
      throw new Error('WebCrypto AES key unavailable');
    }

    const iv = this.base64ToArrayBuffer(ivBase64);
    const cipherBuffer = this.base64ToArrayBuffer(ciphertextBase64);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv), tagLength: 128 },
      key,
      cipherBuffer
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decryptedBuffer));
  }

  /* --------------------------------------------------------------------------
     HEX & BASE64 HELPERS
     -------------------------------------------------------------------------- */
  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async computeSha256Hash(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 28);
  }
}

export const cryptoService = new WebCryptoService();
