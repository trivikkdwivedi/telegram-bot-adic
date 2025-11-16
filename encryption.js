import crypto from "crypto";

const KEY_HEX_OR_B64 = process.env.ENCRYPTION_KEY;
if (!KEY_HEX_OR_B64) throw new Error("Missing ENCRYPTION_KEY env var");

function loadKey() {
  const k = KEY_HEX_OR_B64.trim();
  if (/^[0-9a-f]{64}$/i.test(k)) return Buffer.from(k, "hex");
  return Buffer.from(k, "base64");
}
const KEY = loadKey();
const ALGO = "aes-256-gcm";
const IV_LEN = 12;

export function encryptString(plainText) {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv, { authTagLength: 16 });
  const ct = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString("base64");
}

export function decryptString(payloadB64) {
  const buf = Buffer.from(payloadB64, "base64");
  const iv = buf.slice(0, IV_LEN);
  const tag = buf.slice(IV_LEN, IV_LEN + 16);
  const ct = buf.slice(IV_LEN + 16);
  const decipher = crypto.createDecipheriv(ALGO, KEY, iv, { authTagLength: 16 });
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ct), decipher.final()]);
  return plain.toString("utf8");
}
