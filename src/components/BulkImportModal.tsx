import React, { useState } from "react";
import { X, ClipboardPaste, Check, AlertCircle, FileText } from "lucide-react";
import { DataPoint } from "../types";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (points: DataPoint[]) => void;
  xName: string;
  yName: string;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  xName,
  yName,
}) => {
  const [rawText, setRawText] = useState("");
  const [hasHeader, setHasHeader] = useState(false);

  if (!isOpen) return null;

  // Parse raw text into DataPoints
  const parseRows = (): { points: DataPoint[]; error?: string } => {
    if (!rawText.trim()) return { points: [] };

    const lines = rawText
      .trim()
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return { points: [] };

    const startIdx = hasHeader ? 1 : 0;
    const points: DataPoint[] = [];

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i];
      // Split by tab, comma, semicolon, or multiple spaces
      let parts: string[] = [];
      if (line.includes("\t")) {
        parts = line.split("\t");
      } else if (line.includes(",")) {
        parts = line.split(",");
      } else if (line.includes(";")) {
        parts = line.split(";");
      } else {
        parts = line.split(/\s+/);
      }

      parts = parts.map((p) => p.trim()).filter((p) => p.length > 0);
      if (parts.length >= 2) {
        const xVal = parseFloat(parts[0]);
        const yVal = parseFloat(parts[1]);
        const uncVal = parts[2] ? parseFloat(parts[2]) : 0.05;

        if (!isNaN(xVal) && !isNaN(yVal)) {
          points.push({
            id: `p_import_${Date.now()}_${i}`,
            x: xVal,
            y: yVal,
            yUncertainty: isNaN(uncVal) ? 0.05 : uncVal,
          });
        }
      }
    }

    if (points.length === 0 && lines.length > 0) {
      return {
        points: [],
        error: "Could not detect numbers in two columns. Please ensure each row has X and Y values.",
      };
    }

    return { points };
  };

  const { points: parsedPoints, error } = parseRows();

  const handleApply = () => {
    if (parsedPoints.length > 0) {
      onImport(parsedPoints);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        id="bulk-import-modal"
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <ClipboardPaste className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Paste Data from Excel / Google Sheets
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Copy two columns (or three columns including uncertainty) from your
            spreadsheet and paste them below:
          </p>

          <textarea
            rows={7}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`0.5\t0.12\n1.0\t0.49\n1.5\t1.13\n2.0\t2.01\n2.5\t3.12`}
            className="w-full font-mono text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 select-none font-medium">
              <input
                type="checkbox"
                checked={hasHeader}
                onChange={(e) => setHasHeader(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>First row is column header (ignore first row)</span>
            </label>

            <span className="text-slate-500 font-mono">
              {parsedPoints.length} valid rows parsed
            </span>
          </div>

          {/* Error notice */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Preview Table */}
          {parsedPoints.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-3 py-1.5 font-bold text-[11px] text-slate-700 border-b border-slate-200">
                Parsed Data Preview
              </div>
              <div className="max-h-36 overflow-y-auto">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-1 px-3">#</th>
                      <th className="py-1 px-3">{xName || "X"}</th>
                      <th className="py-1 px-3">{yName || "Y"}</th>
                      <th className="py-1 px-3">Uncertainty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedPoints.slice(0, 8).map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-1 px-3 text-slate-400">{idx + 1}</td>
                        <td className="py-1 px-3 font-semibold text-slate-800">
                          {p.x}
                        </td>
                        <td className="py-1 px-3 font-semibold text-indigo-700">
                          {p.y}
                        </td>
                        <td className="py-1 px-3 text-slate-500">
                          ±{p.yUncertainty}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            id="apply-import-btn"
            onClick={handleApply}
            disabled={parsedPoints.length === 0}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply {parsedPoints.length} Points</span>
          </button>
        </div>
      </div>
    </div>
  );
};
