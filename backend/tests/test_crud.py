from datetime import date

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app import crud, schemas

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    test_db = TestingSessionLocal()
    try:
        yield test_db
    finally:
        test_db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def sample_user(db):
    user = schemas.UserCreate(
        name="Test Kullanici",
        email="test@test.com",
        password="test123",
        monthly_income=10000,
    )
    return crud.create_user(db=db, user=user)


class TestUserCRUD:
    def test_create_user(self, db):
        user = schemas.UserCreate(
            name="Test",
            email="test@test.com",
            password="secret",
            monthly_income=5000,
        )
        result = crud.create_user(db=db, user=user)
        assert result.name == "Test"
        assert result.monthly_income == 5000
        assert result.id is not None

    def test_password_hashing(self, db):
        user = schemas.UserCreate(
            name="Password Test",
            email="pw@test.com",
            password="mysecret123",
            monthly_income=3000,
        )
        result = crud.create_user(db=db, user=user)
        assert result.password_hash is not None
        assert result.password_hash != "mysecret123"
        assert crud.verify_password("mysecret123", result.password_hash) is True
        assert crud.verify_password("wrong", result.password_hash) is False

    def test_get_user(self, db, sample_user):
        result = crud.get_user(db=db, user_id=sample_user.id)
        assert result is not None
        assert result.email == "test@test.com"

    def test_get_user_not_found(self, db):
        result = crud.get_user(db=db, user_id=999)
        assert result is None


class TestTransactionCRUD:
    def test_create_transaction(self, db, sample_user):
        tx = schemas.TransactionCreate(
            user_id=sample_user.id,
            date=date(2026, 5, 1),
            description="Test harcama",
            amount=250.0,
            type="expense",
            source="manual",
        )
        result = crud.create_transaction(db=db, transaction=tx)
        assert result.description == "Test harcama"
        assert result.amount < 0
        assert result.category is not None

    def test_create_income_transaction(self, db, sample_user):
        tx = schemas.TransactionCreate(
            user_id=sample_user.id,
            date=date(2026, 5, 1),
            description="Maas",
            amount=5000.0,
            type="income",
            source="manual",
        )
        result = crud.create_transaction(db=db, transaction=tx)
        assert result.type == "income"
        assert result.amount > 0

    def test_get_transactions_by_month(self, db, sample_user):
        for day in [1, 15, 20]:
            crud.create_transaction(
                db=db,
                transaction=schemas.TransactionCreate(
                    user_id=sample_user.id,
                    date=date(2026, 5, day),
                    description=f"Harcama {day}",
                    amount=100.0,
                    type="expense",
                    source="manual",
                ),
            )

        results = crud.get_transactions(
            db=db, user_id=sample_user.id, year=2026, month=5
        )
        assert len(results) == 3


class TestBudgetCRUD:
    def test_create_budget(self, db, sample_user):
        budget = schemas.BudgetCreate(
            user_id=sample_user.id,
            category="Yemek",
            monthly_limit=1500,
        )
        result = crud.create_budget(db=db, budget=budget)
        assert result.category == "Yemek"
        assert result.monthly_limit == 1500

    def test_create_duplicate_budget_updates(self, db, sample_user):
        b1 = crud.create_budget(
            db=db,
            budget=schemas.BudgetCreate(
                user_id=sample_user.id, category="Yemek", monthly_limit=1000
            ),
        )
        b2 = crud.create_budget(
            db=db,
            budget=schemas.BudgetCreate(
                user_id=sample_user.id, category="Yemek", monthly_limit=2000
            ),
        )
        assert b1.id == b2.id
        assert b2.monthly_limit == 2000
