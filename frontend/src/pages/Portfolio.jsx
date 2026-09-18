import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe2, Zap, Search, Filter, Plus, ArrowUpDown, ChevronRight,
  TrendingDown, CheckCircle2, AlertTriangle, AlertOctagon, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import GeoPortfolioMap from '../components/GeoPortfolioMap';

export default function Portfolio() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedSiteId, setSelectedSiteId] = useState('SITE-001');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSite, setNewSite] = useState({
    site_id: `SITE-00${Math.floor(Math.random()*900)+100}`,
    name: '',
    location: '',
    latitude: 19.0760,
    longitude: 72.8777,
    capacity_kw: 150,
    tilt: 18,
    azimuth: 180,
    module_type: 'Standard Crystalline Silicon',
    inverter_capacity_kw: 150,
    tariff_per_kwh: 7.5,
    cleaning_cost: 1500,
    technician_cost: 3500,
    status: 'Healthy'
  });

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      setLoading(true);
      const data = await api.getSites();
      setSites(data || []);
      if (data?.length > 0 && !selectedSiteId) {
        setSelectedSiteId(data[0].site_id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSite = async (e) => {
    e.preventDefault();
    try {
      await api.createSite(newSite);
      setShowAddModal(false);
      loadSites();
    } catch (err) {
      alert('Failed to add site: ' + err.message);
    }
  };

  const filteredSites = sites.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.site_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-bold text-slate-100">Solar Portfolio Sites</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Geographic asset distribution, live capacity, performance ratios, and economic loss tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Solar Site
          </button>
          <button
            onClick={loadSites}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Geo Portfolio Map */}
      <GeoPortfolioMap
        sites={sites}
        selectedSiteId={selectedSiteId}
        onSelectSite={(id) => setSelectedSiteId(id)}
      />

      {/* Search and Filters Bar */}
      <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search site name, ID, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Filter Status:</span>
          {['ALL', 'HEALTHY', 'WARNING', 'CRITICAL'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Sites Grid / Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Site Name & ID</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Capacity</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Performance Ratio</th>
                <th className="py-3.5 px-4">Current Fault</th>
                <th className="py-3.5 px-4">Daily Loss (₹/d)</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSites.map((site) => (
                <tr
                  key={site.site_id}
                  className="hover:bg-slate-850/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedSiteId(site.site_id)}
                >
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-200">{site.name}</div>
                    <span className="text-[11px] text-slate-500 font-mono">{site.site_id}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">{site.location}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-amber-300">{site.capacity_kw} kW</span>
                    <span className="text-[10px] text-slate-500 block">Tilt {site.tilt}° • Az {site.azimuth}°</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={site.status} size="xs" />
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-200">{site.daily_pr || 88.5}%</span>
                    <div className="w-20 bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div
                        className={`h-full ${
                          (site.daily_pr || 88) > 85 ? 'bg-emerald-400' : ((site.daily_pr || 88) > 75 ? 'bg-amber-400' : 'bg-rose-500')
                        }`}
                        style={{ width: `${Math.min(100, site.daily_pr || 88)}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-amber-400">{site.current_fault}</span>
                    <span className="text-[10px] text-slate-500 block">{site.fault_confidence}% match</span>
                  </td>
                  <td className="py-3.5 px-4">
                    {site.daily_loss_financial > 0 ? (
                      <span className="font-extrabold text-rose-400">
                        -₹{site.daily_loss_financial.toLocaleString()}
                      </span>
                    ) : (
                      <span className="font-semibold text-emerald-400">₹0</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      to={`/sites/${site.site_id}`}
                      className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Inspect <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Site Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-slate-100 mb-4">Add Solar PV Site</h3>
            <form onSubmit={handleCreateSite} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Site ID</label>
                  <input
                    type="text"
                    value={newSite.site_id}
                    onChange={(e) => setNewSite({ ...newSite, site_id: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Site Name</label>
                  <input
                    type="text"
                    value={newSite.name}
                    onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                    placeholder="e.g. Noida Solar Rooftop 01"
                    className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-slate-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Location Address</label>
                <input
                  type="text"
                  value={newSite.location}
                  onChange={(e) => setNewSite({ ...newSite, location: e.target.value })}
                  placeholder="e.g. Sector 62, Noida, UP"
                  className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Capacity (kWp)</label>
                  <input
                    type="number"
                    value={newSite.capacity_kw}
                    onChange={(e) => setNewSite({ ...newSite, capacity_kw: parseFloat(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newSite.latitude}
                    onChange={(e) => setNewSite({ ...newSite, latitude: parseFloat(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newSite.longitude}
                    onChange={(e) => setNewSite({ ...newSite, longitude: parseFloat(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Tariff (₹/kWh)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newSite.tariff_per_kwh}
                    onChange={(e) => setNewSite({ ...newSite, tariff_per_kwh: parseFloat(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Cleaning Cost (₹)</label>
                  <input
                    type="number"
                    value={newSite.cleaning_cost}
                    onChange={(e) => setNewSite({ ...newSite, cleaning_cost: parseFloat(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md"
                >
                  Save Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
