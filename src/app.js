const { Telegraf, session } = require("telegraf");
const scenesInit = require("./scenes/scenes-init");
const actionsInit = require("./actions/actions-init");
const commandsInit = require("./commands/commands-init");

class App {

    bot;

    constructor(token) {
        this.bot = new Telegraf(token);
    }

    start() {
        this.bot.use(session());
        let ctx = new Context(this.bot);

        scenesInit(ctx);
        actionsInit(ctx);
        commandsInit(ctx);

        this.bot.launch();
    }
}

class Context {

    bot;

    constructor(bot) {
        this.bot = bot;
    }

    registerFunction(msgCtx, func) {
        return func({ ...this, msgCtx });
    }
}

module.exports = App;