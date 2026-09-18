import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Zap, AlertTriangle, CheckCircle2, ChevronRight, Activity } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function GeoPortfolioMap({ sites = [], selectedSiteId, onSelectSite }) {
  const [hoveredSite, setHoveredSite] = useState(null);

  // Projected SVG coordinates based on Latitude/Longitude of India
  // Lat: 8 to 35, Lon: 68 to 90
  const projectToMap = (lat, lon) => {
    const minLat = 8.0, maxLat = 32.0;
    const minLon = 68.0, maxLon = 88.0;
    
    const x = ((lon - minLon) / (maxLon - minLon)) * 520 + 40;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 520 + 40;
    return { x, y };
  };

  return (
    <div className="relative bg-[#0f172a] rounded-2xl border border-slate-800 p-4 overflow-hidden shadow-2xl">
      {/* Map Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-amber-400" />
          <h3 className="font-semibold text-sm text-slate-100">Geospatial Solar Portfolio Map</h3>
          <span className="text-xs text-slate-500">({sites.length} Active Sites)</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Healthy</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Warning (Soiling/Shading)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping"></span> Critical (Inverter/Outage)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* SVG Interactive Geo Canvas */}
        <div className="lg:col-span-8 relative bg-[#090d16] rounded-xl border border-slate-800/80 p-4 min-h-[380px] flex items-center justify-center overflow-hidden">
          <svg viewBox="0 0 600 600" className="w-full h-[380px] max-h-[420px]">
            <defs>
              {/* Background Map Grid */}
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
              </pattern>
              <linearGradient id="indiaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#131e33" />
                <stop offset="100%" stopColor="#0c1424" />
              </linearGradient>
            </defs>

            <rect width="600" height="600" fill="url(#grid)" />

            {/* Stylized Geo Outline of India Region */}
            <path
              d="M 280,50 L 330,80 L 370,120 L 420,160 L 460,200 L 440,240 L 400,270 L 380,310 L 340,360 L 300,430 L 260,490 L 250,540 L 240,490 L 200,430 L 160,370 L 140,300 L 120,240 L 150,180 L 200,120 L 250,70 Z"
              fill="url(#indiaGrad)"
              stroke="#24344d"
              strokeWidth="1.5"
              strokeDasharray="4 2"
              className="transition-all duration-300"
            />

            {/* Site Pins */}
            {sites.map((site) => {
              const { x, y } = projectToMap(site.latitude, site.longitude);
              const isSelected = selectedSiteId === site.site_id;
              const isCritical = site.status === 'Critical';
              const isWarning = site.status === 'Warning';
              
              const pinColor = isCritical ? '#f43f5e' : (isWarning ? '#f59e0b' : '#10b981');

              return (
                <g 
                  key={site.site_id}
                  className="cursor-pointer transition-transform duration-200"
                  onClick={() => onSelectSite && onSelectSite(site.site_id)}
                  onMouseEnter={() => setHoveredSite(site)}
                  onMouseLeave={() => setHoveredSite(null)}
                >
                  {/* Ping Ring for Critical / Warning */}
                  {(isCritical || isWarning) && (
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 18 : 14}
                      fill={pinColor}
                      opacity="0.25"
                      className="animate-pulse"
                    />
                  )}

                  {/* Main Pin Circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 8 : 6}
                    fill={pinColor}
                    stroke="#ffffff"
                    strokeWidth={isSelected ? "2.5" : "1.5"}
                    filter="drop-shadow(0 0 6px rgba(0,0,0,0.8))"
                  />

                  {/* Site Label Tag */}
                  <text
                    x={x + 10}
                    y={y + 4}
                    fill="#e2e8f0"
                    fontSize="11"
                    fontWeight="600"
                    className="select-none pointer-events-none drop-shadow-md"
                  >
                    {site.name.split(' ')[0]} {site.name.split(' ')[1] || ''}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Floating Hover Card */}
          {hoveredSite && (
            <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 rounded-xl p-3 shadow-xl backdrop-blur-md w-64 pointer-events-none animate-in fade-in">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-slate-100">{hoveredSite.name}</span>
                <StatusBadge status={hoveredSite.status} size="xs" />
              </div>
              <p className="text-[11px] text-slate-400 mb-2">{hoveredSite.location}</p>
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/60 p-2 rounded-lg">
                <div>
                  <span className="text-slate-500 block">Capacity</span>
                  <span className="font-bold text-amber-400">{hoveredSite.capacity_kw} kW</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Performance</span>
                  <span className="font-bold text-emerald-400">{hoveredSite.daily_pr || 88.5}% PR</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Side Site List / Inspector */}
        <div className="lg:col-span-4 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {sites.map((s) => {
            const isSelected = selectedSiteId === s.site_id;
            return (
              <div
                key={s.site_id}
                onClick={() => onSelectSite && onSelectSite(s.site_id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/5'
                    : 'bg-slate-900/70 border-slate-800 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-100 block">{s.name}</span>
                    <span className="text-[10px] text-slate-400">{s.location} • {s.capacity_kw} kW</span>
                  </div>
                  <StatusBadge status={s.status} size="xs" />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400">
                    PR: <strong className="text-slate-200">{s.daily_pr || 88.5}%</strong>
                  </span>
                  {s.daily_loss_financial > 0 ? (
                    <span className="text-rose-400 font-semibold">
                      -₹{s.daily_loss_financial.toLocaleString()}/day
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-semibold">Nominal</span>
                  )}
                  <Link
                    to={`/sites/${s.site_id}`}
                    className="text-amber-400 hover:text-amber-300 flex items-center text-[10px] font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
