from fastapi import APIRouter, HTTPException
from typing import List
from app.models.schemas import SiteBase, SiteCreate, SiteUpdate, SiteDetail
from app.database.db import get_connection
from app.agent.agent_tools import agent_tools

router = APIRouter(prefix="/sites", tags=["Sites"])

@router.get("", response_model=List[SiteDetail])
def get_all_sites():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sites ORDER BY site_id ASC")
    sites = [dict(r) for r in cursor.fetchall()]
    conn.close()
    
    results = []
    for s in sites:
        s_id = s["site_id"]
        # Fetch current power, expected power, PR, fault, loss
        gen = agent_tools.get_generation_data(s_id)
        fault = agent_tools.get_fault_prediction(s_id)
        econ = agent_tools.calculate_payback(s_id)
        
        last_reading = gen.get("recent_readings", [{}])[0] if gen.get("recent_readings") else {}
        
        results.append(SiteDetail(
            **s,
            current_power_kw=last_reading.get("actual_power_kw", 0.0),
            expected_power_kw=last_reading.get("expected_power_kw", 0.0),
            daily_energy_kwh=gen.get("total_actual_kwh", 0.0),
            daily_expected_kwh=gen.get("total_expected_kwh", 0.0),
            daily_pr=gen.get("performance_ratio_pct", 100.0),
            current_fault=fault.get("probable_fault", "Normal"),
            fault_confidence=fault.get("confidence_pct", 95.0),
            daily_loss_kwh=gen.get("total_shortfall_kwh", 0.0),
            daily_loss_financial=econ.get("daily_revenue_loss", 0.0),
            active_tickets_count=1 if s["status"] in ["Warning", "Critical"] else 0,
            anomaly_detected=bool(last_reading.get("is_anomaly", 0)),
            last_updated=last_reading.get("timestamp", "Live")
        ))
    return results

@router.get("/{site_id}", response_model=SiteDetail)
def get_site(site_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sites WHERE site_id = ?", (site_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Site not found")
        
    s = dict(row)
    gen = agent_tools.get_generation_data(site_id)
    fault = agent_tools.get_fault_prediction(site_id)
    econ = agent_tools.calculate_payback(site_id)
    last_reading = gen.get("recent_readings", [{}])[0] if gen.get("recent_readings") else {}
    
    return SiteDetail(
        **s,
        current_power_kw=last_reading.get("actual_power_kw", 0.0),
        expected_power_kw=last_reading.get("expected_power_kw", 0.0),
        daily_energy_kwh=gen.get("total_actual_kwh", 0.0),
        daily_expected_kwh=gen.get("total_expected_kwh", 0.0),
        daily_pr=gen.get("performance_ratio_pct", 100.0),
        current_fault=fault.get("probable_fault", "Normal"),
        fault_confidence=fault.get("confidence_pct", 95.0),
        daily_loss_kwh=gen.get("total_shortfall_kwh", 0.0),
        daily_loss_financial=econ.get("daily_revenue_loss", 0.0),
        active_tickets_count=1 if s["status"] in ["Warning", "Critical"] else 0,
        anomaly_detected=bool(last_reading.get("is_anomaly", 0)),
        last_updated=last_reading.get("timestamp", "Live")
    )

@router.post("", response_model=SiteBase)
def create_site(site: SiteCreate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO sites (
            site_id, name, location, latitude, longitude, capacity_kw,
            tilt, azimuth, module_type, inverter_capacity_kw, tariff_per_kwh,
            cleaning_cost, technician_cost, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        site.site_id, site.name, site.location, site.latitude, site.longitude,
        site.capacity_kw, site.tilt, site.azimuth, site.module_type,
        site.inverter_capacity_kw, site.tariff_per_kwh, site.cleaning_cost,
        site.technician_cost, site.status
    ))
    conn.commit()
    conn.close()
    return site

@router.patch("/{site_id}")
def update_site(site_id: str, updates: SiteUpdate):
    conn = get_connection()
    cursor = conn.cursor()
    fields = []
    values = []
    for k, v in updates.model_dump(exclude_unset=True).items():
        fields.append(f"{k} = ?")
        values.append(v)
    if not fields:
        conn.close()
        return {"status": "No changes"}
    values.append(site_id)
    query = f"UPDATE sites SET {', '.join(fields)} WHERE site_id = ?"
    cursor.execute(query, values)
    conn.commit()
    conn.close()
    return {"status": "Updated", "site_id": site_id}
