const emoji = require("node-emoji");
const telegraf = require("telegraf");
const { Composer, Scenes: { WizardScene }, Markup } = telegraf;
const { mdEscape } = require("../utils");

const ChartTypes = {
    ELLIPSE: "Эллипс",
    HYPERBOLE: "Гипербола",
    PARABOLA: "Парабола"
}
class ReduceFunctionWizard {
    scene;

    constructor(ctx) {
        const enterHandler = (msgCtx) => msgCtx.reply(emoji.emojify(":black_nib: Введите кривую 2-го порядка"));

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
            TCoefficient: {
                text: "Коэффициент A+C:",
                value: null
            },
            BMatrix: {
                text: "Матрица δ:",
                value: null
            },
            BDeterminant: {
                text: "Коэффициент δ:",
                value: null
            },
            ADeterminant: {
                text: "Коэффициент Δ:",
                value: null
            },
            AMatrix: {
                text: "Определитель Δ:",
                value: null
            },
            GraphType: {
                text: "Тип графика:",
                value: null
            },
            CanonicalForm: {
                text: "Канонический вид:",
                value: null
            }
        };

         const drawMatrix = (matrix) => {
             const longestStr = (arr) => arr.reduce((max, n) => max.length > n.length ? max : n, '');
             const colLength = longestStr(matrix.map(row => row.map(col => String(col))).map(row => longestStr(row)))?.length;

             const mdMatrix = matrix.map(row => row.map(num => String(num).padStart(colLength)));

             return "```\n" + mdMatrix.map(row => row.join("\t")).join("\n") + "```";
         };

        const tCoefficient = variables.A11 + variables.A22;
        steps.TCoefficient.value = `A + C = ${ tCoefficient }`;

        const bMatrix = [
            [variables.A11, variables.A12],
            [variables.A12, variables.A22]
        ]
        steps.BMatrix.value = drawMatrix(bMatrix);

        const bDeterminant = (variables.A11 * variables.A22) - (variables.A12 * variables.A12);
        steps.BDeterminant.value = `δ \= (${ variables.A11 } * ${ variables.A22 }) - (${ variables.A12} * ${ variables.A12}) \= ${ bDeterminant }`;

        const aMatrix = [
            [variables.A11, variables.A12, variables.A1],
            [variables.A12, variables.A22, variables.A2],
            [variables.A1, variables.A2, variables.A0]
        ]
        steps.AMatrix.value = drawMatrix(aMatrix);

        const aDeterminant =
            aMatrix[0][0] * (aMatrix[1][1] * aMatrix[2][2] - aMatrix[1][2] * aMatrix[2][1]) -
            aMatrix[0][1] * (aMatrix[1][0] * aMatrix[2][2] - aMatrix[1][2] * aMatrix[2][0]) +
            aMatrix[0][2] * (aMatrix[1][0] * aMatrix[2][1] - aMatrix[1][1] * aMatrix[2][0]);
        steps.ADeterminant.value = `Δ \= ${ aMatrix[0][0] } * (${ aMatrix[1][1] } * ${ aMatrix[2][2] } - ${ Math.abs(aMatrix[1][2]) } * ${ aMatrix[2][1] }) - ${ Math.abs(aMatrix[0][1]) } * (${ aMatrix[1][0] } * ${ aMatrix[2][2] } - ${ Math.abs(aMatrix[1][2]) } * ${ aMatrix[2][0] }) + ${ aMatrix[0][2] } * (${ aMatrix[1][0] } * ${ aMatrix[2][1] } - ${ Math.abs(aMatrix[1][1]) } * ${ aMatrix[2][0] }) \= ${ aDeterminant }`;

        if (bDeterminant > 0 && aDeterminant !== 0 && tCoefficient * aDeterminant < 0) {
            steps.GraphType.value = ChartTypes.ELLIPSE;

            const a = 1;
            const b = -tCoefficient;
            const c = bDeterminant;

            const discriminant = Math.pow(b, 2) - (4 * a * c);

            const aCoefficient = (-b - Math.sqrt(discriminant)) / (2 * a);
            const cCoefficient = (-b + Math.sqrt(discriminant)) / (2 * a);
            const fCoefficient = aDeterminant / bDeterminant;

            steps.CanonicalForm.value = `${ aCoefficient }x²+${ cCoefficient }y²${ fCoefficient }=0`;
        } else if (bDeterminant < 0 && aDeterminant !== 0) {
            steps.GraphType.value = ChartTypes.HYPERBOLE;
        } else if (bDeterminant === 0 && aDeterminant !== 0) {
            steps.GraphType.value = ChartTypes.PARABOLA;
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
                variables.A12 += Number(term.split('xy')[0]) / 2;
            } else if (term.includes('x')) {
                variables.A1 += Number(term.replace(/x/, '')) / 2;
            } else if (term.includes('y')) {
                variables.A2 += Number(term.replace(/y/, '')) / 2;
            } else {
                variables.A0 += Number(term);
            }
        });
        
        return variables;
    }
}

module.exports = ReduceFunctionWizard;