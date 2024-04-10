const { Scenes } = require("telegraf");
const ReduceFunctionWizard = require("./reduce-function-wizard");

async function scenesInit(ctx) {
    const reduceFunctionWizard = new ReduceFunctionWizard(ctx).scene;

    const stage = new Scenes.Stage([reduceFunctionWizard]);
    ctx.bot.use(stage.middleware());
}

module.exports = scenesInit;