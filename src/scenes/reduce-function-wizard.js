const emoji = require("node-emoji");
const telegraf = require("telegraf");
const { Composer, Scenes: { WizardScene }, Markup } = telegraf;
const { mdEscape } = require("../utils");
const D3Node = require("d3-node");
const svg2png = require("svg2png");
// const vega = require("vega");
// const fs = require("fs");
// const stackedBarChartSpec = require("../../stacked-bar-chart.spec.json");
// const { SVG } = require("@svgdotjs/svg.js");

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
            let chart = this.drawChart(steps.GraphType.value, steps.CanonicalForm.value ?? equation);

            await msgCtx.reply(msg, { parse_mode: 'MarkdownV2' });
            await msgCtx.replyWithPhoto({ source: chart });

            return msgCtx.scene.leave();
        });

        const scene = new WizardScene("reduce-function-wizard", equationStep);
        scene.enter(enterHandler);

        this.scene = scene;
    }

     reducingEquation(equation) {
        let vars = this.parseEquation(equation);

        const steps = {
            I1: {
                text: "Коэффициент 1-го инварианта",
                value: null
            },
            I2Det: {
                text: "Определитель 2-го инварианта",
                value: []
            },
            I2: {
                text: "Коэффициент 2-го инварианта",
                value: null
            },
            I3Det: {
                text: "Определитель 3-го инварианта",
                value: []
            },
            I3: {
                text: "Коэффициент 3-го инварианта",
                value: null
            },
            GraphType: {
                text: "Фигура:",
                value: null
            },
            CharacteristicEquation: {
                text: "Характеристическое уравнение:",
                value: null
            },
            CanonicalForm: {
                text: "Канонический вид:",
                value: null
            }
        }

        const drawMatrix = (matrix) => {
            const longestStr = (arr) => arr.reduce((max, n) => max.length > n.length ? max : n, '');
            const colLength = longestStr(matrix.map(row => row.map(col => String(col))).map(row => longestStr(row)))?.length;

            const mdMatrix = matrix.map(row => row.map(num => String(num).padStart(colLength)));

            return "```\n" + mdMatrix.map(row => row.join("\t")).join("\n") + "```";
        };

        let I1 = vars.A11 + vars.A22;
        steps.I1.value = `I₁=${ I1 }`

        let I2Det = [
            [vars.A11, vars.A12],
            [vars.A12, vars.A22]
        ];
        let I2 = (I2Det[0][0] * I2Det[1][1]) - (I2Det[0][1] * I2Det[1][0]);
        steps.I2Det.value = drawMatrix(I2Det);
        steps.I2.value = `I₂=(${ I2Det[0][0] } * ${ I2Det[1][1] }) - (${ I2Det[0][1] } * ${ I2Det[1][0] }) \= ${ I2 }`;

        const I3Det = [
            [vars.A11, vars.A12, vars.A13],
            [vars.A12, vars.A22, vars.A23],
            [vars.A13, vars.A23, vars.A33]
        ]
        const I3 =
            I3Det[0][0] * (I3Det[1][1] * I3Det[2][2] - I3Det[1][2] * I3Det[2][1]) -
            I3Det[0][1] * (I3Det[1][0] * I3Det[2][2] - I3Det[1][2] * I3Det[2][0]) +
            I3Det[0][2] * (I3Det[1][0] * I3Det[2][1] - I3Det[1][1] * I3Det[2][0]);
        steps.I3Det.value = drawMatrix(I3Det);
        steps.I3.value = `I₃=(${ I3Det[0][0] } * (${ I3Det[1][1] } * ${ I3Det[2][2] } - ${ I3Det[1][2] } * ${ I3Det[2][1] })) - (${ I3Det[0][1] } * (${ I3Det[1][0] } * ${ I3Det[2][2] } - ${ I3Det[1][2] } * ${ I3Det[2][0] })) + (${ I3Det[0][2] } * (${ I3Det[1][0] } * ${ I3Det[2][1] } - ${ I3Det[1][1] } * ${ I3Det[2][0] })) \= ${ I3 }`;

        const K2Det1 = [
            [vars.A11, vars.A13],
            [vars.A13, vars.A33]
        ]
        const K2Det2 = [
            [vars.A22, vars.A23],
            [vars.A23, vars.A33]
        ]
        const K2 = ((K2Det1[0][0] * K2Det1[1][1]) - (K2Det1[0][1] * K2Det1[1][0])) + ((K2Det2[0][0] * K2Det2[1][1]) - (K2Det2[0][1] * K2Det2[1][0]));

        if (I2 > 0 && I3 !== 0 && I1 * I3 < 0) {
            //4x^2-8x+4y^2+4y-11=0
            steps.GraphType.value = ChartTypes.ELLIPSE;
            steps.CharacteristicEquation.value = `x²-${ I1 }+${ I2 }`

            let a = 1;
            let b = I1 * -1;
            let c = I2;

            let discriminant = (b*b)-(4*a*c);
            let x1 = (b * -1 + discriminant) / 2*a;
            let x2 = (b * -1 - discriminant) / 2*a;

            steps.CanonicalForm.value = `${ x1 }x²+${ x2 }y²${ I3 / I2}`;
        } else if (I1 < 0 && I3 !== 0) {
            steps.GraphType.value = ChartTypes.HYPERBOLE;
        } else if (I1 === 0 && I3 !== 0) {
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
            A13: 0,
            A22: 0,
            A23: 0,
            A33: 0
        }

        //4x^2-8x+4y^2+4y-11=0
        terms.forEach(term => {
            if (term.includes('x^2')) {
                variables.A11 += Number(term.split('x^2')[0]);
            } else if (term.includes('y^2')) {
                variables.A22 += Number(term.split('y^2')[0]);
            } else if (term.includes('xy')) {
                variables.A12 += Number(term.split('xy')[0]);
            } else if (term.includes('x')) {
                variables.A13 += Number(term.replace(/x/, '')) / 2;
            } else if (term.includes('y')) {
                variables.A23 += Number(term.replace(/y/, '')) / 2;
            } else {
                variables.A33 += Number(term);
            }
        });

        return variables;
    }

    // rootNode
    //     .append("text")
    //     .attr("x", (width / 2) + xStep)
    //     .attr("y", (height / 2) + 20)
    //     .text(i);

    drawChart(type, equation) {
        const svgNode = new D3Node();

        const width = 1000;
        const height = 1000;

        let rootNode = svgNode.createSVG(width, height);

        // x-axis
        rootNode
            .append("line")
            .attr("x1", width / 2)
            .attr("x2", width / 2)
            .attr("y1", 0)
            .attr("y2", height)
            .attr("stroke", "black")
            .attr("stroke-width", 1);

        // y-axis
        rootNode
            .append("line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", height / 2)
            .attr("y2", height / 2)
            .attr("stroke", "black")
            .attr("stroke-width", 1);

        const delimiters = 10;

        // X mark
        rootNode
            .append("text")
            .attr("x", width - 20)
            .attr("y", (height / 2) + 20)
            .text("X");
        // Y mark
        rootNode
            .append("text")
            .attr("x", (width / 2) + 5)
            .attr("y", 20)
            .text("Y");
        // ZERO mark
        rootNode
            .append("text")
            .attr("x", (width / 2) + 5)
            .attr("y", (height / 2) + 20)
            .text(0);

        // negative x-axis delimiters
        for (let i = 1; i <= delimiters; i++) {
            const xStep = (i * (((width - (width / 2 * 0.25)) / 2) / delimiters));

            rootNode
                .append("line")
                .attr("x1", (width / 2) - xStep)
                .attr("x2", (width / 2) - xStep)
                .attr("y1", height / 2 - 10)
                .attr("y2", height / 2 + 11)
                .attr("stroke", "black")
                .attr("stroke-width", 1);

            rootNode
                .append("text")
                .attr("x", (width / 2) - xStep - 10)
                .attr("y", (height / 2) + 30)
                .text("-" + i);
        }
        // positive x-axis delimiters
        for (let i = 1; i <= delimiters; i++) {
            const xStep = (i * (((width - (width / 2 * 0.25)) / 2) / delimiters));

            rootNode
                .append("line")
                .attr("x1", (width / 2) + xStep)
                .attr("x2", (width / 2) + xStep)
                .attr("y1", height / 2 - 10)
                .attr("y2", height / 2 + 11)
                .attr("stroke", "black")
                .attr("stroke-width", 1);

            rootNode
                .append("text")
                .attr("x", (width / 2) + xStep - 5)
                .attr("y", (height / 2) + 30)
                .text(i);
        }

        // negative y-axis delimiters
        for (let i = 1; i <= delimiters; i++) {
            const yStep = (i * (((height - (height / 2 * 0.25)) / 2) / delimiters));

            rootNode
                .append("line")
                .attr("x1", width / 2 - 10)
                .attr("x2", width / 2 + 11)
                .attr("y1", (height / 2) + yStep)
                .attr("y2", (height / 2) + yStep)
                .attr("stroke", "black")
                .attr("stroke-width", 1);

            rootNode
                .append("text")
                .attr("x", (width / 2) + 20)
                .attr("y", (height / 2) + yStep + 5)
                .text("-" + i);
        }
        // positive y-axis delimiters
        for (let i = 1; i <= delimiters; i++) {
            const yStep = (i * (((height - (height / 2 * 0.25)) / 2) / delimiters));

            rootNode
                .append("line")
                .attr("x1", width / 2 - 10)
                .attr("x2", width / 2 + 11)
                .attr("y1", (height / 2) - yStep)
                .attr("y2", (height / 2) - yStep)
                .attr("stroke", "black")
                .attr("stroke-width", 1);

            rootNode
                .append("text")
                .attr("x", (width / 2) + 25)
                .attr("y", (height / 2) - yStep + 5)
                .text(i);
        }

        //chart render
        if (type === ChartTypes.ELLIPSE) {
            rootNode
                .append("circle")
                .attr("cx", (width / 2) + 40)
                .attr("cy", (height / 2) + 40)
                .attr("r", 100)
                .attr("fill", "transparent")
                .attr("stroke", "black")
                .attr("stroke-width", 2);

            // rootNode
            //     .append("path")
            //     .attr("d", "M 100 350 q 150 -300 300 0")
            //     .attr("fill", "none")
            //     .attr("stroke", "black")
            //     .attr("stroke-width", 2);

            // rootNode
            //     .append("path")
            //     .attr("d", "M 0 150 S 500 600 100 1000")
            //     .attr("fill", "none")
            //     .attr("stroke", "black")
            //     .attr("stroke-width", 2);
        } else if (type === ChartTypes.HYPERBOLE) {
            rootNode
                .append("path")
                .attr("d", "M 0 150 C 350 600 350 600 100 1000")
                .attr("fill", "none")
                .attr("stroke", "black")
                .attr("stroke-width", 2);
            rootNode
                .append("path")
                .attr("d", "M 900 0 C 500 600 500 600 800 1000")
                .attr("fill", "none")
                .attr("stroke", "black")
                .attr("stroke-width", 2);
        } else if (type === ChartTypes.PARABOLA) {

        }

        const bufferedSvg = Buffer.from(svgNode.svgString(), "utf-8");

        return svg2png.sync(bufferedSvg);
    }
}

module.exports = ReduceFunctionWizard;