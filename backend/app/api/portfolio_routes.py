from fastapi import APIRouter
from typing import List, Dict, Any
from app.models.schemas import PortfolioSummary, NotificationItem
from app.database.db import get_connection
from app.agent.agent_tools import agent_tools
from app.agent.agent_core import solar_maintenance_agent

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])

@router.get("/summary", response_model=PortfolioSummary)
def get_portfolio_summary():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sites")
    sites = [dict(r) for r in cursor.fetchall()]
    
    cursor.execute("SELECT COUNT(*) FROM tickets WHERE status != 'Resolved' AND status != 'Dismissed'")
    open_tickets = cursor.fetchone()[0]
    conn.close()
    
    total_sites = len(sites)
    healthy_sites = sum(1 for s in sites if s["status"] == "Healthy")
    warning_sites = sum(1 for s in sites if s["status"] == "Warning")
    critical_sites = sum(1 for s in sites if s["status"] == "Critical")
    offline_sites = sum(1 for s in sites if s["status"] == "Offline")
    
    total_cap = sum(s["capacity_kw"] for s in sites)
    
    # Prioritized economic calculations
    priorities = solar_maintenance_agent.rank_portfolio_maintenance_priorities()
    total_loss_rupees = sum(p["daily_revenue_loss"] for p in priorities)
    total_loss_kwh = sum(p["daily_lost_kwh"] for p in priorities)
    total_recoverable_30d = sum(p["recoverable_90d"] * (30.0/90.0) for p in priorities)
    
    # Calculate live portfolio actual vs expected power
    total_cur_kw = 0.0
    total_exp_kw = 0.0
    total_daily_kwh = 0.0
    pr_accum = []
    
    for s in sites:
        gen = agent_tools.get_generation_data(s["site_id"])
        total_daily_kwh += gen.get("total_actual_kwh", 0.0)
        pr_accum.append(gen.get("performance_ratio_pct", 100.0))
        readings = gen.get("recent_readings", [])
        if readings:
            total_cur_kw += readings[0].get("actual_power_kw", 0.0)
            total_exp_kw += readings[0].get("expected_power_kw", 0.0)

    avg_pr = round(sum(pr_accum) / max(1, len(pr_accum)), 1)
    
    portfolio_status = "Action Required" if critical_sites > 0 else ("Monitor" if warning_sites > 0 else "Optimal")
    
    return PortfolioSummary(
        total_sites=total_sites,
        healthy_sites=healthy_sites,
        warning_sites=warning_sites,
        critical_sites=critical_sites,
        offline_sites=offline_sites,
        total_capacity_kw=total_cap,
        total_current_generation_kw=round(total_cur_kw, 1),
        total_expected_generation_kw=round(total_exp_kw, 1),
        total_daily_energy_kwh=round(total_daily_kwh, 1),
        total_daily_loss_kwh=round(total_loss_kwh, 1),
        total_daily_financial_loss=round(total_loss_rupees, 2),
        total_recoverable_30d=round(max(0.0, total_recoverable_30d), 2),
        average_portfolio_pr_pct=avg_pr,
        open_tickets_count=open_tickets,
        high_priority_actions_count=len([p for p in priorities if p["priority_level"] in ["HIGH", "CRITICAL"]]),
        portfolio_status=portfolio_status
    )

@router.get("/notifications", response_model=List[NotificationItem])
def get_notifications():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM notifications ORDER BY timestamp DESC LIMIT 20")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    
    for r in rows:
        r["read"] = bool(r["read"])
    return rows

@router.post("/notifications/{notif_id}/read")
def mark_notification_read(notif_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE notifications SET read = 1 WHERE id = ?", (notif_id,))
    conn.commit()
    conn.close()
    return {"status": "Success"}
