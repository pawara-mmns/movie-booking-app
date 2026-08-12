import asyncio
import hashlib
import hmac
import json
import os
import urllib.error
import urllib.request
import uuid
from decimal import Decimal, InvalidOperation

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db


router = APIRouter(prefix="/api/payments/payhere", tags=["payments"])


class CustomerDetails(BaseModel):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    email: str = Field(min_length=3, max_length=254)
    phone: str = Field(min_length=7, max_length=30)
    address: str = Field(min_length=3, max_length=220)
    city: str = Field(min_length=2, max_length=100)


class PaymentRequest(BaseModel):
    showtime_id: int
    seats: list[str] = Field(min_length=1, max_length=6)
    customer: CustomerDetails


def required_setting(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise HTTPException(status_code=503, detail=f"Missing server setting: {name}")
    return value


def md5_upper(value: str) -> str:
    return hashlib.md5(value.encode("utf-8")).hexdigest().upper()


def payment_hash(merchant_id: str, order_id: str, amount: str, currency: str, secret: str) -> str:
    return md5_upper(f"{merchant_id}{order_id}{amount}{currency}{md5_upper(secret)}")


def notification_hash(merchant_id: str, order_id: str, amount: str, currency: str, status: str, secret: str) -> str:
    return md5_upper(f"{merchant_id}{order_id}{amount}{currency}{status}{md5_upper(secret)}")


async def authenticated_user(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Sign in before making a payment")

    supabase_url = required_setting("VITE_SUPABASE_URL").rstrip("/")
    publishable_key = required_setting("VITE_SUPABASE_PUBLISHABLE_KEY")

    def fetch_user() -> dict:
        request = urllib.request.Request(
            f"{supabase_url}/auth/v1/user",
            headers={"Authorization": authorization, "apikey": publishable_key},
        )
        try:
            with urllib.request.urlopen(request, timeout=10) as response:
                return json.loads(response.read().decode("utf-8"))
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as error:
            raise HTTPException(status_code=401, detail="Your session is invalid or expired") from error

    user = await asyncio.to_thread(fetch_user)
    if not user.get("id"):
        raise HTTPException(status_code=401, detail="Your session is invalid or expired")
    return user


def parse_seat(value: str) -> tuple[int, int]:
    try:
        row, col = (int(part) for part in value.split("-", 1))
    except (TypeError, ValueError) as error:
        raise HTTPException(status_code=400, detail="Invalid seat selection") from error
    if row < 0 or col < 0:
        raise HTTPException(status_code=400, detail="Invalid seat selection")
    return row, col


@router.post("/initiate")
async def initiate_payment(
    payload: PaymentRequest,
    user: dict = Depends(authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    merchant_id = required_setting("PAYHERE_MERCHANT_ID")
    merchant_secret = required_setting("PAYHERE_MERCHANT_SECRET")
    seats = list(dict.fromkeys(payload.seats))
    if len(seats) != len(payload.seats):
        raise HTTPException(status_code=400, detail="The same seat was selected more than once")

    showtime = (await db.execute(text("""
        select st.price, st.seat_prices, st.start_time, s.seat_configuration, m.title
        from public.showtimes st
        join public.screens s on s.id = st.screen_id
        join public.movies m on m.id = st.movie_id
        where st.id = :showtime_id and st.start_time > now()
        for update of st
    """), {"showtime_id": payload.showtime_id})).mappings().first()
    if not showtime:
        raise HTTPException(status_code=404, detail="Showtime not found or already started")

    layout = showtime["seat_configuration"] or []
    prices = showtime["seat_prices"] or {}
    selected = []
    total_cents = 0
    for seat in seats:
        row, col = parse_seat(seat)
        try:
            seat_type = layout[row][col]
        except (IndexError, TypeError):
            raise HTTPException(status_code=400, detail=f"Seat {seat} does not exist")
        seat_type = {0: "gap", 1: "standard", 2: "vip"}.get(seat_type, seat_type)
        if seat_type in (None, "gap", "blocked"):
            raise HTTPException(status_code=400, detail=f"Seat {seat} cannot be booked")

        hold_exists = await db.scalar(text("""
            select exists (
                select 1 from public.seat_holds
                where showtime_id = :showtime_id and seat_row = :row and seat_col = :col
                  and user_id = cast(:user_id as uuid) and expires_at > now()
            )
        """), {"showtime_id": payload.showtime_id, "row": row, "col": col, "user_id": user["id"]})
        if not hold_exists:
            raise HTTPException(status_code=409, detail=f"Your hold for seat {seat} expired. Select your seats again.")

        seat_price = prices.get(str(seat_type)) or prices.get("standard") or showtime["price"]
        total_cents += int(seat_price)
        selected.append({"row": row, "col": col})

    order_id = f"CS-{uuid.uuid4().hex[:12].upper()}"
    customer = payload.customer.model_dump()
    customer["email"] = user.get("email") or customer["email"]
    await db.execute(text("""
        insert into public.payment_orders
            (order_id, user_id, showtime_id, seats, amount, currency, status, customer_details, expires_at)
        values
            (:order_id, cast(:user_id as uuid), :showtime_id, cast(:seats as jsonb), :amount, 'LKR',
             'PENDING', cast(:customer as jsonb), now() + interval '15 minutes')
    """), {
        "order_id": order_id,
        "user_id": user["id"],
        "showtime_id": payload.showtime_id,
        "seats": json.dumps(selected),
        "amount": total_cents,
        "customer": json.dumps(customer),
    })
    await db.execute(text("""
        update public.seat_holds set expires_at = now() + interval '15 minutes'
        where showtime_id = :showtime_id and user_id = cast(:user_id as uuid)
    """), {"showtime_id": payload.showtime_id, "user_id": user["id"]})
    await db.commit()

    amount = f"{Decimal(total_cents) / Decimal(100):.2f}"
    frontend_url = required_setting("FRONTEND_PUBLIC_URL").rstrip("/")
    backend_url = required_setting("BACKEND_PUBLIC_URL").rstrip("/")
    form_data = {
        "merchant_id": merchant_id,
        "return_url": f"{frontend_url}/payment/status/{order_id}",
        "cancel_url": f"{frontend_url}/payment/status/{order_id}?cancelled=true",
        "notify_url": f"{backend_url}/api/payments/payhere/notify",
        "first_name": customer["first_name"],
        "last_name": customer["last_name"],
        "email": customer["email"],
        "phone": customer["phone"],
        "address": customer["address"],
        "city": customer["city"],
        "country": "Sri Lanka",
        "order_id": order_id,
        "items": f"{showtime['title']} - {len(seats)} seat{'s' if len(seats) != 1 else ''}",
        "currency": "LKR",
        "amount": amount,
        "hash": payment_hash(merchant_id, order_id, amount, "LKR", merchant_secret),
        "custom_1": user["id"],
        "custom_2": str(payload.showtime_id),
    }
    return {"checkout_url": "https://sandbox.payhere.lk/pay/checkout", "order_id": order_id, "form_data": form_data}


@router.post("/notify")
async def payment_notification(request: Request, db: AsyncSession = Depends(get_db)):
    form = await request.form()
    data = {key: str(value) for key, value in form.items()}
    required = ("merchant_id", "order_id", "payhere_amount", "payhere_currency", "status_code", "md5sig")
    if any(not data.get(key) for key in required):
        raise HTTPException(status_code=400, detail="Incomplete PayHere notification")

    merchant_id = required_setting("PAYHERE_MERCHANT_ID")
    merchant_secret = required_setting("PAYHERE_MERCHANT_SECRET")
    expected = notification_hash(
        data["merchant_id"], data["order_id"], data["payhere_amount"],
        data["payhere_currency"], data["status_code"], merchant_secret,
    )
    if data["merchant_id"] != merchant_id or not hmac.compare_digest(expected, data["md5sig"].upper()):
        raise HTTPException(status_code=400, detail="Invalid PayHere signature")

    order = (await db.execute(text("""
        select * from public.payment_orders where order_id = :order_id for update
    """), {"order_id": data["order_id"]})).mappings().first()
    if not order:
        raise HTTPException(status_code=404, detail="Payment order not found")

    try:
        notified_cents = int(Decimal(data["payhere_amount"]) * 100)
    except (InvalidOperation, ValueError) as error:
        raise HTTPException(status_code=400, detail="Invalid payment amount") from error
    if notified_cents != order["amount"] or data["payhere_currency"] != order["currency"]:
        raise HTTPException(status_code=400, detail="Payment amount does not match the order")

    status_code = data["status_code"]
    status_map = {"0": "PENDING", "-1": "CANCELLED", "-2": "FAILED", "-3": "CHARGEBACKED"}
    if status_code == "2" and order["status"] != "PAID":
        reference = uuid.uuid4().hex[:8].upper()
        try:
            booking_id = await db.scalar(text("""
                insert into public.bookings (user_id, showtime_id, total_price, status, booking_reference)
                values (:user_id, :showtime_id, :amount, 'CONFIRMED', :reference)
                returning id
            """), {
                "user_id": order["user_id"], "showtime_id": order["showtime_id"],
                "amount": order["amount"], "reference": reference,
            })
            for seat in order["seats"]:
                await db.execute(text("""
                    insert into public.tickets (booking_id, showtime_id, seat_row, seat_col, seat_label)
                    values (:booking_id, :showtime_id, :row, :col, :label)
                """), {
                    "booking_id": booking_id, "showtime_id": order["showtime_id"],
                    "row": seat["row"], "col": seat["col"],
                    "label": f"{chr(65 + seat['row'])}{seat['col'] + 1}",
                })
            await db.execute(text("""
                update public.payment_orders
                set status = 'PAID', payment_id = :payment_id, payment_method = :method,
                    status_message = :message, booking_id = :booking_id, updated_at = now()
                where id = :id
            """), {
                "payment_id": data.get("payment_id"), "method": data.get("method"),
                "message": data.get("status_message"), "booking_id": booking_id, "id": order["id"],
            })
            await db.execute(text("""
                delete from public.seat_holds where showtime_id = :showtime_id and user_id = :user_id
            """), {"showtime_id": order["showtime_id"], "user_id": order["user_id"]})
            await db.commit()
        except IntegrityError:
            await db.rollback()
            await db.execute(text("""
                update public.payment_orders set status = 'REVIEW', status_message = :message, updated_at = now()
                where id = :id
            """), {"id": order["id"], "message": "Payment received but one or more seats were unavailable"})
            await db.commit()
    elif status_code != "2" and order["status"] != "PAID":
        await db.execute(text("""
            update public.payment_orders
            set status = :status, payment_id = :payment_id, payment_method = :method,
                status_message = :message, updated_at = now()
            where id = :id
        """), {
            "status": status_map.get(status_code, "FAILED"), "payment_id": data.get("payment_id"),
            "method": data.get("method"), "message": data.get("status_message"), "id": order["id"],
        })
        await db.commit()

    return {"status": "ok"}


@router.get("/status/{order_id}")
async def payment_status(
    order_id: str,
    user: dict = Depends(authenticated_user),
    db: AsyncSession = Depends(get_db),
):
    order = (await db.execute(text("""
        select po.order_id, po.status, po.amount, po.currency, po.status_message,
               po.payment_method, po.created_at, b.booking_reference
        from public.payment_orders po
        left join public.bookings b on b.id = po.booking_id
        where po.order_id = :order_id and po.user_id = cast(:user_id as uuid)
    """), {"order_id": order_id, "user_id": user["id"]})).mappings().first()
    if not order:
        raise HTTPException(status_code=404, detail="Payment order not found")
    return dict(order)
