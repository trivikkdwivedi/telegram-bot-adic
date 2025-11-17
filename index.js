// index.js
import "dotenv/config";
import { Telegraf } from "telegraf";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

import { createAndStoreWallet, getUserRecord } from "./services/wallet.js";
import { getSolPrice, getTokenPrice, isMint } from "./services/price.js";

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) throw new Error("Missing BOT_TOKEN");

const RPC = process.env.SOLANA_RPC || "https://api.mainnet-beta.solana.com";
const conn = new Connection(RPC, "confirmed");

const bot = new Telegraf(BOT_TOKEN);

// /start
bot.start((ctx) => {
  ctx.reply(
    "Welcome to your wallet bot! 🔥\n\n" +
      "Commands:\n" +
      "/createwallet\n" +
      "/balance\n" +
      "/price SOL\n" +
      "/price <token_mint>"
  );
});

// /createwallet
bot.command("createwallet", async (ctx) => {
  try {
    const tgId = ctx.from.id;
    const existing = await getUserRecord(tgId);

    if (existing) {
      return ctx.reply(
        You already have a wallet:\n${existing.public_key}\n\nUse /balance to check SOL balance.
      );
    }

    const result = await createAndStoreWallet(tgId);
    return ctx.reply(
      ✅ Wallet created!\n\nYour public key:\n${result.publicKey}
    );
  } catch (err) {
    console.error(err);
    return ctx.reply("❌ Error creating wallet.");
  }
});

// /balance
bot.command("balance", async (ctx) => {
  try {
    const tgId = ctx.from.id;
    const row = await getUserRecord(tgId);

    if (!row) return ctx.reply("❌ No wallet found. Use /createwallet");

    const pubkey = new PublicKey(row.public_key);
    const lamports = await conn.getBalance(pubkey);
    const sol = lamports / LAMPORTS_PER_SOL;

    return ctx.reply(`💰 Balance\nAddress:\n${row.public_key}\nSOL: ${sol}`);
  } catch (err) {
    console.error(err);
    return ctx.reply("❌ Error fetching balance.");
  }
});

// /price
bot.command("price", async (ctx) => {
  try {
    const parts = ctx.message.text.trim().split(" ");
    const query = parts[1];

    if (!query)
      return ctx.reply("Usage:\n/price SOL\n/price <token_mint>");

    if (/^sol$/i.test(query)) {
      const price = await getSolPrice();
      if (!price) return ctx.reply("❌ Could not fetch SOL price.");
      return ctx.reply(`💸 SOL Price: $${price}`);
    }

    if (isMint(query)) {
      const price = await getTokenPrice(query);
      if (!price) return ctx.reply("❌ Token price not found.");
      return ctx.reply(`💠 Token Price\nMint: ${query}\nUSD: $${price}`);
    }

    return ctx.reply("❌ Invalid token or mint.");
  } catch (err) {
    console.error(err);
    return ctx.reply("❌ Error fetching price.");
  }
});

// Unknown messages
bot.on("message", (ctx) => ctx.reply("Unknown command. Use /start"));

// Launch bot
bot.launch().then(() => console.log("🚀 Bot running"));
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
