const ReduceEquation = require("../math/reduce-equation");
const emoji = require("node-emoji");

const reduceFunctionAction = async (ctx) => {
    try {
        const equation = ctx.match[1];

        if(equation) {
            try {
                const reduceEquation = new ReduceEquation();
                const { msg, chart } = reduceEquation.writeSolution(equation);

                await ctx.reply(msg, { parse_mode: "MarkdownV2" });
                await ctx.replyWithPhoto({ source: chart });
            } catch(ex) {
                await ctx.reply(emoji.emojify(`:warning: ${ ex?.msg ? ex.msg : "Произошла неизвестная ошибка" }`));
            }
        } else {
            await ctx.scene.enter("reduce-function-wizard");
        }
    } catch(ex) {
        console.log(ex);
    }
}

module.exports = reduceFunctionAction;