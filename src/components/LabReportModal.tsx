import React, { useState } from "react";
import {
  X,
  Printer,
  Copy,
  Check,
  FileText,
  FlaskConical,
} from "lucide-react";
import {
  DataPoint,
  DatasetConfig,
  FitResult,
} from "../types";
import { formatSigFigs } from "../utils/mathFitting";

interface LabReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DatasetConfig;
  points: DataPoint[];
  fitResult: FitResult | null;
}

export const LabReportModal: React.FC<LabReportModalProps> = ({
  isOpen,
  onClose,
  config,
  points,
  fitResult,
}) => {
  const [studentName, setStudentName] = useState("Student Scientist");
  const [labPartner, setLabPartner] = useState("");
  const [classSection, setClassSection] = useState("Science Laboratory Period 3");
  const [reportDate, setReportDate] = useState(
    new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  );
  const [customConclusion, setCustomConclusion] = useState(
    config.notes || ""
  );
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const activePoints = points.filter((p) => !p.excluded);

  // Generate Markdown text for clipboard copy
  const generateMarkdown = (): string => {
    let md = `# Lab Report: ${config.title}\n`;
    md += `**Author:** ${studentName}  \n`;
    if (labPartner) md += `**Lab Partner:** ${labPartner}  \n`;
    md += `**Course / Class:** ${classSection}  \n`;
    md += `**Date:** ${reportDate}  \n\n`;

    md += `## 1. Experimental Variables & Investigation Setup\n`;
    md += `**Independent Variable (X):** ${config.xName} (${config.xUnit || "no unit"})  \n`;
    md += `**Dependent Variable (Y):** ${config.yName} (${config.yUnit || "no unit"})  \n`;
    if (config.notes) {
      md += `**Notes:** ${config.notes}  \n\n`;
    }

    md += `## 2. Collected Experimental Data\n\n`;
    md += `| Trial # | ${config.xName} (${config.xUnit || ""}) | ${config.yName} (${config.yUnit || ""}) | Uncertainty (±δy) |\n`;
    md += `|:---:|:---:|:---:|:---:|\n`;
    activePoints.forEach((p, idx) => {
      md += `| ${idx + 1} | ${p.x} | ${p.y} | ±${p.yUncertainty || 0.05} |\n`;
    });
    md += `\n`;

    md += `## 3. Mathematical Regression & Trend Analysis\n`;
    if (fitResult) {
      md += `- **Best-Fit Model:** ${fitResult.type.toUpperCase()}\n`;
      md += `- **Fitted Equation:** \`${fitResult.equation}\`\n`;
      md += `- **Coefficient of Determination (R²):** ${formatSigFigs(fitResult.r2, 5)}\n`;
      if (fitResult.slope !== undefined)
        md += `- **Calculated Slope (m):** ${formatSigFigs(fitResult.slope, 4)}\n`;
      if (fitResult.intercept !== undefined)
        md += `- **Y-Intercept (b):** ${formatSigFigs(fitResult.intercept, 4)}\n`;
      md += `- **Residual Sum of Squares (RSS):** ${formatSigFigs(fitResult.rss, 4)}\n\n`;
    }

    if (customConclusion.trim()) {
      md += `## 4. Student Discussion & Findings\n\n${customConclusion}\n\n`;
    }

    return md;
  };

  const handleCopyMarkdown = () => {
    const md = generateMarkdown();
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div
        id="lab-report-modal-card"
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto"
      >
        {/* Top Action Bar (hidden in print) */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Official Lab Write-Up Report Preview
              </h3>
              <p className="text-xs text-slate-400">
                Print, save as PDF, or copy markdown for reports
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Canvas */}
        <div
          id="printable-lab-report"
          className="p-6 sm:p-10 overflow-y-auto flex-1 bg-white text-slate-900 font-sans space-y-6 print:p-0 print:overflow-visible"
        >
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-indigo-700">
                  Laboratory Investigation Report
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 mt-1">
                  {config.title}
                </h1>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 shrink-0 print:hidden">
                <FlaskConical className="w-6 h-6 text-indigo-700" />
              </div>
            </div>

            {/* Editable Meta Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">
                  Student Author
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="font-bold text-slate-900 bg-transparent w-full focus:outline-none focus:border-b focus:border-indigo-500"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">
                  Lab Partner(s)
                </label>
                <input
                  type="text"
                  value={labPartner}
                  onChange={(e) => setLabPartner(e.target.value)}
                  placeholder="e.g. Partner Name"
                  className="font-bold text-slate-900 bg-transparent w-full focus:outline-none focus:border-b focus:border-indigo-500"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">
                  Course / Period
                </label>
                <input
                  type="text"
                  value={classSection}
                  onChange={(e) => setClassSection(e.target.value)}
                  className="font-bold text-slate-900 bg-transparent w-full focus:outline-none focus:border-b focus:border-indigo-500"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">
                  Date of Report
                </label>
                <input
                  type="text"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="font-bold text-slate-900 bg-transparent w-full focus:outline-none focus:border-b focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 1: Variables & Setup */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
              1. Experimental Variables & Setup
            </h2>
            <div className="text-xs space-y-1.5 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
              <p>
                <strong>Independent Variable (X):</strong> {config.xName} (
                {config.xUnit || "no unit"})
              </p>
              <p>
                <strong>Dependent Variable (Y):</strong> {config.yName} (
                {config.yUnit || "no unit"})
              </p>
              {config.notes && (
                <p>
                  <strong>Lab Notes:</strong> {config.notes}
                </p>
              )}
            </div>
          </section>

          {/* Section 2: Data Table */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
              2. Collected Experimental Data
            </h2>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-2 px-3 w-12 text-center">Trial</th>
                    <th className="py-2 px-4">
                      {config.xName} [{config.xUnit || "unit"}]
                    </th>
                    <th className="py-2 px-4">
                      {config.yName} [{config.yUnit || "unit"}]
                    </th>
                    <th className="py-2 px-4">Uncertainty (±δy)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activePoints.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-1.5 px-3 text-center text-slate-400 font-normal">
                        {idx + 1}
                      </td>
                      <td className="py-1.5 px-4 font-semibold text-slate-900">
                        {p.x}
                      </td>
                      <td className="py-1.5 px-4 font-semibold text-indigo-900">
                        {p.y}
                      </td>
                      <td className="py-1.5 px-4 text-slate-500">
                        ±{p.yUncertainty || 0.05}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3: Regression Results */}
          {fitResult && (
            <section className="space-y-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
                3. Mathematical Regression Analysis
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    Best Fit Equation
                  </span>
                  <span className="font-mono font-bold text-indigo-900 text-xs mt-0.5 block">
                    {fitResult.equation}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    Coefficient of Determination (R²)
                  </span>
                  <span className="font-mono font-bold text-emerald-700 text-sm mt-0.5 block">
                    {formatSigFigs(fitResult.r2, 5)}
                  </span>
                </div>

                {fitResult.slope !== undefined && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">
                      Calculated Slope (m)
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-xs mt-0.5 block">
                      {formatSigFigs(fitResult.slope, 4)}
                    </span>
                  </div>
                )}

                {fitResult.intercept !== undefined && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">
                      Y-Intercept (b)
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-xs mt-0.5 block">
                      {formatSigFigs(fitResult.intercept, 4)}
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Section 4: Discussion & Notes */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
              4. Analysis & Discussion
            </h2>
            <textarea
              rows={4}
              value={customConclusion}
              onChange={(e) => setCustomConclusion(e.target.value)}
              placeholder="Write your analysis of the data trends, physical significance of the slope, sources of experimental uncertainty, and conclusion..."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 leading-relaxed bg-white print:border-none print:p-0"
            />
          </section>

          {/* Sign-off footer for grading */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-500">
            <div>
              <div className="border-b border-slate-400 h-8 mb-1" />
              <span>Student Signature</span>
            </div>
            <div>
              <div className="border-b border-slate-400 h-8 mb-1" />
              <span>Instructor Review & Grade</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
