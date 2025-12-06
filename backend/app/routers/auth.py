from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.future import select
from app.database import get_db
from app.models import User
from app.core import security
from pydantic import BaseModel, EmailStr

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

class UserCreate(BaseModel):
    email: str
    password: str
    role: str = "CUSTOMER"

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

@router.post("/register")
async def register(user_in: UserCreate, db: Session = Depends(get_db)):
    print(f"DEBUG: Registering {user_in.email}")
    # Check existing
    try:
        result = await db.execute(select(User).where(User.email == user_in.email))
        existing_user = result.scalars().first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        user = User(
            email=user_in.email,
            hashed_password=security.get_password_hash(user_in.password),
            role=user_in.role
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        access_token = security.create_access_token(subject=user.id)
        return {"access_token": access_token, "token_type": "bearer", "role": user.role}
    except Exception as e:
        print(f"DEBUG: Error {e}")
        import traceback
        traceback.print_exc()
        raise e

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Note: OAuth2PasswordRequestForm uses 'username' field, which we map to email
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()
    
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = security.create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}
