from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field
from datetime import datetime

# --- AUTH & USER SCHEMAS ---
class UserBase(BaseModel):
    username: str
    email: str
    role: str = "Operations Manager"  # Admin, Operations Manager, Technician
    full_name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# --- SITE SCHEMAS ---
class SiteBase(BaseModel):
    site_id: str
    name: str
    location: str
    latitude: float
    longitude: float
    capacity_kw: float
    tilt: float = 15.0
    azimuth: float = 180.0
    module_type: str = "Standard Crystalline Silicon"  # Standard, Premium, Thin Film
    inverter_capacity_kw: float = 100.0
    tariff_per_kwh: float = 7.5  # In INR ₹
    cleaning_cost: float = 1500.0
    technician_cost: float = 3500.0
    status: str = "Healthy"  # Healthy, Warning, Critical, Offline

class SiteCreate(SiteBase):
    pass

class SiteUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    capacity_kw: Optional[float] = None
    tilt: Optional[float] = None
    azimuth: Optional[float] = None
    tariff_per_kwh: Optional[float] = None
    cleaning_cost: Optional[float] = None
    technician_cost: Optional[float] = None
    status: Optional[str] = None

class SiteDetail(SiteBase):
    current_power_kw: float = 0.0
    expected_power_kw: float = 0.0
    daily_energy_kwh: float = 0.0
    daily_expected_kwh: float = 0.0
    daily_pr: float = 0.0
    current_fault: str = "Normal"
    fault_confidence: float = 0.95
    daily_loss_kwh: float = 0.0
    daily_loss_financial: float = 0.0
    active_tickets_count: int = 0
    anomaly_detected: bool = False
    last_updated: str = ""

# --- DATA INGESTION & QUALITY SCHEMAS ---
class ColumnMapping(BaseModel):
    timestamp_col: str = "DATE_TIME"
    irradiance_col: str = "IRRADIATION"
    actual_power_col: str = "AC_POWER"
    dc_power_col: Optional[str] = "DC_POWER"
    module_temp_col: Optional[str] = "MODULE_TEMPERATURE"
    ambient_temp_col: Optional[str] = "AMBIENT_TEMPERATURE"
    site_id_col: Optional[str] = "PLANT_ID"
    inverter_id_col: Optional[str] = "SOURCE_KEY"

class DataQualityReport(BaseModel):
    total_records: int
    missing_values_count: int
    missing_values_pct: float
    duplicate_records_count: int
    invalid_irradiance_count: int
    invalid_power_count: int
    time_gaps_count: int
    data_quality_score_pct: float
    timestamp_range: Dict[str, str]
    actions_performed: List[str]
    sample_preview: List[Dict[str, Any]] = []

# --- TIME SERIES TELEMETRY SCHEMAS ---
class TelemetryPoint(BaseModel):
    timestamp: str
    actual_power_kw: float
    expected_power_kw: float
    irradiance_wm2: float
    module_temp_c: float
    ambient_temp_c: float
    dc_power_kw: Optional[float] = None
    performance_ratio_pct: float
    shortfall_kw: float
    is_anomaly: bool = False
    anomaly_score: float = 0.0

class SiteTimeSeriesResponse(BaseModel):
    site_id: str
    date: str
    points: List[TelemetryPoint]
    summary: Dict[str, Any]

# --- PERFORMANCE RATIO & SHORTFALL ---
class PerformanceRatioSummary(BaseModel):
    site_id: str
    pr_today_pct: float
    pr_week_pct: float
    pr_month_pct: float
    pr_historical_baseline_pct: float
    pr_deviation_pct: float
    total_actual_kwh: float
    total_expected_kwh: float
    total_shortfall_kwh: float
    shortfall_pct: float
    shortfall_type: str  # Gradual Degradation, Sudden Drop, Time-of-Day Cyclic Dip, Partial Outage, None

# --- ML & ANOMALIES & FAULT CLASSIFICATION ---
class AnomalyDetectionResponse(BaseModel):
    site_id: str
    total_records: int
    anomalies_detected: int
    anomaly_rate_pct: float
    recent_anomalies: List[Dict[str, Any]]
    explanation: str

class FaultEvidenceItem(BaseModel):
    indicator: str
    observed_value: str
    expected_baseline: str
    matched: bool
    description: str

class FaultClassificationResult(BaseModel):
    site_id: str
    probable_fault: str  # Normal, Soiling, Shading, Inverter Fault, String Outage, Unknown
    confidence_pct: float
    signature_name: str
    is_synthetic_simulation: bool = False
    evidence_checklist: List[FaultEvidenceItem]
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    rate_of_decline: str
    time_of_day_pattern: str
    dc_ac_relationship: str
    string_balance_status: str

