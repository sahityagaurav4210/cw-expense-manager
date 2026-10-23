import crypto from "crypto";

const RFC4648_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Encodes a Buffer to Base32 string (RFC 4648)
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += RFC4648_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += RFC4648_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes a Base32 string to Buffer (RFC 4648)
 */
export function base32Decode(input: string): Buffer {
  const cleanInput = input.toUpperCase().replace(/[\s=-]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleanInput.length; i++) {
    const idx = RFC4648_ALPHABET.indexOf(cleanInput[i]);
    if (idx === -1) continue;

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

export class TotpService {
  /**
   * Generates a 20-byte random secret encoded as Base32 (32 chars)
   */
  public static generateSecret(byteLength: number = 20): string {
    const bytes = crypto.randomBytes(byteLength);
    return base32Encode(bytes);
  }

  /**
   * Generates standard otpauth:// URL for scanning into Google Authenticator, Microsoft Authenticator, etc.
   */
  public static generateOtpAuthUrl(
    email: string,
    secret: string,
    issuer: string = "CW Expense Tracker",
  ): string {
    const label = `${issuer}:${email}`;
    return `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(
      issuer,
    )}&algorithm=SHA1&digits=6&period=30`;
  }

  /**
   * Generates standard QR Code image URL using QR Server API
   */
  public static generateQrCodeUrl(otpAuthUrl: string): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(
      otpAuthUrl,
    )}`;
  }

  /**
   * Generates a 6-digit TOTP code for a secret at a specific counter offset
   */
  public static generateTotpCode(secret: string, counterOffset: number = 0): string {
    const key = base32Decode(secret);
    const epoch = Math.floor(Date.now() / 1000);
    const timeStep = 30;
    const counter = Math.floor(epoch / timeStep) + counterOffset;

    const buf = Buffer.alloc(8);
    buf.writeBigInt64BE(BigInt(counter), 0);

    const hmac = crypto.createHmac("sha1", key).update(buf).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    return (code % 1000000).toString().padStart(6, "0");
  }

  /**
   * Verifies 6-digit TOTP code against secret.
   * Tolerates ±1 time step (±30 seconds) clock drift.
   */
  public static verifyTotp(token: string, secret: string, window: number = 1): boolean {
    if (!token || !secret) return false;
    const cleanToken = token.trim();
    if (cleanToken.length !== 6) return false;

    for (let offset = -window; offset <= window; offset++) {
      if (this.generateTotpCode(secret, offset) === cleanToken) {
        return true;
      }
    }
    return false;
  }
}
