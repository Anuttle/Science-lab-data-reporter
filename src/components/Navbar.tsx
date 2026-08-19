import React from "react";
import {
  TrendingUp,
  FileDown,
  RotateCcw,
  PlusCircle,
  HelpCircle,
  Trash2,
} from "lucide-react";

interface NavbarProps {
  onClearData: () => void;
  onResetSample: () => void;
  onOpenReport: () => void;
  onOpenHelp: () => void;
  pointCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onClearData,
  onResetSample,
  onOpenReport,
  onOpenHelp,
  pointCount,
}) => {
  return (
    <header
      id="app-navbar"
      className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md backdrop-blur-md bg-opacity-95"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Branding */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-500 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-100 truncate">
                Scientific Data Plotter
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Data & Regression
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate hidden md:block">
              Universal STEM Laboratory Curve Fitting & Statistical Analysis
            </p>
          </div>
        </div>

        {/* Center: Dataset Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="reset-sample-btn"
            onClick={onResetSample}
            title="Load Sample Dataset"
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Sample Data</span>
          </button>

          <button
            type="button"
            id="clear-data-btn"
            onClick={onClearData}
            title="Clear Table Data"
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-900/50 transition-colors shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Clear Table</span>
          </button>
        </div>

        {/* Right: Lab Report & Help */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            id="open-report-btn"
            onClick={onOpenReport}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all active:scale-[0.98]"
          >
            <FileDown className="w-4 h-4" />
            <span>Export Report</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-800 text-emerald-100 font-bold">
              {pointCount} pts
            </span>
          </button>

          <button
            type="button"
            id="help-guide-btn"
            onClick={onOpenHelp}
            title="Help & User Guide"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
