// services/price.js

const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY;

// Check if the string looks like a Solana mint
export function isMint(s) {
  return /^[A-Za-z0-9]{32,60}$/.test(s);
}

// Fetch SOL price fallback (CoinGecko)
export async function getSolPrice() {
  try {
    const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd");
    const j = await r.json();
    return j.solana.usd;
  } catch (_) {
    return null;
  }
}

// Fetch price for ANY SPL token using Birdeye
export async function getTokenPrice(mint) {
  if (!BIRDEYE_API_KEY) throw new Error("Missing BIRDEYE_API_KEY");

  const url = https://public-api.birdeye.so/defi/price?chain=solana&mint=${mint};

  const res = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-api-key": BIRDEYE_API_KEY
    }
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Birdeye error: ${res.status} ${t}`);
  }

  const data = await res.json();

  // Birdeye price usually in: data.price or data.data.price
  return data.data?.price ?? data.price ?? null;
}
