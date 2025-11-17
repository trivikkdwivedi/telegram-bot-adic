// index.js
import "dotenv/config";
import { Telegraf } from "telegraf";
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";

import { createAndStoreWallet, getUserRecord } from "./services/wallet.js";
import { getSolPrice, getTokenPrice, isMint } from "./services/jupiter.js";

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) throw new Error("Missing BOT_TOKEN");

const RPC = process.env.SOLANA_RPC || "https://api.mainnet-beta.solana.com";
const conn = new Connection(RPC, "confirmed");

const bot = new Telegraf(BOT_TOKEN);

// --------------------------------------------------
// /start
// --------------------------------------------------
bot.start((ctx) => {
  ctx.reply(
    `Welcome to your Solana bot! 🔥

Available commands:
/createwallet - Create your Solana wallet
/balance - Check your balance
/price <SOL|mint> - Check price using Jupiter`
  );
});

// --------------------------------------------------
// /createwallet
// --------------------------------------------------
bot.command("createwallet", async (ctx) => {
  try {
    const tgId = ctx.from.id;
    const existing = await getUserRecord(tgId);

    if (existing) {
      return ctx.reply(
        `⚠️ You already have a wallet:\n\n${existing.public_key}\n\nUse /balance to check your SOL balance.`
      );
    }

    const result = await createAndStoreWallet(tgId);

    return ctx.reply(
      `✅ *Wallet Created!*

Your public key:
\`${result.publicKey}\`

Save it safely.`,
      { parse_mode: "Markdown" }
    );

  } catch (err) {
    console.error("Create wallet error:", err);
    return ctx.reply("❌ Error creating wallet. Check logs.");
  }
});

// --------------------------------------------------
// /balance
// --------------------------------------------------
bot.command("balance", async (ctx) => {
  try {
    const tgId = ctx.from.id;
    const row = await getUserRecord(tgId);

    if (!row) return ctx.reply("❌ You don't have a wallet. Use /createwallet");

    const pubkey = new PublicKey(row.public_key);
    const lamports = await conn.getBalance(pubkey);
    const sol = lamports / LAMPORTS_PER_SOL;

    return ctx.reply(
      `💰 *Balance Check*

Address:
\`${row.public_key}\`

SOL: *${sol}*`,
      { parse_mode: "Markdown" }
    );

  } catch (err) {
    console.error("Balance error:", err);
    return ctx.reply("❌ Error fetching balance.");
  }
});

// --------------------------------------------------
// /price <SOL|mint>
// --------------------------------------------------
bot.command("price", async (ctx) => {
  try {
    const parts = ctx.message.text.trim().split(" ");
    if (parts.length < 2)
      return ctx.reply("Usage:\n/price SOL\n/price <token_mint>");

    const query = parts[1].trim();

    // -----------------------------
    // SOL PRICE
    // -----------------------------
    if (/^sol$/i.test(query)) {
      const price = await getSolPrice();
      if (!price) return ctx.reply("❌ Could not fetch SOL price.");
      return ctx.reply(`💸 SOL Price: $${price}`);
    }

    // -----------------------------
    // TOKEN MINT PRICE
    // -----------------------------
    if (!isMint(query))
      return ctx.reply("❌ Invalid mint address.");

    const price = await getTokenPrice(query);
    if (!price) return ctx.reply("❌ Could not fetch token price.");

    return ctx.reply(
      `💠 *Token Price*

Mint:
\`${query}\`

Price: *$${price}*`,
      { parse_mode: "Markdown" }
    );

  } catch (err) {
    console.error("Price error:", err);
    return ctx.reply(`❌ Error: ${err.message}`);
  }
});

// --------------------------------------------------
// Fallback for unknown messages
// --------------------------------------------------
bot.on("message", async (ctx) => {
  ctx.reply("Unknown command. Use /start");
});

// --------------------------------------------------
// Start bot
// --------------------------------------------------
bot.launch().then(() => {
  console.log("🚀 Bot started successfully.");
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
