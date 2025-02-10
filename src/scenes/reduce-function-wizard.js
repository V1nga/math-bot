const emoji = require("node-emoji");
const telegraf = require("telegraf");
const { Composer, Scenes: { WizardScene }, Markup } = telegraf;
const { mdEscape } = require("../utils");
const { solveSystemEquationGauss, solveQuadraticEquation, findDeterminant, invertValue } = require("./math-actions");
const D3Node = require("d3-node");
const svg2png = require("svg2png");

const ChartTypes = {
    CIRCLE: "Окружность",
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

            const coefficients = this.solveEquation(equation);
            const figureData = this.findFigure(coefficients);
            const steps = this.describeSteps(coefficients, figureData);
            const chart = this.drawChart(figureData);

            const msg = Object.keys(steps).filter(index => steps[index].value != null).map(index => mdEscape(steps[index].text) + "\n" + mdEscape(steps[index].value) + (steps[index].altValue ? "\n" + mdEscape(steps[index].altValue) : "")).join("\n\n");

            await msgCtx.reply(msg, { parse_mode: 'MarkdownV2' });
            await msgCtx.replyWithPhoto({ source: chart });

            return msgCtx.scene.leave();
        });

        const scene = new WizardScene("reduce-function-wizard", equationStep);
        scene.enter(enterHandler);

        this.scene = scene;
    }


    findZeroCoords(variables) {
        const zeroCoordsMatrix = [
            [variables.A11, variables.A12],
            [variables.A12, variables.A22]
        ];
        const zeroCoordsVector = [
            invertValue(variables.A1),
            invertValue(variables.A2)
        ];
        const gaussResult = solveSystemEquationGauss(zeroCoordsMatrix, zeroCoordsVector);

        return {
            x: Number.isFinite(gaussResult[0]) ? gaussResult[0] : 0,
            y: Number.isFinite(gaussResult[1]) ? gaussResult[1] : 0
        };
    }

    rotateAngle(variables) {
        return variables.A12 ? variables.A11 === variables.A22 ? (Math.PI / 4) : Math.atan((2 * variables.A12) / (variables.A11 - variables.A22)) / 2 : 0;
    }

    findCircle(coefficients) {
        return {
            chartType: ChartTypes.CIRCLE,
            circleRadius: Math.sqrt(coefficients.aCoefficient),
            zeroCoords: coefficients.zeroCoords
        }
    }

    findEllipse(coefficients) {
        return {
            chartType: ChartTypes.ELLIPSE,
            halfAxis: {
                a: Math.sqrt(coefficients.aQuadCoefficient),
                b: Math.sqrt(coefficients.bQuadCoefficient)
            },
            zeroCoords: coefficients.zeroCoords
        }
    }

    findHyperbole(coefficients) {
        // Вершины гиперболы
        const hyperbolaVertices = {
            leftBranch: {
                x: coefficients.zeroCoords.x - Math.sqrt(Math.abs(coefficients.bQuadCoefficient)),
                y: coefficients.zeroCoords.y
            },
            rightBranch: {
                x: coefficients.zeroCoords.x + Math.sqrt(Math.abs(coefficients.bQuadCoefficient)),
                y: coefficients.zeroCoords.y
            }
        };

        // Точки гирерболы
        const pointsCoords = {
            leftBranch: [hyperbolaVertices.leftBranch],
            rightBranch: [hyperbolaVertices.rightBranch]
        };

        // Нахождение Y координат для веток
        for (let i = 0; i < 10; i += 0.2) {
            const aCoefficient = Math.abs(coefficients.aQuadCoefficient);
            const bCoefficient = Math.abs(coefficients.bQuadCoefficient);

            const xLeftBranch = hyperbolaVertices.leftBranch.x - i;
            const xRightBranch = hyperbolaVertices.rightBranch.x + i;

            const yFunc = (x) => coefficients.zeroCoords.y + Math.sqrt(aCoefficient * (Math.pow(x - coefficients.zeroCoords.x, 2) / bCoefficient - 1));

            const yLeftBranchStep = Math.abs(hyperbolaVertices.leftBranch.y - yFunc(xLeftBranch));
            const yRightBranchStep = Math.abs(hyperbolaVertices.rightBranch.y - yFunc(xRightBranch));

            pointsCoords.leftBranch.push({ x: xLeftBranch, y: hyperbolaVertices.leftBranch.y + yLeftBranchStep });
            pointsCoords.leftBranch.push({ x: xLeftBranch, y: hyperbolaVertices.leftBranch.y - yLeftBranchStep });

            pointsCoords.rightBranch.push({ x: xRightBranch, y: hyperbolaVertices.rightBranch.y + yRightBranchStep });
            pointsCoords.rightBranch.push({ x: xRightBranch, y: hyperbolaVertices.rightBranch.y - yRightBranchStep });
        }

        // Сортировка по убыванию Y координат (для правильной отрисовки на графике)
        pointsCoords.leftBranch.sort((a, b) => a.y - b.y).reverse();
        pointsCoords.rightBranch.sort((a, b) => a.y - b.y).reverse();

        return {
            chartType: ChartTypes.HYPERBOLE,
            zeroCoords: coefficients.zeroCoords,
            pointsCoords: pointsCoords,
            hyperbolaVertices: hyperbolaVertices
        }
    }

    findParabola(coefficients) {
        const A = coefficients.variables.A11;
        const C = coefficients.variables.A22;
        const D = coefficients.variables.A1;
        const E = coefficients.variables.A2;
        const F = coefficients.variables.A0;

        const pCoefficient = Math.sign(invertValue(D)) * Math.sqrt(-coefficients.aDeterminant / Math.pow(coefficients.tCoefficient, 3));

        // Вершина параболы
        const parabolaVertices = {
            x: coefficients.zeroCoords.x,
            y: coefficients.zeroCoords.y
        };

        // Точки параболы
        const pointsCoords = {
            firstBranch: [],
            secondBranch: []
        };

        if(A !== 0) {
            parabolaVertices.x = -(D / A);
            parabolaVertices.y = -((F / (2 * E) - (Math.pow(D, 2) / (2 * E * A))));

            //TO-DO
        } else {
            parabolaVertices.x = -(F / (2 * D)) + (Math.pow(E, 2) / ((2 * D) * C));
            parabolaVertices.y = -(E / C);

            const yFunc = (x) => (Math.sign(pCoefficient) * Math.sqrt(Math.abs(2 * D / C))) * Math.sqrt((x * Math.sign(pCoefficient)) - Math.abs(parabolaVertices.x));

            // Нахождение Y координат для веток
            for (let i = 0; i < 10; i += 0.2) {
                const x = parabolaVertices.x + (i * Math.sign(pCoefficient));

                // pointsCoords.push({ x: x, y: yFunc(x) + parabolaVertices.y });
                pointsCoords.firstBranch.push({ x: x, y: parabolaVertices.y - yFunc(x)});
                pointsCoords.secondBranch.push({ x: x, y: parabolaVertices.y + yFunc(x)});
            }

            // Сортировка по убыванию Y координат (для правильной отрисовки на графике)
            pointsCoords.firstBranch.sort((a, b) => a.y - b.y).reverse();
            pointsCoords.secondBranch.sort((a, b) => a.y - b.y).reverse();
        }

        return {
            chartType: ChartTypes.PARABOLA,
            zeroCoords: coefficients.zeroCoords,
            pointsCoords: pointsCoords,
            parabolaVertices: parabolaVertices,
            pCoefficient: pCoefficient
        }
    }

    findFigure(coefficients) {
        // 4x^2-8x+4y^2+4y-11=0 - окружность
        // 9x^2-36x+16y^2+64y-44=0 - эллипс
        // 16x^2-9y^2-64x-54y-161=0 - гипербола
        // 18y^2+6x+6y+15=0 - парабола

        if (coefficients.bDeterminant > 0 && coefficients.aDeterminant !== 0 && coefficients.tCoefficient * coefficients.aDeterminant < 0) {
            if (Math.sqrt(coefficients.aQuadCoefficient) === Math.sqrt(coefficients.bQuadCoefficient)) {
                return this.findCircle(coefficients);
            } else {
                return this.findEllipse(coefficients);
            }
        } else if (coefficients.bDeterminant < 0 && coefficients.aDeterminant !== 0) {
            return this.findHyperbole(coefficients);
        } else if (coefficients.bDeterminant === 0 && coefficients.aDeterminant !== 0) {
            return this.findParabola(coefficients);
        }
    };

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
                const value = Number(term.split('x^2')[0]);
                variables.A11 = value === 0 ? 1 : value;
            } else if (term.includes('y^2')) {
                const value = Number(term.split('y^2')[0]);
                variables.A22 = value === 0 ? 1 : value;
            } else if (term.includes('xy')) {
                variables.A12 = Number(term.split('xy')[0]) / 2;
            } else if (term.includes('x')) {
                variables.A1 = Number(term.replace(/x/, '')) / 2;
            } else if (term.includes('y')) {
                variables.A2 = Number(term.replace(/y/, '')) / 2;
            } else {
                if (variables.A0 === 0) {
                    variables.A0 = Number(term);
                }
            }
        });

        return variables;
    }

    solveEquation(equation) {
        let variables = this.parseEquation(equation);

        const tCoefficient = variables.A11 + variables.A22;

        const bMatrix = [
            [variables.A11, variables.A12],
            [variables.A12, variables.A22]
        ]
        const bDeterminant = findDeterminant(bMatrix);

        const aMatrix = [
            [variables.A11, variables.A12, variables.A1],
            [variables.A12, variables.A22, variables.A2],
            [variables.A1, variables.A2, variables.A0]
        ]
        const aDeterminant = findDeterminant(aMatrix);

        const solvedQuadEquation = solveQuadraticEquation(1, -tCoefficient, bDeterminant);

        const aCoefficient = solvedQuadEquation.x1;
        const cCoefficient = solvedQuadEquation.x2;
        const fCoefficient = aDeterminant / bDeterminant;

        const invertFCoefficient = invertValue(fCoefficient);
        const aQuadCoefficient = invertFCoefficient / aCoefficient;
        const bQuadCoefficient = invertFCoefficient / cCoefficient;

        // Центр системы координат
        const zeroCoords = this.findZeroCoords(variables);

        // Поворот графика
        let rotateAngle = this.rotateAngle(variables);

        return {
            variables: variables,

            tCoefficient: tCoefficient,
            bMatrix: bMatrix,
            bDeterminant: bDeterminant,
            aMatrix: aMatrix,
            aDeterminant: aDeterminant,

            solvedQuadEquation: solvedQuadEquation,
            aCoefficient: aCoefficient,
            cCoefficient: cCoefficient,
            fCoefficient: fCoefficient,
            invertFCoefficient: invertFCoefficient,

            aQuadCoefficient: aQuadCoefficient,
            bQuadCoefficient: bQuadCoefficient,

            zeroCoords: zeroCoords,
            rotateAngle: rotateAngle
        };
    }

    describeSteps(coefficients, figureData) {
        const generateTextMatrix = (matrix) => {
            const longestStr = (arr) => arr.reduce((max, n) => max.length > n.length ? max : n, '');
            const colLength = longestStr(matrix.map(row => row.map(col => String(col))).map(row => longestStr(row)))?.length;

            const mdMatrix = matrix.map(row => row.map(num => String(num).padStart(colLength)));

            return "```\n" + mdMatrix.map(row => row.join("\t")).join("\n") + "```";
        }

        const canonicalForm = () => {
            if(figureData.chartType === ChartTypes.CIRCLE) {
                return `(x - ${ coefficients.zeroCoords.x })² + (y - ${ coefficients.zeroCoords.y })² = ${ Math.sqrt(coefficients.aQuadCoefficient) }`;
            } else if (figureData.chartType === ChartTypes.ELLIPSE) {
                return `x²/${ coefficients.aQuadCoefficient.toFixed(1) } + y²/${ coefficients.bQuadCoefficient.toFixed(1) } = 1`;
            } else if (figureData.chartType === ChartTypes.HYPERBOLE) {
                return `(x - ${ coefficients.zeroCoords.x.toFixed(1) })²/${ Math.abs(coefficients.bQuadCoefficient).toFixed(1) } - (y - ${ coefficients.zeroCoords.y.toFixed(1) })²/${ Math.abs(coefficients.aQuadCoefficient).toFixed(1) } = 1`;
            } else if (figureData.chartType === ChartTypes.PARABOLA) {
                // return `(y - `;
                // console.log(figureData);
                return "";
            }
        }

        return {
            TCoefficient: {
                text: "Коэффициент A + C:",
                value: `A + C = ${ coefficients.tCoefficient }`
            },
            BMatrix: {
                text: "Матрица δ:",
                value: generateTextMatrix(coefficients.bMatrix)
            },
            BDeterminant: {
                text: "Коэффициент δ:",
                value: `δ \= (${ coefficients.bMatrix[0][0] } * ${ coefficients.bMatrix[1][1] }) - (${ coefficients.bMatrix[0][1]} * ${ coefficients.bMatrix[1][0] }) \= ${ coefficients.bDeterminant }`
            },
            ADeterminant: {
                text: "Коэффициент Δ:",
                value: `Δ \= ${ coefficients.aMatrix[0][0] } * (${ coefficients.aMatrix[1][1] } * ${ coefficients.aMatrix[2][2] } - ${ Math.abs(coefficients.aMatrix[1][2]) } * ${ coefficients.aMatrix[2][1] }) - ${ Math.abs(coefficients.aMatrix[0][1]) } * (${ coefficients.aMatrix[1][0] } * ${ coefficients.aMatrix[2][2] } - ${ Math.abs(coefficients.aMatrix[1][2]) } * ${ coefficients.aMatrix[2][0] }) + ${ coefficients.aMatrix[0][2] } * (${ coefficients.aMatrix[1][0] } * ${ coefficients.aMatrix[2][1] } - ${ Math.abs(coefficients.aMatrix[1][1]) } * ${ coefficients.aMatrix[2][0] }) \= ${ coefficients.aDeterminant }`
            },
            AMatrix: {
                text: "Определитель Δ:",
                value: generateTextMatrix(coefficients.aMatrix)
            },
            QuadEquationSolve: {
                text: "Решение квадратного уравнения:",
                value: `D = ${ coefficients.solvedQuadEquation.discriminant }, x₁ = ${ coefficients.solvedQuadEquation.x1 }, x₂ = ${ coefficients.solvedQuadEquation.x2 }`
            },
            ZeroCoords: {
                text: "Координаты O'(x₁, y₁):",
                value: `x₁ = ${ coefficients.zeroCoords.x.toFixed(1) }, y₁ = ${ coefficients.zeroCoords.y.toFixed(1) }`,
            },
            RotateAngle: {
                text: "Угол поворота α осей координат:",
                value: `α = ${ coefficients.rotateAngle.toFixed(3) } ≈ ${ Math.round(coefficients.rotateAngle * (180 / Math.PI)) }°`
            },
            GraphType: {
                text: "Тип графика:",
                value: figureData.chartType
            },
            CircleRadius: {
                text: "Радиус окружности",
                value: figureData.chartType === ChartTypes.CIRCLE
                    ? `R = ${ figureData.circleRadius }`
                    : null
            },
            HalfAxis: {
                text: "Длины полуосей:",
                value: figureData.chartType === ChartTypes.ELLIPSE
                    ? `a = ${ Math.sqrt(figureData.halfAxis.a).toFixed(1) }; b = ${ Math.sqrt(figureData.halfAxis.b).toFixed(1) }`
                    : null
            },
            HyperbolaVertices: {
                text: "Вершины гиперболы:",
                value: figureData.chartType === ChartTypes.HYPERBOLE
                    ? `A₁ (${ figureData.hyperbolaVertices.leftBranch.x.toFixed(1) }; ${ figureData.hyperbolaVertices.leftBranch.y.toFixed(1) }), A₂ (${ figureData.hyperbolaVertices.leftBranch.x.toFixed(1) }; ${ figureData.hyperbolaVertices.leftBranch.y.toFixed(1) })`
                    : null
            },
            CanonicalForm: {
                text: "Канонический вид:",
                value: canonicalForm()
            }
        }
    }

    drawChart(data, imgSize = 1000, padding = 100) {
        const svgNode = new D3Node();

        let rootNode = svgNode.createSVG(imgSize, imgSize);

        // chart size values
        const chartSize = imgSize - padding;
        const chartZeroCoords = {
            x: imgSize / 2,
            y: imgSize / 2
        };
        const chartDelimitersAmount = 10;
        const chartStep = (chartSize / 2) / chartDelimitersAmount;

        // chart settings
        const chartNumHeight = 20;
        const chartAxisHeight = imgSize * 0.001;
        const chartDelimiterHeight = imgSize * 0.01;
        const chartStrokeWidth = imgSize * 0.002 > 2 ? imgSize * 0.002 : 2;

        // x-axis
        rootNode
            .append("line")
            .attr("x1", chartZeroCoords.x)
            .attr("x2", chartZeroCoords.x)
            .attr("y1", 0)
            .attr("y2", imgSize)
            .attr("stroke", "black")
            .attr("stroke-width", 1);

        // y-axis
        rootNode
            .append("line")
            .attr("x1", 0)
            .attr("x2", imgSize)
            .attr("y1", chartZeroCoords.y)
            .attr("y2", chartZeroCoords.y)
            .attr("stroke", "black")
            .attr("stroke-width", 1);

        // X mark
        rootNode
            .append("text")
            .attr("x", imgSize - 20)
            .attr("y", chartZeroCoords.y + 20)
            .text("X");
        // Y mark
        rootNode
            .append("text")
            .attr("x", chartZeroCoords.x + 5)
            .attr("y", 20)
            .text("Y");

        // ZERO mark
        rootNode
            .append("text")
            .attr("x", chartZeroCoords.x + 5)
            .attr("y", chartZeroCoords.y + 20)
            .text(0);

        // translation equation values to chart coords system
        const searchMultipleNumber = (num) => Number(`1${ "0".repeat(num.toString().length - 1) }`);
        const roundUp = (num) => {
            const multipleNumber = searchMultipleNumber(num);
            return Math.ceil(num /  multipleNumber) * multipleNumber;
        }

        const maxValue =
            roundUp(
                Math.ceil(Math.max(Math.abs(data?.zeroCoords.x || 0), Math.abs(data?.zeroCoords.y || 0))) +
                Math.ceil(Math.max(Math.abs(data?.halfAxis?.a || 0), Math.abs(data?.halfAxis?.b || 0), Math.abs(data?.circleRadius || 0)))
            );
        const multipleNumber = searchMultipleNumber(maxValue);

        // translation to chart coords system functions
        const getXCoords = (x) => chartZeroCoords.x + ((x / multipleNumber) * chartStep);
        const getYCoords = (y) => chartZeroCoords.y - ((y / multipleNumber) * chartStep);
        const getLength = (value) => (value / multipleNumber) * chartStep;
        const getStep = (index) => index * chartStep;
        const getDelimiterValue = (index) => multipleNumber > 1000 ? index * Number(multipleNumber.toString().substring(0, 1)) : (index * multipleNumber)

        // multiply mark
        if (multipleNumber > 1000) {
            rootNode
                .append("text")
                .attr("x", chartSize + ((imgSize - chartSize) / 2))
                .attr("y", ((imgSize - chartSize) / 2))
                .attr("text-anchor", "end")
                .attr("font-size", "2em")
                .text(`x${ multipleNumber }`);
        }

        // negative x-axis delimiters
        for (let i = 1; i <= chartDelimitersAmount; i++) {
            rootNode
                .append("line")
                .attr("x1", chartZeroCoords.x - getStep(i))
                .attr("x2", chartZeroCoords.x - getStep(i))
                .attr("y1", chartZeroCoords.y - chartDelimiterHeight)
                .attr("y2", chartZeroCoords.y + (chartDelimiterHeight + chartAxisHeight))
                .attr("stroke", "black")
                .attr("stroke-width", 1);

            rootNode
                .append("text")
                .attr("x", chartZeroCoords.x - getStep(i))
                .attr("y", chartZeroCoords.y + (chartDelimiterHeight * 2 + chartAxisHeight) + (chartNumHeight * 0.4))
                .attr("text-anchor", "middle")
                .text(getDelimiterValue(-i));
        }
        // positive x-axis delimiters
        for (let i = 1; i <= chartDelimitersAmount; i++) {
            rootNode
                .append("line")
                .attr("x1", chartZeroCoords.x + getStep(i))
                .attr("x2", chartZeroCoords.x + getStep(i))
                .attr("y1", chartZeroCoords.y - chartDelimiterHeight)
                .attr("y2", chartZeroCoords.y + (chartDelimiterHeight + chartAxisHeight))
                .attr("stroke", "black")
                .attr("stroke-width", 1);

            rootNode
                .append("text")
                .attr("x", chartZeroCoords.x + getStep(i))
                .attr("y", chartZeroCoords.y + (chartDelimiterHeight * 2 + chartAxisHeight) + (chartNumHeight * 0.4))
                .attr("text-anchor", "middle")
                .text(getDelimiterValue(i));
        }
        // positive y-axis delimiters
        for (let i = 1; i <= chartDelimitersAmount; i++) {
            rootNode
                .append("line")
                .attr("x1", chartZeroCoords.x - chartDelimiterHeight)
                .attr("x2", chartZeroCoords.y + (chartDelimiterHeight + chartAxisHeight))
                .attr("y1", chartZeroCoords.y + getStep(i))
                .attr("y2", chartZeroCoords.y + getStep(i))
                .attr("stroke", "black")
                .attr("stroke-width", 1);

            rootNode
                .append("text")
                .attr("x", chartZeroCoords.x + 15)
                .attr("y", chartZeroCoords.y - getStep(i) + (chartNumHeight * 0.25))
                .text(getDelimiterValue(i));
        }
        // negative y-axis delimiters
        for (let i = 1; i <= chartDelimitersAmount; i++) {
            rootNode
                .append("line")
                .attr("x1", chartZeroCoords.x - chartDelimiterHeight)
                .attr("x2", chartZeroCoords.y + (chartDelimiterHeight + chartAxisHeight))
                .attr("y1", chartZeroCoords.y - getStep(i))
                .attr("y2", chartZeroCoords.y - getStep(i))
                .attr("stroke", "black")
                .attr("stroke-width", 1);

            rootNode
                .append("text")
                .attr("x", chartZeroCoords.x + 15)
                .attr("y", chartZeroCoords.y + getStep(i) + (chartNumHeight * 0.25))
                .text(getDelimiterValue(-i));
        }

        // draw equation graphs
        if (data.chartType === ChartTypes.CIRCLE) {
            // Окружность
            rootNode
                .append("ellipse")
                .attr("cx", getXCoords(data.zeroCoords.x))
                .attr("cy", getYCoords(data.zeroCoords.y))
                .attr("rx", getLength(data.circleRadius))
                .attr("ry", getLength(data.circleRadius))
                .attr("fill", "none")
                .attr("stroke", "black")
                .attr("stroke-width", chartStrokeWidth);

            // Линия радиуса
            rootNode
                .append("line")
                .attr("x1", getXCoords(data.zeroCoords.x))
                .attr("y1", getYCoords(data.zeroCoords.y))
                .attr("x2", getXCoords(data.zeroCoords.x) + getLength(data.circleRadius))
                .attr("y2", getYCoords(data.zeroCoords.y))
                .attr("stroke", "red")
                .attr("stroke-width", chartStrokeWidth)

            // Длина радиуса (текст)
            rootNode
                .append("text")
                .attr("x", getXCoords(data.zeroCoords.x + (data.circleRadius / 2)))
                .attr("y", getYCoords(data.zeroCoords.y) - 10)
                .attr("text-anchor", "middle")
                .attr("font-weight", "bold")
                .attr("fill", "blue")
                .text(`R = ${ data.circleRadius.toFixed(1) }`);
        } else if (data.chartType === ChartTypes.ELLIPSE) {
            // Эллипс
            rootNode
                .append("ellipse")
                .attr("cx", getXCoords(data.zeroCoords.x))
                .attr("cy", getYCoords(data.zeroCoords.y))
                .attr("rx", getLength(data.halfAxis.a))
                .attr("ry", getLength(data.halfAxis.b))
                .attr("fill", "none")
                .attr("stroke", "black")
                .attr("stroke-width", chartStrokeWidth);

            // Линия полуоси A
            rootNode
                .append("line")
                .attr("x1", getXCoords(data.zeroCoords.x))
                .attr("y1", getYCoords(data.zeroCoords.y))
                .attr("x2", getXCoords(data.zeroCoords.x) + getLength(data.halfAxis.a))
                .attr("y2", getYCoords(data.zeroCoords.y))
                .attr("stroke", "blue")
                .attr("stroke-width", chartStrokeWidth)
            // Линия полуоси B
            rootNode
                .append("line")
                .attr("x1", getXCoords(data.zeroCoords.x))
                .attr("y1", getYCoords(data.zeroCoords.y))
                .attr("x2", getXCoords(data.zeroCoords.x))
                .attr("y2", getYCoords(data.zeroCoords.y) - getLength(data.halfAxis.b))
                .attr("stroke", "blue")
                .attr("stroke-width", chartStrokeWidth)

            // Длина полуоси A эллипса (текст)
            rootNode
                .append("text")
                .attr("x", getXCoords(data.zeroCoords.x + (data.halfAxis.a / 2)))
                .attr("y", getYCoords(data.zeroCoords.y) - 10)
                .attr("text-anchor", "middle")
                .attr("font-weight", "bold")
                .attr("fill", "blue")
                .text(`A = ${ data.halfAxis.a.toFixed(1) }`);
            // Длина полуоси B эллипса (текст)
            rootNode
                .append("text")
                .attr("x", getXCoords(data.zeroCoords.x) - 10)
                .attr("y", getYCoords(data.zeroCoords.y + (data.halfAxis.b / 2)))
                .attr("text-anchor", "end")
                .attr("font-weight", "bold")
                .attr("fill", "blue")
                .text(`B = ${ data.halfAxis.b.toFixed(1) }`);
        } else if (data.chartType === ChartTypes.HYPERBOLE) {
            const leftBranchPoints = data.pointsCoords.leftBranch.map(coords => `${ getXCoords(coords.x) }, ${ getYCoords(coords.y) }`).join(" ");
            const rightBranchPoints = data.pointsCoords.rightBranch.map(coords => `${ getXCoords(coords.x) }, ${ getYCoords(coords.y) }`).join(" ");

            // Линия левой ветки гиперболы
            rootNode
                .append("polyline")
                .attr("points", leftBranchPoints)
                .attr("fill", "none")
                .attr("stroke", "red")
            // Линия правой ветки гиперболы
            rootNode
                .append("polyline")
                .attr("points", rightBranchPoints)
                .attr("fill", "none")
                .attr("stroke", "red")

            // Вершина левой ветки гиперболы (текст)
            rootNode
                .append("text")
                .attr("x", getXCoords(data.hyperbolaVertices.leftBranch.x) - 10)
                .attr("y", getYCoords(data.hyperbolaVertices.leftBranch.y))
                .attr("text-anchor", "end")
                .attr("font-weight", "bold")
                .attr("fill", "blue")
                .text(`A₁ (${ data.hyperbolaVertices.leftBranch.x.toFixed(1) }, ${ data.hyperbolaVertices.leftBranch.y.toFixed(1) })`);
            // Вершина правой ветки гиперболы (текст)
            rootNode
                .append("text")
                .attr("x", getXCoords(data.hyperbolaVertices.rightBranch.x) + 10)
                .attr("y", getYCoords(data.hyperbolaVertices.rightBranch.y))
                .attr("text-anchor", "start")
                .attr("font-weight", "bold")
                .attr("fill", "blue")
                .text(`A₂ (${ data.hyperbolaVertices.rightBranch.x.toFixed(1) }, ${ data.hyperbolaVertices.rightBranch.y.toFixed(1) })`);

            // Точки левой ветки гиперболы
            data.pointsCoords.leftBranch.forEach(coords => {
                rootNode
                    .append("ellipse")
                    .attr("cx", getXCoords(coords.x))
                    .attr("cy", getYCoords(coords.y))
                    .attr("fill", "blue")
                    .attr("rx", "3")
                    .attr("ry", "3")
            });
            // Точки правой ветки гиперболы
            data.pointsCoords.rightBranch.forEach(coords => {
                rootNode
                    .append("ellipse")
                    .attr("cx", getXCoords(coords.x))
                    .attr("cy", getYCoords(coords.y))
                    .attr("fill", "blue")
                    .attr("rx", "3")
                    .attr("ry", "3")
            });
        } else if (data.chartType === ChartTypes.PARABOLA) {
            const firstBranchPoints = data.pointsCoords.firstBranch.map(coords => `${ getXCoords(coords.x) }, ${ getYCoords(coords.y) }`).join(" ");
            const secondBranchPoints = data.pointsCoords.secondBranch.map(coords => `${ getXCoords(coords.x) }, ${ getYCoords(coords.y) }`).join(" ");

            // Линии параболы
            rootNode
                .append("polyline")
                .attr("points", firstBranchPoints)
                .attr("fill", "none")
                .attr("stroke", "red");
            rootNode
                .append("polyline")
                .attr("points", secondBranchPoints)
                .attr("fill", "none")
                .attr("stroke", "red");

            // Вершина параболы (текст)
            rootNode
                .append("text")
                .attr("x", getXCoords(data.parabolaVertices.x) - 10)
                .attr("y", getYCoords(data.parabolaVertices.y))
                .attr("text-anchor", "end")
                .attr("font-weight", "bold")
                .attr("fill", "blue")
                .text(`A₁ (${ data.parabolaVertices.x.toFixed(1) }, ${ data.parabolaVertices.y.toFixed(1) })`);

            // Точки параболы
            data.pointsCoords.firstBranch.forEach(coords => {
                rootNode
                    .append("ellipse")
                    .attr("cx", getXCoords(coords.x))
                    .attr("cy", getYCoords(coords.y))
                    .attr("fill", "blue")
                    .attr("rx", "3")
                    .attr("ry", "3")
            });
            data.pointsCoords.secondBranch.forEach(coords => {
                rootNode
                    .append("ellipse")
                    .attr("cx", getXCoords(coords.x))
                    .attr("cy", getYCoords(coords.y))
                    .attr("fill", "blue")
                    .attr("rx", "3")
                    .attr("ry", "3")
            });
        }

        // центр графика
        rootNode
            .append("ellipse")
            .attr("cx", getXCoords(data.zeroCoords.x))
            .attr("cy", getYCoords(data.zeroCoords.y))
            .attr("fill", "red")
            .attr("rx", "6")
            .attr("ry", "6");
        if(data.zeroCoords.x !== 0 && data.zeroCoords.y !== 0) {
            rootNode
                .append("text")
                .attr("x", getXCoords(data.zeroCoords.x))
                .attr("y", getYCoords(data.zeroCoords.y) + 25)
                .attr("text-anchor", "middle")
                .attr("font-weight", "bold")
                .attr("fill", "red")
                .text(`O' (${ data.zeroCoords.x.toFixed(1) }, ${ data.zeroCoords.y.toFixed(1) })`);
        }

        const bufferedSvg = Buffer.from(svgNode.svgString(), "utf-8");

        return svg2png.sync(bufferedSvg);
    }
}

module.exports = ReduceFunctionWizard;