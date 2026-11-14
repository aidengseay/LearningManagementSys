
from fastapi import FastAPI, HTTPException

from app.database import check_database

app = FastAPI(
    title="Learning Management System",
    version="0.1.0"
)


@app.get("/api")
def root():
    return {
        "message": "LMS API is running"
    }


@app.get("/api/health")
def health():
    try:
        check_database()
        return {
            "status": "healthy",
            "database": "connected"
        }
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Database connection failed"
        )
