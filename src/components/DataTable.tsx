import React, { useState } from "react";
import {
  Plus,
  Trash2,
  EyeOff,
  Eye,
  ClipboardPaste,
  SlidersHorizontal,
  Table as TableIcon,
  ArrowUpDown,
  Hash,
} from "lucide-react";
import { DataPoint, DatasetConfig } from "../types";
import { computeStats } from "../utils/mathFitting";

interface DataTableProps {
  config: DatasetConfig;
  points: DataPoint[];
  onUpdatePoints: (newPoints: DataPoint[]) => void;
  onOpenBulkImport: () => void;
  hasTrials: boolean;
  onToggleTrials: (enabled: boolean) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  config,
  points,
  onUpdatePoints,
  onOpenBulkImport,
  hasTrials,
  onToggleTrials,
}) => {
  const [quickFillStart, setQuickFillStart] = useState("1");
  const [quickFillStep, setQuickFillStep] = useState("1");
  const [quickFillCount, setQuickFillCount] = useState("5");
  const [isQuickFillOpen, setIsQuickFillOpen] = useState(false);

  // Handle single cell update
  const handleCellChange = (
    id: string,
    field: "x" | "y" | "yUncertainty",
    valueStr: string
  ) => {
    const val = valueStr === "" ? NaN : parseFloat(valueStr);
    const updated = points.map((p) => {
      if (p.id === id) {
        return { ...p, [field]: isNaN(val) ? 0 : val };
      }
      return p;
    });
    onUpdatePoints(updated);
  };

  // Handle trial update
  const handleTrialChange = (
    id: string,
    trialIndex: number,
    valueStr: string
  ) => {
    const val = valueStr === "" ? NaN : parseFloat(valueStr);
    const updated = points.map((p) => {
      if (p.id === id) {
        const trials = [...(p.trials || [p.y, p.y, p.y])];
        trials[trialIndex] = isNaN(val) ? 0 : val;
        // Compute mean and stdDev
        const stats = computeStats(trials);
        return {
          ...p,
          trials,
          y: parseFloat(stats.mean.toFixed(4)),
          yUncertainty: parseFloat((stats.stdDev || 0.05).toFixed(4)),
        };
      }
      return p;
    });
    onUpdatePoints(updated);
  };

  // Add new blank row
  const handleAddRow = () => {
    const lastX = points.length > 0 ? points[points.length - 1].x : 0;
    const secondLastX =
      points.length > 1 ? points[points.length - 2].x : lastX - 1;
    const diff = lastX - secondLastX > 0 ? lastX - secondLastX : 1;
    const nextX = parseFloat((lastX + diff).toFixed(3));

    const newPoint: DataPoint = {
      id: "p_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      x: nextX,
      y: 0,
      yUncertainty: 0.05,
      trials: hasTrials ? [0, 0, 0] : undefined,
    };
    onUpdatePoints([...points, newPoint]);
  };

  // Delete row
  const handleDeleteRow = (id: string) => {
    onUpdatePoints(points.filter((p) => p.id !== id));
  };

  // Toggle point exclusion
  const handleToggleExclude = (id: string) => {
    onUpdatePoints(
      points.map((p) => (p.id === id ? { ...p, excluded: !p.excluded } : p))
    );
  };

  // Sort by X
  const handleSortByX = () => {
    const sorted = [...points].sort((a, b) => a.x - b.x);
    onUpdatePoints(sorted);
  };

  // Quick fill sequence generator
  const handleGenerateSequence = () => {
    const start = parseFloat(quickFillStart) || 0;
    const step = parseFloat(quickFillStep) || 1;
    const count = Math.min(30, Math.max(2, parseInt(quickFillCount) || 5));

    const newPts: DataPoint[] = [];
    for (let i = 0; i < count; i++) {
      const xVal = parseFloat((start + i * step).toFixed(4));
      newPts.push({
        id: "p_seq_" + Date.now() + "_" + i,
        x: xVal,
        y: 0,
        yUncertainty: 0.05,
        trials: hasTrials ? [0, 0, 0] : undefined,
      });
    }
    onUpdatePoints(newPts);
    setIsQuickFillOpen(false);
  };

  const activePoints = points.filter((p) => !p.excluded);
  const xStats = computeStats(activePoints.map((p) => p.x));
  const yStats = computeStats(activePoints.map((p) => p.y));

  return (
    <div
      id="data-table-container"
      className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-full"
    >
      {/* Header controls bar */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
            <TableIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Raw Data Spreadsheet
            </h3>
            <p className="text-[11px] text-slate-500">
              {activePoints.length} active data pairs ({points.length - activePoints.length} excluded)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Multi-trial toggle */}
          <button
            type="button"
            onClick={() => onToggleTrials(!hasTrials)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1 ${
              hasTrials
                ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            title="Enable 3 Replicate Trials per X point"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Multi-Trial Replicates</span>
            <span className="sm:hidden">Trials</span>
          </button>

          {/* Paste CSV/Sheets */}
          <button
            type="button"
            id="paste-data-btn"
            onClick={onOpenBulkImport}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center gap-1 shadow-2xs"
            title="Import or paste from Excel / Google Sheets"
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-blue-600" />
            <span>Paste / Import</span>
          </button>

          {/* Sort */}
          <button
            type="button"
            onClick={handleSortByX}
            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-md transition-colors"
            title="Sort ascending by X"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Fill Drawer */}
      {isQuickFillOpen && (
        <div className="bg-indigo-50/70 p-3 border-b border-indigo-100 flex flex-wrap items-center gap-3 text-xs">
          <span className="font-bold text-indigo-900">Generate X Sequence:</span>
          <div className="flex items-center gap-1">
            <span className="text-slate-600">Start:</span>
            <input
              type="number"
              value={quickFillStart}
              onChange={(e) => setQuickFillStart(e.target.value)}
              className="w-16 px-2 py-1 bg-white border border-indigo-200 rounded text-xs"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-600">Step:</span>
            <input
              type="number"
              value={quickFillStep}
              onChange={(e) => setQuickFillStep(e.target.value)}
              className="w-16 px-2 py-1 bg-white border border-indigo-200 rounded text-xs"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-600">Count:</span>
            <input
              type="number"
              value={quickFillCount}
              onChange={(e) => setQuickFillCount(e.target.value)}
              className="w-16 px-2 py-1 bg-white border border-indigo-200 rounded text-xs"
            />
          </div>
          <button
            type="button"
            onClick={handleGenerateSequence}
            className="px-2.5 py-1 bg-indigo-600 text-white font-semibold rounded text-xs hover:bg-indigo-500 shadow-xs"
          >
            Fill Table
          </button>
          <button
            type="button"
            onClick={() => setIsQuickFillOpen(false)}
            className="text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Table grid */}
      <div className="overflow-x-auto overflow-y-auto max-h-[460px] flex-1">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-100/90 text-slate-700 sticky top-0 z-10 font-bold border-b border-slate-200 backdrop-blur-xs">
            <tr>
              <th className="py-2.5 px-3 w-10 text-center text-slate-400">#</th>
              <th className="py-2.5 px-3 min-w-[110px]">
                <div className="flex flex-col">
                  <span className="text-slate-900 font-bold">
                    {config.xName || "X"}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    [{config.xUnit || "unit"}]
                  </span>
                </div>
              </th>

              {hasTrials ? (
                <>
                  <th className="py-2.5 px-2 min-w-[70px] text-slate-600">Trial 1</th>
                  <th className="py-2.5 px-2 min-w-[70px] text-slate-600">Trial 2</th>
                  <th className="py-2.5 px-2 min-w-[70px] text-slate-600">Trial 3</th>
                  <th className="py-2.5 px-3 min-w-[100px]">
                    <div className="flex flex-col">
                      <span className="text-indigo-950 font-bold">
                        Mean {config.yName || "Y"}
                      </span>
                      <span className="text-[10px] text-indigo-600 font-medium">
                        [{config.yUnit || "unit"}]
                      </span>
                    </div>
                  </th>
                </>
              ) : (
                <th className="py-2.5 px-3 min-w-[110px]">
                  <div className="flex flex-col">
                    <span className="text-slate-900 font-bold">
                      {config.yName || "Y"}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      [{config.yUnit || "unit"}]
                    </span>
                  </div>
                </th>
              )}

              <th className="py-2.5 px-3 min-w-[90px] text-slate-600">
                <div className="flex flex-col">
                  <span>Uncertainty (±δy)</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Error bar
                  </span>
                </div>
              </th>

              <th className="py-2.5 px-3 w-16 text-center text-slate-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {points.map((point, index) => {
              const isExcluded = point.excluded;
              return (
                <tr
                  key={point.id}
                  className={`transition-colors ${
                    isExcluded
                      ? "bg-slate-100/60 text-slate-400 line-through"
                      : index % 2 === 0
                      ? "bg-white hover:bg-slate-50/80"
                      : "bg-slate-50/40 hover:bg-slate-50"
                  }`}
                >
                  <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                    {index + 1}
                  </td>

                  {/* X Value Input */}
                  <td className="py-1.5 px-2.5">
                    <input
                      type="number"
                      step="any"
                      value={isNaN(point.x) ? "" : point.x}
                      onChange={(e) =>
                        handleCellChange(point.id, "x", e.target.value)
                      }
                      className={`w-full font-mono text-xs px-2 py-1 rounded border ${
                        isExcluded
                          ? "bg-slate-100 border-slate-200 text-slate-400 line-through"
                          : "bg-white border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      }`}
                    />
                  </td>

                  {hasTrials ? (
                    <>
                      {/* Trial 1 */}
                      <td className="py-1.5 px-1.5">
                        <input
                          type="number"
                          step="any"
                          value={
                            point.trials && !isNaN(point.trials[0])
                              ? point.trials[0]
                              : ""
                          }
                          onChange={(e) =>
                            handleTrialChange(point.id, 0, e.target.value)
                          }
                          className="w-full font-mono text-xs px-1.5 py-1 rounded border border-slate-200 bg-white"
                        />
                      </td>
                      {/* Trial 2 */}
                      <td className="py-1.5 px-1.5">
                        <input
                          type="number"
                          step="any"
                          value={
                            point.trials && !isNaN(point.trials[1])
                              ? point.trials[1]
                              : ""
                          }
                          onChange={(e) =>
                            handleTrialChange(point.id, 1, e.target.value)
                          }
                          className="w-full font-mono text-xs px-1.5 py-1 rounded border border-slate-200 bg-white"
                        />
                      </td>
                      {/* Trial 3 */}
                      <td className="py-1.5 px-1.5">
                        <input
                          type="number"
                          step="any"
                          value={
                            point.trials && !isNaN(point.trials[2])
                              ? point.trials[2]
                              : ""
                          }
                          onChange={(e) =>
                            handleTrialChange(point.id, 2, e.target.value)
                          }
                          className="w-full font-mono text-xs px-1.5 py-1 rounded border border-slate-200 bg-white"
                        />
                      </td>
                      {/* Computed Mean Y */}
                      <td className="py-1.5 px-2.5 font-mono font-bold text-indigo-900 bg-indigo-50/40">
                        {point.y}
                      </td>
                    </>
                  ) : (
                    /* Single Y Input */
                    <td className="py-1.5 px-2.5">
                      <input
                        type="number"
                        step="any"
                        value={isNaN(point.y) ? "" : point.y}
                        onChange={(e) =>
                          handleCellChange(point.id, "y", e.target.value)
                        }
                        className={`w-full font-mono text-xs px-2 py-1 rounded border ${
                          isExcluded
                            ? "bg-slate-100 border-slate-200 text-slate-400 line-through"
                            : "bg-white border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        }`}
                      />
                    </td>
                  )}

                  {/* Uncertainty (Error bar) */}
                  <td className="py-1.5 px-2.5">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={
                        point.yUncertainty === undefined ||
                        isNaN(point.yUncertainty)
                          ? ""
                          : point.yUncertainty
                      }
                      onChange={(e) =>
                        handleCellChange(
                          point.id,
                          "yUncertainty",
                          e.target.value
                        )
                      }
                      placeholder="0.05"
                      className="w-full font-mono text-xs px-2 py-1 rounded border border-slate-200 bg-white text-slate-600 focus:border-indigo-500"
                    />
                  </td>

                  {/* Actions: Exclude & Delete */}
                  <td className="py-1.5 px-2 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleExclude(point.id)}
                        className={`p-1 rounded hover:bg-slate-200 transition-colors ${
                          isExcluded
                            ? "text-amber-600"
                            : "text-slate-400 hover:text-slate-700"
                        }`}
                        title={
                          isExcluded
                            ? "Include point in fit"
                            : "Exclude point from fit (Outlier)"
                        }
                      >
                        {isExcluded ? (
                          <Eye className="w-3.5 h-3.5" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(point.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom Action Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="add-data-row-btn"
            onClick={handleAddRow}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Data Row</span>
          </button>

          <button
            type="button"
            onClick={() => setIsQuickFillOpen(!isQuickFillOpen)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium rounded-lg transition-colors flex items-center gap-1"
          >
            <Hash className="w-3.5 h-3.5 text-indigo-500" />
            <span>Fill Range</span>
          </button>
        </div>

        {/* Mini stats */}
        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
          <span>
            X̄: <strong className="text-slate-800">{xStats.mean.toFixed(2)}</strong>
          </span>
          <span>
            Ȳ: <strong className="text-slate-800">{yStats.mean.toFixed(2)}</strong>
          </span>
          <span>
            N: <strong className="text-slate-800">{activePoints.length}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
