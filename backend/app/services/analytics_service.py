from collections import defaultdict, Counter
from datetime import date
from calendar import monthrange

from sqlalchemy.orm import Session

from app import models


def get_month_date_range(year: int, month: int):
    start_date = date(year, month, 1)
    last_day = monthrange(year, month)[1]
    end_date = date(year, month, last_day)

    return start_date, end_date


def get_previous_month(year: int, month: int):
    if month == 1:
        return year - 1, 12

    return year, month - 1


def get_transactions_by_month(
    db: Session,
    user_id: int,
    year: int,
    month: int
):
    start_date, end_date = get_month_date_range(year, month)

    return (
        db.query(models.Transaction)
        .filter(models.Transaction.user_id == user_id)
        .filter(models.Transaction.date >= start_date)
        .filter(models.Transaction.date <= end_date)
        .all()
    )


def calculate_monthly_summary(
    db: Session,
    user_id: int,
    year: int,
    month: int
):
    transactions = get_transactions_by_month(
        db=db,
        user_id=user_id,
        year=year,
        month=month
    )

    total_income = sum(
        tx.amount for tx in transactions if tx.type == "income"
    )

    total_expense = abs(sum(
        tx.amount for tx in transactions if tx.type == "expense"
    ))

    remaining_budget = total_income - total_expense

    expense_transactions = [
        tx for tx in transactions if tx.type == "expense"
    ]

    top_category = None

    if expense_transactions:
        category_totals = defaultdict(float)

        for tx in expense_transactions:
            category_totals[tx.category] += abs(tx.amount)

        top_category = max(category_totals, key=category_totals.get)

    return {
        "user_id": user_id,
        "year": year,
        "month": month,
        "total_income": round(total_income, 2),
        "total_expense": round(total_expense, 2),
        "remaining_budget": round(remaining_budget, 2),
        "transaction_count": len(transactions),
        "top_category": top_category
    }


def calculate_category_summary(
    db: Session,
    user_id: int,
    year: int,
    month: int
):
    transactions = get_transactions_by_month(
        db=db,
        user_id=user_id,
        year=year,
        month=month
    )

    category_totals = defaultdict(float)

    for tx in transactions:
        if tx.type == "expense":
            category_totals[tx.category] += abs(tx.amount)

    result = []

    total_expense = sum(category_totals.values())

    for category, total in category_totals.items():
        percentage = 0

        if total_expense > 0:
            percentage = (total / total_expense) * 100

        result.append({
            "category": category,
            "total": round(total, 2),
            "percentage": round(percentage, 2)
        })

    result.sort(key=lambda item: item["total"], reverse=True)

    return {
        "user_id": user_id,
        "year": year,
        "month": month,
        "categories": result
    }


def calculate_monthly_comparison(
    db: Session,
    user_id: int,
    year: int,
    month: int
):
    previous_year, previous_month = get_previous_month(year, month)

    current_transactions = get_transactions_by_month(
        db=db,
        user_id=user_id,
        year=year,
        month=month
    )

    previous_transactions = get_transactions_by_month(
        db=db,
        user_id=user_id,
        year=previous_year,
        month=previous_month
    )

    current_totals = defaultdict(float)
    previous_totals = defaultdict(float)

    for tx in current_transactions:
        if tx.type == "expense":
            current_totals[tx.category] += abs(tx.amount)

    for tx in previous_transactions:
        if tx.type == "expense":
            previous_totals[tx.category] += abs(tx.amount)

    all_categories = set(current_totals.keys()) | set(previous_totals.keys())

    comparison = []

    for category in all_categories:
        current_total = current_totals.get(category, 0)
        previous_total = previous_totals.get(category, 0)

        difference = current_total - previous_total

        if previous_total > 0:
            change_percent = (difference / previous_total) * 100
        else:
            change_percent = None

        comparison.append({
            "category": category,
            "previous_total": round(previous_total, 2),
            "current_total": round(current_total, 2),
            "difference": round(difference, 2),
            "change_percent": round(change_percent, 2) if change_percent is not None else None
        })

    comparison.sort(key=lambda item: item["difference"], reverse=True)

    return {
        "user_id": user_id,
        "current_period": {
            "year": year,
            "month": month
        },
        "previous_period": {
            "year": previous_year,
            "month": previous_month
        },
        "comparison": comparison
    }


