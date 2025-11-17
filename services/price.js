// services/price.js
import "dotenv/config";

const API = "https://public-api.birdeye.so";
const KEY = process.env.BIRDEYE_API_KEY;

// --- Fetch SOL price ---
export async function getSolPrice() {
  try {
    const url = `${API}/defi/price?address=So11111111111111111111111111111111111111112`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        "x-chain": "solana",
        "X-API-KEY": KEY,
      },
    });

    const data = await res.json();
    return data?.data?.value || null;
  } catch (err) {
    console.error("SOL PRICE ERROR:", err);
    return null;
  }
}

// --- Fetch ANY token price ---
export async function getTokenPrice(mint) {
  try {
    const url = `${API}/defi/price?address=${mint}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        "x-chain": "solana",
        "X-API-KEY": KEY,
      },
    });

    const data = await res.json();
    return data?.data?.value || null;
  } catch (err) {
    console.error("TOKEN PRICE ERROR:", err);
    return null;
  }
}

// --- Mint validation ---
export function isMint(s) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s);
}
