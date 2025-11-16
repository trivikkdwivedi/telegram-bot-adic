import "dotenv/config";
import { Telegraf } from "telegraf";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { createAndStoreWallet, getUserRecord } from "./services/wallet.js";

const bot = new Telegraf(process.env.BOT_TOKEN);
const conn = new Connection("https://api.devnet.solana.com", "confirmed");

bot.start((ctx) => {
  ctx.reply("Welcome 👋\nCommands:\n/createwallet\n/balance");
});

bot.command("createwallet", async (ctx) => {
  const tgId = ctx.from.id;
  const existing = await getUserRecord(tgId);

  if (existing) {
    return ctx.reply(`You already have a wallet:\n${existing.public_key}`);
  }

  const result = await createAndStoreWallet(tgId);
  ctx.reply(`Wallet created! 🔑\nPublic Key:\n${result.publicKey}`);
});

bot.command("balance", async (ctx) => {
  const tgId = ctx.from.id;
  const row = await getUserRecord(tgId);

  if (!row) return ctx.reply("No wallet found. Use /createwallet");

  const pubkey = new PublicKey(row.public_key);
  const lamports = await conn.getBalance(pubkey);
  const sol = lamports / LAMPORTS_PER_SOL;

  ctx.reply(`Balance for ${row.public_key}:\n${sol} SOL`);
});

bot.launch();
