from typing import Dict, Any

class EconomicEngine:
    """
    Quantifies revenue loss, maintenance repair payback periods, and ROI for solar portfolio decisions.
    """
    @staticmethod
    def calculate_impact(
        lost_energy_kwh_day: float,
        tariff_per_kwh: float,
        fault_type: str,
        cleaning_cost: float = 1500.0,
        technician_cost: float = 3500.0,
        recovery_efficiency: float = 0.95
    ) -> Dict[str, Any]:
        """
        Calculates daily loss, maintenance cost, payback in days, and 30d/90d recoverable cashflow.
        """
        daily_loss = round(lost_energy_kwh_day * tariff_per_kwh, 2)
        monthly_loss = round(daily_loss * 30.0, 2)
        annual_loss = round(daily_loss * 365.0, 2)
        
        # Determine appropriate maintenance action and cost
        if fault_type.lower() in ["soiling", "dust", "dirt"]:
            action_type = "Panel Cleaning (Automated/Manual Brush)"
            cost_estimate = cleaning_cost
        elif fault_type.lower() in ["inverter fault", "inverter failure", "igbt trip"]:
            action_type = "Inverter Technician Diagnostic & Component Replacement"
            cost_estimate = technician_cost
        elif fault_type.lower() in ["string outage", "blown fuse", "combiner box"]:
            action_type = "String Fuse & Connector Replacement"
            cost_estimate = min(cleaning_cost, technician_cost * 0.4)
        elif fault_type.lower() in ["shading", "tree obstruction"]:
            action_type = "Obstruction Trimming / Bypass Diode Inspection"
            cost_estimate = cleaning_cost * 1.2
        else:
            action_type = "General Technical Inspection"
            cost_estimate = technician_cost * 0.5
            
        recoverable_daily_value = round(daily_loss * recovery_efficiency, 2)
        
        if recoverable_daily_value > 0.1:
            payback_days = round(cost_estimate / recoverable_daily_value, 1)
        else:
            payback_days = 999.0
            
        recoverable_30d = round(recoverable_daily_value * 30.0 - cost_estimate, 2)
        recoverable_90d = round(recoverable_daily_value * 90.0 - cost_estimate, 2)
        
        # ROI % over 90 days = (Net Recovered / Cost) * 100
        roi_90d = round((recoverable_90d / cost_estimate * 100.0) if cost_estimate > 0 else 0.0, 1)
        
        is_viable = payback_days <= 14.0  # Financially compelling if payback is under 2 weeks
        
        recommendation = (
            f"Economically compelling: Estimated payback of {payback_days} days. "
            f"Net 90-day cash recovery of ₹{recoverable_90d:,.2f} ({roi_90d}% ROI)."
            if is_viable else
            f"Low immediate financial ROI (Payback {payback_days} days). Recommend monitoring until loss exceeds threshold."
        )
        
        return {
            "lost_energy_kwh_day": round(lost_energy_kwh_day, 2),
            "tariff_rate": tariff_per_kwh,
            "daily_revenue_loss": daily_loss,
            "monthly_projected_loss": monthly_loss,
            "annual_projected_loss": annual_loss,
            "maintenance_cost_estimate": cost_estimate,
            "action_type": action_type,
            "payback_days": payback_days,
            "recoverable_value_30d": max(0.0, recoverable_30d),
            "recoverable_value_90d": max(0.0, recoverable_90d),
            "estimated_roi_pct": roi_90d,
            "is_economically_viable": is_viable,
            "recommendation_summary": recommendation
        }

economic_engine = EconomicEngine()
