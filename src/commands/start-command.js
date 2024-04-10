// import emoji from "node-emoji";
const { Markup } = require("telegraf");

async function startCommand(ctx) {
    try {
        const buttons = [
            [Markup.button.callback("Кривая 2-го порядка", "reducing-function")],
        ]

        await ctx.msgCtx.reply("test", { reply_markup: { inline_keyboard: buttons } });
    } catch (ex) {
        console.log(ex);
    }
}

module.exports = startCommand;