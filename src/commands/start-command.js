const { Markup } = require("telegraf");
const emoji = require("node-emoji");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const D3Node = require("d3-node");
const svg2png = require("svg2png");

async function startCommand(ctx) {

    try {
        const buttons = [
            [Markup.button.callback(emoji.emojify("Кривая 2-го порядка"), "reducing-function")],
        ]

        await ctx.msgCtx.reply(emoji.emojify(":clipboard: Меню"), { reply_markup: { inline_keyboard: buttons } });
    } catch (ex) {
        console.log(ex);
    }
}

module.exports = startCommand;