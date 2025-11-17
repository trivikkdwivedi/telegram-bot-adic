// services/price.js
import fetch from "node-fetch";

const JUP_URL = "https://price.jup.ag/v4/price";

export async function getSolPrice() {
  try {
    const url = ${JUP_URL}?ids=SOL;
    const res = await fetch(url);
    const json = await res.json();
    return json?.data?.SOL?.price ?? null;
  } catch (err) {
    console.error("SOL price error:", err);
    return null;
  }
}

export async function getTokenPrice(mint) {
  try {
    const url = ${JUP_URL}?ids=${mint};
    const res = await fetch(url);
    const json = await res.json();
    return json?.data?.[mint]?.price ?? null;
  } catch (err) {
    console.error("Token price error:", err);
    return null;
  }
}

export function isMint(address) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(String(address));
}
