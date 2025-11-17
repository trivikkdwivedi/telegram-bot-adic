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

// --------------------------------------------------
// ENV + RPC
// --------------------------------------------------
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) throw new Error("❌ Missing BOT_TOKEN in .env");

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
/createwallet - generate a Solana wallet
/balance - check your balance
/price <SOL|CA> - check SOL or token price`
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
        `⚠️ You already have a wallet:

${existing.public_key}

Use /balance to check SOL balance.`
      );
    }

    const result = await createAndStoreWallet(tgId);

    return ctx.reply(
      `✅ *Wallet Created!*

Your public key:
\`${result.publicKey}\`

Store it safely.`,
      { parse_mode: "Markdown" }
    );

  } catch (err) {
    console.error("Create wallet error:", err);
    return ctx.reply("❌ Error creating wallet.");
  }
});

// --------------------------------------------------
// /balance
// --------------------------------------------------
bot.command("balance", async (ctx) => {
  try {
    const tgId = ctx.from.id;
    const user = await getUserRecord(tgId);

    if (!user) return ctx.reply("❌ You don’t have a wallet. Use /createwallet");

    const pubkey = new PublicKey(user.public_key);
    const lamports = await conn.getBalance(pubkey);
    const sol = lamports / LAMPORTS_PER_SOL;

    return ctx.reply(
      `💰 *Balance Check*

Address:
\`${user.public_key}\`

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
    const text = ctx.message.text.trim().split(" ");
    if (text.length < 2)
      return ctx.reply("Usage:\n/price SOL\n/price <token_mint>");

    const query = text[1];

    // SOL price
    if (/^sol$/i.test(query)) {
      const p = await getSolPrice();
      return ctx.reply(`💸 *SOL Price:* $${p}`, { parse_mode: "Markdown" });
    }

    // Token price by mint
    if (isMint(query)) {
      const p = await getTokenPrice(query);
      if (!p) return ctx.reply("❌ Could not fetch token price.");

      return ctx.reply(
        `💠 *Token Price*

Mint:
\`${query}\`

USD: *$${p}*`,
        { parse_mode: "Markdown" }
      );
    }

    return ctx.reply("❌ Invalid token or mint address.");

  } catch (err) {
    console.error("Price error:", err);
    return ctx.reply("❌ Error fetching price.");
  }
});

// --------------------------------------------------
// Unknown command handler
// --------------------------------------------------
bot.on("message", (ctx) => {
  ctx.reply("Unknown command. Use /start");
});

// --------------------------------------------------
// Bot start
// --------------------------------------------------
bot.launch().then(() => {
  console.log("🚀 Bot launched successfully");
});

// Graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
