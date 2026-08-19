import React from "react";
import {
  X,
  TrendingUp,
  Table as TableIcon,
  HelpCircle,
  FileSpreadsheet,
  FileDown,
  Activity,
} from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        id="help-guide-modal"
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100">
              Scientific Data Plotter Guide
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs text-slate-700 leading-relaxed">
          {/* Step 1 */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl font-bold text-xs shrink-0 mt-0.5">
              1
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Define Variables & Title
              </h4>
              <p className="mt-1">
                Click <strong>&quot;Edit Variables & Title&quot;</strong> in the
                top header to specify your independent variable ($X$) and
                dependent variable ($Y$), units, and experimental notes.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs shrink-0 mt-0.5">
              2
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Enter or Import Experimental Data
              </h4>
              <p className="mt-1">
                Type directly into table cells, use <strong>Fill Range</strong> to
                generate arithmetic sequences, or click{" "}
                <strong>Paste / Import</strong> to copy and paste multi-column
                datasets directly from Google Sheets or Excel. Toggle{" "}
                <strong>Multi-Trial Replicates</strong> to automatically average
                trials and compute standard deviations.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xs shrink-0 mt-0.5">
              3
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Select Regression Curve Fit
              </h4>
              <p className="mt-1">
                Switch between <strong>Linear (y = mx + b)</strong>,{" "}
                <strong>Through Origin (y = mx)</strong>,{" "}
                <strong>Quadratic (y = ax² + bx + c)</strong>,{" "}
                <strong>Power (y = axᵇ)</strong>,{" "}
                <strong>Exponential (y = a·eᵇˣ)</strong>, or{" "}
                <strong>Inverse (y = k/x)</strong>.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl font-bold text-xs shrink-0 mt-0.5">
              4
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Uncertainty, Outliers & Residuals
              </h4>
              <p className="mt-1">
                Enable error bars (±δy) on data markers, exclude
                suspected outliers using the eye toggle icon in the table without
                deleting them, and inspect the <strong>Residuals Plot</strong> to
                verify if errors are randomly distributed.
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl font-bold text-xs shrink-0 mt-0.5">
              5
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Export Vector Graphics & Lab Report
              </h4>
              <p className="mt-1">
                Download publication-ready <strong>PNG</strong> or vector{" "}
                <strong>SVG</strong> graphics directly from the plot canvas, or
                open <strong>Export Report</strong> to print a formatted lab
                summary or copy Markdown.
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
