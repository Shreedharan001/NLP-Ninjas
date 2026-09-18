import sqlite3
import json
import math
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

DB_FILE = "solar_intelligence.db"

def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        full_name TEXT NOT NULL
    )
    """)
    
    # Sites table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sites (
        site_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        capacity_kw REAL NOT NULL,
        tilt REAL NOT NULL,
        azimuth REAL NOT NULL,
        module_type TEXT NOT NULL,
        inverter_capacity_kw REAL NOT NULL,
        tariff_per_kwh REAL NOT NULL,
        cleaning_cost REAL NOT NULL,
        technician_cost REAL NOT NULL,
        status TEXT NOT NULL
    )
    """)
    
    # Telemetry time-series table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS telemetry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        site_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        actual_power_kw REAL NOT NULL,
        expected_power_kw REAL NOT NULL,
        irradiance_wm2 REAL NOT NULL,
        module_temp_c REAL NOT NULL,
        ambient_temp_c REAL NOT NULL,
        dc_power_kw REAL,
        performance_ratio_pct REAL NOT NULL,
        shortfall_kw REAL NOT NULL,
        is_anomaly INTEGER DEFAULT 0,
        anomaly_score REAL DEFAULT 0.0,
        FOREIGN KEY (site_id) REFERENCES sites(site_id)
    )
    """)
    
    # Maintenance Tickets table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        ticket_id TEXT UNIQUE NOT NULL,
        site_id TEXT NOT NULL,
        fault_type TEXT NOT NULL,
        priority TEXT NOT NULL,
        status TEXT NOT NULL,
        confidence_pct REAL NOT NULL,
        estimated_daily_loss REAL NOT NULL,
        estimated_cost REAL NOT NULL,
        payback_days REAL NOT NULL,
        recommended_action TEXT NOT NULL,
        assigned_to TEXT,
        technician_notes TEXT,
        actual_cost REAL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        resolved_at TEXT,
        closed_loop_data TEXT,
        FOREIGN KEY (site_id) REFERENCES sites(site_id)
    )
    """)
    
    # Notifications table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        site_id TEXT,
        timestamp TEXT NOT NULL,
        read INTEGER DEFAULT 0,
        action_url TEXT
    )
    """)
    
    # Settings & Audit table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )
    """)
    
    conn.commit()
    seed_initial_data(conn)
    conn.close()

