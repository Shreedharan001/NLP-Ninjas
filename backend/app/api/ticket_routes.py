from fastapi import APIRouter, HTTPException
from typing import List
from app.models.schemas import MaintenanceTicket, TicketCreate, TicketUpdate
from app.services.ticket_service import ticket_service

router = APIRouter(prefix="/tickets", tags=["Maintenance Tickets"])

@router.get("", response_model=List[MaintenanceTicket])
def get_tickets():
    return ticket_service.get_all_tickets()

@router.get("/{ticket_id}", response_model=MaintenanceTicket)
def get_ticket(ticket_id: str):
    ticket = ticket_service.get_ticket_by_id(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@router.post("", response_model=MaintenanceTicket)
def create_ticket(ticket_data: TicketCreate):
    created = ticket_service.create_ticket(ticket_data.model_dump())
    return created

@router.patch("/{ticket_id}", response_model=MaintenanceTicket)
def update_ticket(ticket_id: str, updates: TicketUpdate):
    updated = ticket_service.update_ticket(ticket_id, updates.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return updated
