from fastapi import FastAPI
from sqlalchemy import text
from app.core.config import settings
from app.db.database import engine

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
)

@app.get("/")
def root():
    return {
        "project": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "Running"
    }

@app.get("/health")
def health():
    return {
        "status": "Healthy"
    }

@app.get("/database")
def database_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "database": "Connected Successfully"
        }

    except Exception as e:
        return {
            "database": "Connection Failed",
            "error": str(e)
        }