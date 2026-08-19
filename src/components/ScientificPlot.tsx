import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Download,
  TrendingUp,
  Activity,
} from "lucide-react";
import { DataPoint, DatasetConfig, FitResult, FitType } from "../types";
import { calculateFit, formatSigFigs } from "../utils/mathFitting";

interface ScientificPlotProps {
  config: DatasetConfig;
  points: DataPoint[];
  selectedFit: FitType;
  onSelectFit: (fit: FitType) => void;
  onFitCalculated?: (fit: FitResult | null) => void;
}

const FIT_OPTIONS: { id: FitType; label: string; formula: string }[] = [
  { id: "linear", label: "Linear", formula: "y = mx + b" },
  { id: "linear_origin", label: "Through Origin", formula: "y = mx (b=0)" },
  { id: "quadratic", label: "Quadratic", formula: "y = ax² + bx + c" },
  { id: "power", label: "Power", formula: "y = a·xᵇ" },
  { id: "exponential", label: "Exponential", formula: "y = a·eᵇˣ" },
  { id: "inverse", label: "Inverse", formula: "y = k / x" },
];

export const ScientificPlot: React.FC<ScientificPlotProps> = ({
  config,
  points,
  selectedFit,
  onSelectFit,
  onFitCalculated,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 640, height: 420 });
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [showResiduals, setShowResiduals] = useState(false);
  const [showErrorBars, setShowErrorBars] = useState(true);

  // ResizeObserver for responsive SVG
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          const height = Math.max(340, Math.min(480, width * 0.62));
          setDimensions({ width, height });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute regression fit
  const fitResult = useMemo(() => {
    const res = calculateFit(
      points,
      selectedFit,
      config.xName || "x",
      config.yName || "y"
    );
    return res;
  }, [points, selectedFit, config.xName, config.yName]);

  // Inform parent of fit result
  useEffect(() => {
    if (onFitCalculated) {
      onFitCalculated(fitResult);
    }
  }, [fitResult, onFitCalculated]);

  const activePoints = useMemo(
    () =>
      points.filter(
        (p) => !isNaN(p.x) && !isNaN(p.y) && isFinite(p.x) && isFinite(p.y)
      ),
    [points]
  );

  // Determine Plot Bounds
  const plotBounds = useMemo(() => {
    if (activePoints.length === 0) {
      return { minX: 0, maxX: 10, minY: 0, maxY: 10 };
    }

    let minX = Math.min(...activePoints.map((p) => p.x));
    let maxX = Math.max(...activePoints.map((p) => p.x));
    let minY = Math.min(
      ...activePoints.map((p) => p.y - (showErrorBars ? p.yUncertainty || 0 : 0))
    );
    let maxY = Math.max(
      ...activePoints.map((p) => p.y + (showErrorBars ? p.yUncertainty || 0 : 0))
    );

    if (selectedFit === "linear_origin" || minX >= 0) {
      minX = Math.min(0, minX);
    }
    if (minY >= 0) {
      minY = Math.min(0, minY);
    }

    if (minX === maxX) {
      minX -= 1;
      maxX += 1;
    }
    if (minY === maxY) {
      minY -= 1;
      maxY += 1;
    }

    // Add 8% padding
    const xPadding = (maxX - minX) * 0.08 || 1;
    const yPadding = (maxY - minY) * 0.08 || 1;

    return {
      minX: minX < 0 ? minX - xPadding : 0,
      maxX: maxX + xPadding,
      minY: minY < 0 ? minY - yPadding : 0,
      maxY: maxY + yPadding,
    };
  }, [activePoints, selectedFit, showErrorBars]);

  // Layout Margins
  const margin = { top: 30, right: 35, bottom: 55, left: 65 };
  const innerWidth = Math.max(100, dimensions.width - margin.left - margin.right);
  const innerHeight = Math.max(100, dimensions.height - margin.top - margin.bottom);

  // Coordinate transforms
  const scaleX = (x: number) => {
    const { minX, maxX } = plotBounds;
    return margin.left + ((x - minX) / (maxX - minX)) * innerWidth;
  };

  const scaleY = (y: number) => {
    const { minY, maxY } = plotBounds;
    return margin.top + innerHeight - ((y - minY) / (maxY - minY)) * innerHeight;
  };

  // Generate nice tick marks
  const xTicks = useMemo(() => {
    const count = Math.max(4, Math.min(8, Math.floor(innerWidth / 75)));
    const { minX, maxX } = plotBounds;
    const step = (maxX - minX) / count;
    const ticks: number[] = [];
    for (let i = 0; i <= count; i++) {
      ticks.push(parseFloat((minX + i * step).toFixed(2)));
    }
    return ticks;
  }, [plotBounds, innerWidth]);

  const yTicks = useMemo(() => {
    const count = Math.max(4, Math.min(7, Math.floor(innerHeight / 45)));
    const { minY, maxY } = plotBounds;
    const step = (maxY - minY) / count;
    const ticks: number[] = [];
    for (let i = 0; i <= count; i++) {
      ticks.push(parseFloat((minY + i * step).toFixed(2)));
    }
    return ticks;
  }, [plotBounds, innerHeight]);

  // Generate Smooth Regression Curve Path
  const fitCurvePath = useMemo(() => {
    if (!fitResult || activePoints.length < 2) return "";
    const { minX, maxX } = plotBounds;
    const samples = 120;
    const step = (maxX - minX) / samples;
    let pathStr = "";

    for (let i = 0; i <= samples; i++) {
      const curX = minX + i * step;
      if (selectedFit === "power" && curX <= 0) continue;
      if (selectedFit === "inverse" && Math.abs(curX) < 1e-4) continue;

      const predY = fitResult.predict(curX);
      if (isNaN(predY) || !isFinite(predY)) continue;

      const svgX = scaleX(curX);
      const svgY = scaleY(predY);

      if (svgY < margin.top - 50 || svgY > margin.top + innerHeight + 50) continue;

      if (!pathStr) {
        pathStr = `M ${svgX.toFixed(1)} ${svgY.toFixed(1)}`;
      } else {
        pathStr += ` L ${svgX.toFixed(1)} ${svgY.toFixed(1)}`;
      }
    }
    return pathStr;
  }, [fitResult, activePoints, plotBounds, selectedFit, innerWidth, innerHeight]);

  // Export Chart as PNG
  const handleExportPNG = () => {
    if (!svgRef.current) return;
    const svgElement = svgRef.current;
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    const scaleFactor = 2;
    canvas.width = dimensions.width * scaleFactor;
    canvas.height = dimensions.height * scaleFactor;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scaleFactor, scaleFactor);
        ctx.drawImage(img, 0, 0);

        const a = document.createElement("a");
        a.download = `${config.title.replace(/\s+/g, "_")}_chart.png`;
        a.href = canvas.toDataURL("image/png");
        a.click();
      }
    };
    img.src =
      "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);
  };

  // Export Chart as SVG
  const handleExportSVG = () => {
    if (!svgRef.current) return;
    const svgString = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = `${config.title.replace(/\s+/g, "_")}_plot.svg`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="scientific-plot-card"
      className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 flex flex-col h-full"
    >
      {/* Top Controls & Regression Model Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            Interactive Scientific Plot & Regression Fit
          </h3>
          <p className="text-[11px] text-slate-500">
            {config.yName || "Y"} vs. {config.xName || "X"} with uncertainty bounds
          </p>
        </div>

        {/* Model selection pills */}
        <div className="flex items-center gap-1 flex-wrap">
          {FIT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectFit(opt.id)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                selectedFit === opt.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
              }`}
              title={opt.formula}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Regression Statistics Banner */}
      {fitResult && (
        <div className="mt-3 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="px-2 py-1 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold border border-indigo-400/30">
              {fitResult.equation}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 mr-1.5">R² =</span>
              <strong className="text-emerald-400 text-sm">
                {formatSigFigs(fitResult.r2, 5)}
              </strong>
            </div>

            {fitResult.slope !== undefined && (
              <div className="hidden sm:block">
                <span className="text-slate-400 mr-1.5">Slope (m) =</span>
                <strong className="text-cyan-300">
                  {formatSigFigs(fitResult.slope, 4)}
                </strong>
              </div>
            )}

            {fitResult.intercept !== undefined && (
              <div className="hidden md:block">
                <span className="text-slate-400 mr-1.5">Intercept (b) =</span>
                <strong className="text-amber-300">
                  {formatSigFigs(fitResult.intercept, 4)}
                </strong>
              </div>
            )}

            <div className="hidden lg:block">
              <span className="text-slate-400 mr-1.5">RSS =</span>
              <span className="text-slate-300">
                {formatSigFigs(fitResult.rss, 3)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SVG Canvas Area */}
      <div
        ref={containerRef}
        className="w-full mt-3 relative bg-slate-50/50 rounded-xl border border-slate-100 overflow-hidden flex-1 min-h-[340px]"
      >
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="w-full h-full select-none"
        >
          {/* Background Grid Lines */}
          <g className="grid-lines" opacity={0.5}>
            {/* Horizontal Grid */}
            {yTicks.map((yVal, i) => {
              const yPos = scaleY(yVal);
              return (
                <line
                  key={`gy-${i}`}
                  x1={margin.left}
                  y1={yPos}
                  x2={margin.left + innerWidth}
                  y2={yPos}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              );
            })}

            {/* Vertical Grid */}
            {xTicks.map((xVal, i) => {
              const xPos = scaleX(xVal);
              return (
                <line
                  key={`gx-${i}`}
                  x1={xPos}
                  y1={margin.top}
                  x2={xPos}
                  y2={margin.top + innerHeight}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              );
            })}
          </g>

          {/* Axes */}
          <g className="axes" stroke="#475569" strokeWidth="1.5">
            {/* X-Axis */}
            <line
              x1={margin.left}
              y1={margin.top + innerHeight}
              x2={margin.left + innerWidth}
              y2={margin.top + innerHeight}
            />
            {/* Y-Axis */}
            <line
              x1={margin.left}
              y1={margin.top}
              x2={margin.left}
              y2={margin.top + innerHeight}
            />
          </g>

          {/* Tick Labels */}
          <g className="tick-labels" fill="#64748b" fontSize="10" fontFamily="monospace">
            {/* Y-Ticks */}
            {yTicks.map((yVal, i) => {
              const yPos = scaleY(yVal);
              return (
                <text
                  key={`ty-${i}`}
                  x={margin.left - 8}
                  y={yPos + 3.5}
                  textAnchor="end"
                >
                  {yVal}
                </text>
              );
            })}

            {/* X-Ticks */}
            {xTicks.map((xVal, i) => {
              const xPos = scaleX(xVal);
              return (
                <text
                  key={`tx-${i}`}
                  x={xPos}
                  y={margin.top + innerHeight + 16}
                  textAnchor="middle"
                >
                  {xVal}
                </text>
              );
            })}
          </g>

          {/* Axis Titles */}
          {/* X Axis Title */}
          <text
            x={margin.left + innerWidth / 2}
            y={dimensions.height - 12}
            textAnchor="middle"
            fill="#1e293b"
            fontSize="12"
            fontWeight="bold"
          >
            {config.xName || "Independent Variable (X)"}{" "}
            {config.xUnit ? `(${config.xUnit})` : ""}
          </text>

          {/* Y Axis Title */}
          <text
            x={-(margin.top + innerHeight / 2)}
            y={18}
            transform="rotate(-90)"
            textAnchor="middle"
            fill="#1e293b"
            fontSize="12"
            fontWeight="bold"
          >
            {config.yName || "Dependent Variable (Y)"}{" "}
            {config.yUnit ? `(${config.yUnit})` : ""}
          </text>

          {/* Regression Curve */}
          {fitCurvePath && (
            <path
              d={fitCurvePath}
              fill="none"
              stroke="#4f46e5"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Error Bars and Data Points */}
          {activePoints.map((point) => {
            const cx = scaleX(point.x);
            const cy = scaleY(point.y);
            const isExcluded = point.excluded;
            const unc = point.yUncertainty || 0;
            const hasUnc = showErrorBars && unc > 0;

            const yTop = scaleY(point.y + unc);
            const yBottom = scaleY(point.y - unc);
            const isHovered = hoveredPoint?.id === point.id;

            return (
              <g
                key={point.id}
                onMouseEnter={() => setHoveredPoint(point)}
                onMouseLeave={() => setHoveredPoint(null)}
                className="cursor-pointer"
              >
                {/* Error Bar */}
                {hasUnc && !isExcluded && (
                  <g stroke="#6366f1" strokeWidth="1.2">
                    {/* Vertical stem */}
                    <line x1={cx} y1={yTop} x2={cx} y2={yBottom} />
                    {/* Top cap */}
                    <line x1={cx - 4} y1={yTop} x2={cx + 4} y2={yTop} />
                    {/* Bottom cap */}
                    <line x1={cx - 4} y1={yBottom} x2={cx + 4} y2={yBottom} />
                  </g>
                )}

                {/* Point Marker */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 7 : isExcluded ? 4.5 : 5.5}
                  fill={isExcluded ? "#cbd5e1" : "#1e1b4b"}
                  stroke={
                    isExcluded
                      ? "#94a3b8"
                      : isHovered
                      ? "#4f46e5"
                      : "#38bdf8"
                  }
                  strokeWidth={isHovered ? 2.5 : 2}
                  className="transition-all duration-150"
                />

                {/* Glow ring on hover */}
                {isHovered && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={12}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                    className="animate-pulse"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Point Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none bg-slate-900/95 text-white text-xs rounded-lg p-2.5 shadow-xl border border-slate-700 backdrop-blur-xs font-mono"
            style={{
              left: `${Math.min(
                dimensions.width - 150,
                Math.max(10, scaleX(hoveredPoint.x) - 75)
              )}px`,
              top: `${Math.max(10, scaleY(hoveredPoint.y) - 70)}px`,
            }}
          >
            <div className="font-bold text-cyan-300">
              {hoveredPoint.excluded ? "(Excluded Outlier)" : "Data Point"}
            </div>
            <div>
              {config.xName || "X"}: {hoveredPoint.x}{" "}
              {config.xUnit}
            </div>
            <div>
              {config.yName || "Y"}: {hoveredPoint.y}{" "}
              {config.yUnit}
              {hoveredPoint.yUncertainty
                ? ` ± ${hoveredPoint.yUncertainty}`
                : ""}
            </div>
            {fitResult && !hoveredPoint.excluded && (
              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-700 mt-1">
                Residual:{" "}
                <span className="text-amber-300">
                  {formatSigFigs(
                    hoveredPoint.y - fitResult.predict(hoveredPoint.x),
                    3
                  )}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Residuals Subplot Drawer */}
      {showResiduals && fitResult && (
        <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              Residuals Plot (Δy = Actual - Predicted)
            </span>
            <span className="text-[10px] text-slate-500">
              Random scatter around zero indicates good model fit
            </span>
          </div>

          <div className="h-28 w-full relative bg-white rounded-lg border border-slate-200 overflow-hidden">
            <svg width="100%" height="100%" className="overflow-visible">
              {/* Zero baseline */}
              <line
                x1="40"
                y1="56"
                x2="98%"
                y2="56"
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text x="10" y="60" fontSize="10" fill="#64748b" fontFamily="monospace">
                0.0
              </text>

              {/* Residual Points */}
              {fitResult.residuals.map((res) => {
                const cx = scaleX(res.x);
                const maxRes =
                  Math.max(
                    0.1,
                    ...fitResult.residuals.map((r) => Math.abs(r.residual))
                  ) * 1.3;
                const cy = 56 - (res.residual / maxRes) * 45;

                return (
                  <g key={res.id}>
                    <line
                      x1={cx}
                      y1="56"
                      x2={cx}
                      y2={cy}
                      stroke="#cbd5e1"
                      strokeWidth="1"
                    />
                    <circle
                      cx={cx}
                      cy={cy}
                      r="4"
                      fill={res.residual >= 0 ? "#10b981" : "#f43f5e"}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {/* Chart Footer Controls & Export */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900 select-none">
            <input
              type="checkbox"
              checked={showErrorBars}
              onChange={(e) => setShowErrorBars(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
            />
            <span>Error Bars (±δy)</span>
          </label>

          <button
            type="button"
            onClick={() => setShowResiduals(!showResiduals)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md border transition-colors ${
              showResiduals
                ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Residuals Analysis</span>
          </button>
        </div>

        {/* Download Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="export-chart-png-btn"
            onClick={handleExportPNG}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            title="Download high-resolution PNG image"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>PNG</span>
          </button>

          <button
            type="button"
            id="export-chart-svg-btn"
            onClick={handleExportSVG}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            title="Download vector SVG"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>SVG</span>
          </button>
        </div>
      </div>
    </div>
  );
};
