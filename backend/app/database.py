import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base


def _resolve_database_url() -> str:
    explicit_url = os.getenv("DATABASE_URL")
    if explicit_url:
        return explicit_url

    vercel_postgres_url = (
        os.getenv("POSTGRES_URL_NON_POOLING")
        or os.getenv("POSTGRES_URL")
        or os.getenv("POSTGRES_PRISMA_URL")
    )

    if vercel_postgres_url:
        if vercel_postgres_url.startswith("postgres://"):
            vercel_postgres_url = "postgresql://" + vercel_postgres_url[len("postgres://"):]

        if "sslmode=" not in vercel_postgres_url:
            separator = "&" if "?" in vercel_postgres_url else "?"
            vercel_postgres_url = f"{vercel_postgres_url}{separator}sslmode=require"

        return vercel_postgres_url

    if os.getenv("VERCEL"):
        return "sqlite:////tmp/spendwise.db"

    return "sqlite:///./spendwise.db"


DATABASE_URL = _resolve_database_url()

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