def detect_recurring_payments(
    db: Session,
    user_id: int
):
    transactions = (
        db.query(models.Transaction)
        .filter(models.Transaction.user_id == user_id)
        .filter(models.Transaction.type == "expense")
        .all()
    )

    grouped = defaultdict(list)

    for tx in transactions:
        key = tx.description.lower().strip()
        grouped[key].append(tx)

    recurring = []

    for description, items in grouped.items():
        if len(items) < 2:
            continue

        amounts = [abs(tx.amount) for tx in items]
        avg_amount = sum(amounts) / len(amounts)

        amount_difference = max(amounts) - min(amounts)

        categories = [tx.category for tx in items]
        most_common_category = Counter(categories).most_common(1)[0][0]

        sub_categories = [
            tx.sub_category for tx in items if tx.sub_category
        ]

        most_common_sub_category = None

        if sub_categories:
            most_common_sub_category = Counter(sub_categories).most_common(1)[0][0]

        is_subscription_like = (
            most_common_category in ["Abonelik", "Fatura"]
            and amount_difference <= max(20, avg_amount * 0.15)
        )

        if is_subscription_like:
            recurring.append({
                "description": description,
                "count": len(items),
                "average_amount": round(avg_amount, 2),
                "category": most_common_category,
                "sub_category": most_common_sub_category,
                "type": "Tekrar eden ödeme / abonelik"
            })

    recurring.sort(key=lambda item: item["average_amount"], reverse=True)

    return {
        "user_id": user_id,
        "recurring_payments": recurring
    }


def detect_spending_habits(
    db: Session,
    user_id: int,
    year: int,
    month: int
):
    transactions = get_transactions_by_month(
        db=db,
        user_id=user_id,
        year=year,
        month=month
    )

    expense_transactions = [
        tx for tx in transactions if tx.type == "expense"
    ]

    sub_category_counter = Counter()
    sub_category_totals = defaultdict(float)

    description_counter = Counter()
    description_totals = defaultdict(float)

    for tx in expense_transactions:
        if tx.sub_category:
            sub_category_counter[tx.sub_category] += 1
            sub_category_totals[tx.sub_category] += abs(tx.amount)

        normalized_description = tx.description.lower().strip()
        description_counter[normalized_description] += 1
        description_totals[normalized_description] += abs(tx.amount)

    frequent_sub_categories = []

    for sub_category, count in sub_category_counter.items():
        if count >= 2:
            frequent_sub_categories.append({
                "sub_category": sub_category,
                "count": count,
                "total": round(sub_category_totals[sub_category], 2)
            })

    frequent_descriptions = []

    for description, count in description_counter.items():
        if count >= 2:
            frequent_descriptions.append({
                "description": description,
                "count": count,
                "total": round(description_totals[description], 2)
            })

    frequent_sub_categories.sort(
        key=lambda item: item["total"],
        reverse=True
    )

    frequent_descriptions.sort(
        key=lambda item: item["total"],
        reverse=True
    )

    return {
        "user_id": user_id,
        "year": year,
        "month": month,
        "frequent_sub_categories": frequent_sub_categories,
        "frequent_descriptions": frequent_descriptions
    }
