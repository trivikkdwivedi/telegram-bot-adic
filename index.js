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

// /start
bot.start((ctx) => {
  ctx.reply(
    "Welcome.\n\n" +
    "Commands:\n" +
    "/createwallet - create wallet\n" +
    "/balance - check balance\n" +
    "/price <SOL|mint> - get price"
  );
});

// /createwallet
bot.command("createwallet", async (ctx) => {
  try {
    const tgId = ctx.from.id;
    const existing = await getUserRecord(tgId);

    if (existing) {
      return ctx.reply(
        `You already have a wallet.\n\nPublic Key:\n${existing.public_key}\n\nUse /balance to check SOL balance.`
      );
    }

    const result = await createAndStoreWallet(tgId);
    return ctx.reply(
      `Wallet created.\n\nYour public key:\n${result.publicKey}`
    );

  } catch (err) {
    console.error("Create wallet error:", err);
    return ctx.reply("Error creating wallet.");
  }
});

// /balance
bot.command("balance", async (ctx) => {
  try {
    const tgId = ctx.from.id;
    const row = await getUserRecord(tgId);

    if (!row) return ctx.reply("You don't have a wallet. Use /createwallet");

    const pubkey = new PublicKey(row.public_key);
    const lamports = await conn.getBalance(pubkey);
    const sol = lamports / LAMPORTS_PER_SOL;

    return ctx.reply(
      `Balance:\nAddress: ${row.public_key}\nSOL: ${sol}`
    );

  } catch (err) {
    console.error("Balance error:", err);
    return ctx.reply("Error fetching balance.");
  }
});

// /price
bot.command("price", async (ctx) => {
  try {
    const text = ctx.message.text.trim();
    const parts = text.split(" ");

    if (parts.length < 2)
      return ctx.reply("Usage:\n/price SOL\n/price <token_mint>");

    const query = parts[1];

    if (/^sol$/i.test(query)) {
      const p = await getSolPrice();
      return ctx.reply(`SOL Price: $${p}`);
    }

    if (isMint(query)) {
      const p = await getTokenPrice(query);
      if (!p) return ctx.reply("Could not fetch token price.");
      return ctx.reply(`Token Price:\nMint: ${query}\nUSD: $${p}`);
    }

    return ctx.reply("Invalid token or mint.");

  } catch (err) {
    console.error("Price error:", err);
    return ctx.reply("Error fetching price.");
  }
});

// fallback
bot.on("message", (ctx) => {
  ctx.reply("Unknown command. Use /start.");
});

// launch
bot.launch().then(() => console.log("Bot started."));
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
