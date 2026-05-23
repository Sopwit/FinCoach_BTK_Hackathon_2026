import bcrypt
from calendar import monthrange
from datetime import date
from typing import Optional

from sqlalchemy.orm import Session

from app import models, schemas
from app.services.categorizer import detect_category, detect_sub_category


def hash_password(password: str) -> str:
    return bcrypt.hashpw(
        password.encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(
        password.encode("utf-8"), password_hash.encode("utf-8")
    )


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=hash_password(user.password) if user.password else None,
        monthly_income=user.monthly_income
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_users(db: Session):
    return db.query(models.User).all()


def create_transaction(db: Session, transaction: schemas.TransactionCreate):
    tx_type = transaction.type.strip().lower()

    if tx_type not in ["income", "expense"]:
        raise ValueError("Transaction type must be 'income' or 'expense'")

    category = transaction.category
    sub_category = transaction.sub_category

    if not category:
        category = detect_category(
            description=transaction.description,
            tx_type=tx_type
        )

    if not sub_category:
        sub_category = detect_sub_category(
            description=transaction.description
        )

    amount = transaction.amount

    if tx_type == "expense" and amount > 0:
        amount = -amount

    if tx_type == "income" and amount < 0:
        amount = abs(amount)

    db_transaction = models.Transaction(
        user_id=transaction.user_id,
        date=transaction.date,
        description=transaction.description,
        amount=amount,
        type=tx_type,
        category=category,
        sub_category=sub_category,
        source=transaction.source,
        note=transaction.note
    )

    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)

    return db_transaction


def get_transactions(
    db: Session,
    user_id: Optional[int] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
    tx_type: Optional[str] = None,
    category: Optional[str] = None,
    source: Optional[str] = None,
    search: Optional[str] = None
):
    query = db.query(models.Transaction)

    if user_id is not None:
        query = query.filter(models.Transaction.user_id == user_id)

    if year and month:
        last_day = monthrange(year, month)[1]
        start_date = date(year, month, 1)
        end_date = date(year, month, last_day)

        query = query.filter(
            models.Transaction.date >= start_date,
            models.Transaction.date <= end_date
        )

    elif year:
        start_date = date(year, 1, 1)
        end_date = date(year, 12, 31)

        query = query.filter(
            models.Transaction.date >= start_date,
            models.Transaction.date <= end_date
        )

    if tx_type:
        query = query.filter(
            models.Transaction.type == tx_type.strip().lower()
        )

    if category:
        query = query.filter(
            models.Transaction.category.ilike(category.strip())
        )

    if source:
        query = query.filter(
            models.Transaction.source == source.strip().lower()
        )

    if search:
        query = query.filter(
            models.Transaction.description.ilike(f"%{search.strip()}%")
        )

    return query.order_by(models.Transaction.date.desc()).all()


def delete_transactions(
    db: Session,
    user_id: int,
    year: Optional[int] = None,
    month: Optional[int] = None
):
    transactions = get_transactions(
        db=db,
        user_id=user_id,
        year=year,
        month=month
    )

    deleted_count = len(transactions)

    for transaction in transactions:
        db.delete(transaction)

    db.commit()

    return deleted_count


def create_many_transactions(
    db: Session,
    transactions: list[schemas.TransactionCreate],
    skip_duplicates: bool = True
):
    created_transactions = []
    skipped_count = 0

    for transaction in transactions:
        tx_type = transaction.type.strip().lower()
        amount = transaction.amount

        if tx_type == "expense" and amount > 0:
            amount = -amount

        if tx_type == "income" and amount < 0:
            amount = abs(amount)

        exists = transaction_exists(
            db=db,
            user_id=transaction.user_id,
            date=transaction.date,
            description=transaction.description,
            amount=amount,
            tx_type=tx_type
        )

        if skip_duplicates and exists:
            skipped_count += 1
            continue

        created_transaction = create_transaction(db=db, transaction=transaction)
        created_transactions.append(created_transaction)

    return {
        "created_transactions": created_transactions,
        "skipped_count": skipped_count
    }


def get_transaction(db: Session, transaction_id: int):
    return (
        db.query(models.Transaction)
        .filter(models.Transaction.id == transaction_id)
        .first()
    )


