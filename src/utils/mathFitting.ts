import { DataPoint, FitResult, FitType } from "../types";

export function formatSigFigs(num: number, sigFigs = 4): string {
  if (isNaN(num) || !isFinite(num)) return "N/A";
  if (num === 0) return "0";
  const abs = Math.abs(num);
  if (abs >= 1e4 || (abs < 1e-3 && abs > 0)) {
    return num.toExponential(sigFigs - 1);
  }
  return parseFloat(num.toPrecision(sigFigs)).toString();
}

export function computeStats(values: number[]): {
  mean: number;
  stdDev: number;
  variance: number;
  min: number;
  max: number;
} {
  if (!values.length) {
    return { mean: 0, stdDev: 0, variance: 0, min: 0, max: 0 };
  }
  const n = values.length;
  const mean = values.reduce((sum, v) => sum + v, 0) / n;
  if (n === 1) {
    return { mean, stdDev: 0, variance: 0, min: values[0], max: values[0] };
  }
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);
  const min = Math.min(...values);
  const max = Math.max(...values);
  return { mean, stdDev, variance, min, max };
}

export function calculateFit(
  points: DataPoint[],
  fitType: FitType = "linear",
  xName = "x",
  yName = "y"
): FitResult | null {
  const activePoints = points.filter(
    (p) => !p.excluded && !isNaN(p.x) && !isNaN(p.y) && isFinite(p.x) && isFinite(p.y)
  );

  const n = activePoints.length;
  if (n < 2) return null;

  const xs = activePoints.map((p) => p.x);
  const ys = activePoints.map((p) => p.y);
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  const ssTot = ys.reduce((acc, y) => acc + Math.pow(y - meanY, 2), 0);

  let predict: (x: number) => number;
  let equation = "";
  let slope: number | undefined;
  let intercept: number | undefined;
  let aVal: number | undefined;
  let bVal: number | undefined;
  let cVal: number | undefined;

  switch (fitType) {
    case "linear_origin": {
      // y = m * x (intercept b = 0)
      // m = sum(x*y) / sum(x^2)
      let sumXY = 0;
      let sumX2 = 0;
      for (let i = 0; i < n; i++) {
        sumXY += xs[i] * ys[i];
        sumX2 += xs[i] * xs[i];
      }
      const m = sumX2 !== 0 ? sumXY / sumX2 : 0;
      slope = m;
      intercept = 0;
      predict = (x: number) => m * x;
      equation = `${yName} = ${formatSigFigs(m)} · ${xName}`;
      break;
    }

    case "quadratic": {
      // y = a*x^2 + b*x + c
      if (n < 3) {
        return calculateFit(points, "linear", xName, yName);
      }
      // Solve normal equations for 2nd order polynomial using Cramer's rule / matrix inversion
      let s0 = n,
        s1 = 0,
        s2 = 0,
        s3 = 0,
        s4 = 0;
      let t0 = 0,
        t1 = 0,
        t2 = 0;

      for (let i = 0; i < n; i++) {
        const x = xs[i];
        const y = ys[i];
        const x2 = x * x;
        s1 += x;
        s2 += x2;
        s3 += x2 * x;
        s4 += x2 * x2;
        t0 += y;
        t1 += x * y;
        t2 += x2 * y;
      }

      // Matrix:
      // [s4 s3 s2] [a] = [t2]
      // [s3 s2 s1] [b] = [t1]
      // [s2 s1 s0] [c] = [t0]
      const det =
        s4 * (s2 * s0 - s1 * s1) -
        s3 * (s3 * s0 - s1 * s2) +
        s2 * (s3 * s1 - s2 * s2);

      if (Math.abs(det) < 1e-12) {
        return calculateFit(points, "linear", xName, yName);
      }

      const detA =
        t2 * (s2 * s0 - s1 * s1) -
        s3 * (t1 * s0 - s1 * t0) +
        s2 * (t1 * s1 - s2 * t0);
      const detB =
        s4 * (t1 * s0 - s1 * t0) -
        t2 * (s3 * s0 - s1 * s2) +
        s2 * (s3 * t0 - t1 * s2);
      const detC =
        s4 * (s2 * t0 - t1 * s1) -
        s3 * (s3 * t0 - t1 * s2) +
        t2 * (s3 * s1 - s2 * s2);

      const a = detA / det;
      const b = detB / det;
      const c = detC / det;
      aVal = a;
      bVal = b;
      cVal = c;

      predict = (x: number) => a * x * x + b * x + c;
      const bSign = b >= 0 ? "+ " : "- ";
      const cSign = c >= 0 ? "+ " : "- ";
      equation = `${yName} = ${formatSigFigs(a)} · ${xName}² ${bSign}${formatSigFigs(Math.abs(b))} · ${xName} ${cSign}${formatSigFigs(Math.abs(c))}`;
      break;
    }

    case "power": {
      // y = a * x^b => ln(y) = ln(a) + b * ln(x)
      const validPower = activePoints.filter((p) => p.x > 0 && p.y > 0);
      if (validPower.length < 2) {
        return calculateFit(points, "linear", xName, yName);
      }
      let sumLnX = 0,
        sumLnY = 0,
        sumLnX2 = 0,
        sumLnXY = 0;
      const mCount = validPower.length;
      for (const p of validPower) {
        const lx = Math.log(p.x);
        const ly = Math.log(p.y);
        sumLnX += lx;
        sumLnY += ly;
        sumLnX2 += lx * lx;
        sumLnXY += lx * ly;
      }
      const bSlope =
        (mCount * sumLnXY - sumLnX * sumLnY) /
        (mCount * sumLnX2 - sumLnX * sumLnX);
      const lnA = (sumLnY - bSlope * sumLnX) / mCount;
      const a = Math.exp(lnA);
      aVal = a;
      bVal = bSlope;
      predict = (x: number) => (x > 0 ? a * Math.pow(x, bSlope) : 0);
      equation = `${yName} = ${formatSigFigs(a)} · ${xName}^(${formatSigFigs(bSlope)})`;
      break;
    }

    case "exponential": {
      // y = a * e^(b*x) => ln(y) = ln(a) + b * x
      const validExp = activePoints.filter((p) => p.y > 0);
      if (validExp.length < 2) {
        return calculateFit(points, "linear", xName, yName);
      }
      let sumX = 0,
        sumLnY = 0,
        sumX2 = 0,
        sumXLnY = 0;
      const mCount = validExp.length;
      for (const p of validExp) {
        const x = p.x;
        const ly = Math.log(p.y);
        sumX += x;
        sumLnY += ly;
        sumX2 += x * x;
        sumXLnY += x * ly;
      }
      const bSlope =
        (mCount * sumXLnY - sumX * sumLnY) /
        (mCount * sumX2 - sumX * sumX);
      const lnA = (sumLnY - bSlope * sumX) / mCount;
      const a = Math.exp(lnA);
      aVal = a;
      bVal = bSlope;
      predict = (x: number) => a * Math.exp(bSlope * x);
      equation = `${yName} = ${formatSigFigs(a)} · e^(${formatSigFigs(bSlope)} · ${xName})`;
      break;
    }

    case "inverse": {
      // y = k / x => y = k * (1/x)
      const validInv = activePoints.filter((p) => p.x !== 0);
      if (validInv.length < 2) {
        return calculateFit(points, "linear", xName, yName);
      }
      let sumInvX2 = 0;
      let sumYInvX = 0;
      for (const p of validInv) {
        const invX = 1 / p.x;
        sumInvX2 += invX * invX;
        sumYInvX += p.y * invX;
      }
      const k = sumInvX2 !== 0 ? sumYInvX / sumInvX2 : 0;
      aVal = k;
      predict = (x: number) => (x !== 0 ? k / x : 0);
      equation = `${yName} = ${formatSigFigs(k)} / ${xName}`;
      break;
    }

    case "linear":
    default: {
      // Standard Ordinary Least Squares: y = m*x + b
      let sumX = 0,
        sumY = 0,
        sumX2 = 0,
        sumXY = 0;
      for (let i = 0; i < n; i++) {
        sumX += xs[i];
        sumY += ys[i];
        sumX2 += xs[i] * xs[i];
        sumXY += xs[i] * ys[i];
      }
      const denominator = n * sumX2 - sumX * sumX;
      const m = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
      const b = (sumY - m * sumX) / n;
      slope = m;
      intercept = b;
      predict = (x: number) => m * x + b;
      const sign = b >= 0 ? "+ " : "- ";
      equation = `${yName} = ${formatSigFigs(m)} · ${xName} ${sign}${formatSigFigs(Math.abs(b))}`;
      break;
    }
  }

  // Calculate Residuals and RSS
  let rss = 0;
  const residuals = activePoints.map((p) => {
    const predictedY = predict(p.x);
    const residual = p.y - predictedY;
    rss += Math.pow(residual, 2);
    return {
      id: p.id,
      x: p.x,
      actualY: p.y,
      predictedY,
      residual,
    };
  });

  // Coefficient of determination R^2
  let r2 = ssTot !== 0 ? 1 - rss / ssTot : 1;
  if (r2 < 0) r2 = 0;
  if (r2 > 1) r2 = 1;

  // Pearson correlation r for linear
  let r = Math.sqrt(Math.max(0, r2));
  if (slope !== undefined && slope < 0) {
    r = -r;
  }

  return {
    type: fitType,
    equation,
    slope,
    intercept,
    a: aVal,
    b: bVal,
    c: cVal,
    r2,
    r,
    rss,
    predict,
    residuals,
  };
}
