import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.database.db import get_connection
from app.services.economic_engine import economic_engine
from app.services.performance_engine import performance_engine
from app.ml.fault_classifier import solar_fault_classifier

class AgentTools:
    """
    Deterministic calculation and operational tools for the Solar Maintenance Agent.
    Ensures mathematical accuracy and zero numerical hallucination.
    """

    @staticmethod
    def get_site_data(site_id: str) -> Dict[str, Any]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM sites WHERE site_id = ?", (site_id,))
        row = cursor.fetchone()
        conn.close()
        if not row:
            return {"error": f"Site {site_id} not found."}
        return dict(row)

    @staticmethod
    def get_generation_data(site_id: str) -> Dict[str, Any]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT timestamp, actual_power_kw, expected_power_kw, performance_ratio_pct, shortfall_kw, is_anomaly
            FROM telemetry WHERE site_id = ? ORDER BY timestamp DESC LIMIT 96
        """, (site_id,))
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        
        if not rows:
            return {"error": f"No telemetry for {site_id}"}
            
        shortfall_analysis = performance_engine.analyze_shortfall(rows)
        return {
            "site_id": site_id,
            "records_analyzed": len(rows),
            "total_actual_kwh": shortfall_analysis["total_actual_kwh"],
            "total_expected_kwh": shortfall_analysis["total_expected_kwh"],
            "total_shortfall_kwh": shortfall_analysis["total_shortfall_kwh"],
            "performance_ratio_pct": shortfall_analysis["pr_pct"],
            "shortfall_type": shortfall_analysis["shortfall_type"],
            "recent_readings": rows[:5]
        }

    @staticmethod
    def get_weather_data(site_id: str) -> Dict[str, Any]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT irradiance_wm2, ambient_temp_c, module_temp_c, timestamp
            FROM telemetry WHERE site_id = ? ORDER BY timestamp DESC LIMIT 10
        """, (site_id,))
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        
        if not rows:
            return {"error": f"No weather data for {site_id}"}
            
        latest = rows[0]
        avg_irr = sum(r["irradiance_wm2"] for r in rows) / len(rows)
        avg_amb = sum(r["ambient_temp_c"] for r in rows) / len(rows)
        avg_mod = sum(r["module_temp_c"] for r in rows) / len(rows)
        
        return {
            "site_id": site_id,
            "current_irradiance_wm2": latest["irradiance_wm2"],
            "current_ambient_temp_c": latest["ambient_temp_c"],
            "current_module_temp_c": latest["module_temp_c"],
            "recent_avg_irradiance": round(avg_irr, 1),
            "recent_avg_ambient_temp": round(avg_amb, 1),
            "recent_avg_module_temp": round(avg_mod, 1),
            "sky_condition": "Clear Sky" if avg_irr > 600 else "Partly Cloudy / Lower Sun"
        }

    @staticmethod
    def get_fault_prediction(site_id: str) -> Dict[str, Any]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM sites WHERE site_id = ?", (site_id,))
        site_row = cursor.fetchone()
        if not site_row:
            conn.close()
            return {"error": f"Site {site_id} not found."}
            
        cursor.execute("""
            SELECT * FROM telemetry WHERE site_id = ? ORDER BY timestamp DESC LIMIT 96
        """, (site_id,))
        telemetry_rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        
        diagnosis = solar_fault_classifier.classify(telemetry_rows, dict(site_row))
        return diagnosis

    @staticmethod
    def calculate_energy_loss(site_id: str) -> Dict[str, Any]:
        gen = AgentTools.get_generation_data(site_id)
        if "error" in gen:
            return gen
        return {
            "site_id": site_id,
            "daily_expected_kwh": gen["total_expected_kwh"],
            "daily_actual_kwh": gen["total_actual_kwh"],
            "daily_lost_kwh": gen["total_shortfall_kwh"],
            "loss_percentage": round((gen["total_shortfall_kwh"] / gen["total_expected_kwh"] * 100) if gen["total_expected_kwh"] > 0 else 0, 1)
        }

    @staticmethod
    def calculate_financial_loss(site_id: str) -> Dict[str, Any]:
        site = AgentTools.get_site_data(site_id)
        loss = AgentTools.calculate_energy_loss(site_id)
        if "error" in site or "error" in loss:
            return {"error": "Unable to calculate financial loss"}
            
        tariff = site.get("tariff_per_kwh", 7.5)
        lost_kwh = loss.get("daily_lost_kwh", 0.0)
        daily_loss_rupees = round(lost_kwh * tariff, 2)
        
        return {
            "site_id": site_id,
            "daily_lost_kwh": lost_kwh,
            "tariff_per_kwh": tariff,
            "daily_financial_loss": daily_loss_rupees,
            "monthly_financial_loss": round(daily_loss_rupees * 30, 2),
            "annual_financial_loss": round(daily_loss_rupees * 365, 2)
        }

    @staticmethod
    def calculate_payback(site_id: str, action_override: Optional[str] = None) -> Dict[str, Any]:
        site = AgentTools.get_site_data(site_id)
        fault = AgentTools.get_fault_prediction(site_id)
        loss = AgentTools.calculate_energy_loss(site_id)
        
        if "error" in site or "error" in fault or "error" in loss:
            return {"error": "Unable to compute payback"}
            
        lost_kwh = loss.get("daily_lost_kwh", 0.0)
        tariff = site.get("tariff_per_kwh", 7.5)
        fault_type = action_override or fault.get("probable_fault", "General Inspection")
        cleaning_cost = site.get("cleaning_cost", 1500.0)
        tech_cost = site.get("technician_cost", 3500.0)
        
        econ = economic_engine.calculate_impact(
            lost_energy_kwh_day=lost_kwh,
            tariff_per_kwh=tariff,
            fault_type=fault_type,
            cleaning_cost=cleaning_cost,
            technician_cost=tech_cost
        )
        return econ

    @staticmethod
    def get_maintenance_history(site_id: str) -> List[Dict[str, Any]]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tickets WHERE site_id = ? ORDER BY created_at DESC", (site_id,))
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows

    @staticmethod
    def get_site_configuration(site_id: str) -> Dict[str, Any]:
        return AgentTools.get_site_data(site_id)

    @staticmethod
    def create_maintenance_ticket(
        site_id: str,
        fault_type: str,
        priority: str,
        recommended_action: str,
        estimated_daily_loss: float,
        estimated_cost: float,
        payback_days: float,
        assigned_to: str = "Priya K (Lead Field Engineer)",
        notes: str = "Auto-generated by Solar Maintenance Agent"
    ) -> Dict[str, Any]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM tickets")
        count = cursor.fetchone()[0] + 1001
        ticket_id = f"TKT-{count}"
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        cursor.execute("""
            INSERT INTO tickets (
                id, ticket_id, site_id, fault_type, priority, status, confidence_pct,
                estimated_daily_loss, estimated_cost, payback_days, recommended_action,
                assigned_to, technician_notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            ticket_id, ticket_id, site_id, fault_type, priority, "Open", 92.0,
            estimated_daily_loss, estimated_cost, payback_days, recommended_action,
            assigned_to, notes, now_str, now_str
        ))
        conn.commit()
        conn.close()
        
        return {
            "ticket_id": ticket_id,
            "status": "Created",
            "site_id": site_id,
            "priority": priority,
            "recommended_action": recommended_action,
            "payback_days": payback_days
        }

    @staticmethod
    def update_ticket(ticket_id: str, status: str, notes: Optional[str] = None) -> Dict[str, Any]:
        conn = get_connection()
        cursor = conn.cursor()
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute("""
            UPDATE tickets SET status = ?, updated_at = ?, technician_notes = COALESCE(?, technician_notes)
            WHERE ticket_id = ?
        """, (status, now_str, notes, ticket_id))
        conn.commit()
        conn.close()
        return {"ticket_id": ticket_id, "updated_status": status}

agent_tools = AgentTools()
