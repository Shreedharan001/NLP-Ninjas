import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench, CheckCircle2, Clock, AlertOctagon, User, DollarSign,
  Plus, Filter, ChevronRight, MessageSquare, ShieldCheck, RefreshCw, LayoutGrid, List
} from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import ClosedLoopCard from '../components/ClosedLoopCard';

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    status: 'In Progress',
    assigned_to: '',
    technician_notes: '',
    actual_cost: 1500
  });

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await api.getTickets();
      setTickets(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStatusModal = (ticket) => {
    setSelectedTicket(ticket);
    setStatusUpdate({
      status: ticket.status,
      assigned_to: ticket.assigned_to || 'Priya K (Lead Field Engineer)',
      technician_notes: ticket.technician_notes || '',
      actual_cost: ticket.actual_cost || ticket.estimated_cost || 1500
    });
    setShowStatusModal(true);
  };

  const handleUpdateTicketStatus = async (e) => {
    e.preventDefault();
    try {
      await api.updateTicket(selectedTicket.ticket_id, statusUpdate);
      setShowStatusModal(false);
      loadTickets();
    } catch (err) {
      alert('Failed to update ticket: ' + err.message);
    }
  };

  const kanbanColumns = [
    { key: 'Open', title: 'Open / Triage', color: 'border-rose-500/40 text-rose-400' },
    { key: 'Assigned', title: 'Assigned', color: 'border-amber-500/40 text-amber-400' },
    { key: 'In Progress', title: 'In Progress', color: 'border-cyan-500/40 text-cyan-400' },
    { key: 'Resolved', title: 'Resolved & Verified', color: 'border-emerald-500/40 text-emerald-400' }
  ];

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-bold text-slate-100">Maintenance & Work Order Hub</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Prioritized work orders, technician assignment, and closed-loop PR recovery verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                viewMode === 'kanban' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
          </div>

          <button
            onClick={loadTickets}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {kanbanColumns.map((col) => {
            const colTickets = tickets.filter(t => t.status.toLowerCase() === col.key.toLowerCase());
            return (
              <div key={col.key} className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 flex flex-col min-h-[480px]">
                <div className={`flex items-center justify-between pb-3 border-b border-slate-800 mb-3`}>
                  <span className={`text-xs font-bold ${col.color}`}>{col.title}</span>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full">
                    {colTickets.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTickets.length === 0 ? (
                    <p className="text-center text-xs text-slate-600 py-8">No tickets in {col.title}</p>
                  ) : (
                    colTickets.map((ticket) => (
                      <div
                        key={ticket.ticket_id}
                        onClick={() => handleOpenStatusModal(ticket)}
                        className="p-3.5 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 rounded-xl cursor-pointer transition-all shadow-md group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-[10px] font-mono text-slate-400">{ticket.ticket_id}</span>
                          <StatusBadge status={ticket.priority} size="xs" />
                        </div>

                        <h4 className="text-xs font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
                          {ticket.recommended_action}
                        </h4>
                        <span className="text-[11px] text-amber-400 font-medium block mt-0.5">
                          {ticket.site_name || ticket.site_id}
                        </span>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                          <div>
                            <span className="text-slate-500 block">Daily Loss</span>
                            <span className="font-extrabold text-rose-400">
                              -₹{ticket.estimated_daily_loss.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Payback</span>
                            <span className="font-bold text-emerald-400">
                              {ticket.payback_days} Days
                            </span>
                          </div>
                        </div>

                        {ticket.assigned_to && (
                          <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800">
                            <span className="flex items-center gap-1 truncate">
                              <User className="w-3 h-3 text-slate-500" /> {ticket.assigned_to}
                            </span>
                            <span className="text-amber-400 font-semibold group-hover:underline">Update →</span>
                          </div>
                        )}

                        {ticket.closed_loop && (
                          <div className="mt-2 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-[10px] text-emerald-300">
                            ✓ Verified: +{ticket.closed_loop.recovered_kwh_day} kWh/d recovered
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Ticket ID</th>
                <th className="py-3 px-4">Site</th>
                <th className="py-3 px-4">Fault</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Daily Loss</th>
                <th className="py-3 px-4">Cost</th>
                <th className="py-3 px-4">Payback</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tickets.map((t) => (
                <tr key={t.ticket_id} className="hover:bg-slate-850/50 cursor-pointer" onClick={() => handleOpenStatusModal(t)}>
                  <td className="py-3 px-4 font-mono font-bold text-slate-200">{t.ticket_id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-300">{t.site_name}</td>
                  <td className="py-3 px-4 text-amber-400">{t.fault_type}</td>
                  <td className="py-3 px-4"><StatusBadge status={t.priority} size="xs" /></td>
                  <td className="py-3 px-4"><StatusBadge status={t.status} size="xs" /></td>
                  <td className="py-3 px-4 font-extrabold text-rose-400">-₹{t.estimated_daily_loss}</td>
                  <td className="py-3 px-4 text-slate-300">₹{t.estimated_cost}</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">{t.payback_days}d</td>
                  <td className="py-3 px-4 text-slate-400">{t.assigned_to}</td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-amber-400 hover:text-amber-300 font-bold">Update</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Status Update / Closed-Loop Resolution Modal */}
      {showStatusModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <span className="text-[10px] font-mono text-slate-400">{selectedTicket.ticket_id}</span>
                <h3 className="font-bold text-sm text-slate-100">{selectedTicket.recommended_action}</h3>
              </div>
              <StatusBadge status={selectedTicket.priority} size="xs" />
            </div>

            <form onSubmit={handleUpdateTicketStatus} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Workflow Status</label>
                <select
                  value={statusUpdate.status}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-slate-200"
                >
                  <option value="Open">Open</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved & Verify Closed-Loop</option>
                  <option value="Dismissed">Dismissed</option>
                  <option value="Monitoring">Monitoring</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Assign Technician</label>
                <input
                  type="text"
                  value={statusUpdate.assigned_to}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, assigned_to: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-slate-200"
                />
              </div>

              {statusUpdate.status === 'Resolved' && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <ShieldCheck className="w-4 h-4" /> Closed-Loop Verification Trigger
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    Resolving this ticket will immediately calculate post-maintenance PR recovery and record the validated outcome into the ML knowledge bank.
                  </p>
                  <div>
                    <label className="text-slate-400 block text-[10px] mb-1 font-semibold">Actual Maintenance Cost (₹)</label>
                    <input
                      type="number"
                      value={statusUpdate.actual_cost}
                      onChange={(e) => setStatusUpdate({ ...statusUpdate, actual_cost: parseFloat(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-slate-200"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Technician / Resolution Notes</label>
                <textarea
                  rows="3"
                  value={statusUpdate.technician_notes}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, technician_notes: e.target.value })}
                  placeholder="Record physical inspection observations, replaced components, or panel cleaning notes..."
                  className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>

            {selectedTicket.closed_loop && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <ClosedLoopCard closedLoopData={selectedTicket.closed_loop} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
