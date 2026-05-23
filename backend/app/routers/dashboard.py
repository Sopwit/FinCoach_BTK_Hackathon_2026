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
from app.services.ai_service import generate_ai_advice


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/")
def get_dashboard_data(
    user_id: int = Query(...),
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    include_ai: bool = Query(default=True),
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

    budgets = crud.get_budgets(db=db, user_id=user_id)

    category_totals = {
        item["category"]: item["total"]
        for item in categories["categories"]
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

    financial_health = calculate_financial_health_score(
        summary=summary,
        monthly_comparison=monthly_comparison,
        recurring_payments=recurring_payments,
        spending_habits=spending_habits,
        budget_status=budget_status
    )

    cards = [
        {
            "key": "total_income",
            "title": "Toplam Gelir",
            "value": summary["total_income"],
            "unit": "TL"
        },
        {
            "key": "total_expense",
            "title": "Toplam Gider",
            "value": summary["total_expense"],
            "unit": "TL"
        },
        {
            "key": "remaining_budget",
            "title": "Kalan Bütçe",
            "value": summary["remaining_budget"],
            "unit": "TL"
        },
        {
            "key": "top_category",
            "title": "En Çok Harcama",
            "value": summary["top_category"],
            "unit": None
        },
        {
            "key": "financial_health",
            "title": "Finansal Sağlık Skoru",
            "value": financial_health["score"],
            "unit": "/100",
            "status": financial_health["status"]
        }
    ]

    alerts = []

    for item in budget_status:
        if item["is_exceeded"]:
            alerts.append({
                "type": "danger",
                "title": f"{item['category']} bütçesi aşıldı",
                "message": (
                    f"{item['category']} için belirlenen "
                    f"{item['monthly_limit']} TL limit aşılmış. "
                    f"Bu ay harcama: {item['spent']} TL."
                )
            })

    for item in monthly_comparison["comparison"]:
        change_percent = item.get("change_percent")
        difference = item.get("difference", 0)

        if change_percent is not None and change_percent > 50 and difference > 0:
            alerts.append({
                "type": "warning",
                "title": f"{item['category']} harcamaları arttı",
                "message": (
                    f"{item['category']} harcamaların geçen aya göre "
                    f"%{change_percent} artmış. "
                    f"Artış miktarı: {difference} TL."
                )
            })

    frequent_sub_categories = spending_habits.get("frequent_sub_categories", [])

    if frequent_sub_categories:
        top_habit = frequent_sub_categories[0]

        alerts.append({
            "type": "info",
            "title": f"{top_habit['sub_category']} sık tekrar ediyor",
            "message": (
                f"Bu ay {top_habit['sub_category']} alanında "
                f"{top_habit['count']} kez harcama yapılmış. "
                f"Toplam: {top_habit['total']} TL."
            )
        })

    if financial_health["score"] < 50:
        alerts.append({
            "type": "danger",
            "title": "Finansal sağlık skoru düşük",
            "message": financial_health["message"]
        })
    elif financial_health["score"] < 70:
        alerts.append({
            "type": "warning",
            "title": "Finansal sağlık skoru dikkat istiyor",
            "message": financial_health["message"]
        })

    charts = {
        "category_distribution": categories["categories"],
        "monthly_comparison": monthly_comparison["comparison"],
        "budget_usage": budget_status,
        "spending_habits": spending_habits["frequent_sub_categories"]
    }

    quick_insights = []

    if summary["top_category"]:
        quick_insights.append(
            f"Bu ay en çok harcama yapılan kategori {summary['top_category']}."
        )

    if monthly_comparison["comparison"]:
        highest_increase = None

        for item in monthly_comparison["comparison"]:
            if item.get("difference", 0) > 0:
                highest_increase = item
                break

        if highest_increase:
            quick_insights.append(
                f"{highest_increase['category']} harcamalarında geçen aya göre "
                f"{highest_increase['difference']} TL artış var."
            )

    recurring_items = recurring_payments.get("recurring_payments", [])

    if recurring_items:
        quick_insights.append(
            f"{len(recurring_items)} adet tekrar eden ödeme tespit edildi."
        )

    quick_insights.append(
        f"Finansal sağlık skorun {financial_health['score']}/100: "
        f"{financial_health['status']}."
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
        "spending_habits": spending_habits,
        "budget_status": budget_status,
        "financial_health": financial_health,
        "cards": cards,
        "alerts": alerts,
        "charts": charts,
        "quick_insights": quick_insights
    }

    advice = None

    if include_ai:
        advice = generate_ai_advice(analysis_data)

    return {
        "user_id": user_id,
        "year": year,
        "month": month,
        "summary": summary,
        "categories": categories,
        "monthly_comparison": monthly_comparison,
        "recurring_payments": recurring_payments,
        "spending_habits": spending_habits,
        "budget_status": budget_status,
        "financial_health": financial_health,
        "cards": cards,
        "alerts": alerts,
        "charts": charts,
        "quick_insights": quick_insights,
        "advice": advice
    }