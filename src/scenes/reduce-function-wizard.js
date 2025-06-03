const emoji = require("node-emoji");
const ReduceEquation = require("../math/reduce-equation");
const {WizardScene} = require("telegraf/scenes");
const {Composer} = require("telegraf");

const reduceFunctionWizard = (ctx) => {
    const enterHandler = (msgCtx) => msgCtx.reply(emoji.emojify(":black_nib: Введите кривую 2-го порядка"));

    const equationStep = new Composer();
    equationStep.on("text", async (msgCtx) => {
        const reduceEquation = new ReduceEquation();
        const { msg, chart } = reduceEquation.writeSolution(msgCtx.message.text);

        await msgCtx.reply(msg, { parse_mode: "MarkdownV2" });
        await msgCtx.replyWithPhoto({ source: chart });

        return msgCtx.scene.leave();
    });

    const scene = new WizardScene("reduce-function-wizard", equationStep);
    scene.enter(enterHandler);

    return scene;
}

module.exports = reduceFunctionWizard;