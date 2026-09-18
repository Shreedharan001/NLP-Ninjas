from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.db import init_db
from app.api.auth_routes import router as auth_router
from app.api.site_routes import router as site_router
from app.api.portfolio_routes import router as portfolio_router
from app.api.performance_routes import router as performance_router
from app.api.ml_routes import router as ml_router
from app.api.ticket_routes import router as ticket_router
from app.api.agent_routes import router as agent_router
from app.api.data_routes import router as data_router

app = FastAPI(
    title="Solar Portfolio Intelligence & Autonomous Maintenance Platform",
    description="End-to-End AI Solar PV Asset Management, Diagnostics, Financial ROI, and Autonomous Maintenance System",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API Routers
app.include_router(auth_router, prefix="/api")
app.include_router(site_router, prefix="/api")
app.include_router(portfolio_router, prefix="/api")
app.include_router(performance_router, prefix="/api")
app.include_router(ml_router, prefix="/api")
app.include_router(ticket_router, prefix="/api")
app.include_router(agent_router, prefix="/api")
app.include_router(data_router, prefix="/api")

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/")
def read_root():
    return {
        "status": "Online",
        "service": "Solar Portfolio Intelligence & Autonomous Maintenance Platform",
        "version": "2.0.0",
        "docs_url": "/docs"
    }
