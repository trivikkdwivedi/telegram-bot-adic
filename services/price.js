import fetch from "node-fetch";

// BirdEye API Base
const API = "https://public-api.birdeye.so";

// Only SOL or SPL tokens allowed
export function isMint(str) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(str);
}

// --- Fetch SOL price ---
export async function getSolPrice() {
  const url = `${API}/defi/price?chain=solana&address=So11111111111111111111111111111111111111112`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-chain": "solana",
    },
  });

  const data = await res.json();
  return data.data?.value || null;
}

// --- Fetch SPL Token price ---
export async function getTokenPrice(mint) {
  const url = `${API}/defi/price?chain=solana&address=${mint}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-chain": "solana",
    },
  });

  const data = await res.json();
  return data.data?.value || null;
}
