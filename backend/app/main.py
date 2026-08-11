from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(
    title="CineSphere Legacy API",
    version="2.0",
    description="The React application now talks directly to Supabase.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
