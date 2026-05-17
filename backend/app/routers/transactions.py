from typing import List, Optional

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db

router = APIRouter(
    prefix="/transactions",
    tags=["Transactions"]
)


@router.post("/manual", response_model=schemas.TransactionResponse)
def create_manual_transaction(
    transaction: schemas.TransactionCreate,
    db: Session = Depends(get_db)
):
    user = crud.get_user(db=db, user_id=transaction.user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    transaction.source = "manual"

    return crud.create_transaction(db=db, transaction=transaction)

@router.get("/", response_model=List[schemas.TransactionResponse])
def list_transactions(
    user_id: Optional[int] = Query(default=None),
    year: Optional[int] = Query(default=None),
    month: Optional[int] = Query(default=None),
    type: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    source: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    db: Session = Depends(get_db)
):
    return crud.get_transactions(
        db=db,
        user_id=user_id,
        year=year,
        month=month,
        tx_type=type,
        category=category,
        source=source,
        search=search
    )
@router.post("/upload", response_model=schemas.BulkTransactionResponse)
async def upload_transactions_file(
    user_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    user = crud.get_user(db=db, user_id=user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    filename = file.filename.lower()

    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(file.file)
        elif filename.endswith(".xlsx") or filename.endswith(".xls"):
            df = pd.read_excel(file.file)
        else:
            raise HTTPException(
                status_code=400,
                detail="Only CSV or Excel files are supported"
            )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"File could not be read: {str(e)}"
        )

    required_columns = {"date", "description", "amount", "type"}

    if not required_columns.issubset(set(df.columns)):
        raise HTTPException(
            status_code=400,
            detail="File must contain these columns: date, description, amount, type"
        )

    transactions_to_create = []

    for _, row in df.iterrows():
        try:
            tx_date = pd.to_datetime(row["date"]).date()
            description = str(row["description"])
            amount = float(row["amount"])
            tx_type = str(row["type"]).strip().lower()

            if tx_type not in ["income", "expense"]:
                continue

            transaction = schemas.TransactionCreate(
                user_id=user_id,
                date=tx_date,
                description=description,
                amount=amount,
                type=tx_type,
                source="csv"
            )

            transactions_to_create.append(transaction)

        except Exception:
            continue

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


@router.delete("/")
def delete_transactions(
    user_id: int = Query(...),
    year: Optional[int] = Query(default=None),
    month: Optional[int] = Query(default=None),
    db: Session = Depends(get_db)
):
    user = crud.get_user(db=db, user_id=user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    deleted_count = crud.delete_transactions(
        db=db,
        user_id=user_id,
        year=year,
        month=month
    )

    return {
        "message": "Transactions deleted successfully",
        "deleted_count": deleted_count
    }


@router.put("/{transaction_id}", response_model=schemas.TransactionResponse)
def update_transaction(
    transaction_id: int,
    transaction_update: schemas.TransactionUpdate,
    db: Session = Depends(get_db)
):
    try:
        updated_transaction = crud.update_transaction(
            db=db,
            transaction_id=transaction_id,
            transaction_update=transaction_update
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not updated_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    return updated_transaction


@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db)
):
    deleted_transaction = crud.delete_transaction(
        db=db,
        transaction_id=transaction_id
    )

    if not deleted_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    return {
        "message": "Transaction deleted successfully",
        "deleted_transaction_id": transaction_id
    }
