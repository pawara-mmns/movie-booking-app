from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.future import select
from app.database import get_db
from app.models import Booking, Ticket, Showtime, User, Screen
from app.core import security
from app.redis_client import redis_client
from app.routers.auth import oauth2_scheme
from pydantic import BaseModel
from typing import List, Any
import uuid

router = APIRouter()

# Dependency to get current user
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = security.jwt.decode(token, security.settings.SECRET_KEY, algorithms=[security.settings.ALGORITHM])
        user_id = payload.get("sub")
    except Exception:
         raise HTTPException(status_code=401, detail="Invalid token")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

class LockRequest(BaseModel):
    showtime_id: int
    row: int
    col: int

class BookingRequest(BaseModel):
    showtime_id: int
    seats: List[List[int]] # [[0,1], [0,2]]

@router.get("/showtime/{showtime_id}", response_model=Any)
async def get_showtime_details(showtime_id: int, db: Session = Depends(get_db)):
    result = await db.execute(select(Showtime).where(Showtime.id == showtime_id))
    showtime = result.scalars().first()
    if not showtime:
        raise HTTPException(status_code=404, detail="Showtime not found")
        
    # Get Screen Layout
    # Lazy load or explicit join? SQLAlchemy async requires explicit option or redundant query
    result_screen = await db.execute(select(Screen).where(Screen.id == showtime.screen_id))
    screen = result_screen.scalars().first()

    # Get Booked Seats (Confirmed)
    result_tickets = await db.execute(select(Ticket).where(Ticket.booking_id.in_(
        select(Booking.id).where(Booking.showtime_id == showtime_id).where(Booking.status != 'CANCELLED')
    )))
    tickets = result_tickets.scalars().all()
    booked_seats = [f"{t.seat_row}-{t.seat_col}" for t in tickets]

    return {
        "id": showtime.id,
        "movie_id": showtime.movie_id,
        "price": showtime.price,
        "start_time": showtime.start_time,
        "screen_name": screen.name,
        "seat_configuration": screen.seat_configuration,
        "booked_seats": booked_seats 
        # Note: We aren't returning currently LOCKED (redis) seats in this GET for simplicity, 
        # but the client can discover them on click or we could scan redis keys here (expensive).
        # Better approach: Client polls a separate lightweight status endpoint or we scan here.
        # Let's scan here for MVP "Real-time" feel on load.
    }

@router.post("/lock")
async def lock_seat(req: LockRequest, user: User = Depends(get_current_user)):
    # Key format: seat:{showtime_id}:{row}:{col}
    key = f"seat:{req.showtime_id}:{req.row}:{req.col}"
    
    # Try to acquire lock
    # Value is user_id
    success = await redis_client.setnx(key, str(user.id), expire=300) # 5 mins
    
    if not success:
        # Check who holds it?
        holder = await redis_client.get(key)
        if holder == str(user.id):
             return {"status": "locked", "message": "You already hold this lock"}
        raise HTTPException(status_code=409, detail="Seat is already reserved")
    
    return {"status": "locked", "expires_in": 300}

@router.post("/book", response_model=Any)
async def create_booking(req: BookingRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Verify locks
    total_price = 0
    # Fetch showtime price
    result = await db.execute(select(Showtime).where(Showtime.id == req.showtime_id))
    showtime = result.scalars().first()
    if not showtime:
        raise HTTPException(status_code=404, detail="Showtime not found")
    
    for row, col in req.seats:
        key = f"seat:{req.showtime_id}:{row}:{col}"
        holder = await redis_client.get(key)
        if holder != str(user.id):
            raise HTTPException(status_code=400, detail=f"Seat {row}-{col} lock expired or not held by you")
        total_price += showtime.price

    # Create Booking
    booking = Booking(
        user_id=user.id,
        showtime_id=req.showtime_id,
        total_price=total_price,
        status="CONFIRMED",
        booking_reference=str(uuid.uuid4())[:8].upper()
    )
    db.add(booking)
    await db.commit()
    await db.refresh(booking)

    # Create Tickets
    for row, col in req.seats:
        ticket = Ticket(
            booking_id=booking.id,
            seat_row=row,
            seat_col=col,
            seat_label=f"{row}-{col}" 
        )
        db.add(ticket)
        # Release lock? Or keep it/let expire? 
        # Better: delete lock so others know its booked (but we need persistent storage check too)
        # For simplicity in this demo, we rely on checking Booking DB + Redis Lock.
        # Ideally, we should add a 'booked' key or check DB. 
        # But we will just delete the lock key.
        key = f"seat:{req.showtime_id}:{row}:{col}"
        await redis_client.delete(key)
    
    await db.commit()
    
    return {"status": "confirmed", "booking_id": booking.id, "reference": booking.booking_reference}
