from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="CUSTOMER") # CUSTOMER, ADMIN
    created_at = Column(DateTime, default=datetime.utcnow)

class Movie(Base):
    __tablename__ = "movies"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    duration_mins = Column(Integer)
    poster_url = Column(String)
    genre = Column(String)
    rating = Column(String) # G, PG, R, etc

class Screen(Base):
    __tablename__ = "screens"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    # layout will be a JSON matrix: [[1, 1, 0, 1], [1, 1, 1, 1]] etc where 1=seat, 0=aisle
    seat_configuration = Column(JSON) 

class Showtime(Base):
    __tablename__ = "showtimes"
    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id"))
    screen_id = Column(Integer, ForeignKey("screens.id"))
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    price = Column(Integer) # In cents

    movie = relationship("Movie")
    screen = relationship("Screen")

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    showtime_id = Column(Integer, ForeignKey("showtimes.id"))
    total_price = Column(Integer)
    status = Column(String, default="PENDING") # PENDING, CONFIRMED, CANCELLED
    booking_reference = Column(String, unique=True) # For QR Code
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")
    showtime = relationship("Showtime")
    tickets = relationship("Ticket", back_populates="booking")

class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"))
    seat_row = Column(Integer)
    seat_col = Column(Integer) # Using col index instead of number for simplicity with matrix
    seat_label = Column(String) # e.g. "A5"

    booking = relationship("Booking", back_populates="tickets")