def calculate_financial_health_score(
    summary: dict,
    monthly_comparison: dict,
    recurring_payments: dict,
    spending_habits: dict,
    budget_status: list
):
    score = 100
    reasons = []

    total_income = summary.get("total_income", 0)
    total_expense = summary.get("total_expense", 0)
    remaining_budget = summary.get("remaining_budget", 0)

    # 1. Gelire göre gider oranı
    expense_ratio = 0

    if total_income > 0:
        expense_ratio = (total_expense / total_income) * 100

        if expense_ratio > 90:
            score -= 25
            reasons.append(
                "Aylık giderlerin gelirinin %90'ından fazlasını oluşturuyor."
            )
        elif expense_ratio > 75:
            score -= 15
            reasons.append(
                "Aylık giderlerin gelirine göre yüksek seviyede."
            )
        elif expense_ratio > 60:
            score -= 8
            reasons.append(
                "Aylık giderlerin gelirine göre orta-yüksek seviyede."
            )
    else:
        score -= 20
        reasons.append(
            "Bu ay gelir bilgisi bulunmadığı için bütçe dengesi net değerlendirilemiyor."
        )

    # 2. Kalan bütçe kontrolü
    if remaining_budget < 0:
        score -= 20
        reasons.append(
            "Bu ay giderlerin gelirini aşmış görünüyor."
        )
    elif total_income > 0 and remaining_budget < total_income * 0.1:
        score -= 10
        reasons.append(
            "Ay sonunda kalan bütçe gelirine göre düşük seviyede."
        )

    # 3. Bütçe limiti aşımı
    exceeded_budgets = [
        item for item in budget_status
        if item.get("is_exceeded")
    ]

    if exceeded_budgets:
        penalty = min(len(exceeded_budgets) * 8, 20)
        score -= penalty

        exceeded_names = ", ".join(
            [item["category"] for item in exceeded_budgets[:3]]
        )

        reasons.append(
            f"{exceeded_names} kategorilerinde belirlenen bütçe limiti aşılmış."
        )

    # 4. En çok artan kategori
    comparison_items = monthly_comparison.get("comparison", [])

    high_increases = [
        item for item in comparison_items
        if item.get("change_percent") is not None
        and item.get("change_percent") > 50
        and item.get("difference", 0) > 0
    ]

    if high_increases:
        score -= 10
        top_increase = high_increases[0]

        reasons.append(
            f"{top_increase['category']} harcamalarında geçen aya göre belirgin artış var."
        )

    # 5. Abonelik yükü
    recurring_items = recurring_payments.get("recurring_payments", [])

    recurring_total = sum(
        item.get("average_amount", 0)
        for item in recurring_items
    )

    if total_income > 0:
        recurring_ratio = (recurring_total / total_income) * 100

        if recurring_ratio > 15:
            score -= 10
            reasons.append(
                "Tekrar eden ödemelerin gelire göre yüksek seviyede."
            )
        elif recurring_ratio > 8:
            score -= 5
            reasons.append(
                "Tekrar eden ödemeler bütçede dikkat çeken bir pay oluşturuyor."
            )

    # 6. Sık harcama alışkanlıkları
    frequent_sub_categories = spending_habits.get(
        "frequent_sub_categories",
        []
    )

    if frequent_sub_categories:
        top_habit = frequent_sub_categories[0]

        if top_habit.get("count", 0) >= 4:
            score -= 8
            reasons.append(
                f"{top_habit['sub_category']} alanında sık tekrar eden harcamalar var."
            )
        elif top_habit.get("count", 0) >= 2:
            score -= 4
            reasons.append(
                f"{top_habit['sub_category']} alanında tekrar eden harcamalar dikkat çekiyor."
            )

    # Skoru 0-100 arasında tut
    score = max(0, min(100, round(score)))

    if score >= 85:
        status = "Çok iyi"
        message = "Bütçe yönetimin genel olarak dengeli görünüyor."
    elif score >= 70:
        status = "İyi"
        message = "Genel durum iyi, ancak bazı kategorilerde dikkat edilebilir."
    elif score >= 50:
        status = "Dikkat edilmeli"
        message = "Bazı harcama alanları bütçeni zorlamaya başlamış olabilir."
    else:
        status = "Riskli"
        message = "Bu ay bütçe dengen zayıf görünüyor; harcamaları gözden geçirmek faydalı olabilir."

    positive_points = []

    if remaining_budget > 0:
        positive_points.append(
            "Ay sonunda pozitif bütçe kalmış."
        )

    if not exceeded_budgets and budget_status:
        positive_points.append(
            "Belirlediğin bütçe limitleri aşılmamış."
        )

    if total_income > 0 and expense_ratio <= 75:
        positive_points.append(
            "Giderlerin gelirine göre kontrol edilebilir seviyede."
        )

    return {
        "score": score,
        "status": status,
        "message": message,
        "reasons": reasons,
        "positive_points": positive_points,
        "metrics": {
            "expense_ratio": round(expense_ratio, 2),
            "recurring_total": round(recurring_total, 2),
            "recurring_ratio": round(
                (recurring_total / total_income) * 100,
                2
            ) if total_income > 0 else 0,
            "exceeded_budget_count": len(exceeded_budgets)
        }
    }