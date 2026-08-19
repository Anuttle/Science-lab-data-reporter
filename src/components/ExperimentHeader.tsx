import React, { useState } from "react";
import { Edit3, Check, FileSpreadsheet, StickyNote } from "lucide-react";
import { DatasetConfig } from "../types";

interface ExperimentHeaderProps {
  config: DatasetConfig;
  onUpdateConfig: (updated: Partial<DatasetConfig>) => void;
}

export const ExperimentHeader: React.FC<ExperimentHeaderProps> = ({
  config,
  onUpdateConfig,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  // Local editing fields
  const [title, setTitle] = useState(config.title);
  const [xName, setXName] = useState(config.xName);
  const [xUnit, setXUnit] = useState(config.xUnit);
  const [yName, setYName] = useState(config.yName);
  const [yUnit, setYUnit] = useState(config.yUnit);
  const [notes, setNotes] = useState(config.notes || "");

  const handleSave = () => {
    onUpdateConfig({
      title: title.trim() || "Untitled Experiment",
      xName: xName.trim() || "X",
      xUnit: xUnit.trim(),
      yName: yName.trim() || "Y",
      yUnit: yUnit.trim(),
      notes: notes.trim(),
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitle(config.title);
    setXName(config.xName);
    setXUnit(config.xUnit);
    setYName(config.yName);
    setYUnit(config.yUnit);
    setNotes(config.notes || "");
    setIsEditing(false);
  };

  return (
    <section
      id="experiment-header-card"
      className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 transition-all mb-6"
    >
      {isEditing ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-indigo-600" />
              Dataset & Variable Configuration
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Save Changes
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Dataset / Investigation Title
            </label>
            <input
              id="edit-lab-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm font-semibold text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g. Kinematics Free Fall: Time vs Distance"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Independent Variable (X)
              </label>
              <input
                type="text"
                value={xName}
                onChange={(e) => setXName(e.target.value)}
                className="w-full text-xs font-medium border border-slate-300 rounded-md px-2.5 py-1.5 bg-white"
                placeholder="e.g. Time"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                X-Unit
              </label>
              <input
                type="text"
                value={xUnit}
                onChange={(e) => setXUnit(e.target.value)}
                className="w-full text-xs font-medium border border-slate-300 rounded-md px-2.5 py-1.5 bg-white"
                placeholder="e.g. s, cm, mL"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Dependent Variable (Y)
              </label>
              <input
                type="text"
                value={yName}
                onChange={(e) => setYName(e.target.value)}
                className="w-full text-xs font-medium border border-slate-300 rounded-md px-2.5 py-1.5 bg-white"
                placeholder="e.g. Distance"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Y-Unit
              </label>
              <input
                type="text"
                value={yUnit}
                onChange={(e) => setYUnit(e.target.value)}
                className="w-full text-xs font-medium border border-slate-300 rounded-md px-2.5 py-1.5 bg-white"
                placeholder="e.g. m, N, V"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Lab Notes / Experimental Details (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs text-slate-800 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 leading-relaxed"
              placeholder="Add hypothesis, apparatus notes, or experimental details..."
            />
          </div>
        </div>
      ) : (
        <div>
          {/* Main Title Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                Laboratory Dataset
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                {config.title}
              </h2>
            </div>
            <button
              type="button"
              id="edit-experiment-details-btn"
              onClick={() => {
                setTitle(config.title);
                setXName(config.xName);
                setXUnit(config.xUnit);
                setYName(config.yName);
                setYUnit(config.yUnit);
                setNotes(config.notes || "");
                setIsEditing(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 px-3 py-1.5 rounded-lg transition-colors self-start sm:self-auto"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Variables & Title
            </button>
          </div>

          {/* Quick Info Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3">
            <div className="flex items-center gap-2.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                X
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Independent Variable
                </div>
                <div className="text-xs font-bold text-slate-800 truncate">
                  {config.xName}{" "}
                  <span className="text-slate-500 font-normal">
                    ({config.xUnit || "no unit"})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                Y
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Dependent Variable
                </div>
                <div className="text-xs font-bold text-slate-800 truncate">
                  {config.yName}{" "}
                  <span className="text-slate-500 font-normal">
                    ({config.yUnit || "no unit"})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 sm:col-span-2 md:col-span-1">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                <StickyNote className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Lab Notes
                </div>
                <div className="text-xs text-slate-700 truncate">
                  {config.notes || "None entered"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
