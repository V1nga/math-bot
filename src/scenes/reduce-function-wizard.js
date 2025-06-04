const emoji = require("node-emoji");
const ReduceEquation = require("../math/reduce-equation");
const {WizardScene} = require("telegraf/scenes");
const {Composer} = require("telegraf");

const reduceFunctionWizard = (ctx) => {
    const enterHandler = (msgCtx) => msgCtx.reply(emoji.emojify(":writing_hand: Введите кривую 2-го порядка"));

    const equationStep = new Composer();
    equationStep.on("text", async (msgCtx) => {
        const reduceEquation = new ReduceEquation();

        try {
            const { msg, chart } = reduceEquation.writeSolution(msgCtx.message.text);

            await msgCtx.reply(msg, { parse_mode: "MarkdownV2" });
            await msgCtx.replyWithPhoto({ source: chart });
        } catch (ex) {
            await msgCtx.reply(emoji.emojify(`:warning: ${ ex?.msg ? ex.msg : "Произошла неизвестная ошибка" }`));
        }

        return msgCtx.scene.leave();
    });

    const scene = new WizardScene("reduce-function-wizard", equationStep);
    scene.enter(enterHandler);

    return scene;
}

module.exports = reduceFunctionWizard;