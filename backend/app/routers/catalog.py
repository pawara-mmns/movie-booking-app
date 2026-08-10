from datetime import date, datetime, time, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Movie, Screen, Showtime


router = APIRouter()


def movie_payload(movie: Movie) -> dict:
    return {
        "id": movie.id,
        "title": movie.title,
        "description": movie.description,
        "duration_mins": movie.duration_mins,
        "poster_url": movie.poster_url,
        "genre": movie.genre,
        "rating": movie.rating,
    }


def selected_day_range(selected_date: date) -> tuple[datetime, datetime]:
    start = datetime.combine(selected_date, time.min)
    return start, start + timedelta(days=1)


@router.get("")
async def list_now_showing(
    search: str = Query(default="", max_length=100),
    genre: str = Query(default="", max_length=50),
    show_date: Optional[date] = None,
    screen_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now()
    query = select(Movie).join(Showtime).where(Showtime.start_time >= now)

    if search.strip():
        query = query.where(Movie.title.ilike(f"%{search.strip()}%"))
    if genre.strip():
        query = query.where(Movie.genre == genre.strip())
    if screen_id is not None:
        query = query.where(Showtime.screen_id == screen_id)
    if show_date is not None:
        day_start, day_end = selected_day_range(show_date)
        query = query.where(
            Showtime.start_time >= max(day_start, now),
            Showtime.start_time < day_end,
        )

    result = await db.execute(query.distinct().order_by(Movie.title))
    return [movie_payload(movie) for movie in result.scalars().all()]


@router.get("/filters")
async def get_catalog_filters(
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now()

    genres_result = await db.execute(
        select(Movie.genre)
        .join(Showtime)
        .where(Showtime.start_time >= now, Movie.genre.is_not(None), Movie.genre != "")
        .distinct()
        .order_by(Movie.genre)
    )
    screens_result = await db.execute(
        select(Screen)
        .join(Showtime)
        .where(Showtime.start_time >= now)
        .distinct()
        .order_by(Screen.name)
    )
    dates_result = await db.execute(
        select(Showtime.start_time)
        .where(Showtime.start_time >= now)
        .order_by(Showtime.start_time)
    )

    dates = sorted({value.date().isoformat() for value in dates_result.scalars().all()})
    return {
        "genres": list(genres_result.scalars().all()),
        "screens": [
            {"id": screen.id, "name": screen.name}
            for screen in screens_result.scalars().all()
        ],
        "dates": dates,
    }


@router.get("/{movie_id}")
async def get_movie_details(
    movie_id: int,
    show_date: Optional[date] = None,
    screen_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
):
    movie_result = await db.execute(select(Movie).where(Movie.id == movie_id))
    movie = movie_result.scalars().first()
    if movie is None:
        raise HTTPException(status_code=404, detail="Movie not found")

    now = datetime.now()
    query = (
        select(Showtime, Screen)
        .join(Screen, Screen.id == Showtime.screen_id)
        .where(Showtime.movie_id == movie_id, Showtime.start_time >= now)
    )
    if screen_id is not None:
        query = query.where(Showtime.screen_id == screen_id)
    if show_date is not None:
        day_start, day_end = selected_day_range(show_date)
        query = query.where(
            Showtime.start_time >= max(day_start, now),
            Showtime.start_time < day_end,
        )

    showtime_result = await db.execute(query.order_by(Showtime.start_time))
    showtimes = [
        {
            "id": showtime.id,
            "screen_id": screen.id,
            "screen_name": screen.name,
            "start_time": showtime.start_time,
            "end_time": showtime.end_time,
            "price": showtime.price,
        }
        for showtime, screen in showtime_result.all()
    ]

    payload = movie_payload(movie)
    payload["showtimes"] = showtimes
    payload["available_dates"] = sorted(
        {showtime["start_time"].date().isoformat() for showtime in showtimes}
    )
    payload["screens"] = list(
        {item["screen_id"]: {"id": item["screen_id"], "name": item["screen_name"]} for item in showtimes}.values()
    )
    return payload
