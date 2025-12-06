from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.future import select
from app.database import get_db
from app.models import Movie, Screen, User
from app.core import security
from pydantic import BaseModel, HttpUrl
from typing import List, Any
from app.routers.auth import oauth2_scheme

router = APIRouter()

# Dependency to check if user is admin
async def get_current_admin(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    # Decode token, get user, check role
    # Simplified for speed: In real app we decode verify signature etc.
    # We will reuse the security verify logic if possible or just trust for prototype if verify implemented
    # Ideally:
    # payload = jwt.decode(token, ...)
    # user = db.get(User, payload.sub)
    # if user.role != "ADMIN": raise ...
    # For now, we'll assume the Auth router handles issuance correctly and verified here:
    
    try:
        payload = security.jwt.decode(token, security.settings.SECRET_KEY, algorithms=[security.settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
             raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
         raise HTTPException(status_code=401, detail="Invalid token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")
    return user

# Schemas
class MovieBase(BaseModel):
    title: str
    description: str
    duration_mins: int
    poster_url: str
    genre: str
    rating: str

class MovieCreate(MovieBase):
    pass

class MovieOut(MovieBase):
    id: int
    class Config:
        from_attributes = True

class ScreenCreate(BaseModel):
    name: str
    seat_configuration: Any # JSON matrix

class ShowtimeCreate(BaseModel):
    movie_id: int
    screen_id: int
    start_time: str # ISO format
    end_time: str
    price: int # cents

# Routes
@router.post("/showtimes", response_model=Any)
async def create_showtime(showtime: ShowtimeCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    # Basic overlap check omitted for MVP speed, but should be here
    from app.models import Showtime
    from datetime import datetime
    
    db_showtime = Showtime(
        movie_id=showtime.movie_id,
        screen_id=showtime.screen_id,
        start_time=datetime.fromisoformat(showtime.start_time),
        end_time=datetime.fromisoformat(showtime.end_time),
        price=showtime.price
    )
    db.add(db_showtime)
    await db.commit()
    await db.refresh(db_showtime)
    return db_showtime
    
@router.post("/movies", response_model=MovieOut)
async def create_movie(movie: MovieCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    db_movie = Movie(**movie.dict())
    db.add(db_movie)
    await db.commit()
    await db.refresh(db_movie)
    return db_movie

@router.get("/movies", response_model=List[MovieOut])
async def list_movies(db: Session = Depends(get_db)):
    # Public endpoint
    result = await db.execute(select(Movie))
    return result.scalars().all()

@router.post("/screens", response_model=Any)
async def create_screen(screen: ScreenCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    # Validate matrix structure?
    # For now accept any JSON
    db_screen = Screen(name=screen.name, seat_configuration=screen.seat_configuration)
    db.add(db_screen)
    await db.commit()
    await db.refresh(db_screen)
    return {
        "id": db_screen.id,
        "name": db_screen.name,
        "seat_configuration": db_screen.seat_configuration
    }

@router.get("/screens", response_model=List[Any])
async def list_screens(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    result = await db.execute(select(Screen))
    screens = result.scalars().all()
    return [{"id": s.id, "name": s.name} for s in screens]
