async function reduceFunctionAction(ctx) {
    try {
        await ctx.msgCtx.scene.enter("reduce-function-wizard");
    } catch(ex) {
        console.log(ex);
    }
}

module.exports = reduceFunctionAction;