import 'dotenv/config'
import { Telegraf } from 'telegraf'

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.start((ctx) => ctx.reply("Hello! Your bot is live on Render 😎"))
bot.command("ping", (ctx) => ctx.reply("Pong!"))
bot.on("text", (ctx) => ctx.reply("You said: " + ctx.message.text))

bot.launch()
console.log("Bot is running...")

process.on("SIGINT", () => bot.stop("SIGINT"))
process.on("SIGTERM", () => bot.stop("SIGTERM"))
