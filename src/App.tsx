import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { ExperimentHeader } from "./components/ExperimentHeader";
import { DataTable } from "./components/DataTable";
import { ScientificPlot } from "./components/ScientificPlot";
import { BulkImportModal } from "./components/BulkImportModal";
import { LabReportModal } from "./components/LabReportModal";
import { HelpModal } from "./components/HelpModal";
import { DataPoint, DatasetConfig, FitResult, FitType } from "./types";

const STORAGE_KEY_CONFIG = "scilab_dataset_config_v2";
const STORAGE_KEY_POINTS = "scilab_dataset_points_v2";

const DEFAULT_SAMPLE_CONFIG: DatasetConfig = {
  title: "Experimental Data: Time vs. Distance",
  xName: "Time",
  xUnit: "s",
  yName: "Distance",
  yUnit: "m",
  notes: "Kinematics cart trial run",
  defaultFit: "linear",
};

const DEFAULT_SAMPLE_POINTS: DataPoint[] = [
  { id: "p1", x: 1.0, y: 2.1, yUncertainty: 0.15 },
  { id: "p2", x: 2.0, y: 4.3, yUncertainty: 0.2 },
  { id: "p3", x: 3.0, y: 5.9, yUncertainty: 0.2 },
  { id: "p4", x: 4.0, y: 8.2, yUncertainty: 0.25 },
  { id: "p5", x: 5.0, y: 10.1, yUncertainty: 0.3 },
  { id: "p6", x: 6.0, y: 12.3, yUncertainty: 0.3 },
];

export default function App() {
  // Dataset configuration (agnostic labels, units, title)
  const [config, setConfig] = useState<DatasetConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_SAMPLE_CONFIG;
  });

  // Data points
  const [points, setPoints] = useState<DataPoint[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_POINTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_SAMPLE_POINTS;
  });

  const [hasTrials, setHasTrials] = useState<boolean>(false);
  const [selectedFit, setSelectedFit] = useState<FitType>("linear");
  const [currentFitResult, setCurrentFitResult] = useState<FitResult | null>(
    null
  );

  // Modals state
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error(e);
    }
  }, [config]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_POINTS, JSON.stringify(points));
    } catch (e) {
      console.error(e);
    }
  }, [points]);

  const handleUpdateConfig = (updated: Partial<DatasetConfig>) => {
    setConfig((prev) => ({ ...prev, ...updated }));
  };

  const handleUpdatePoints = (newPoints: DataPoint[]) => {
    setPoints(newPoints);
  };

  const handleClearData = () => {
    if (window.confirm("Clear all data points from the table?")) {
      setPoints([
        { id: "p1", x: 1, y: 0, yUncertainty: 0.05 },
        { id: "p2", x: 2, y: 0, yUncertainty: 0.05 },
        { id: "p3", x: 3, y: 0, yUncertainty: 0.05 },
      ]);
    }
  };

  const handleResetSample = () => {
    setConfig(DEFAULT_SAMPLE_CONFIG);
    setPoints(DEFAULT_SAMPLE_POINTS);
    setSelectedFit("linear");
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top App Navbar */}
      <Navbar
        onClearData={handleClearData}
        onResetSample={handleResetSample}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        pointCount={points.length}
      />

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* Experiment-Agnostic Variable & Axes Config */}
        <ExperimentHeader
          config={config}
          onUpdateConfig={handleUpdateConfig}
        />

        {/* Core Layout: Data Table + Scientific Plot */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left / Upper: Data Spreadsheet (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col">
            <DataTable
              config={config}
              points={points}
              onUpdatePoints={handleUpdatePoints}
              onOpenBulkImport={() => setIsBulkImportOpen(true)}
              hasTrials={hasTrials}
              onToggleTrials={setHasTrials}
            />
          </div>

          {/* Right / Upper: High-Precision Scientific Chart (7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col">
            <ScientificPlot
              config={config}
              points={points}
              selectedFit={selectedFit}
              onSelectFit={setSelectedFit}
              onFitCalculated={setCurrentFitResult}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">
              Scientific Data Plotter
            </span>
            <span>•</span>
            <span>Clean 2D Graphing, Curve Fitting & Statistical Analysis</span>
          </div>
          <div className="text-slate-500 text-[11px]">
            Experiment-agnostic data analysis for all science lab courses
          </div>
        </div>
      </footer>

      {/* Modals */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onImport={handleUpdatePoints}
        xName={config.xName}
        yName={config.yName}
      />

      <LabReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        config={config}
        points={points}
        fitResult={currentFitResult}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
