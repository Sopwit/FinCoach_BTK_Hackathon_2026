from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, field_validator


class UserCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    monthly_income: float = 0

    @field_validator("name")
    @classmethod
    def validate_name(cls, value):
        value = value.strip()

        if len(value) < 2:
            raise ValueError("name en az 2 karakter olmalıdır")

        return value

    @field_validator("monthly_income")
    @classmethod
    def validate_monthly_income(cls, value):
        if value < 0:
            raise ValueError("monthly_income negatif olamaz")

        return value


class UserResponse(BaseModel):
    id: int
    name: str
    email: Optional[str]
    monthly_income: float
    created_at: datetime

    class Config:
        from_attributes = True


class TransactionCreate(BaseModel):
    user_id: int
    date: date
    description: str
    amount: float
    type: str
    category: Optional[str] = None
    sub_category: Optional[str] = None
    source: str = "manual"
    note: Optional[str] = None

    @field_validator("description")
    @classmethod
    def validate_description(cls, value):
        value = value.strip()

        if len(value) < 2:
            raise ValueError("description en az 2 karakter olmalıdır")

        return value

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, value):
        if value == 0:
            raise ValueError("amount 0 olamaz")

        return value

    @field_validator("type")
    @classmethod
    def validate_type(cls, value):
        value = value.strip().lower()

        if value not in ["income", "expense"]:
            raise ValueError("type sadece 'income' veya 'expense' olabilir")

        return value

    @field_validator("source")
    @classmethod
    def validate_source(cls, value):
        value = value.strip().lower()

        if value not in ["manual", "csv", "demo"]:
            raise ValueError("source sadece 'manual', 'csv' veya 'demo' olabilir")

        return value


class TransactionResponse(BaseModel):
    id: int
    user_id: int
    date: date
    description: str
    amount: float
    type: str
    category: str
    sub_category: Optional[str]
    source: str
    note: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
        
class BulkTransactionResponse(BaseModel):
    inserted_count: int
    skipped_count: int = 0
    transactions: list[TransactionResponse]

    class Config:
        from_attributes = True
class TransactionUpdate(BaseModel):
    date: Optional[date] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    type: Optional[str] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    note: Optional[str] = None

    @field_validator("description")
    @classmethod
    def validate_description(cls, value):
        if value is None:
            return value

        value = value.strip()

        if len(value) < 2:
            raise ValueError("description en az 2 karakter olmalıdır")

        return value

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, value):
        if value is None:
            return value

        if value == 0:
            raise ValueError("amount 0 olamaz")

        return value

    @field_validator("type")
    @classmethod
    def validate_type(cls, value):
        if value is None:
            return value

        value = value.strip().lower()

        if value not in ["income", "expense"]:
            raise ValueError("type sadece 'income' veya 'expense' olabilir")

        return value
class BudgetCreate(BaseModel):
    user_id: int
    category: str
    monthly_limit: float

    @field_validator("category")
    @classmethod
    def validate_category(cls, value):
        value = value.strip()

        if len(value) < 2:
            raise ValueError("category en az 2 karakter olmalıdır")

        return value

    @field_validator("monthly_limit")
    @classmethod
    def validate_monthly_limit(cls, value):
        if value <= 0:
            raise ValueError("monthly_limit 0'dan büyük olmalıdır")

        return value


class BudgetUpdate(BaseModel):
    category: Optional[str] = None
    monthly_limit: Optional[float] = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, value):
        if value is None:
            return value

        value = value.strip()

        if len(value) < 2:
            raise ValueError("category en az 2 karakter olmalıdır")

        return value

    @field_validator("monthly_limit")
    @classmethod
    def validate_monthly_limit(cls, value):
        if value is None:
            return value

        if value <= 0:
            raise ValueError("monthly_limit 0'dan büyük olmalıdır")

        return value


class BudgetResponse(BaseModel):
    id: int
    user_id: int
    category: str
    monthly_limit: float
    created_at: datetime

    class Config:
        from_attributes = True