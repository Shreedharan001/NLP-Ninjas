from fastapi import APIRouter
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.models.schemas import AgentChatRequest, AgentChatResponse
from app.agent.agent_core import solar_maintenance_agent

router = APIRouter(prefix="/agent", tags=["AI Agent"])

class AutoDispatchRequest(BaseModel):
    max_payback_days: float = 7.0

@router.post("/chat", response_model=AgentChatResponse)
def chat_with_agent(req: AgentChatRequest):
    result = solar_maintenance_agent.execute_chat_reasoning(
        query=req.message,
        target_site_id=req.site_id
    )
    return AgentChatResponse(
        reply=result["reply"],
        reasoning_steps=result["reasoning_steps"],
        tools_executed=result["tools_executed"],
        suggested_actions=result["suggested_actions"],
        generated_ticket=None
    )

@router.get("/priorities")
def get_portfolio_priorities():
    priorities = solar_maintenance_agent.rank_portfolio_maintenance_priorities()
    return {"priorities": priorities}

@router.post("/auto-dispatch")
def trigger_auto_dispatch(req: Optional[AutoDispatchRequest] = None):
    max_days = req.max_payback_days if req else 7.0
    return solar_maintenance_agent.execute_autonomous_portfolio_dispatch(max_payback_days=max_days)
