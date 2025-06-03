const { Scenes } = require("telegraf");
const reduceFunctionWizard = require("./reduce-function-wizard");

async function scenesInit(ctx) {

    const stage = new Scenes.Stage([reduceFunctionWizard(ctx)]);
    ctx.bot.use(stage.middleware());
}

module.exports = scenesInit;