// index.js
import "dotenv/config";
import { Telegraf } from "telegraf";
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";

import { createAndStoreWallet, getUserRecord } from "./services/wallet.js";
import { getSolPrice, getTokenPrice, isMint } from "./services/price.js";

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) throw new Error("Missing BOT_TOKEN");

const RPC = process.env.SOLANA_RPC || "https://api.mainnet-beta.solana.com";
const conn = new Connection(RPC, "confirmed");

const bot = new Telegraf(BOT_TOKEN);

// ---------------------------------------------
// /start
// ---------------------------------------------
bot.start((ctx) => {
  ctx.reply(
    "Welcome to your wallet bot! 🔥\n\n" +
      "Available commands:\n" +
      "/createwallet - generate a secure Solana wallet\n" +
      "/balance - check wallet balance\n" +
      "/price <SOL|CA> - get price of SOL or any SPL token"
  );
});

// ---------------------------------------------
// /createwallet
// ---------------------------------------------
bot.command("createwallet", async (ctx) => {
  try {
    const tgId = ctx.from.id;
    const existing = await getUserRecord(tgId);

    if (existing) {
      return ctx.reply(
        ⚠️ You already have a wallet.\n\n +
        Public Key:\n${existing.public_key}\n\n +
        Use /balance to check SOL balance.
      );
    }

    const result = await createAndStoreWallet(tgId);
    return ctx.reply(
      ✅ Wallet created!\n\nYour public key:\n${result.publicKey}\n\nSave it safely.,
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    console.error("Create wallet error:", err);
    return ctx.reply("❌ Error creating wallet. Check logs.");
  }
});

// ---------------------------------------------
// /balance
// ---------------------------------------------
bot.command("balance", async (ctx) => {
  try {
    const tgId = ctx.from.id;
    const row = await getUserRecord(tgId);

    if (!row) return ctx.reply("❌ You don't have a wallet. Use /createwallet");

    const pubkey = new PublicKey(row.public_key);
    const lamports = await conn.getBalance(pubkey);
    const sol = lamports / LAMPORTS_PER_SOL;

    return ctx.reply(
      💰 *Balance*\nAddress: ${row.public_key}\nSOL: *${sol}*,
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    console.error("Balance error:", err);
    return ctx.reply("❌ Error fetching balance.");
  }
});

// ---------------------------------------------
// /price <SOL|CA>
// ---------------------------------------------
bot.command("price", async (ctx) => {
  try {
    const text = ctx.message.text.trim();
    const parts = text.split(" ");

    if (parts.length < 2)
      return ctx.reply("Usage:\n/price SOL\n/price <token_mint>");

    const query = parts[1];

    // SOL price
    if (/^sol$/i.test(query)) {
      const p = await getSolPrice();
      return ctx.reply(`💸 SOL Price: $${p}`);
    }

    // SPL token (by mint)
    if (isMint(query)) {
      const p = await getTokenPrice(query);
      if (!p) return ctx.reply("❌ Could not fetch price for that token.");
      return ctx.reply(
        💠 Token Price\nMint: ${query}\nUSD: $${p}
      );
    }

    return ctx.reply("❌ Invalid token or mint address.");
  } catch (err) {
    console.error("Price error:", err);
    return ctx.reply(`❌ Error: ${err.message}`);
  }
});

// ---------------------------------------------
// Fallback for unknown messages
// ---------------------------------------------
bot.on("message", async (ctx) => {
  ctx.reply("Unknown command. Use /start to see commands.");
});

// ---------------------------------------------
// Launch bot
// ---------------------------------------------
bot.launch().then(() => {
  console.log("🚀 Bot started successfully.");
});

// Graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