def update_transaction(
    db: Session,
    transaction_id: int,
    transaction_update: schemas.TransactionUpdate
):
    db_transaction = get_transaction(db=db, transaction_id=transaction_id)

    if not db_transaction:
        return None

    update_data = transaction_update.model_dump(exclude_unset=True)

    if "type" in update_data and update_data["type"]:
        update_data["type"] = update_data["type"].strip().lower()

        if update_data["type"] not in ["income", "expense"]:
            raise ValueError("Transaction type must be 'income' or 'expense'")

    # Alanları güncelle
    for field, value in update_data.items():
        setattr(db_transaction, field, value)

    # Güncellemeden sonra kategori otomatik tekrar hesaplansın
    tx_type = db_transaction.type.strip().lower()

    if tx_type not in ["income", "expense"]:
        raise ValueError("Transaction type must be 'income' or 'expense'")

    if not transaction_update.category:
        db_transaction.category = detect_category(
            description=db_transaction.description,
            tx_type=tx_type
        )

    if not transaction_update.sub_category:
        db_transaction.sub_category = detect_sub_category(
            description=db_transaction.description
        )

    # Tutar işaretini düzelt
    if tx_type == "expense" and db_transaction.amount > 0:
        db_transaction.amount = -db_transaction.amount

    if tx_type == "income" and db_transaction.amount < 0:
        db_transaction.amount = abs(db_transaction.amount)

    db_transaction.type = tx_type

    db.commit()
    db.refresh(db_transaction)

    return db_transaction


def delete_transaction(db: Session, transaction_id: int):
    db_transaction = get_transaction(db=db, transaction_id=transaction_id)

    if not db_transaction:
        return None

    db.delete(db_transaction)
    db.commit()

    return db_transaction


def has_demo_transactions(db: Session, user_id: int):
    return (
        db.query(models.Transaction)
        .filter(models.Transaction.user_id == user_id)
        .filter(models.Transaction.source == "demo")
        .first()
        is not None
    )


def delete_demo_transactions(db: Session, user_id: int):
    demo_transactions = (
        db.query(models.Transaction)
        .filter(models.Transaction.user_id == user_id)
        .filter(models.Transaction.source == "demo")
        .all()
    )

    deleted_count = len(demo_transactions)

    for transaction in demo_transactions:
        db.delete(transaction)

    db.commit()

    return deleted_count


def transaction_exists(
    db: Session,
    user_id: int,
    date,
    description: str,
    amount: float,
    tx_type: str
):
    normalized_description = description.strip().lower()
    normalized_type = tx_type.strip().lower()

    if normalized_type == "expense" and amount > 0:
        amount = -amount

    if normalized_type == "income" and amount < 0:
        amount = abs(amount)

    return (
        db.query(models.Transaction)
        .filter(models.Transaction.user_id == user_id)
        .filter(models.Transaction.date == date)
        .filter(models.Transaction.description.ilike(normalized_description))
        .filter(models.Transaction.amount == amount)
        .filter(models.Transaction.type == normalized_type)
        .first()
        is not None
    )


def create_budget(db: Session, budget: schemas.BudgetCreate):
    category = budget.category.strip()

    existing_budget = (
        db.query(models.Budget)
        .filter(models.Budget.user_id == budget.user_id)
        .filter(models.Budget.category.ilike(category))
        .first()
    )

    if existing_budget:
        existing_budget.monthly_limit = budget.monthly_limit
        db.commit()
        db.refresh(existing_budget)
        return existing_budget

    db_budget = models.Budget(
        user_id=budget.user_id,
        category=category,
        monthly_limit=budget.monthly_limit
    )

    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)

    return db_budget


def get_budgets(db: Session, user_id: int):
    return (
        db.query(models.Budget)
        .filter(models.Budget.user_id == user_id)
        .order_by(models.Budget.category.asc())
        .all()
    )


def get_budget(db: Session, budget_id: int):
    return (
        db.query(models.Budget)
        .filter(models.Budget.id == budget_id)
        .first()
    )


def update_budget(
    db: Session,
    budget_id: int,
    budget_update: schemas.BudgetUpdate
):
    db_budget = get_budget(db=db, budget_id=budget_id)

    if not db_budget:
        return None

    update_data = budget_update.model_dump(exclude_unset=True)

    if "category" in update_data and update_data["category"]:
        update_data["category"] = update_data["category"].strip()

    for field, value in update_data.items():
        setattr(db_budget, field, value)

    db.commit()
    db.refresh(db_budget)

    return db_budget


def delete_budget(db: Session, budget_id: int):
    db_budget = get_budget(db=db, budget_id=budget_id)

    if not db_budget:
        return None

    db.delete(db_budget)
    db.commit()

    return db_budget