# --- ECONOMIC & PAYBACK SCHEMAS ---
class EconomicAnalysisResult(BaseModel):
    site_id: str
    lost_energy_kwh_day: float
    tariff_rate: float
    daily_revenue_loss: float
    monthly_projected_loss: float
    annual_projected_loss: float
    maintenance_cost_estimate: float
    action_type: str
    payback_days: float
    recoverable_value_30d: float
    recoverable_value_90d: float
    estimated_roi_pct: float
    is_economically_viable: bool
    recommendation_summary: str

# --- MAINTENANCE TICKETING & CLOSED LOOP VERIFICATION ---
class TicketCreate(BaseModel):
    site_id: str
    fault_type: str
    priority: str = "HIGH"  # LOW, MEDIUM, HIGH, CRITICAL
    title: str
    description: str
    estimated_daily_loss: float
    estimated_cost: float
    payback_days: float
    recommended_action: str
    assigned_to: Optional[str] = "Technician Priya K"

class TicketUpdate(BaseModel):
    status: Optional[str] = None  # Open, Assigned, In Progress, Resolved, Dismissed, Monitoring
    assigned_to: Optional[str] = None
    priority: Optional[str] = None
    technician_notes: Optional[str] = None
    actual_cost: Optional[float] = None
    resolution_summary: Optional[str] = None

class ClosedLoopVerification(BaseModel):
    ticket_id: str
    site_id: str
    maintenance_date: str
    pre_maintenance_pr_pct: float
    post_maintenance_pr_pct: float
    pr_improvement_pct: float
    pre_daily_gen_kwh: float
    post_daily_gen_kwh: float
    recovered_kwh_day: float
    recovered_revenue_day: float
    actual_payback_days: float
    verification_status: str  # Confirmed Improvement, No Measurable Change, Underperforming

class MaintenanceTicket(BaseModel):
    id: str
    ticket_id: str
    site_id: str
    site_name: str
    fault_type: str
    priority: str
    status: str
    confidence_pct: float
    estimated_daily_loss: float
    estimated_cost: float
    payback_days: float
    recommended_action: str
    assigned_to: Optional[str] = None
    technician_notes: Optional[str] = None
    actual_cost: Optional[float] = None
    created_at: str
    updated_at: str
    resolved_at: Optional[str] = None
    closed_loop: Optional[ClosedLoopVerification] = None

# --- AI AGENT SCHEMAS ---
class AgentReasoningStep(BaseModel):
    phase: str  # OBSERVE, ANALYZE, INVESTIGATE, CALCULATE, DECIDE, ACT
    thought: str
    tool_name: Optional[str] = None
    tool_args: Optional[Dict[str, Any]] = None
    tool_result: Optional[Any] = None

class AgentMessage(BaseModel):
    role: str  # user, assistant, system
    content: str
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    reasoning_steps: Optional[List[AgentReasoningStep]] = None
    recommended_ticket: Optional[Dict[str, Any]] = None

class AgentChatRequest(BaseModel):
    message: str
    site_id: Optional[str] = None
    history: Optional[List[Dict[str, Any]]] = []

class AgentChatResponse(BaseModel):
    reply: str
    reasoning_steps: List[AgentReasoningStep]
    tools_executed: List[str]
    suggested_actions: List[str]
    generated_ticket: Optional[MaintenanceTicket] = None

# --- ML MODEL PERFORMANCE SCHEMAS ---
class ModelMetricsResponse(BaseModel):
    generation_model: Dict[str, Any]
    anomaly_detector: Dict[str, Any]
    fault_classifier: Dict[str, Any]

# --- PORTFOLIO KPIS ---
class PortfolioSummary(BaseModel):
    total_sites: int
    healthy_sites: int
    warning_sites: int
    critical_sites: int
    offline_sites: int
    total_capacity_kw: float
    total_current_generation_kw: float
    total_expected_generation_kw: float
    total_daily_energy_kwh: float
    total_daily_loss_kwh: float
    total_daily_financial_loss: float
    total_recoverable_30d: float
    average_portfolio_pr_pct: float
    open_tickets_count: int
    high_priority_actions_count: int
    portfolio_status: str

# --- NOTIFICATION SCHEMA ---
class NotificationItem(BaseModel):
    id: str
    title: str
    message: str
    type: str  # critical, warning, info, success
    site_id: Optional[str] = None
    timestamp: str
    read: bool = False
    action_url: Optional[str] = None
