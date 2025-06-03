const emoji = require("node-emoji");
const MenuTypes = require("./menu-types");
const { Markup } = require("telegraf");

const createMenu = (text, buttons) => {
    return {
        text: text.join("\n"),
        buttons: Markup.inlineKeyboard(buttons)
    }
};

class MenuBuilder {
    buildMainMenu() {
        const buttons = [
            [Markup.button.callback(emoji.emojify(":writing_hand: Ввести уравнение"), "reducing-function")],
            [Markup.button.callback(emoji.emojify(":chart_with_upwards_trend: Примеры уравнений"), `change-menu:${ MenuTypes.EQUATION_EXAMPLES }`)],
        ]

        return createMenu(
            [emoji.emojify(":clipboard: Меню")],
            buttons
        );
    }

    buildExamplesMenu() {
        const buttons = [
            [Markup.button.callback(emoji.emojify("x^2+y^2-4x+6y+4=0 (окружность)"), "reducing-function:x^2+y^2-4x+6y+4=0")],
            [Markup.button.callback(emoji.emojify("2x^2+5y^2+8x-10y-17=0 (эллипс)"), "reducing-function:2x^2+5y^2+8x-10y-17=0")],
            [Markup.button.callback(emoji.emojify("x^2-6y^2-12x+36y-48=0 (гипербола)"), "reducing-function:x^2-6y^2-12x+36y-48=0")],
            [Markup.button.callback(emoji.emojify("5x^2+9y^2-30x+18y+9=0 (эллипс)"), "reducing-function:5x^2+9y^2-30x+18y+9=0")],
            [Markup.button.callback(emoji.emojify("16x^2-9y^2-64x-54y-161=0 (гипербола)"), "reducing-function:16x^2-9y^2-64x-54y-161=0")],
            // [Markup.button.callback(emoji.emojify("4x^2+3y^2-8x+12y-32=0 (эллипс)"), "reducing-function:4x^2+3y^2-8x+12y-32=0")], доработать, поменять знаменатель
            [Markup.button.callback(emoji.emojify("16x^2-9y^2-64x-54y-161=0 (гипербола)"), "reducing-function:16x^2-9y^2-64x-54y-161=0")],
            [Markup.button.callback(emoji.emojify("9x^2-16y^2+90x+32y-367=0 (гипербола)"), "reducing-function:9x^2-16y^2+90x+32y-367=0")],
            // [Markup.button.callback(emoji.emojify("16x^2-9y^2-64x-18y+199=0 (гипербола)"), "reducing-function:6x^2-9y^2-64x-18y+199=0")], поменять местами x,y
            [Markup.button.callback(emoji.emojify(":arrow_left: Назад"), `change-menu:${ MenuTypes.MAIN }`)],
        ]

        return createMenu(
            [emoji.emojify(":chart_with_upwards_trend: Примеры уравнений")],
            buttons
        );
    }
}

module.exports = MenuBuilder;