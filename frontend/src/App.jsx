import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import SiteDetail from './pages/SiteDetail';
import Anomalies from './pages/Anomalies';
import Faults from './pages/Faults';
import Tickets from './pages/Tickets';
import Agent from './pages/Agent';
import Models from './pages/Models';
import DataQuality from './pages/DataQuality';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { api } from './services/api';

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  const [currentUser, setCurrentUser] = useState({
    id: 'USR-02',
    username: 'ops_lead',
    email: 'ops@solarintel.ai',
    role: 'Operations Manager',
    full_name: 'Ananya Deshmukh (Ops Lead)'
  });

  const [openTicketsCount, setOpenTicketsCount] = useState(3);

  const handleRoleChange = (newRole) => {
    setCurrentUser(prev => ({
      ...prev,
      role: newRole,
      full_name: newRole === 'Admin' ? 'Rajesh Sharma (Admin)' : (newRole === 'Technician' ? 'Priya K (Lead Field Engineer)' : 'Ananya Deshmukh (Ops Lead)')
    }));
  };

  if (isLoginPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLoginSuccess={setCurrentUser} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 antialiased selection:bg-amber-500 selection:text-slate-950">
      <Navbar currentUser={currentUser} onUserChange={handleRoleChange} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar openTicketsCount={openTicketsCount} />
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#090d18] to-[#070b14] flex flex-col">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/sites" element={<Portfolio />} />
            <Route path="/sites/:id" element={<SiteDetail />} />
            <Route path="/anomalies" element={<Anomalies />} />
            <Route path="/faults" element={<Faults />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/agent" element={<Agent />} />
            <Route path="/models" element={<Models />} />
            <Route path="/data-quality" element={<DataQuality />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
