from typing import List, Dict, Any
import numpy as np

class PerformanceEngine:
    """
    Computes PV Performance Ratio (PR), Energy Shortfall, and Loss Signatures according to IEC 61724.
    """
    @staticmethod
    def calculate_pr(actual_kwh: float, expected_kwh: float) -> float:
        if expected_kwh <= 0.01:
            return 100.0
        return round(min(100.0, max(0.0, (actual_kwh / expected_kwh) * 100.0)), 2)

    @staticmethod
    def analyze_shortfall(telemetry_records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyzes time series of actual vs expected generation to categorize shortfall type and quantify lost energy.
        """
        if not telemetry_records:
            return {
                "total_actual_kwh": 0.0,
                "total_expected_kwh": 0.0,
                "total_shortfall_kwh": 0.0,
                "shortfall_pct": 0.0,
                "shortfall_type": "None",
                "pr_pct": 100.0
            }

        # Each 15-min interval power (kW) -> energy (kWh) = power * 0.25h
        actual_kwh = sum(r.get("actual_power_kw", 0.0) * 0.25 for r in telemetry_records)
        expected_kwh = sum(r.get("expected_power_kw", 0.0) * 0.25 for r in telemetry_records)
        
        actual_kwh = round(actual_kwh, 2)
        expected_kwh = round(expected_kwh, 2)
        shortfall_kwh = round(max(0.0, expected_kwh - actual_kwh), 2)
        
        shortfall_pct = round((shortfall_kwh / expected_kwh * 100.0) if expected_kwh > 0 else 0.0, 1)
        pr_pct = PerformanceEngine.calculate_pr(actual_kwh, expected_kwh)
        
        # Analyze temporal signature of the loss
        shortfalls = [max(0.0, r.get("expected_power_kw", 0.0) - r.get("actual_power_kw", 0.0)) for r in telemetry_records]
        
        if shortfall_pct < 5.0:
            shortfall_type = "None / Nominal"
        elif shortfall_pct > 25.0 and any(r.get("actual_power_kw", 0.0) < 0.1 and r.get("expected_power_kw", 0.0) > 20.0 for r in telemetry_records):
            shortfall_type = "Sudden Inverter / Subsystem Outage"
        elif any(14 <= int(r.get("timestamp", " 12:").split(" ")[1].split(":")[0]) <= 17 and r.get("shortfall_kw", 0) > 10 for r in telemetry_records):
            shortfall_type = "Time-of-Day Cyclic Shading Dip"
        elif shortfall_pct > 12.0:
            shortfall_type = "Gradual Soiling Accumulation"
        else:
            shortfall_type = "Partial String / Sub-array Imbalance"
            
        return {
            "total_actual_kwh": actual_kwh,
            "total_expected_kwh": expected_kwh,
            "total_shortfall_kwh": shortfall_kwh,
            "shortfall_pct": shortfall_pct,
            "shortfall_type": shortfall_type,
            "pr_pct": pr_pct
        }

performance_engine = PerformanceEngine()
