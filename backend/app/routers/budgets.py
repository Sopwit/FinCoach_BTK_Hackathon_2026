from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db
from app.services.analytics_service import calculate_category_summary


router = APIRouter(
    prefix="/budgets",
    tags=["Budgets"]
)


@router.post("/", response_model=schemas.BudgetResponse)
def create_budget(
    budget: schemas.BudgetCreate,
    db: Session = Depends(get_db)
):
    user = crud.get_user(db=db, user_id=budget.user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return crud.create_budget(db=db, budget=budget)


@router.get("/", response_model=list[schemas.BudgetResponse])
def list_budgets(
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    user = crud.get_user(db=db, user_id=user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return crud.get_budgets(db=db, user_id=user_id)


@router.put("/{budget_id}", response_model=schemas.BudgetResponse)
def update_budget(
    budget_id: int,
    budget_update: schemas.BudgetUpdate,
    db: Session = Depends(get_db)
):
    updated_budget = crud.update_budget(
        db=db,
        budget_id=budget_id,
        budget_update=budget_update
    )

    if not updated_budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    return updated_budget


@router.delete("/{budget_id}")
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db)
):
    deleted_budget = crud.delete_budget(
        db=db,
        budget_id=budget_id
    )

    if not deleted_budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    return {
        "message": "Budget deleted successfully",
        "deleted_budget_id": budget_id
    }


@router.get("/status")
def get_budget_status(
    user_id: int = Query(...),
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db)
):
    user = crud.get_user(db=db, user_id=user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

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

    status_items = []

    for budget in budgets:
        spent = category_totals.get(budget.category, 0)
        remaining = budget.monthly_limit - spent
        usage_percent = 0

        if budget.monthly_limit > 0:
            usage_percent = (spent / budget.monthly_limit) * 100

        status_items.append({
            "budget_id": budget.id,
            "category": budget.category,
            "monthly_limit": round(budget.monthly_limit, 2),
            "spent": round(spent, 2),
            "remaining": round(remaining, 2),
            "usage_percent": round(usage_percent, 2),
            "is_exceeded": spent > budget.monthly_limit
        })

    status_items.sort(
        key=lambda item: item["usage_percent"],
        reverse=True
    )

    return {
        "user_id": user_id,
        "year": year,
        "month": month,
        "budgets": status_items
    }