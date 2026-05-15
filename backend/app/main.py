from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import ai, analytics, budgets, chat, dashboard, demo, transactions, users
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Akıllı Harcama Dedektifi API",
    description="Kullanıcı harcamalarını analiz eden finansal farkındalık backend sistemi.",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
