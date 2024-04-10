const emoji = require("node-emoji");
const telegraf = require("telegraf");
const { Composer, Scenes: { WizardScene }, Markup } = telegraf;
const { mdEscape } = require("../utils");

class ReduceFunctionWizard {
    scene;

    constructor(ctx) {
        const enterHandler = (msgCtx) => msgCtx.reply(emoji.emojify(":moneybag: Введите кривую 2-го порядка"));

        const equationStep = new Composer();
        equationStep.on("text", async (msgCtx) => {
            const equation = msgCtx.message.text;
            const steps = this.reducingEquation(equation);
            const msg = Object.keys(steps).map(index => mdEscape(steps[index].text) + "\n" + mdEscape(steps[index].value)).join("\n\n");

            await msgCtx.reply(msg, { parse_mode: 'MarkdownV2' });

            return msgCtx.scene.leave();
        });

        const scene = new WizardScene("reduce-function-wizard", equationStep);
        scene.enter(enterHandler);

        this.scene = scene;
    }

     reducingEquation(equation) {
        let variables = this.parseEquation(equation);

        const steps= {
            T: {
                text: "Подсчёт T:",
                value: null
            },
            BMatrix: {
                text: "Матрица B:",
                value: null
            },
            B: {
                text: "Подсчёт B:",
                value: null
            },
            A: {
                text: "Подсчёт A:",
                value: null
            },
            ADet: {
                text: "Определитель A:",
                value: null
            },
            Graph: {
                text: "Тип графика:",
                value: null
            }
        };

        const mdMatrix = (matrix) => "```\n" + matrix.map(row => row.join("\t")).join("\n") + "```";

        const T = variables.A11 + variables.A22;
        steps.T.value = `T=${ T }`;

        const BMatrix = [
            [variables.A11, variables.A12],
            [variables.A12, variables.A22]
        ]
        steps.BMatrix.value = mdMatrix(BMatrix);

        const B = (variables.A11 * variables.A22) - (variables.A12 * variables.A12);
        // steps.B.value = `B\=\n${ steps.BMatrix.value } \n\= (${ variables.A11 } * ${ variables.A22 }) - (${ variables.A12} * ${ variables.A12}) \= ${ B }`;

        const AMatrixDet = [
            [variables.A11, variables.A12, variables.A1],
            [variables.A12, variables.A22, variables.A2],
            [variables.A1, variables.A2, variables.A0]
        ]
        steps.ADet.value = mdMatrix(AMatrixDet);

        const det =
            AMatrixDet[0][0] * (AMatrixDet[1][1] * AMatrixDet[2][2] - AMatrixDet[1][2] * AMatrixDet[2][1]) -
            AMatrixDet[0][1] * (AMatrixDet[1][0] * AMatrixDet[2][2] - AMatrixDet[1][2] * AMatrixDet[2][0]) +
            AMatrixDet[0][2] * (AMatrixDet[1][0] * AMatrixDet[2][1] - AMatrixDet[1][1] * AMatrixDet[2][0]);
        // steps.ADet.value = `${ steps.A.value } \n\= ${ AMatrixDet[0][0] } * (${ AMatrixDet[1][1] } * ${ AMatrixDet[2][2] } - ${ AMatrixDet[1][2] } * ${ AMatrixDet[2][1] }) - ${ AMatrixDet[0][1] } * (${ AMatrixDet[1][0] } * ${ AMatrixDet[2][2] } - ${ AMatrixDet[1][2] } * ${ AMatrixDet[2][0] }) + ${ AMatrixDet[0][2] } * (${ AMatrixDet[1][0] } * ${ AMatrixDet[2][1] } - ${ AMatrixDet[1][1] } * ${ AMatrixDet[2][0] }) \= ${ det }`;

        if (B > 0 && det !== 0 && T * det < 0) {
            steps.Graph.value = "Эллипс";
        } else if (B < 0 && det !== 0) {
            steps.Graph.value = "Гипербола";
        } else if (B === 0 && det !== 0) {
            steps.Graph.value = "Парабола";
        }

        return steps;
    }

    parseEquation(equation) {
        equation = equation.replace(/-/g, "+-").replace(/\s+/g, '');

        let terms = equation.split(/[+=]/);
        let variables = {
            A11: 0,
            A12: 0,
            A22: 0,
            A1: 0,
            A2: 0,
            A0: 0
        }

        terms.forEach(term => {
            if (term.includes('x^2')) {
                variables.A11 += Number(term.split('x^2')[0]);
            } else if (term.includes('y^2')) {
                variables.A22 += Number(term.split('y^2')[0]);
            } else if (term.includes('xy')) {
                variables.A12 += Number(term.split('xy')[0]);
            } else if (term.includes('x')) {
                variables.A1 += Number(term.replace(/x/, ''));
            } else if (term.includes('y')) {
                variables.A1 += Number(term.replace(/y/, ''));
            } else {
                variables.A0 += Number(term);
            }
        });

        return variables;
    }
}

module.exports = ReduceFunctionWizard;