import React, { useState } from 'react';
import {
  AlertTriangle, CheckCircle, HelpCircle, ShieldAlert, Sparkles, Layers,
  ChevronRight, ArrowRight, Eye, Wrench
} from 'lucide-react';
import EvidenceChecklist from '../components/EvidenceChecklist';

export default function Faults() {
  const [activeTab, setActiveTab] = useState('soiling');

  const faultCategories = [
    {
      id: 'soiling',
      name: 'Soiling (Dust & Particulate)',
      severity: 'HIGH',
      confidence: 89,
      color: 'amber',
      typicalLoss: '12% - 25% yield',
      rateOfDecline: 'Gradual multi-day decline (2-3%/day)',
      pattern: 'Uniform attenuation across all daylight hours',
      action: 'Robotic or Manual Panel Washing',
      evidence: [
        { indicator: 'Multi-Day PR Decay', observed_value: '88% down to 74%', expected_baseline: '> 85% stable', matched: true, description: 'Monotonic drop over 5 days under clear skies' },
        { indicator: 'Broad Daylight Attenuation', observed_value: 'Uniform -16% yield', expected_baseline: 'Nominal curve', matched: true, description: 'Loss is uniform regardless of solar angle' },
        { indicator: 'Thermal Uniformity', observed_value: 'No hot-spots', expected_baseline: 'Uniform thermal profile', matched: true, description: 'Rules out localized cell diode or cell crack failures' }
      ]
    },
    {
      id: 'shading',
      name: 'Shading (Tree / Structure / HVAC)',
      severity: 'MEDIUM',
      confidence: 88,
      color: 'blue',
      typicalLoss: '15% - 40% (localized)',
      rateOfDecline: 'Daily recurring afternoon cyclic dip',
      pattern: 'Localized between 14:00 and 17:00 IST',
      action: 'Vegetation Trimming / Bypass Diode Check',
      evidence: [
        { indicator: 'Time-of-Day Cyclic Dip', observed_value: 'PR 64% at 15:00', expected_baseline: 'Midday PR 89%', matched: true, description: 'Sharp drop when sun angle lowers behind western obstruction' },
        { indicator: 'Morning & Midday Health', observed_value: '89.2% PR', expected_baseline: '> 85.0%', matched: true, description: 'Array generates optimal yield when unshaded' },
        { indicator: 'Geometric Repeatability', observed_value: '5 consecutive days', expected_baseline: 'Variable if clouds', matched: true, description: 'Identical daily dip confirms fixed structural/tree obstacle' }
      ]
    },
    {
      id: 'inverter',
      name: 'Inverter Fault (Bridge / Contactor / Trip)',
      severity: 'CRITICAL',
      confidence: 94,
      color: 'rose',
      typicalLoss: '25% - 100% capacity',
      rateOfDecline: 'Abrupt step drop within 15 minutes',
      pattern: 'Continuous daylight suppression across all sun angles',
      action: 'Inverter Technician Diagnostic & IGBT/Board Replacement',
      evidence: [
        { indicator: 'Performance Ratio Collapse', observed_value: 'PR dropped to 68%', expected_baseline: '88.5%', matched: true, description: 'Abrupt step collapse during peak 850 W/m² irradiance' },
        { indicator: 'DC to AC Conversion Ratio', observed_value: '71.4% efficiency', expected_baseline: '96.5% - 98.2%', matched: true, description: 'Internal conversion losses indicate IGBT bridge failure' },
        { indicator: 'Temperature Correlation', observed_value: 'Ambient normal', expected_baseline: 'Thermal trip', matched: false, description: 'No external heat wave caused the shutdown' }
      ]
    },
    {
      id: 'string',
      name: 'String Outage (Blown Fuse / MC4 Open)',
      severity: 'MEDIUM',
      confidence: 86,
      color: 'purple',
      typicalLoss: '15% - 25% quantized drop',
      rateOfDecline: 'Discrete fractional drop',
      pattern: 'Uniform loss across entire daylight window',
      action: 'Combiner Box Fuse / Connector Replacement',
      evidence: [
        { indicator: 'Quantized Fractional Loss', observed_value: '20.0% constant loss', expected_baseline: '0.0%', matched: true, description: 'Loss exactly matches 1 missing string in 5-string combiner' },
        { indicator: 'Combiner Fuse Telemetry', observed_value: 'String 4 current = 0.0A', expected_baseline: '8.4A string current', matched: true, description: 'Zero current while other parallel strings are producing normally' }
      ]
    }
  ];

  const currentFault = faultCategories.find(f => f.id === activeTab) || faultCategories[0];

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-bold text-slate-100">Fault Signatures & Diagnostic Lab</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Interpretable diagnostic behavioral signatures matching solar PV anomalies with physical causes.
          </p>
        </div>
        <span className="text-xs text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20 font-semibold">
          Transparent ML Inference
        </span>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {faultCategories.map((f) => {
          const isActive = activeTab === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setActiveTab(f.id)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500/15 border-amber-500/50 shadow-xl shadow-amber-500/10'
                  : 'bg-[#0f172a] border-slate-800 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-100">{f.name.split(' ')[0]}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  f.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  f.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}>
                  {f.severity}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">{f.pattern}</p>
            </button>
          );
        })}
      </div>

      {/* Detailed Diagnostic Lab Card */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-100">{currentFault.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Behavioral Diagnostic Signature Profile</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Typical Energy Impact: <strong className="text-rose-400">{currentFault.typicalLoss}</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Signature Profile */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5 font-semibold">Rate of Yield Decline</span>
                <span className="text-slate-200 font-medium">{currentFault.rateOfDecline}</span>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-500 block mb-0.5 font-semibold">Time-of-Day Curve Characteristic</span>
                <span className="text-slate-200 font-medium">{currentFault.pattern}</span>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-500 block mb-0.5 font-semibold">Standard Remediation Action</span>
                <span className="text-amber-400 font-bold">{currentFault.action}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 leading-relaxed">
              <strong className="text-slate-200 block mb-1">Scientific Transparency Notice:</strong>
              The system computes physical baseline deviations using temperature-corrected PV models and flags matching temporal signatures. Inferred fault classes are candidate hypotheses to guide field inspections.
            </div>
          </div>

          {/* Right: Evidence Checklist */}
          <div className="lg:col-span-6">
            <EvidenceChecklist
              evidenceList={currentFault.evidence}
              faultName={currentFault.name}
              confidence={currentFault.confidence}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
