import json
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.agent.agent_tools import agent_tools
from app.database.db import get_connection

class SolarMaintenanceAgent:
    """
    Autonomous AI Solar Maintenance Agent.
    Implements multi-step reasoning & autonomous control:
    OBSERVE -> ANALYZE -> INVESTIGATE -> CALCULATE -> DECIDE -> ACT
    """
    def __init__(self):
        self.name = "Solar Portfolio Autonomous Maintenance Agent"
        self.auto_dispatch_enabled = True

    def rank_portfolio_maintenance_priorities(self) -> List[Dict[str, Any]]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT site_id, name, capacity_kw, tariff_per_kwh, cleaning_cost, technician_cost FROM sites")
        sites = [dict(r) for r in cursor.fetchall()]
        conn.close()
        
        evaluations = []
        for s in sites:
            s_id = s["site_id"]
            loss = agent_tools.calculate_energy_loss(s_id)
            if "error" in loss:
                continue
                
            fault = agent_tools.get_fault_prediction(s_id)
            econ = agent_tools.calculate_payback(s_id)
            
            lost_kwh = loss.get("daily_lost_kwh", 0.0)
            daily_loss = econ.get("daily_revenue_loss", 0.0)
            payback = econ.get("payback_days", 999.0)
            conf = fault.get("confidence_pct", 90.0) / 100.0
            fault_type = fault.get("probable_fault", "Normal")
            
            priority_score = round((daily_loss * conf) / (payback + 0.5), 2)
            priority_level = "CRITICAL" if daily_loss > 1500 or payback < 2.0 else ("HIGH" if daily_loss > 400 and payback < 4.0 else ("MEDIUM" if daily_loss > 100 else "LOW"))
            
            if fault_type != "Normal":
                evaluations.append({
                    "site_id": s_id,
                    "site_name": s["name"],
                    "fault_type": fault_type,
                    "confidence_pct": round(conf * 100, 1),
                    "daily_lost_kwh": lost_kwh,
                    "daily_revenue_loss": daily_loss,
                    "estimated_repair_cost": econ.get("maintenance_cost_estimate", 1500),
                    "payback_days": payback,
                    "action_recommended": econ.get("action_type", "Inspection"),
                    "priority_level": priority_level,
                    "priority_score": priority_score,
                    "recoverable_90d": econ.get("recoverable_value_90d", 0.0)
                })
                
        evaluations.sort(key=lambda x: x["priority_score"], reverse=True)
        return evaluations

    def execute_autonomous_portfolio_dispatch(self, max_payback_days: float = 7.0) -> Dict[str, Any]:
        """
        Autonomous Control Action: Evaluates entire portfolio and automatically creates/dispatches
        high-priority work orders for sites satisfying the economic payback threshold.
        """
        priorities = self.rank_portfolio_maintenance_priorities()
        dispatched_tickets = []
        reasoning_steps = []
        
        reasoning_steps.append({
            "phase": "OBSERVE",
            "thought": f"Scanning active telemetry and economic yields across all portfolio sites.",
            "tool_name": "get_portfolio_data",
            "tool_args": {},
            "tool_result": f"Evaluated {len(priorities)} underperforming sites."
        })
        
        for p in priorities:
            if p["payback_days"] <= max_payback_days and p["daily_revenue_loss"] > 300.0:
                ticket_res = agent_tools.create_maintenance_ticket(
                    site_id=p["site_id"],
                    fault_type=p["fault_type"],
                    priority=p["priority_level"],
                    recommended_action=f"Autonomous Dispatch: {p['action_recommended']} for {p['site_name']}",
                    estimated_daily_loss=p["daily_revenue_loss"],
                    estimated_cost=p["estimated_repair_cost"],
                    payback_days=p["payback_days"],
                    assigned_to="Priya K (Lead Field Engineer)" if p["priority_level"] == "CRITICAL" else "Arun V (Solar Specialist)",
                    notes=f"Dispatched by Autonomous Agent Control Engine (Estimated payback {p['payback_days']} days, daily revenue loss ₹{p['daily_revenue_loss']}/day)."
                )
                dispatched_tickets.append({
                    "ticket_id": ticket_res["ticket_id"],
                    "site_id": p["site_id"],
                    "site_name": p["site_name"],
                    "fault_type": p["fault_type"],
                    "payback_days": p["payback_days"],
                    "daily_loss": p["daily_revenue_loss"]
                })
                
        reasoning_steps.append({
            "phase": "ACT",
            "thought": f"Autonomous control engine created {len(dispatched_tickets)} maintenance tickets.",
            "tool_name": "create_maintenance_ticket",
            "tool_args": {"count": len(dispatched_tickets)},
            "tool_result": [d["ticket_id"] for d in dispatched_tickets]
        })
        
        return {
            "status": "Success",
            "dispatched_count": len(dispatched_tickets),
            "dispatched_tickets": dispatched_tickets,
            "reasoning_steps": reasoning_steps,
            "message": f"Autonomous Agent Control successfully dispatched {len(dispatched_tickets)} high ROI work orders."
        }

    def execute_chat_reasoning(self, query: str, target_site_id: Optional[str] = None) -> Dict[str, Any]:
        q_lower = query.lower()
        reasoning_steps = []
        tools_executed = []
        
        # Check if user commanded autonomous dispatch or action
        if any(term in q_lower for term in ["auto dispatch", "enable agent control", "autonomous control", "dispatch work orders", "auto fix", "execute dispatch"]):
            dispatch_res = self.execute_autonomous_portfolio_dispatch()
            tools_executed.extend(["get_portfolio_data", "calculate_payback", "create_maintenance_ticket"])
            
            reply = (
                f"### ⚡ Autonomous Agent Control Executed\n\n"
                f"Autonomous maintenance control is **Active**.\n\n"
                f"**Actions Taken**:\n"
            )
            for t in dispatch_res["dispatched_tickets"]:
                reply += f"- Created `{t['ticket_id']}` for **{t['site_name']}** ({t['fault_type']} | Loss: ₹{t['daily_loss']:,.0f}/d | Payback: {t['payback_days']}d)\n"
            reply += f"\nWork orders have been logged in the **Maintenance Hub** and assigned to lead technicians."
            
            return {
                "reply": reply,
                "reasoning_steps": dispatch_res["reasoning_steps"],
                "tools_executed": tools_executed,
                "suggested_actions": ["View Maintenance Hub", "Review Telemetry Curves", "Run Performance Audit"]
            }

        # Step 1: Detect Intent & Target Site
        detected_site_id = target_site_id
        if not detected_site_id:
            for s in ["SITE-001", "SITE-002", "SITE-003", "SITE-004", "SITE-005", "SITE-006"]:
                if s.lower() in q_lower or s.replace("-", "").lower() in q_lower.replace("-", ""):
                    detected_site_id = s
                    break

        if "chennai" in q_lower:
            detected_site_id = "SITE-001"
        elif "thar" in q_lower or "bhadla" in q_lower:
            detected_site_id = "SITE-002"
        elif "bengaluru" in q_lower or "whitefield" in q_lower:
            detected_site_id = "SITE-003"
        elif "pune" in q_lower:
            detected_site_id = "SITE-004"
        elif "gujarat" in q_lower:
            detected_site_id = "SITE-005"
        elif "hyderabad" in q_lower:
            detected_site_id = "SITE-006"

        # Case A: Portfolio Priority Inquiry
        if any(term in q_lower for term in ["which site", "inspect first", "priority", "prioritize", "ranking", "where to start"]):
            priorities = self.rank_portfolio_maintenance_priorities()
            top_site = priorities[0] if priorities else None
            
            tools_executed.extend(["get_portfolio_data", "calculate_energy_loss", "get_fault_prediction", "calculate_payback"])
            
            reasoning_steps.append({
                "phase": "OBSERVE",
                "thought": f"Queried telemetry across all {len(priorities)} active underperforming solar PV sites in portfolio.",
                "tool_name": "get_portfolio_data",
                "tool_args": {},
                "tool_result": f"Found {len(priorities)} sites exhibiting active generation shortfalls."
            })
            reasoning_steps.append({
                "phase": "ANALYZE",
                "thought": "Calculated performance ratio deviations, expected vs actual generation, and behavioral fault signatures.",
                "tool_name": "get_fault_prediction",
                "tool_args": {"sites": [p["site_id"] for p in priorities]},
                "tool_result": [f"{p['site_id']}: {p['fault_type']} ({p['confidence_pct']}%)" for p in priorities]
            })
            reasoning_steps.append({
                "phase": "CALCULATE",
                "thought": "Ranked sites using economic impact framework: Financial Loss / Payback Period.",
                "tool_name": "calculate_payback",
                "tool_args": {"top_site": top_site["site_id"] if top_site else None},
                "tool_result": top_site
            })
            reasoning_steps.append({
                "phase": "DECIDE",
                "thought": f"Selected {top_site['site_id']} ({top_site['site_name']}) as highest urgent priority.",
                "tool_name": None,
                "tool_args": None,
                "tool_result": None
            })
            
            if top_site:
                reply = (
                    f"### 🎯 Maintenance Priority Recommendation\n\n"
                    f"Based on current estimated financial impact and return on maintenance:\n\n"
                    f"**Inspect `{top_site['site_id']}` ({top_site['site_name']}) first.**\n\n"
                    f"#### Key Metrics & Evidence:\n"
                    f"- **Probable Fault**: `{top_site['fault_type']}` ({top_site['confidence_pct']}% confidence)\n"
                    f"- **Daily Energy Shortfall**: `{top_site['daily_lost_kwh']} kWh/day`\n"
                    f"- **Daily Revenue Loss**: `₹{top_site['daily_revenue_loss']:,.2f}/day`\n"
                    f"- **Estimated Repair Cost**: `₹{top_site['estimated_repair_cost']:,.2f}`\n"
                    f"- **Estimated Payback Period**: `{top_site['payback_days']} days`\n"
                    f"- **90-Day Net Cashflow Recovery**: `₹{top_site['recoverable_90d']:,.2f}`\n\n"
                    f"#### Portfolio Ranking:\n"
                )
                for rank, p in enumerate(priorities, start=1):
                    reply += f"{rank}. **{p['site_id']} ({p['site_name']})** — {p['fault_type']} | Loss: ₹{p['daily_revenue_loss']:,.0f}/day | Payback: {p['payback_days']}d | Priority: `{p['priority_level']}`\n"
            else:
                reply = "All portfolio sites are currently operating within nominal baseline parameters (No active maintenance required)."
                
            return {
                "reply": reply,
                "reasoning_steps": reasoning_steps,
                "tools_executed": tools_executed,
                "suggested_actions": ["Trigger Autonomous Work Order Dispatch", "Dispatch Lead Technician", "Review Site Telemetry"]
            }

        # Case B: Specific Site Deep Dive Analysis
        if detected_site_id:
            s_id = detected_site_id
            site_info = agent_tools.get_site_data(s_id)
            gen_data = agent_tools.get_generation_data(s_id)
            fault = agent_tools.get_fault_prediction(s_id)
            econ = agent_tools.calculate_payback(s_id)
            
            tools_executed.extend(["get_site_data", "get_generation_data", "get_fault_prediction", "calculate_payback"])
            
            reasoning_steps.append({
                "phase": "OBSERVE",
                "thought": f"Reading operational telemetry and weather sensor data for {s_id} ({site_info.get('name')}).",
                "tool_name": "get_site_data",
                "tool_args": {"site_id": s_id},
                "tool_result": {"capacity": site_info.get("capacity_kw"), "tariff": site_info.get("tariff_per_kwh")}
            })
            reasoning_steps.append({
                "phase": "ANALYZE",
                "thought": f"Telemetry indicates PR of {gen_data.get('performance_ratio_pct')}% against expected baseline with shortfall of {gen_data.get('total_shortfall_kwh')} kWh.",
                "tool_name": "get_generation_data",
                "tool_args": {"site_id": s_id},
                "tool_result": gen_data
            })
            reasoning_steps.append({
                "phase": "INVESTIGATE",
                "thought": f"Examining behavioral anomaly signatures and irradiance correlations.",
                "tool_name": "get_fault_prediction",
                "tool_args": {"site_id": s_id},
                "tool_result": fault
            })
            reasoning_steps.append({
                "phase": "CALCULATE",
                "thought": f"Calculating financial loss at ₹{site_info.get('tariff_per_kwh')}/kWh and maintenance payback.",
                "tool_name": "calculate_payback",
                "tool_args": {"site_id": s_id},
                "tool_result": econ
            })
            reasoning_steps.append({
                "phase": "DECIDE",
                "thought": f"Formulated maintenance recommendation: {econ.get('action_type')} with {econ.get('payback_days')} days payback.",
                "tool_name": "create_maintenance_ticket" if ("create ticket" in q_lower or "dispatch" in q_lower) else None,
                "tool_args": {"site_id": s_id},
                "tool_result": "Ready for dispatch"
            })
            
            reply = (
                f"### 🔍 Detailed AI Diagnostics for `{s_id}` ({site_info.get('name')})\n\n"
                f"- **Current PR**: `{gen_data.get('performance_ratio_pct')}%` (Expected Baseline: `88.0%`)\n"
                f"- **Probable Cause**: `{fault.get('probable_fault')}` (Confidence: `{fault.get('confidence_pct')}%`)\n"
                f"- **Signature**: *{fault.get('signature_name')}*\n"
                f"- **Daily Energy Shortfall**: `{gen_data.get('total_shortfall_kwh')} kWh/day`\n"
                f"- **Daily Financial Loss**: `₹{econ.get('daily_revenue_loss', 0):,.2f}/day` (Tariff: ₹{site_info.get('tariff_per_kwh')}/kWh)\n"
                f"- **Action Type**: `{econ.get('action_type')}`\n"
                f"- **Estimated Maintenance Cost**: `₹{econ.get('maintenance_cost_estimate', 0):,.2f}`\n"
                f"- **Payback Period**: `{econ.get('payback_days')} days`\n\n"
                f"#### 📊 Diagnostic Evidence:\n"
            )
            for ev in fault.get("evidence_checklist", [])[:3]:
                reply += f"- **{ev['indicator']}**: {ev['description']} (Observed: `{ev['observed_value']}` vs Baseline: `{ev['expected_baseline']}`)\n"
                
            reply += f"\n**Agent Recommendation**: {econ.get('recommendation_summary')}"
            
            return {
                "reply": reply,
                "reasoning_steps": reasoning_steps,
                "tools_executed": tools_executed,
                "suggested_actions": ["Create Maintenance Ticket", "Assign Lead Technician", "View Telemetry Curves"]
            }

        # Case C: General Portfolio Overview
        priorities = self.rank_portfolio_maintenance_priorities()
        total_loss = sum(p["daily_revenue_loss"] for p in priorities)
        total_kwh = sum(p["daily_lost_kwh"] for p in priorities)
        
        reply = (
            f"### ☀️ Solar Portfolio Intelligence Overview\n\n"
            f"The AI Agent is continuously monitoring all active portfolio sites.\n\n"
            f"- **Portfolio Daily Loss**: `₹{total_loss:,.2f}/day` across `{len(priorities)}` underperforming sites.\n"
            f"- **Total Energy Shortfall**: `{total_kwh:,.1f} kWh/day`\n"
            f"- **Top Economic Opportunity**: `{priorities[0]['site_id']}` ({priorities[0]['site_name']}) — Payback in `{priorities[0]['payback_days']} days`.\n\n"
            f"You can ask me to analyze specific sites, rank maintenance priorities, or trigger automated work order tickets."
        )
        
        return {
            "reply": reply,
            "reasoning_steps": [
                {
                    "phase": "OBSERVE",
                    "thought": "Aggregated telemetry across all portfolio sites.",
                    "tool_name": "get_portfolio_data",
                    "tool_args": {},
                    "tool_result": {"total_sites": 6, "loss_daily": total_loss}
                }
            ],
            "tools_executed": ["get_portfolio_data", "calculate_financial_loss"],
            "suggested_actions": ["Enable Autonomous Auto-Dispatch", "Which site should we inspect first?", "Analyze SITE-001 (Rooftop Chennai)"]
        }

solar_maintenance_agent = SolarMaintenanceAgent()
