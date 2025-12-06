from fastapi import FastAPI
from starlette.middleware import Middleware
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, admin, bookings
from app.database import engine, Base

middleware = [
    Middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
]

app = FastAPI(title="CineSphere API", version="1.0", middleware=middleware)

from fastapi import Request

@app.middleware("http")
async def add_cors_header(request: Request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["Bookings"])

@app.get("/")
def read_root():
    return {"message": "Welcome to CineSphere Reservation System API"}
