from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import crud
from app.database import get_db
from app.services.analytics_service import (
    calculate_monthly_summary,
    calculate_category_summary,
    calculate_monthly_comparison,
    detect_recurring_payments,
    detect_spending_habits,
    calculate_financial_health_score
)

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


@router.get("/summary")
def get_monthly_summary(
    user_id: int = Query(...),
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db)
):
    user = crud.get_user(db=db, user_id=user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return calculate_monthly_summary(
        db=db,
        user_id=user_id,
        year=year,
        month=month
    )


@router.get("/categories")
def get_category_summary(
    user_id: int = Query(...),
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db)
):
    user = crud.get_user(db=db, user_id=user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return calculate_category_summary(
        db=db,
        user_id=user_id,
        year=year,
        month=month
    )


@router.get("/monthly-comparison")
def get_monthly_comparison(
    user_id: int = Query(...),
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db)
):
    user = crud.get_user(db=db, user_id=user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return calculate_monthly_comparison(
        db=db,
        user_id=user_id,
        year=year,
        month=month
    )


@router.get("/recurring")
def get_recurring_payments(
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    user = crud.get_user(db=db, user_id=user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return detect_recurring_payments(
        db=db,
        user_id=user_id
    )


@router.get("/habits")
def get_spending_habits(
    user_id: int = Query(...),
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db)
):
    user = crud.get_user(db=db, user_id=user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return detect_spending_habits(
        db=db,
        user_id=user_id,
        year=year,
        month=month
    )


@router.get("/health-score")
def get_financial_health_score(
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

    budgets = crud.get_budgets(db=db, user_id=user_id)

    category_summary = calculate_category_summary(
        db=db,
        user_id=user_id,
        year=year,
        month=month
    )

    category_totals = {
        item["category"]: item["total"]
        for item in category_summary["categories"]
    }

    budget_status = []

    for budget in budgets:
        spent = category_totals.get(budget.category, 0)
        remaining = budget.monthly_limit - spent
        usage_percent = 0

        if budget.monthly_limit > 0:
            usage_percent = (spent / budget.monthly_limit) * 100

        budget_status.append({
            "budget_id": budget.id,
            "category": budget.category,
            "monthly_limit": round(budget.monthly_limit, 2),
            "spent": round(spent, 2),
            "remaining": round(remaining, 2),
            "usage_percent": round(usage_percent, 2),
            "is_exceeded": spent > budget.monthly_limit
        })

    return calculate_financial_health_score(
        summary=summary,
        monthly_comparison=monthly_comparison,
        recurring_payments=recurring_payments,
        spending_habits=spending_habits,
        budget_status=budget_status
    )