def seed_initial_data(conn):
    cursor = conn.cursor()
    
    # Check if sites exist
    cursor.execute("SELECT COUNT(*) FROM sites")
    if cursor.fetchone()[0] > 0:
        return  # Already seeded
        
    # 1. Seed Default Users
    users = [
        ("USR-01", "admin", "admin@solarintel.ai", "admin123", "Admin", "Rajesh Sharma (Admin)"),
        ("USR-02", "ops_lead", "ops@solarintel.ai", "ops123", "Operations Manager", "Ananya Deshmukh (Ops Lead)"),
        ("USR-03", "tech_priya", "priya@solarintel.ai", "tech123", "Technician", "Priya K (Lead Field Engineer)"),
        ("USR-04", "tech_arun", "arun@solarintel.ai", "tech123", "Technician", "Arun V (Solar Specialist)")
    ]
    for u in users:
        cursor.execute("""
        INSERT INTO users (id, username, email, password_hash, role, full_name)
        VALUES (?, ?, ?, ?, ?, ?)
        """, u)
        
    # 2. Seed Diverse Solar Portfolio Sites (Matching Kaggle & Indian Solar Locations)
    sites_data = [
        ("SITE-001", "Rooftop Chennai 01", "Chennai, Tamil Nadu", 13.0827, 80.2707, 100.0, 15.0, 180.0, "Standard Crystalline Silicon", 100.0, 7.50, 1500.0, 3500.0, "Warning"),
        ("SITE-002", "Thar Solar Park - Block 4", "Bhadla, Rajasthan", 27.5385, 71.9168, 500.0, 22.0, 180.0, "Premium Monocrystalline PERC", 500.0, 5.80, 4500.0, 6000.0, "Critical"),
        ("SITE-003", "Bengaluru Tech Park Phase 2", "Whitefield, Bengaluru", 12.9698, 77.7500, 250.0, 12.0, 185.0, "Standard Crystalline Silicon", 250.0, 8.20, 2500.0, 4000.0, "Warning"),
        ("SITE-004", "Pune Industrial Estate", "Chakan, Pune", 18.7606, 73.8643, 150.0, 18.0, 175.0, "Standard Crystalline Silicon", 150.0, 7.80, 1800.0, 3500.0, "Warning"),
        ("SITE-005", "Gujarat Clean Energy Hub", "Charanka, Gujarat", 23.9038, 71.2003, 1000.0, 24.0, 180.0, "Bifacial Monocrystalline", 1000.0, 5.20, 8000.0, 9500.0, "Healthy"),
        ("SITE-006", "Hyderabad Logistics Hub", "Shamshabad, Hyderabad", 17.2403, 78.4294, 200.0, 15.0, 180.0, "Standard Crystalline Silicon", 200.0, 7.60, 2200.0, 3800.0, "Healthy")
    ]
    
    for s in sites_data:
        cursor.execute("""
        INSERT INTO sites (site_id, name, location, latitude, longitude, capacity_kw, tilt, azimuth, module_type, inverter_capacity_kw, tariff_per_kwh, cleaning_cost, technician_cost, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, s)
        
    # 3. Seed Realistic Multi-Day Telemetry Time Series (7 days of 15-min interval solar curves)
    # Reflecting actual physical relationships: Irradiance bell curve, module temperature rise, local physics baseline, and distinct fault signatures.
    
    base_time = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=6)
    
    for day in range(7):
        curr_day = base_time + timedelta(days=day)
        day_str = curr_day.strftime("%Y-%m-%d")
        
        # 96 intervals of 15-min per day
        for step in range(96):
            timestamp_dt = curr_day + timedelta(minutes=step * 15)
            hour_float = timestamp_dt.hour + (timestamp_dt.minute / 60.0)
            iso_time = timestamp_dt.strftime("%Y-%m-%d %H:%M:%S")
            
            # Solar geometry calculation (sun rises ~6:00, peaks ~12:30, sets ~18:30)
            if 6.0 <= hour_float <= 18.5:
                sun_progress = (hour_float - 6.0) / 12.5
                solar_sin = math.sin(sun_progress * math.pi)
                irradiance = round(max(0.0, solar_sin * 920.0 + random.uniform(-15.0, 15.0)), 1)
                ambient_temp = round(24.0 + 10.0 * math.sin((hour_float - 8.0) / 14.0 * math.pi) + random.uniform(-1.0, 1.0), 1)
                # Module temp warms up under irradiance: T_mod = T_amb + (NOCT - 20)/800 * G
                module_temp = round(ambient_temp + (irradiance / 800.0) * 28.0 + random.uniform(-0.5, 0.5), 1)
            else:
                irradiance = 0.0
                ambient_temp = round(21.0 + random.uniform(-0.5, 0.5), 1)
                module_temp = ambient_temp
                
            # Populate for each site with physical baseline and distinct fault behaviors
            for s in sites_data:
                site_id = s[0]
                cap_kw = s[5]
                
                # Temperature derated expected generation: P_exp = Cap * (G/1000) * [1 + gamma*(T_mod - 25)] * system_derate(0.86)
                gamma = -0.0038  # -0.38% / °C
                temp_factor = 1.0 + gamma * (module_temp - 25.0)
                expected_power = round(max(0.0, cap_kw * (irradiance / 1000.0) * temp_factor * 0.88), 2)
                
                # Actual power modification based on site condition
                actual_power = expected_power
                is_anomaly = 0
                anomaly_score = 0.05
                
                if site_id == "SITE-001":  # Soiling on Rooftop Chennai: gradual day-by-day accumulation
                    # Loss factor accumulates from day 0 (5%) to day 6 (20% degradation)
                    soil_factor = 0.95 - (day * 0.024)
                    if irradiance > 50:
                        actual_power = round(expected_power * soil_factor + random.uniform(-0.8, 0.8), 2)
                        if day >= 4:
                            is_anomaly = 1
                            anomaly_score = 0.68 + (day * 0.05)
                elif site_id == "SITE-002":  # Inverter Fault on Thar Solar: Inverter 3 collapsed on day 3 onwards
                    if day >= 3 and irradiance > 50:
                        actual_power = round(expected_power * 0.72 + random.uniform(-2.0, 2.0), 2)
                        is_anomaly = 1
                        anomaly_score = 0.88
                    else:
                        actual_power = round(expected_power * 0.98 + random.uniform(-1.0, 1.0), 2)
                elif site_id == "SITE-003":  # Shading on Bengaluru: daily cyclic dip between 14:00 and 17:00
                    if 14.0 <= hour_float <= 17.0 and irradiance > 100:
                        shade_factor = 0.58 + 0.35 * abs(hour_float - 15.5) / 1.5
                        actual_power = round(expected_power * shade_factor + random.uniform(-1.0, 1.0), 2)
                        is_anomaly = 1
                        anomaly_score = 0.75
                    else:
                        actual_power = round(expected_power * 0.97 + random.uniform(-0.5, 0.5), 2)
                elif site_id == "SITE-004":  # String Outage on Pune: 20% constant string drop
                    if irradiance > 50:
                        actual_power = round(expected_power * 0.80 + random.uniform(-0.5, 0.5), 2)
                        if day >= 2:
                            is_anomaly = 1
                            anomaly_score = 0.72
                elif site_id == "SITE-005":  # Gujarat Hub: Pristine Healthy
                    actual_power = round(expected_power * 0.99 + random.uniform(-1.0, 1.0), 2)
                elif site_id == "SITE-006":  # Hyderabad: Cleaned on Day 4 (Closed-Loop Improvement Demo)
                    if day < 4:
                        actual_power = round(expected_power * 0.82 + random.uniform(-0.8, 0.8), 2)
                    else:
                        actual_power = round(expected_power * 0.98 + random.uniform(-0.5, 0.5), 2)
                        
                actual_power = max(0.0, actual_power)
                shortfall = round(max(0.0, expected_power - actual_power), 2)
                
                # PR = (Actual Power / Expected Power) * 100 (when expected > 1 kW)
                if expected_power > 1.0:
                    pr_pct = round(min(100.0, (actual_power / expected_power) * 100.0), 1)
                else:
                    pr_pct = 100.0 if irradiance == 0 else 90.0
                    
                dc_power = round(actual_power * 1.04, 2)
                
                cursor.execute("""
                INSERT INTO telemetry (
                    site_id, timestamp, actual_power_kw, expected_power_kw, irradiance_wm2,
                    module_temp_c, ambient_temp_c, dc_power_kw, performance_ratio_pct,
                    shortfall_kw, is_anomaly, anomaly_score
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    site_id, iso_time, actual_power, expected_power, irradiance,
                    module_temp, ambient_temp, dc_power, pr_pct, shortfall, is_anomaly, anomaly_score
                ))

    # 4. Seed Initial Maintenance Tickets
    tickets_data = [
        (
            "TKT-1001", "TKT-1001", "SITE-001", "Soiling", "HIGH", "Open", 89.0,
            600.0, 1500.0, 2.5, "Schedule panel cleaning for Rooftop Chennai Array A-C",
            "Priya K (Lead Field Engineer)", "Autonomous diagnosis detected 5-day steady PR decay down to 74%.",
            None, (datetime.now() - timedelta(hours=6)).strftime("%Y-%m-%d %H:%M:%S"),
            (datetime.now() - timedelta(hours=6)).strftime("%Y-%m-%d %H:%M:%S"), None, None
        ),
        (
            "TKT-1002", "TKT-1002", "SITE-002", "Inverter Fault", "CRITICAL", "In Progress", 94.0,
            2100.0, 3500.0, 1.7, "Inspect Inverter INV-03 IGBT bridge & DC combiner box",
            "Arun V (Solar Specialist)", "Technician dispatched on-site. Replacement DC contactor ready.",
            None, (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S"),
            (datetime.now() - timedelta(hours=2)).strftime("%Y-%m-%d %H:%M:%S"), None, None
        ),
        (
            "TKT-1003", "TKT-1003", "SITE-004", "String Outage", "MEDIUM", "Assigned", 86.0,
            468.0, 1200.0, 2.6, "Replace blown 15A string fuse on Combiner Box CB-02",
            "Priya K (Lead Field Engineer)", "String current telemetry indicates 0A on String 4 while other strings show 8.4A.",
            None, (datetime.now() - timedelta(hours=14)).strftime("%Y-%m-%d %H:%M:%S"),
            (datetime.now() - timedelta(hours=8)).strftime("%Y-%m-%d %H:%M:%S"), None, None
        ),
        (
            "TKT-1004", "TKT-1004", "SITE-006", "Soiling", "HIGH", "Resolved", 92.0,
            570.0, 2200.0, 3.8, "Robotic dry brush cleaning executed on all arrays",
            "Arun V (Solar Specialist)", "Cleaning completed successfully on Day 4. Panels inspected and wiped clean.",
            2200.0, (datetime.now() - timedelta(days=4)).strftime("%Y-%m-%d %H:%M:%S"),
            (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S"),
            (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S"),
            json.dumps({
                "ticket_id": "TKT-1004",
                "site_id": "SITE-006",
                "maintenance_date": (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d"),
                "pre_maintenance_pr_pct": 81.5,
                "post_maintenance_pr_pct": 94.2,
                "pr_improvement_pct": 12.7,
                "pre_daily_gen_kwh": 760.0,
                "post_daily_gen_kwh": 878.0,
                "recovered_kwh_day": 118.0,
                "recovered_revenue_day": 896.80,
                "actual_payback_days": 2.45,
                "verification_status": "Confirmed Improvement"
            })
        )
    ]
    
    for t in tickets_data:
        cursor.execute("""
        INSERT INTO tickets (
            id, ticket_id, site_id, fault_type, priority, status, confidence_pct,
            estimated_daily_loss, estimated_cost, payback_days, recommended_action,
            assigned_to, technician_notes, actual_cost, created_at, updated_at, resolved_at, closed_loop_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, t)
        
    # 5. Seed Notifications
    notifications = [
        ("NOTIF-01", "High Financial Loss Alert", "Thar Solar Park - Block 4 losing ₹2,100/day due to Inverter Fault.", "critical", "SITE-002", (datetime.now() - timedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S"), 0, "/sites/SITE-002"),
        ("NOTIF-02", "Autonomous Maintenance Recommendation", "Solar Maintenance Agent identified high ROI cleaning on Rooftop Chennai 01 (Payback: 2.5 days).", "warning", "SITE-001", (datetime.now() - timedelta(hours=3)).strftime("%Y-%m-%d %H:%M:%S"), 0, "/agent"),
        ("NOTIF-03", "Closed-Loop Verification Confirmed", "Hyderabad Logistics Hub recovered +118 kWh/day (+₹896/day) after cleaning.", "success", "SITE-006", (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S"), 1, "/tickets")
    ]
    for n in notifications:
        cursor.execute("""
        INSERT INTO notifications (id, title, message, type, site_id, timestamp, read, action_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, n)
        
    conn.commit()
