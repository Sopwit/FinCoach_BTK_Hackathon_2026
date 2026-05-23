from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import crud
from app.database import get_db
from app.services.analytics_service import (
    calculate_monthly_summary,
    calculate_category_summary,
    calculate_monthly_comparison,
    detect_recurring_payments,
    detect_spending_habits
)
from app.services.ai_service import generate_ai_advice


router = APIRouter(
    prefix="/ai",
    tags=["AI Advice"]
)


@router.post("/advice")
def get_ai_advice(
    user_id: int = Query(...),
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db)
):
    user = crud.get_user(db=db, user_id=user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    summary = calculate_monthly_summary(
        db=db,
        user_id=user_id,
        year=year,
        month=month
    )

    categories = calculate_category_summary(
        db=db,
        user_id=user_id,
        year=year,
        month=month
    )

    monthly_comparison = calculate_monthly_comparison(
        db=db,
        user_id=user_id,
        year=year,
        month=month
    )

    recurring_payments = detect_recurring_payments(
        db=db,
        user_id=user_id
    )

    spending_habits = detect_spending_habits(
        db=db,
        user_id=user_id,
        year=year,
        month=month
    )

    analysis_data = {
        "user": {
            "id": user.id,
            "name": user.name,
            "monthly_income": user.monthly_income
        },
        "summary": summary,
        "categories": categories,
        "monthly_comparison": monthly_comparison,
        "recurring_payments": recurring_payments,
        "spending_habits": spending_habits
    }

    advice = generate_ai_advice(analysis_data)

    return {
        "user_id": user_id,
        "year": year,
        "month": month,
        "analysis_data": analysis_data,
        "advice": advice
    }