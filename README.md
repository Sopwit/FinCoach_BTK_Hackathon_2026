# FinCoach

FinCoach, gelir-gider kayıtlarını analiz eden, kategori bazlı bütçe takibi yapan ve AI destekli kişisel finans önerileri üreten bir harcama yönetimi uygulamasıdır. Kullanıcı manuel işlem ekleyebilir, CSV/Excel dosyası yükleyebilir, bütçe limitleri tanımlayabilir ve harcama alışkanlıklarını tek panelden takip edebilir.

## Özellikler

- Gelir/gider işlemi ekleme, düzenleme, silme ve seçili ayın tüm işlemlerini temizleme
- CSV/XLSX dosyasıyla toplu işlem içe aktarma
- Açıklamaya göre otomatik kategori ve alt kategori tahmini
- Aylık gelir, gider, kalan bütçe ve kategori dağılımı panelleri
- Kategori bazlı bütçe limiti ekleme, güncelleme ve aşım takibi
- Önceki ay / bu ay karşılaştırması
- Tekrar eden ödemeler ve sık harcama alışkanlıkları analizi
- Gemini ile AI finans analizi, tasarruf planı ve sohbet asistanı
- AI önerileri için 5 dakikalık cache; veri değişmedikçe sayfa yenilemede tekrar token harcanmaz
- Örnek öğrenci finans profiliyle hızlı başlangıç

## Teknoloji

**Frontend:** React, Vite, Tailwind CSS, Framer Motion, Recharts, Lucide React  
**Backend:** FastAPI, SQLAlchemy, SQLite, Pandas/OpenPyXL, Google Gemini API

## Proje Yapısı

```text
FinCoach_BTK_Hackathon_2026/
  backend/
    app/
      routers/       API endpointleri
      services/      analiz, kategori ve AI servisleri
      models.py      veritabanı modelleri
      schemas.py     request/response şemaları
      crud.py        veritabanı işlemleri
    requirements.txt
    .env.example
  frontend/
    public/          logo ve statik dosyalar
    src/
      components/    layout ve chat bileşenleri
      pages/         uygulama sayfaları
      services/      API client ve mock API
      context/       seçili kullanıcı/ay durumu
```

## Kurulum

Gereksinimler:

- Python 3.11+
- Node.js 20+
- Gemini API key

Backend kurulumu:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

`backend/.env` dosyasını düzenleyin:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash-lite
FINCOACH_AI_DEBUG=true
AI_RAISE_ERRORS=false
AI_ADVICE_CACHE_TTL_SECONDS=300
```

Backend'i çalıştırın:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Frontend kurulumu:

```bash
cd frontend
npm install
npm run dev
```

Uygulama varsayılan olarak `http://localhost:5173` adresinde açılır. API adresi varsayılan olarak `http://127.0.0.1:8000` kabul edilir. Gerekirse frontend için `.env` oluşturup API adresini değiştirebilirsiniz:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_USE_MOCK_API=false
```

## Kullanım Akışı

1. Uygulamaya giriş yapın veya örnek öğrenci profiliyle başlayın.
2. Harcama Yönetimi sayfasından manuel işlem ekleyin ya da CSV/XLSX dosyası yükleyin.
3. Bütçeler sayfasından kategori limitlerinizi belirleyin.
4. Genel Bakış panelinde gelir, gider, kalan bütçe ve uyarıları takip edin.
5. Finansal Detaylar sayfasında tekrar eden ödemeleri, sık alışkanlıkları ve AI tasarruf planını inceleyin.
6. Sağ alttaki FinCoach Chat ile mevcut finansal veriniz üzerinden soru sorun.

## Faydalı Komutlar

Frontend:

```bash
npm run dev
npm run lint
npm run build
npm run preview
```

Backend:

```bash
uvicorn app.main:app --reload
python -m compileall -q app
```

API dokümantasyonu backend çalışırken şu adreste görüntülenebilir:

```text
http://127.0.0.1:8000/docs
```

## Notlar

- SQLite veritabanı `backend/spendwise.db` dosyasında tutulur.
- Örnek veri aynı kullanıcı için tekrar yüklenirse önce mevcut örnek kayıtları temizlemek gerekir.
- AI analizi Gemini API key olmadan çalışmaz; ancak uygulamanın temel işlem, bütçe ve analiz akışları kullanılabilir.
- Production dağıtımında CORS ayarları, gizli env değerleri ve veritabanı konfigürasyonu ortamınıza göre sıkılaştırılmalıdır.
