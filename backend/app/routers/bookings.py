import uuid
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import security
from app.database import get_db
from app.models import Booking, Movie, Screen, Showtime, Ticket, User
from app.redis_client import redis_client
from app.routers.auth import oauth2_scheme


router = APIRouter()


async def get_current_user(
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
    return user


class LockRequest(BaseModel):
    showtime_id: int
    row: int = Field(ge=0)
    col: int = Field(ge=0)


class BookingRequest(BaseModel):
    showtime_id: int
    seats: List[List[int]] = Field(min_length=1, max_length=6)


def normalize_seat_type(value: Any) -> str:
    if isinstance(value, str):
        return value
    return {0: "gap", 1: "standard", 2: "vip"}.get(value, "standard")


def seat_is_selectable(screen: Screen, row: int, col: int) -> bool:
    layout = screen.seat_configuration or []
    if row >= len(layout) or col >= len(layout[row]):
        return False
    return normalize_seat_type(layout[row][col]) not in {"gap", "blocked"}


async def seat_is_booked(db: AsyncSession, showtime_id: int, row: int, col: int) -> bool:
    result = await db.execute(
        select(Ticket.id)
        .join(Booking, Booking.id == Ticket.booking_id)
        .where(
            Booking.showtime_id == showtime_id,
            Booking.status != "CANCELLED",
            Ticket.seat_row == row,
            Ticket.seat_col == col,
        )
        .limit(1)
    )
    return result.scalar_one_or_none() is not None


@router.get("/showtime/{showtime_id}", response_model=Any)
async def get_showtime_details(showtime_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Showtime, Screen, Movie)
        .join(Screen, Screen.id == Showtime.screen_id)
        .join(Movie, Movie.id == Showtime.movie_id)
        .where(Showtime.id == showtime_id)
    )
    row = result.first()
    if row is None:
        raise HTTPException(status_code=404, detail="Showtime not found")
    showtime, screen, movie = row

    ticket_result = await db.execute(
        select(Ticket)
        .join(Booking, Booking.id == Ticket.booking_id)
        .where(Booking.showtime_id == showtime_id, Booking.status != "CANCELLED")
    )
    booked_seats = [f"{ticket.seat_row}-{ticket.seat_col}" for ticket in ticket_result.scalars().all()]
    locked_keys = await redis_client.keys(f"seat:{showtime_id}:*")
    locked_seats = ["-".join(key.split(":")[-2:]) for key in locked_keys]
    layout = screen.seat_configuration or []
    total_seats = sum(
        1
        for layout_row in layout
        for seat in layout_row
        if normalize_seat_type(seat) not in {"gap", "blocked"}
    )
    unavailable = set(booked_seats) | set(locked_seats)

    return {
        "id": showtime.id,
        "movie_id": movie.id,
        "movie_title": movie.title,
        "poster_url": movie.poster_url,
        "price": showtime.price,
        "start_time": showtime.start_time,
        "end_time": showtime.end_time,
        "screen_name": screen.name,
        "seat_configuration": layout,
        "booked_seats": booked_seats,
        "locked_seats": locked_seats,
        "total_seats": total_seats,
        "available_seats": max(0, total_seats - len(unavailable)),
    }


@router.post("/lock")
async def lock_seat(
    request: LockRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    showtime = await db.get(Showtime, request.showtime_id)
    if showtime is None:
        raise HTTPException(status_code=404, detail="Showtime not found")
    screen = await db.get(Screen, showtime.screen_id)
    if screen is None or not seat_is_selectable(screen, request.row, request.col):
        raise HTTPException(status_code=422, detail="Invalid seat")
    if await seat_is_booked(db, request.showtime_id, request.row, request.col):
        raise HTTPException(status_code=409, detail="Seat is already sold")

    key = f"seat:{request.showtime_id}:{request.row}:{request.col}"
    success = await redis_client.setnx(key, str(user.id), expire=300)
    if not success:
        holder = await redis_client.get(key)
        if holder == str(user.id):
            return {"status": "locked", "expires_in": 300}
        raise HTTPException(status_code=409, detail="Seat is being held by another customer")
    return {"status": "locked", "expires_in": 300}


@router.post("/release")
async def release_seat(request: LockRequest, user: User = Depends(get_current_user)):
    key = f"seat:{request.showtime_id}:{request.row}:{request.col}"
    if await redis_client.get(key) == str(user.id):
        await redis_client.delete(key)
    return {"status": "released"}


@router.post("/book", response_model=Any)
async def create_booking(
    request: BookingRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    showtime = await db.get(Showtime, request.showtime_id)
    if showtime is None:
        raise HTTPException(status_code=404, detail="Showtime not found")
    screen = await db.get(Screen, showtime.screen_id)
    seats = [tuple(seat) for seat in request.seats if len(seat) == 2]
    if len(seats) != len(request.seats) or len(set(seats)) != len(seats):
        raise HTTPException(status_code=422, detail="Invalid or duplicate seats")

    for row, col in seats:
        if screen is None or not seat_is_selectable(screen, row, col):
            raise HTTPException(status_code=422, detail=f"Seat {row}-{col} is invalid")
        if await seat_is_booked(db, request.showtime_id, row, col):
            raise HTTPException(status_code=409, detail=f"Seat {row}-{col} is already sold")
        key = f"seat:{request.showtime_id}:{row}:{col}"
        if await redis_client.get(key) != str(user.id):
            raise HTTPException(status_code=409, detail=f"Seat {row}-{col} hold expired; select it again")

    booking = Booking(
        user_id=user.id,
        showtime_id=request.showtime_id,
        total_price=showtime.price * len(seats),
        status="CONFIRMED",
        booking_reference=str(uuid.uuid4())[:8].upper(),
    )
    db.add(booking)
    await db.flush()
    for row, col in seats:
        db.add(Ticket(
            booking_id=booking.id,
            seat_row=row,
            seat_col=col,
            seat_label=f"{chr(65 + row)}{col + 1}",
        ))
    await db.commit()

    for row, col in seats:
        await redis_client.delete(f"seat:{request.showtime_id}:{row}:{col}")
    return {"status": "confirmed", "booking_id": booking.id, "reference": booking.booking_reference}
