from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from pathlib import Path
import os
from sqlalchemy.exc import SQLAlchemyError

from app.routers.payments import router as payments_router


load_dotenv(Path(__file__).resolve().parents[1] / ".env")


app = FastAPI(
    title="CineSphere Legacy API",
    version="2.0",
    description="The React application now talks directly to Supabase.",
)

allowed_origins = [origin.strip() for origin in os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
).split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(payments_router)


@app.exception_handler(SQLAlchemyError)
async def database_error_handler(_request, _error):
    return JSONResponse(
        status_code=503,
        content={
            "detail": "Backend cannot connect to Supabase. Update SUPABASE_DATABASE_URL in backend/.env and restart the server."
        },
    )


@app.get("/")
def read_root():
    return {
        "message": "CineSphere uses Supabase directly from the React application.",
        "database": "supabase-client",
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}
