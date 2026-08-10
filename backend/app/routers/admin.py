from datetime import datetime
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import security
from app.database import get_db
from app.models import Booking, Movie, Screen, Showtime, Ticket, User
from app.routers.auth import oauth2_scheme


router = APIRouter()


async def get_current_admin(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    try:
        payload = security.jwt.decode(
            token,
            security.settings.SECRET_KEY,
            algorithms=[security.settings.ALGORITHM],
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    if user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


class MovieBase(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    description: str = Field(default="", max_length=3000)
    duration_mins: int = Field(gt=0, le=600)
    poster_url: str = Field(default="", max_length=1000)
    genre: str = Field(min_length=1, max_length=80)
    rating: str = Field(min_length=1, max_length=20)


class MovieCreate(MovieBase):
    pass


class MovieOut(MovieBase):
    id: int

    class Config:
        from_attributes = True


class ScreenCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    seat_configuration: Any


class ShowtimeCreate(BaseModel):
    movie_id: int
    screen_id: int
    start_time: str
    end_time: str
    price: int = Field(gt=0)


def parse_datetime(value: str) -> datetime:
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="Invalid showtime date") from exc
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone().replace(tzinfo=None)
    return parsed


def validate_seat_layout(layout: Any) -> None:
    if not isinstance(layout, list) or not layout or not all(isinstance(row, list) and row for row in layout):
        raise HTTPException(status_code=422, detail="Seat layout must contain rows and columns")
    width = len(layout[0])
    if len(layout) > 30 or width > 40 or any(len(row) != width for row in layout):
        raise HTTPException(status_code=422, detail="Seat layout must be rectangular and at most 30 x 40")
    valid_types = {"standard", "vip", "couple", "blocked", "gap", 0, 1, 2}
    if any(seat not in valid_types for row in layout for seat in row):
        raise HTTPException(status_code=422, detail="Seat layout contains an invalid seat type")


def screen_payload(screen: Screen) -> dict:
    layout = screen.seat_configuration or []
    return {
        "id": screen.id,
        "name": screen.name,
        "seat_configuration": layout,
        "seat_count": sum(1 for row in layout for seat in row if seat not in ("gap", "blocked", 0)),
    }


@router.get("/dashboard")
async def dashboard_summary(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    now = datetime.now()
    customers = await db.scalar(select(func.count(User.id)).where(User.role == "CUSTOMER"))
    movies = await db.scalar(select(func.count(Movie.id)))
    active_showtimes = await db.scalar(select(func.count(Showtime.id)).where(Showtime.start_time >= now))
    confirmed_bookings = await db.scalar(
        select(func.count(Booking.id)).where(Booking.status == "CONFIRMED")
    )
    revenue = await db.scalar(
        select(func.coalesce(func.sum(Booking.total_price), 0)).where(Booking.status == "CONFIRMED")
    )
    tickets_sold = await db.scalar(
        select(func.count(Ticket.id))
        .join(Booking, Booking.id == Ticket.booking_id)
        .where(Booking.status == "CONFIRMED")
    )

    recent_result = await db.execute(
        select(Booking, User, Showtime, Movie)
        .join(User, User.id == Booking.user_id)
        .join(Showtime, Showtime.id == Booking.showtime_id)
        .join(Movie, Movie.id == Showtime.movie_id)
        .order_by(Booking.created_at.desc())
        .limit(8)
    )
    recent_bookings = [
        {
            "id": booking.id,
            "reference": booking.booking_reference,
            "customer_email": user.email,
            "movie_title": movie.title,
            "showtime": showtime.start_time,
            "total_price": booking.total_price,
            "status": booking.status,
            "created_at": booking.created_at,
        }
        for booking, user, showtime, movie in recent_result.all()
    ]
    return {
        "customers": customers or 0,
        "movies": movies or 0,
        "active_showtimes": active_showtimes or 0,
        "confirmed_bookings": confirmed_bookings or 0,
        "tickets_sold": tickets_sold or 0,
        "revenue": revenue or 0,
        "recent_bookings": recent_bookings,
    }


@router.post("/movies", response_model=MovieOut)
async def create_movie(
    movie: MovieCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    db_movie = Movie(**movie.model_dump())
    db.add(db_movie)
    await db.commit()
    await db.refresh(db_movie)
    return db_movie


@router.get("/movies", response_model=List[MovieOut])
async def list_movies(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await db.execute(select(Movie).order_by(Movie.title))
    return result.scalars().all()


@router.put("/movies/{movie_id}", response_model=MovieOut)
async def update_movie(
    movie_id: int,
    movie: MovieCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    db_movie = await db.get(Movie, movie_id)
    if db_movie is None:
        raise HTTPException(status_code=404, detail="Movie not found")
    for field, value in movie.model_dump().items():
        setattr(db_movie, field, value)
    await db.commit()
    await db.refresh(db_movie)
    return db_movie


@router.delete("/movies/{movie_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_movie(
    movie_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    db_movie = await db.get(Movie, movie_id)
    if db_movie is None:
        raise HTTPException(status_code=404, detail="Movie not found")
    showtime_count = await db.scalar(select(func.count(Showtime.id)).where(Showtime.movie_id == movie_id))
    if showtime_count:
        raise HTTPException(status_code=409, detail="Delete this movie's showtimes first")
    await db.delete(db_movie)
    await db.commit()


@router.post("/screens")
async def create_screen(
    screen: ScreenCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    validate_seat_layout(screen.seat_configuration)
    db_screen = Screen(name=screen.name.strip(), seat_configuration=screen.seat_configuration)
    db.add(db_screen)
    await db.commit()
    await db.refresh(db_screen)
    return screen_payload(db_screen)


@router.get("/screens")
async def list_screens(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await db.execute(select(Screen).order_by(Screen.name))
    return [screen_payload(screen) for screen in result.scalars().all()]


@router.put("/screens/{screen_id}")
async def update_screen(
    screen_id: int,
    screen: ScreenCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    validate_seat_layout(screen.seat_configuration)
    db_screen = await db.get(Screen, screen_id)
    if db_screen is None:
        raise HTTPException(status_code=404, detail="Screen not found")
    db_screen.name = screen.name.strip()
    db_screen.seat_configuration = screen.seat_configuration
    await db.commit()
    await db.refresh(db_screen)
    return screen_payload(db_screen)


@router.delete("/screens/{screen_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_screen(
    screen_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    db_screen = await db.get(Screen, screen_id)
    if db_screen is None:
        raise HTTPException(status_code=404, detail="Screen not found")
    showtime_count = await db.scalar(select(func.count(Showtime.id)).where(Showtime.screen_id == screen_id))
    if showtime_count:
        raise HTTPException(status_code=409, detail="Delete this screen's showtimes first")
    await db.delete(db_screen)
    await db.commit()


@router.get("/showtimes")
async def list_showtimes(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await db.execute(
        select(Showtime, Movie, Screen)
        .join(Movie, Movie.id == Showtime.movie_id)
        .join(Screen, Screen.id == Showtime.screen_id)
        .order_by(Showtime.start_time.desc())
    )
    return [
        {
            "id": showtime.id,
            "movie_id": movie.id,
            "movie_title": movie.title,
            "screen_id": screen.id,
            "screen_name": screen.name,
            "start_time": showtime.start_time,
            "end_time": showtime.end_time,
            "price": showtime.price,
        }
        for showtime, movie, screen in result.all()
    ]


@router.post("/showtimes")
async def create_showtime(
    showtime: ShowtimeCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    start_time = parse_datetime(showtime.start_time)
    end_time = parse_datetime(showtime.end_time)
    if end_time <= start_time:
        raise HTTPException(status_code=422, detail="End time must be after start time")
    if await db.get(Movie, showtime.movie_id) is None:
        raise HTTPException(status_code=404, detail="Movie not found")
    if await db.get(Screen, showtime.screen_id) is None:
        raise HTTPException(status_code=404, detail="Screen not found")

    overlap = await db.scalar(
        select(func.count(Showtime.id)).where(
            Showtime.screen_id == showtime.screen_id,
            Showtime.start_time < end_time,
            Showtime.end_time > start_time,
        )
    )
    if overlap:
        raise HTTPException(status_code=409, detail="This screen already has a showtime in that time range")

    db_showtime = Showtime(
        movie_id=showtime.movie_id,
        screen_id=showtime.screen_id,
        start_time=start_time,
        end_time=end_time,
        price=showtime.price,
    )
    db.add(db_showtime)
    await db.commit()
    await db.refresh(db_showtime)
    return {"id": db_showtime.id}


@router.delete("/showtimes/{showtime_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_showtime(
    showtime_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    db_showtime = await db.get(Showtime, showtime_id)
    if db_showtime is None:
        raise HTTPException(status_code=404, detail="Showtime not found")
    booking_count = await db.scalar(select(func.count(Booking.id)).where(Booking.showtime_id == showtime_id))
    if booking_count:
        raise HTTPException(status_code=409, detail="This showtime already has bookings")
    await db.delete(db_showtime)
    await db.commit()
