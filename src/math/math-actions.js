const gauss = require("./gauss");

function solveQuadraticEquation (aCoefficient, bCoefficient, cCoefficient) {
    const discriminant = Math.pow(bCoefficient, 2) - (4 * aCoefficient * cCoefficient);

    const x1 = (-bCoefficient - Math.sqrt(discriminant)) / (2 * aCoefficient);
    const x2 = (-bCoefficient + Math.sqrt(discriminant)) / (2 * aCoefficient);

    return {
        discriminant: discriminant,
        x1: x1,
        x2: x2
    }
}

function solveSystemEquationGauss(matrix, vector) {
    return gauss(matrix, vector);
}

// алгоритм Барейса
function findDeterminant(matrix) {
    let N = matrix.length;
    let B = [];
    let denom = 1;
    let exchanges = 0;

    for (let i = 0; i < N; ++i) {
        B[i] = [];

        for (let j = 0; j < N; ++j) {
            B[i][j] = matrix[i][j];
        }
    }

    for (let i = 0; i < N - 1; ++i) {
        let maxN = i;
        let maxValue = Math.abs(B[i][i]);

        for (let j = i + 1; j < N; ++j) {
            let value = Math.abs(B[j][i]);

            if (value > maxValue) {
                maxN = j; maxValue = value;
            }
        }

        if (maxN > i) {
            let temp = B[i];
            B[i] = B[maxN];
            B[maxN] = temp;
            ++exchanges;
        } else {
            if (maxValue === 0) {
                return maxValue;
            }
        }
        let value1 = B[i][i];

        for (let j = i + 1; j < N; ++j) {
            let value2 = B[j][i];
            B[j][i] = 0;

            for (let k = i + 1; k < N; ++k) {
                B[j][k] = (B[j][k] * value1 - B[i][k] * value2) / denom;
            }
        }
        denom = value1;
    }

    if (exchanges % 2) {
        return -B[N-1][N-1];
    } else {
        return B[N-1][N-1];
    }
}

function invertValue(value) {
    return value === 0 ? 0 : value > 0 ? -Math.abs(value) : Math.abs(value);
}

module.exports = { solveSystemEquationGauss, solveQuadraticEquation, findDeterminant, invertValue };