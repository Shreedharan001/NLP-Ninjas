from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import UserLogin, Token, UserResponse
from app.database.db import get_connection

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(creds: UserLogin):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (creds.username,))
    user = cursor.fetchone()
    conn.close()
    
    if not user or user["password_hash"] != creds.password:
        # For prototype convenience, if unknown user, allow login as demo role
        if creds.username.lower() in ["admin", "ops_lead", "tech_priya", "technician"]:
            role = "Admin" if "admin" in creds.username else ("Technician" if "tech" in creds.username else "Operations Manager")
            user_dict = {
                "id": f"USR-{creds.username}",
                "username": creds.username,
                "email": f"{creds.username}@solarintel.ai",
                "role": role,
                "full_name": creds.username.title()
            }
            return {
                "access_token": f"mock-token-{creds.username}",
                "token_type": "bearer",
                "user": user_dict
            }
        raise HTTPException(status_code=401, detail="Invalid username or password")
        
    user_dict = dict(user)
    return {
        "access_token": f"token-{user_dict['id']}",
        "token_type": "bearer",
        "user": {
            "id": user_dict["id"],
            "username": user_dict["username"],
            "email": user_dict["email"],
            "role": user_dict["role"],
            "full_name": user_dict["full_name"]
        }
    }

@router.get("/me")
def get_current_user():
    return {
        "id": "USR-02",
        "username": "ops_lead",
        "email": "ops@solarintel.ai",
        "role": "Operations Manager",
        "full_name": "Ananya Deshmukh (Ops Lead)"
    }
