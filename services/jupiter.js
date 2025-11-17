// services/jupiter.js
import fetch from "node-fetch";

/**
 * 🟦 Fetch SOL price in USD using Jupiter Price API
 */
export async function getSolPrice() {
  try {
    // Wrapped SOL mint (Jupiter standard ID)
    const url = "https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112";

    const res = await fetch(url);
    const data = await res.json();

    // The price for SOL is stored under the mint key
    const price = data.data?.So11111111111111111111111111111111111111112?.price;

    return price || null;

  } catch (err) {
    console.error("Error fetching SOL price:", err);
    return null;
  }
}

/**
 * 🟩 Fetch SPL token price using mint address
 */
export async function getTokenPrice(mint) {
  try {
    const url = `https://price.jup.ag/v4/price?ids=${mint}`;

    const res = await fetch(url);
    const data = await res.json();

    // Data is returned as: data["mint_address"].price
    const price = data.data?.[mint]?.price;

    return price || null;

  } catch (err) {
    console.error("Error fetching token price:", err);
    return null;
  }
}

/**
 * Validate Solana mint address format
 */
export function isMint(str) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(str);
}
