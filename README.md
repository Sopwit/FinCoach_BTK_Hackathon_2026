# FinCoach — AI Destekli Finansal Koç

<div align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.136-009688?logo=fastapi)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python)
![License](https://img.shields.io/badge/License-MIT-yellow)

**BTK Hackathon 2026 — Finansal Farkındalık Kategorisi**

</div>

FinCoach, gelir-gider kayıtlarını analiz eden, kategori bazlı bütçe takibi yapan ve **Google Gemini AI** destekli kişisel finans önerileri üreten bir harcama yönetimi uygulamasıdır.

> 🏆 **Hackathon için tasarlandı:** Çalışan demo senaryosu, offline mock API, tek tıkla örnek veri yükleme ve etkileyici UI ile sunuma hazır.

---

## ✨ Özellikler

- **Gelir/Gider Yönetimi** — Ekleme, düzenleme, silme, CSV/XLSX toplu içe aktarma
- **Bütçe Takibi** — Kategori bazlı limit belirleme ve aşım uyarıları
- **Finansal Analiz** — Aylık karşılaştırma, tekrar eden ödemeler, harcama alışkanlıkları
- **AI Danışman** — Google Gemini ile kişisel finans analizi ve tasarruf önerileri
- **Finansal Sağlık Skoru** — Harcama alışkanlıklarına göre 0-100 arası puan
- **Sohbet Asistanı** — FinCoach Chat ile verileriniz üzerinden soru sorun
- **Mock/Offline Mod** — Backend olmadan tam çalışma (sunum için ideal)
- **Demo Senaryo** — Örnek öğrenci profiliyle tek tıkla başlangıç

---

## 🛠 Teknoloji Stack'i

| Katman | Teknoloji |
|--------|-----------|
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, Framer Motion, Recharts, React Router 7 |
| **Backend** | FastAPI, SQLAlchemy 2.0, Pydantic v2, Google Gemini API |
| **Veritabanı** | SQLite (lokal) / PostgreSQL (Neon, production) |
| **Auth** | JWT (PyJWT) + bcrypt şifreleme |
| **Deployment** | Vercel (Frontend + Serverless Python API) |
| **Güvenlik** | Rate limiting (slowapi), CORS yapılandırması |

---

## 📁 Proje Yapısı

```
FinCoach_BTK_Hackathon_2026/
├── api/index.py             # Vercel serverless entry
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI uygulama + middleware
│   │   ├── auth.py          # JWT token yönetimi
│   │   ├── database.py      # SQLAlchemy engine
│   │   ├── models.py        # User, Transaction, Budget
│   │   ├── schemas.py       # Pydantic şemaları
│   │   ├── crud.py          # Veritabanı işlemleri
│   │   ├── routers/         # 8 API router
│   │   └── services/        # analiz, kategori, AI servisleri
│   ├── tests/               # Pytest testleri
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/           # Auth, Dashboard, Transactions, Budgets, Insights
│   │   ├── components/      # AppLayout, Sidebar, Topbar, Chatbot
│   │   ├── services/        # api.js, mockApi.js, client.js
│   │   ├── context/         # DemoContext
│   │   ├── data/            # Mock veriler
│   │   └── utils/           # formatCurrency, formatDate
│   └── .env.example
├── vercel.json
├── pyproject.toml
└── .gitignore
```

---

## 🚀 Kurulum

### Gereksinimler
- Python ≥3.12, <3.13
- Node.js 20+
- Gemini API key ([Google AI Studio](https://aistudio.google.com/))

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

`.env` dosyasına Gemini API anahtarınızı ekleyin:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Backend'i çalıştırın:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

API dökümantasyonu: http://127.0.0.1:8000/docs

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Uygulama http://localhost:5173 adresinde açılır.

### Test

```bash
cd backend
pytest tests/ -v
```

---

## 📊 Kullanım Akışı

1. **Giriş** — Hesap oluşturun veya "Örnek Öğrenci Profiliyle Başla" butonuna tıklayın
2. **İşlemler** — Harcama Yönetimi sayfasından manuel işlem ekleyin veya CSV/XLSX yükleyin
3. **Bütçeler** — Kategori limitlerinizi belirleyin
4. **Dashboard** — Gelir, gider, kalan bütçe ve uyarıları tek panelde izleyin
5. **İçgörüler** — Aylık karşılaştırma, tekrar eden ödemeler, AI tasarruf planı
6. **AI Sohbet** — FinCoach Chat ile verileriniz üzerinden soru sorun

---

## 🌐 Vercel Deployment

```bash
# Vercel CLI kurulumu
npm i -g vercel

# Build ve deploy (Python 3.12+ gerekli)
vercel --prod
```

> ⚠️ **Not:** Lokal Vercel build'i Python 3.12+ gerektirir. Vercel'in cloud altyapısı Python 3.12'yi destekler. `vercel.json` içinde `@vercel/python` builder kullanılır.

### Production için environment değişkenleri:
| Değişken | Açıklama |
|----------|----------|
| `GEMINI_API_KEY` | Google Gemini API anahtarı |
| `DATABASE_URL` | PostgreSQL bağlantı dizesi (Neon) |
| `JWT_SECRET_KEY` | JWT imzalama anahtarı |
| `CORS_ORIGINS` | İzin verilen originler (virgülle ayrılmış) |

---

## 🔒 Güvenlik

- JWT token bazlı kimlik doğrulama
- bcrypt ile şifre hashleme
- Rate limiting (dakikada 60 istek)
- Yapılandırılabilir CORS
- `.env` dosyaları git'te tutulmaz

---

## 📝 Lisans

[MIT](LICENSE) © 2026 SurhayKoc

---

<div align="center">
  <strong>BTK Hackathon 2026 — Finansal Farkındalık Kategorisi</strong>
</div>
