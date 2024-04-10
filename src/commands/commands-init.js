const startCommand = require("./start-command");

async function commandsInit (ctx) {
    ctx.bot.start(msgCtx => ctx.registerFunction(msgCtx, startCommand));
}

module.exports = commandsInit;