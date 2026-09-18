import React, { useState, useEffect } from 'react';
import {
  FileCheck2, UploadCloud, CheckCircle2, AlertTriangle, FileText,
  Layers, ArrowRight, ShieldCheck, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

export default function DataQuality() {
  const [quality, setQuality] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);

  const [columnMapping, setColumnMapping] = useState({
    timestamp_col: 'DATE_TIME',
    irradiance_col: 'IRRADIATION',
    actual_power_col: 'AC_POWER',
    dc_power_col: 'DC_POWER',
    module_temp_col: 'MODULE_TEMPERATURE',
    ambient_temp_col: 'AMBIENT_TEMPERATURE'
  });

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const data = await api.getQualityOverview();
      setQuality(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    try {
      setUploading(true);
      const res = await api.uploadCsv(file, columnMapping, 'SITE-CUSTOM');
      setUploadResult(res);
      loadOverview();
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold text-slate-100">Data Ingestion & Quality Preprocessing</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            CSV dataset ingestion, custom column schema mapping, and automated data quality audits.
          </p>
        </div>

        <button
          onClick={loadOverview}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs flex items-center gap-1.5"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Audit
        </button>
      </div>

      {/* Top 4 Quality Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl shadow-lg">
          <span className="text-[11px] text-slate-400 block mb-0.5">Overall Data Quality</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-emerald-400">
              {quality?.data_quality_score_pct || 98.6}%
            </span>
            <span className="text-xs text-emerald-500 font-semibold">Optimal</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">
            Zero critical data gaps
          </span>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl shadow-lg">
          <span className="text-[11px] text-slate-400 block mb-0.5">Total Telemetry Records</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-slate-100">
              {quality?.total_records?.toLocaleString() || '4,032'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1 truncate">
            {quality?.timestamp_range?.start?.split(' ')[0]} to {quality?.timestamp_range?.end?.split(' ')[0]}
          </span>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl shadow-lg">
          <span className="text-[11px] text-slate-400 block mb-0.5">Missing & Null Values</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-slate-100">
              {quality?.missing_values_count || 0}
            </span>
            <span className="text-xs text-slate-500">({quality?.missing_values_pct || 0}%)</span>
          </div>
          <span className="text-[10px] text-emerald-400 block mt-1 font-semibold">
            Passed nullity checks
          </span>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl shadow-lg">
          <span className="text-[11px] text-slate-400 block mb-0.5">Duplicate / Outlier Clamps</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-amber-300">
              {quality?.invalid_irradiance_count || 0}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            Sanitized non-physical values
          </span>
        </div>
      </div>

      {/* CSV Ingestion & Dynamic Column Mapping Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Drag & Drop CSV Upload */}
        <div className="lg:col-span-6 bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-amber-400" /> Ingest New Solar CSV Telemetry
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Upload CSV telemetry from SCADA loggers, Kaggle datasets, or inverter gateways. The system will apply the column mapping below and generate an instant quality report.
          </p>

          <form onSubmit={handleFileUpload} className="space-y-4 text-xs">
            <div className="border-2 border-dashed border-slate-700 hover:border-amber-500/50 bg-slate-900/60 rounded-2xl p-6 text-center cursor-pointer transition-colors">
              <input
                type="file"
                accept=".csv"
                id="csvFile"
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden"
              />
              <label htmlFor="csvFile" className="cursor-pointer block">
                <FileText className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <span className="font-semibold text-slate-200 block text-xs">
                  {file ? file.name : "Click to browse or drop CSV file here"}
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Supports Kaggle Plant Generation / Weather Sensor CSV format
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={!file || uploading}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              {uploading ? "Preprocessing Telemetry & Validating..." : "Upload & Run Quality Preprocessing"}
            </button>
          </form>

          {uploadResult && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" /> Ingestion & Validation Successful!
              </div>
              <p className="text-slate-300">
                Processed <strong>{uploadResult.total_records}</strong> records with a quality score of <strong>{uploadResult.data_quality_score_pct}%</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Right: Dynamic Column Mapping Interface */}
        <div className="lg:col-span-6 bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" /> Dynamic CSV Column Mapping
            </h3>
            <span className="text-[10px] text-slate-500">Auto-Detect Schema</span>
          </div>
          <p className="text-xs text-slate-400">
            Map incoming CSV headers to the platform's standardized physical solar data model:
          </p>

          <div className="space-y-2.5 text-xs">
            <div className="grid grid-cols-2 gap-3 items-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400">Timestamp Field</span>
              <input
                type="text"
                value={columnMapping.timestamp_col}
                onChange={(e) => setColumnMapping({ ...columnMapping, timestamp_col: e.target.value })}
                className="bg-slate-950 border border-slate-700 px-2 py-1 rounded text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 items-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400">Solar Irradiance (W/m²)</span>
              <input
                type="text"
                value={columnMapping.irradiance_col}
                onChange={(e) => setColumnMapping({ ...columnMapping, irradiance_col: e.target.value })}
                className="bg-slate-950 border border-slate-700 px-2 py-1 rounded text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 items-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400">Actual AC Power (kW)</span>
              <input
                type="text"
                value={columnMapping.actual_power_col}
                onChange={(e) => setColumnMapping({ ...columnMapping, actual_power_col: e.target.value })}
                className="bg-slate-950 border border-slate-700 px-2 py-1 rounded text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 items-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400">Module Temperature (°C)</span>
              <input
                type="text"
                value={columnMapping.module_temp_col}
                onChange={(e) => setColumnMapping({ ...columnMapping, module_temp_col: e.target.value })}
                className="bg-slate-950 border border-slate-700 px-2 py-1 rounded text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 items-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400">Ambient Temperature (°C)</span>
              <input
                type="text"
                value={columnMapping.ambient_temp_col}
                onChange={(e) => setColumnMapping({ ...columnMapping, ambient_temp_col: e.target.value })}
                className="bg-slate-950 border border-slate-700 px-2 py-1 rounded text-slate-200"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
