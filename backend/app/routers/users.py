from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app import crud, schemas
from app.auth import create_access_token, get_current_user_id, security
from app.database import get_db

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.post("/", response_model=schemas.TokenResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if user.email:
        existing = crud.get_user_by_email(db=db, email=user.email)
        if existing:
            raise HTTPException(status_code=400, detail="Bu e-posta adresi zaten kullanılıyor.")
    db_user = crud.create_user(db=db, user=user)
    access_token = create_access_token(db_user.id)
    return schemas.TokenResponse(
        access_token=access_token,
        user=db_user
    )


@router.post("/login", response_model=schemas.TokenResponse)
def login_user(
    payload: schemas.UserLogin,
    db: Session = Depends(get_db),
):
    user = crud.get_user_by_email(db=db, email=payload.email)
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="E-posta veya şifre hatalı.")
    if not crud.verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="E-posta veya şifre hatalı.")
    access_token = create_access_token(user.id)
    return schemas.TokenResponse(
        access_token=access_token,
        user=user
    )


@router.get("/", response_model=List[schemas.UserResponse])
def list_users(db: Session = Depends(get_db)):
    return crud.get_users(db=db)


@router.get("/me", response_model=schemas.UserResponse)
def get_me(
    db: Session = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
):
    user_id = get_current_user_id(credentials=credentials, db=db)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Token gerekli.")
    user = crud.get_user(db=db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/{user_id}", response_model=schemas.UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = crud.get_user(db=db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user