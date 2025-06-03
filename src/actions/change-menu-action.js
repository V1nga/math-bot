const MenuBuilder = require("../menu/menu-builder");
const MenuTypes = require("../menu/menu-types");

const menuBuilder = new MenuBuilder();

const changeMenuAction = async (ctx) => {
    try {
        let menu;

        switch(ctx.match[1]) {
            case MenuTypes.MAIN:
                menu = menuBuilder.buildMainMenu();
                break;
            case MenuTypes.EQUATION_EXAMPLES:
                menu = menuBuilder.buildExamplesMenu();
                break;
            case MenuTypes.USEFUL_MATERIALS:
                menu = menuBuilder.buildUsefulMaterialsMenu();
                break;
        }

        ctx.editMessageText(menu.text, { reply_markup: menu.buttons.reply_markup });
    } catch (ex) {
        console.log(ex);
    }
};

module.exports = changeMenuAction;