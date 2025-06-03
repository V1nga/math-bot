const reduceFunctionAction = require("./reduce-function-action");
const changeMenuAction = require("./change-menu-action");

async function actionsInit (ctx) {
    try {
        ctx.bot.action("reducing-function", msgCtx => reduceFunctionAction(msgCtx));
        ctx.bot.action(/^reducing-function:(\S+)$/, msgCtx => reduceFunctionAction(msgCtx));
        ctx.bot.action(/^change-menu:(\S+)$/, msgCtx => changeMenuAction(msgCtx));
    } catch (ex) {
        console.log(ex);
    }
}

module.exports = actionsInit;