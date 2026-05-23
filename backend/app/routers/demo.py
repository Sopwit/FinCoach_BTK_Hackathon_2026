from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db

router = APIRouter(
    prefix="/demo",
    tags=["Demo"]
)


def _demo_month_offset(months_ago: int) -> tuple[int, int]:
    today = datetime.now(timezone.utc)
    target_month = today.month - months_ago
    target_year = today.year
    while target_month < 1:
        target_month += 12
        target_year -= 1
    return target_year, target_month


@router.post("/load-student-data", response_model=schemas.BulkTransactionResponse)
def load_student_demo_data(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = crud.get_user(db=db, user_id=user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if crud.has_demo_transactions(db=db, user_id=user_id):
        raise HTTPException(
            status_code=400,
            detail="Demo data has already been loaded for this user"
        )

    prev_y, prev_m = _demo_month_offset(1)
    curr_y, curr_m = _demo_month_offset(0)

    demo_transactions = [
        {"date": date(prev_y, prev_m, 1), "description": "KYK Burs", "amount": 3000, "type": "income", "note": f"Aylık KYK bursu"},
        {"date": date(prev_y, prev_m, 1), "description": "Aile Desteği", "amount": 2000, "type": "income", "note": "Aile desteği"},
        {"date": date(prev_y, prev_m, 2), "description": "BIM Market", "amount": 380, "type": "expense", "note": "Market alışverişi"},
        {"date": date(prev_y, prev_m, 3), "description": "Trendyol Yemek", "amount": 260, "type": "expense", "note": "Yemek siparişi"},
        {"date": date(prev_y, prev_m, 5), "description": "Spotify", "amount": 59.99, "type": "expense", "note": "Müzik aboneliği"},
        {"date": date(prev_y, prev_m, 7), "description": "Kahve Dünyası", "amount": 120, "type": "expense", "note": "Kafe harcaması"},
        {"date": date(prev_y, prev_m, 10), "description": "Otobus Kart Dolum", "amount": 150, "type": "expense", "note": "Ulaşım"},
        {"date": date(prev_y, prev_m, 12), "description": "Netflix", "amount": 229.99, "type": "expense", "note": "Dijital abonelik"},
        {"date": date(prev_y, prev_m, 16), "description": "Yemeksepeti", "amount": 300, "type": "expense", "note": "Yemek siparişi"},
        {"date": date(prev_y, prev_m, 20), "description": "A101 Market", "amount": 250, "type": "expense", "note": "Market alışverişi"},
        {"date": date(prev_y, prev_m, 26), "description": "Telefon Faturası", "amount": 185, "type": "expense", "note": "Telefon faturası"},
        {"date": date(curr_y, curr_m, 1), "description": "KYK Burs", "amount": 3000, "type": "income", "note": f"Aylık KYK bursu"},
        {"date": date(curr_y, curr_m, 1), "description": "Aile Desteği", "amount": 2000, "type": "income", "note": "Aile desteği"},
        {"date": date(curr_y, curr_m, 2), "description": "BIM Market", "amount": 480, "type": "expense", "note": "Market alışverişi"},
        {"date": date(curr_y, curr_m, 3), "description": "Trendyol Yemek", "amount": 430, "type": "expense", "note": "Yemek siparişi"},
        {"date": date(curr_y, curr_m, 5), "description": "Spotify", "amount": 59.99, "type": "expense", "note": "Müzik aboneliği"},
        {"date": date(curr_y, curr_m, 7), "description": "Starbucks", "amount": 180, "type": "expense", "note": "Kafe harcaması"},
        {"date": date(curr_y, curr_m, 10), "description": "Otobus Kart Dolum", "amount": 180, "type": "expense", "note": "Ulaşım"},
        {"date": date(curr_y, curr_m, 12), "description": "Netflix", "amount": 229.99, "type": "expense", "note": "Dijital abonelik"},
        {"date": date(curr_y, curr_m, 15), "description": "Yemeksepeti", "amount": 470, "type": "expense", "note": "Yemek siparişi"},
        {"date": date(curr_y, curr_m, 20), "description": "Migros Market", "amount": 620, "type": "expense", "note": "Market alışverişi"},
        {"date": date(curr_y, curr_m, 26), "description": "Telefon Faturası", "amount": 185, "type": "expense", "note": "Telefon faturası"},
        {"date": date(curr_y, curr_m, 28), "description": "Getir Yemek", "amount": 390, "type": "expense", "note": "Yemek siparişi"},
    ]

    transactions_to_create = [
        schemas.TransactionCreate(
            user_id=user_id,
            date=item["date"],
            description=item["description"],
            amount=item["amount"],
            type=item["type"],
            source="demo",
            note=item["note"]
        )
        for item in demo_transactions
    ]

    result = crud.create_many_transactions(
    db=db,
    transactions=transactions_to_create,
    skip_duplicates=True
)

    created_transactions = result["created_transactions"]
    skipped_count = result["skipped_count"]

    return {
    "inserted_count": len(created_transactions),
    "skipped_count": skipped_count,
    "transactions": created_transactions
}


@router.delete("/clear-student-data")
def clear_student_demo_data(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = crud.get_user(db=db, user_id=user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    deleted_count = crud.delete_demo_transactions(
        db=db,
        user_id=user_id
    )

    return {
        "message": "Demo data cleared successfully",
        "deleted_count": deleted_count
    }