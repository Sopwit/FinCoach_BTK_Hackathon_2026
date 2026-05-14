from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db

router = APIRouter(
    prefix="/demo",
    tags=["Demo"]
)


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
    demo_transactions = [
        {
            "date": date(2026, 4, 1),
            "description": "KYK Burs",
            "amount": 3000,
            "type": "income",
            "note": "Nisan KYK bursu"
        },
        {
            "date": date(2026, 4, 1),
            "description": "Aile Desteği",
            "amount": 2000,
            "type": "income",
            "note": "Nisan aile desteği"
        },
        {
            "date": date(2026, 4, 2),
            "description": "BIM Market",
            "amount": 380,
            "type": "expense",
            "note": "Market alışverişi"
        },
        {
            "date": date(2026, 4, 3),
            "description": "Trendyol Yemek",
            "amount": 260,
            "type": "expense",
            "note": "Yemek siparişi"
        },
        {
            "date": date(2026, 4, 5),
            "description": "Spotify",
            "amount": 59.99,
            "type": "expense",
            "note": "Müzik aboneliği"
        },
        {
            "date": date(2026, 4, 7),
            "description": "Kahve Dünyası",
            "amount": 120,
            "type": "expense",
            "note": "Kafe harcaması"
        },
        {
            "date": date(2026, 4, 10),
            "description": "Otobus Kart Dolum",
            "amount": 150,
            "type": "expense",
            "note": "Ulaşım"
        },
        {
            "date": date(2026, 4, 12),
            "description": "Netflix",
            "amount": 229.99,
            "type": "expense",
            "note": "Dijital abonelik"
        },
        {
            "date": date(2026, 4, 16),
            "description": "Yemeksepeti",
            "amount": 300,
            "type": "expense",
            "note": "Yemek siparişi"
        },
        {
            "date": date(2026, 4, 20),
            "description": "A101 Market",
            "amount": 250,
            "type": "expense",
            "note": "Market alışverişi"
        },
        {
            "date": date(2026, 4, 26),
            "description": "Telefon Faturası",
            "amount": 185,
            "type": "expense",
            "note": "Telefon faturası"
        },
        {
            "date": date(2026, 5, 1),
            "description": "KYK Burs",
            "amount": 3000,
            "type": "income",
            "note": "Mayıs KYK bursu"
        },
        {
            "date": date(2026, 5, 1),
            "description": "Aile Desteği",
            "amount": 2000,
            "type": "income",
            "note": "Mayıs aile desteği"
        },
        {
            "date": date(2026, 5, 2),
            "description": "BIM Market",
            "amount": 480,
            "type": "expense",
            "note": "Market alışverişi"
        },
        {
            "date": date(2026, 5, 3),
            "description": "Trendyol Yemek",
            "amount": 430,
            "type": "expense",
            "note": "Yemek siparişi"
        },
        {
            "date": date(2026, 5, 5),
            "description": "Spotify",
            "amount": 59.99,
            "type": "expense",
            "note": "Müzik aboneliği"
        },
        {
            "date": date(2026, 5, 7),
            "description": "Starbucks",
            "amount": 180,
            "type": "expense",
            "note": "Kafe harcaması"
        },
        {
            "date": date(2026, 5, 10),
            "description": "Otobus Kart Dolum",
            "amount": 180,
            "type": "expense",
            "note": "Ulaşım"
        },
        {
            "date": date(2026, 5, 12),
            "description": "Netflix",
            "amount": 229.99,
            "type": "expense",
            "note": "Dijital abonelik"
        },
        {
            "date": date(2026, 5, 15),
            "description": "Yemeksepeti",
            "amount": 470,
            "type": "expense",
            "note": "Yemek siparişi"
        },
        {
            "date": date(2026, 5, 20),
            "description": "Migros Market",
            "amount": 620,
            "type": "expense",
            "note": "Market alışverişi"
        },
        {
            "date": date(2026, 5, 26),
            "description": "Telefon Faturası",
            "amount": 185,
            "type": "expense",
            "note": "Telefon faturası"
        },
        {
            "date": date(2026, 5, 28),
            "description": "Getir Yemek",
            "amount": 390,
            "type": "expense",
            "note": "Yemek siparişi"
        }
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