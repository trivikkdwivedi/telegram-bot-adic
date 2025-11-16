import { Keypair } from "@solana/web3.js";
import { encryptString, decryptString } from "../utils/encryption.js";
import { query } from "../db.js";

export async function createAndStoreWallet(telegramId) {
  const kp = Keypair.generate();
  const pub = kp.publicKey.toBase58();
  const secretBase64 = Buffer.from(kp.secretKey).toString("base64");

  const encrypted = encryptString(secretBase64);

  const sql = `
    INSERT INTO users (telegram_id, public_key, encrypted_secret_key)
    VALUES ($1, $2, $3)
    ON CONFLICT (telegram_id) DO NOTHING
    RETURNING public_key
  `;
  const res = await query(sql, [telegramId, pub, encrypted]);

  return { publicKey: pub, created: res.rowCount > 0 };
}

export async function getUserRecord(telegramId) {
  const res = await query("SELECT * FROM users WHERE telegram_id = $1", [telegramId]);
  return res.rows[0] || null;
}

export async function getSecretKeyUint8Array(telegramId) {
  const row = await getUserRecord(telegramId);
  if (!row) return null;
  const encrypted = row.encrypted_secret_key;
  const secretBase64 = decryptString(encrypted);
  return Uint8Array.from(Buffer.from(secretBase64, "base64"));
}
