const reduceFunction = require("./reduce-function");

async function actionsInit (ctx) {
    try {
        ctx.bot.action("reducing-function", msgCtx => ctx.registerFunction(msgCtx, reduceFunction));
    } catch (ex) {
        console.log(ex);
    }
}

module.exports = actionsInit;