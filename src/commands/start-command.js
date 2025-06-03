const MenuBuilder = require("../menu/menu-builder");

const menuBuilder = new MenuBuilder();

async function startCommand(ctx) {
    try {
        const mainMenu = menuBuilder.buildMainMenu();
        await ctx.msgCtx.reply(mainMenu.text, mainMenu.buttons);
    } catch (ex) {
        console.log(ex);
    }
}

module.exports = startCommand;