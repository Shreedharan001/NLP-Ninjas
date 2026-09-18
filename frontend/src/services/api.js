const API_BASE = '/api';

export const api = {
  // Auth
  async login(username, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`);
    return res.json();
  },

  // Portfolio
  async getPortfolioSummary() {
    const res = await fetch(`${API_BASE}/portfolio/summary`);
    if (!res.ok) throw new Error('Failed to fetch portfolio summary');
    return res.json();
  },

  async getNotifications() {
    const res = await fetch(`${API_BASE}/portfolio/notifications`);
    return res.json();
  },

  async markNotificationRead(id) {
    const res = await fetch(`${API_BASE}/portfolio/notifications/${id}/read`, { method: 'POST' });
    return res.json();
  },

  // Sites
  async getSites() {
    const res = await fetch(`${API_BASE}/sites`);
    if (!res.ok) throw new Error('Failed to fetch sites');
    return res.json();
  },

  async getSiteById(siteId) {
    const res = await fetch(`${API_BASE}/sites/${siteId}`);
    if (!res.ok) throw new Error('Failed to fetch site details');
    return res.json();
  },

  async createSite(siteData) {
    const res = await fetch(`${API_BASE}/sites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(siteData)
    });
    return res.json();
  },

  async updateSite(siteId, updates) {
    const res = await fetch(`${API_BASE}/sites/${siteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.json();
  },

  // Performance
  async getSiteTimeseries(siteId, limit = 96) {
    const res = await fetch(`${API_BASE}/performance/timeseries/${siteId}?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch timeseries');
    return res.json();
  },

  async getPrSummary(siteId) {
    const res = await fetch(`${API_BASE}/performance/pr-summary/${siteId}`);
    return res.json();
  },

  // Machine Learning
  async getMlMetrics() {
    const res = await fetch(`${API_BASE}/ml/metrics`);
    if (!res.ok) throw new Error('Failed to fetch ML metrics');
    return res.json();
  },

  async getSiteAnomalies(siteId) {
    const res = await fetch(`${API_BASE}/ml/anomalies/${siteId}`);
    return res.json();
  },

  async getSiteFaults(siteId) {
    const res = await fetch(`${API_BASE}/ml/faults/${siteId}`);
    return res.json();
  },

  // Maintenance Tickets
  async getTickets() {
    const res = await fetch(`${API_BASE}/tickets`);
    if (!res.ok) throw new Error('Failed to fetch tickets');
    return res.json();
  },

  async getTicketById(ticketId) {
    const res = await fetch(`${API_BASE}/tickets/${ticketId}`);
    return res.json();
  },

  async createTicket(ticketData) {
    const res = await fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticketData)
    });
    return res.json();
  },

  async updateTicket(ticketId, updates) {
    const res = await fetch(`${API_BASE}/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.json();
  },

  // AI Agent
  async chatWithAgent(message, siteId = null, history = []) {
    const res = await fetch(`${API_BASE}/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, site_id: siteId, history })
    });
    if (!res.ok) throw new Error('Agent communication failed');
    return res.json();
  },

  async getAgentPriorities() {
    const res = await fetch(`${API_BASE}/agent/priorities`);
    return res.json();
  },

  // Data Quality & Ingestion
  async getQualityOverview() {
    const res = await fetch(`${API_BASE}/data/quality-overview`);
    return res.json();
  },

  async uploadCsv(file, columnMapping = null, siteId = 'SITE-CUSTOM') {
    const formData = new FormData();
    formData.append('file', file);
    if (columnMapping) {
      formData.append('column_mapping_json', JSON.stringify(columnMapping));
    }
    formData.append('site_id', siteId);

    const res = await fetch(`${API_BASE}/data/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  }
};
