import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.database import Base, engine
from app.routers import ai, analytics, budgets, chat, dashboard, demo, transactions, users
Base.metadata.create_all(bind=engine)


def _rate_limit_key(request):
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)


limiter = Limiter(key_func=_rate_limit_key, default_limits=["60/minute"])

app = FastAPI(
    title="Akıllı Harcama Dedektifi API",
    description="Kullanıcı harcamalarını analiz eden finansal farkındalık sistemi.",
    version="0.1.0"
)

app.state.limiter = limiter


async def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={"detail": "Çok fazla istek gönderdiniz. Lütfen bekleyin."},
    )


app.add_exception_handler(RateLimitExceeded, rate_limit_handler)

ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS != ["*"] else ["*"],
    allow_credentials=ALLOWED_ORIGINS != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SlowAPIMiddleware)

app.include_router(users.router)
app.include_router(transactions.router)
app.include_router(demo.router)
app.include_router(analytics.router)
app.include_router(ai.router)
app.include_router(chat.router)
app.include_router(dashboard.router)
app.include_router(budgets.router)

@app.get("/")
def root():
    return {
        "message": "Akıllı Harcama Dedektifi API çalışıyor."
    }
