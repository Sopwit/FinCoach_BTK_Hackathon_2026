# FinCoach Backend - Frontend Entegrasyon Rehberi

Bu README, frontend gelistiren ekip arkadasinin ve onun AI asistaninin backend'i hizli anlamasi icin hazirlandi. Proje FastAPI ile yazilmis bir kisisel finans/harcama analizi backend'idir.

Backend kullanici, gelir-gider islemleri, CSV/Excel yukleme, demo veri, kategori analizi, butce limitleri, dashboard verisi ve AI destekli harcama onerisi endpointleri sunar.

## Hizli Ozet

- Backend framework: FastAPI
- Varsayilan port: `8000`
- Base URL: `http://127.0.0.1:8000`
- Swagger/OpenAPI: `http://127.0.0.1:8000/docs`
- Veritabani: SQLite, `spendwise.db`
- Auth/token yok. Frontend `user_id` ile calisir.
- CORS acik: frontend herhangi bir origin'den istek atabilir.
- Para birimi ekranda `TL` olarak dusunulebilir.
- Tarih formati: `YYYY-MM-DD`
- Ay/yil parametreleri: `year=2026&month=5`

## Kurulum ve Calistirma

```powershell
cd D:\btkhackathon\fincoach-backend
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

PowerShell virtualenv calistirma izni vermezse:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.venv\Scripts\activate
```

AI onerisi icin proje kokunde `.env` dosyasi kullanilir:

```env
GEMINI_API_KEY=BURAYA_GEMINI_API_KEY
```

`GEMINI_API_KEY` yoksa backend yine calisir. AI cevabi `source: "fallback"` olarak yerel fallback metniyle doner.

## Frontend Icin Onerilen Akis

1. Uygulama acilisinda kullanici olustur veya mevcut kullanicilari listele.
2. Secili kullanicinin `id` degerini frontend state/localStorage icinde tut.
3. Test/demo icin `POST /demo/load-student-data?user_id=1` cagir.
4. Dashboard ekrani icin tek endpoint yeterli: `GET /dashboard/?user_id=1&year=2026&month=5&include_ai=true`
5. Islem listesi/grafik filtreleri icin `GET /transactions/` ve analytics endpointleri kullanilabilir.
6. Butce ekrani icin `/budgets` endpointleri kullanilir.

Frontend'in dashboard icin ayri ayri summary, categories, comparison, budget, AI cagirmasina gerek yok. `/dashboard/` bu verilerin tamamini tek response icinde verir.

## Genel Request Kurallari

JSON gonderirken header:

```http
Content-Type: application/json
```

Dosya yuklerken `multipart/form-data` kullanilir.

Hata formati FastAPI standardidir:

```json
{
  "detail": "User not found"
}
```

Validasyon hatalarinda `422 Unprocessable Entity` donebilir.

## Veri Modelleri

### User

```ts
type User = {
  id: number;
  name: string;
  email: string | null;
  monthly_income: number;
  created_at: string;
};
```

Kullanici olusturma body:

```json
{
  "name": "Ali Veli",
  "email": "ali@example.com",
  "monthly_income": 12000
}
```

Notlar:

- `name` en az 2 karakter olmali.
- `email` opsiyonel.
- `monthly_income` negatif olamaz.

### Transaction

```ts
type Transaction = {
  id: number;
  user_id: number;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  sub_category: string | null;
  source: "manual" | "csv" | "demo";
  note: string | null;
  created_at: string;
};
```

Onemli: Expense kaydi gonderirken amount pozitif gonderilebilir; backend expense ise otomatik negatif kaydeder. Response icinde giderler negatif gelir. Grafiklerde gider gostermek icin genelde `Math.abs(amount)` kullanmak gerekir.

Manuel islem olusturma body:

```json
{
  "user_id": 1,
  "date": "2026-05-15",
  "description": "Migros Market",
  "amount": 620,
  "type": "expense",
  "category": null,
  "sub_category": null,
  "note": "Haftalik market"
}
```

`category` veya `sub_category` bos/null gelirse backend description'a gore otomatik kategori tahmini yapar.

### Budget

```ts
type Budget = {
  id: number;
  user_id: number;
  category: string;
  monthly_limit: number;
  created_at: string;
};
```

Butce olusturma body:

```json
{
  "user_id": 1,
  "category": "Yemek",
  "monthly_limit": 2500
}
```

Ayni kullanici ve kategori icin tekrar budget create edilirse yeni kayit acmak yerine mevcut limit guncellenir.

## Endpointler

### Health Check

`GET /`

Backend ayakta mi kontrolu.

Ornek response:

```json
{
  "message": "Akilli Harcama Dedektifi API calisiyor."
}
```

### Users

#### Kullanici olustur

`POST /users/`

Body:

```json
{
  "name": "Zeynep",
  "email": "zeynep@example.com",
  "monthly_income": 10000
}
```

Response: `User`

#### Kullanicilari listele

`GET /users/`

Response:

```json
[
  {
    "id": 1,
    "name": "Zeynep",
    "email": "zeynep@example.com",
    "monthly_income": 10000,
    "created_at": "2026-05-15T00:00:00"
  }
]
```

#### Kullanici detayi

`GET /users/{user_id}`

Response: `User`

Bulunamazsa `404`.

### Transactions

#### Manuel gelir/gider ekle

`POST /transactions/manual`

Body:

```json
{
  "user_id": 1,
  "date": "2026-05-15",
  "description": "KYK Burs",
  "amount": 3000,
  "type": "income",
  "category": null,
  "sub_category": null,
  "note": "Mayis bursu"
}
```

Response: `Transaction`

#### Islemleri listele/filtrele

`GET /transactions/`

Query parametreleri opsiyoneldir:

| Parametre | Tip | Aciklama |
| --- | --- | --- |
| `user_id` | number | Kullaniciya gore filtre |
| `year` | number | Yila gore filtre |
| `month` | number | Aya gore filtre, `year` ile kullan |
| `type` | `income` veya `expense` | Gelir/gider filtresi |
| `category` | string | Kategori filtresi |
| `source` | `manual`, `csv`, `demo` | Kaynak filtresi |
| `search` | string | Description icinde arama |

Ornek:

```http
GET /transactions/?user_id=1&year=2026&month=5&type=expense
```

Response: `Transaction[]`

#### CSV/Excel ile toplu yukleme

`POST /transactions/upload`

Form-data:

- `user_id`: number
- `file`: `.csv`, `.xlsx` veya `.xls`

Zorunlu kolonlar:

```csv
date,description,amount,type
2026-05-01,KYK Burs,3000,income
2026-05-03,Trendyol Yemek,430,expense
2026-05-12,Netflix,229.99,expense
```

Response:

```json
{
  "inserted_count": 3,
  "skipped_count": 0,
  "transactions": []
}
```

Duplicate kontrolu vardir. Ayni `user_id + date + description + amount + type` tekrar gelirse atlanir ve `skipped_count` artar.

#### Islem guncelle

`PUT /transactions/{transaction_id}`

Tum alanlar opsiyoneldir.

Body:

```json
{
  "description": "Migros Market",
  "amount": 700,
  "type": "expense",
  "note": "Guncellendi"
}
```

Response: `Transaction`

#### Islem sil

`DELETE /transactions/{transaction_id}`

Response:

```json
{
  "message": "Transaction deleted successfully",
  "deleted_transaction_id": 12
}
```

### Demo Data

#### Ogrenci demo verisini yukle

`POST /demo/load-student-data?user_id=1`

Request body yoktur. `user_id` query parametresi olarak gonderilir.

Response:

```json
{
  "inserted_count": 23,
  "skipped_count": 0,
  "transactions": []
}
```

Ayni kullanici icin demo veri daha once yuklendiyse `400` doner:

```json
{
  "detail": "Demo data has already been loaded for this user"
}
```

#### Ogrenci demo verisini temizle

`DELETE /demo/clear-student-data?user_id=1`

Response:

```json
{
  "message": "Demo data cleared successfully",
  "deleted_count": 23
}
```

### Analytics

Bu endpointler dashboard'u parca parca kurmak isteyen frontend icin vardir. Dashboard icin genelde `/dashboard/` daha pratiktir.

#### Aylik ozet

`GET /analytics/summary?user_id=1&year=2026&month=5`

Response:

```json
{
  "user_id": 1,
  "year": 2026,
  "month": 5,
  "total_income": 5000,
  "total_expense": 3224.98,
  "remaining_budget": 1775.02,
  "transaction_count": 12,
  "top_category": "Yemek"
}
```

#### Kategori dagilimi

`GET /analytics/categories?user_id=1&year=2026&month=5`

Response:

```json
{
  "user_id": 1,
  "year": 2026,
  "month": 5,
  "categories": [
    {
      "category": "Yemek",
      "total": 1290,
      "percentage": 40
    }
  ]
}
```

#### Gecen ay / bu ay karsilastirma

`GET /analytics/monthly-comparison?user_id=1&year=2026&month=5`

Response:

```json
{
  "user_id": 1,
  "current_period": {
    "year": 2026,
    "month": 5
  },
  "previous_period": {
    "year": 2026,
    "month": 4
  },
  "comparison": [
    {
      "category": "Yemek",
      "previous_total": 560,
      "current_total": 1290,
      "difference": 730,
      "change_percent": 130.36
    }
  ]
}
```

`change_percent` onceki ay degeri 0 ise `null` gelebilir.

#### Tekrar eden odemeler

`GET /analytics/recurring?user_id=1`

Response:

```json
{
  "user_id": 1,
  "recurring_payments": [
    {
      "description": "netflix",
      "count": 2,
      "average_amount": 229.99,
      "category": "Abonelik",
      "sub_category": "Dijital Abonelik",
      "type": "Tekrar eden odeme / abonelik"
    }
  ]
}
```

#### Harcama aliskanliklari

`GET /analytics/habits?user_id=1&year=2026&month=5`

Response:

```json
{
  "user_id": 1,
  "year": 2026,
  "month": 5,
  "frequent_sub_categories": [
    {
      "sub_category": "Disaridan Siparis",
      "count": 3,
      "total": 1290
    }
  ],
  "frequent_descriptions": []
}
```

#### Finansal saglik skoru

`GET /analytics/health-score?user_id=1&year=2026&month=5`

Response:

```json
{
  "score": 72,
  "status": "Iyi",
  "message": "Genel durum iyi, ancak bazi kategorilerde dikkat edilebilir.",
  "reasons": [],
  "positive_points": [],
  "metrics": {
    "expense_ratio": 64.5,
    "recurring_total": 289.98,
    "recurring_ratio": 5.8,
    "exceeded_budget_count": 0
  }
}
```

### Budgets

#### Butce olustur/guncelle

`POST /budgets/`

Body:

```json
{
  "user_id": 1,
  "category": "Yemek",
  "monthly_limit": 2000
}
```

Response: `Budget`

#### Butceleri listele

`GET /budgets/?user_id=1`

Response: `Budget[]`

#### Butce guncelle

`PUT /budgets/{budget_id}`

Body:

```json
{
  "monthly_limit": 2500
}
```

Response: `Budget`

#### Butce sil

`DELETE /budgets/{budget_id}`

Response:

```json
{
  "message": "Budget deleted successfully",
  "deleted_budget_id": 3
}
```

#### Aylik butce durumlari

`GET /budgets/status?user_id=1&year=2026&month=5`

Response:

```json
{
  "user_id": 1,
  "year": 2026,
  "month": 5,
  "budgets": [
    {
      "budget_id": 1,
      "category": "Yemek",
      "monthly_limit": 2000,
      "spent": 1290,
      "remaining": 710,
      "usage_percent": 64.5,
      "is_exceeded": false
    }
  ]
}
```

### Dashboard

#### Tek endpoint ile dashboard verisi

`GET /dashboard/?user_id=1&year=2026&month=5&include_ai=true`

Query:

| Parametre | Tip | Aciklama |
| --- | --- | --- |
| `user_id` | number | Zorunlu |
| `year` | number | Zorunlu |
| `month` | number | Zorunlu |
| `include_ai` | boolean | Opsiyonel, default `true`. AI daha yavas olabilir; listeleme/grafik icin `false` kullanilabilir. |

Response ana alanlari:

```ts
type DashboardResponse = {
  user_id: number;
  year: number;
  month: number;
  summary: MonthlySummary;
  categories: CategorySummary;
  monthly_comparison: MonthlyComparison;
  recurring_payments: RecurringPayments;
  spending_habits: SpendingHabits;
  budget_status: BudgetStatusItem[];
  financial_health: FinancialHealth;
  cards: DashboardCard[];
  alerts: DashboardAlert[];
  charts: {
    category_distribution: CategoryItem[];
    monthly_comparison: ComparisonItem[];
    budget_usage: BudgetStatusItem[];
    spending_habits: FrequentSubCategory[];
  };
  quick_insights: string[];
  advice: AiAdvice | null;
};
```

Ornek response kisaltilmis:

```json
{
  "user_id": 1,
  "year": 2026,
  "month": 5,
  "summary": {
    "total_income": 5000,
    "total_expense": 3224.98,
    "remaining_budget": 1775.02,
    "transaction_count": 12,
    "top_category": "Yemek"
  },
  "cards": [
    {
      "key": "total_income",
      "title": "Toplam Gelir",
      "value": 5000,
      "unit": "TL"
    },
    {
      "key": "financial_health",
      "title": "Finansal Saglik Skoru",
      "value": 72,
      "unit": "/100",
      "status": "Iyi"
    }
  ],
  "alerts": [
    {
      "type": "warning",
      "title": "Yemek harcamalari artti",
      "message": "Yemek harcamalarin gecen aya gore %130.36 artmis."
    }
  ],
  "charts": {
    "category_distribution": [],
    "monthly_comparison": [],
    "budget_usage": [],
    "spending_habits": []
  },
  "quick_insights": [
    "Bu ay en cok harcama yapilan kategori Yemek."
  ],
  "advice": {
    "source": "fallback",
    "text": "..."
  }
}
```

Frontend mapping onerisi:

- KPI kartlari: `cards`
- Pasta/bar kategori grafigi: `charts.category_distribution`
- Aylik karsilastirma grafigi: `charts.monthly_comparison`
- Butce progress barlari: `charts.budget_usage`
- Uyari paneli: `alerts`
- Kisa insight listesi: `quick_insights`
- AI metni: `advice.text`

### AI Advice

`POST /ai/advice?user_id=1&year=2026&month=5`

Request body yoktur. Tum parametreler query string'den gelir.

Response:

```json
{
  "user_id": 1,
  "year": 2026,
  "month": 5,
  "analysis_data": {},
  "advice": {
    "source": "gemini",
    "text": "Kisisel harcama analizi..."
  }
}
```

`source` degeri:

- `gemini`: Gemini API ile uretilmis cevap
- `fallback`: API key yoksa veya Gemini hatasi olursa backend'in yerel metni

AI endpointi yatirim tavsiyesi vermez; sadece harcama/butce farkindaligi onerisi uretir.

## Otomatik Kategoriler

Backend description alanina gore kategori ve alt kategori tahmini yapar.

Ana kategoriler:

- `Gelir`
- `Yemek`
- `Market`
- `Ulasim`
- `Abonelik`
- `Fatura`
- `Egitim`
- `Diger`

Alt kategori ornekleri:

- `Disaridan Siparis`
- `Restoran`
- `Kafe`
- `Ev Alisverisi`
- `Toplu Tasima`
- `Yakit`
- `Taksi`
- `Dijital Abonelik`
- `Telefon`
- `Internet`
- `Elektrik`
- `Su`
- `Dogalgaz`
- `Burs`
- `Aile Destegi`
- `Freelance`

Frontend kategori renklerini bu stringlere gore mapleyebilir. Bilinmeyen kategori gelirse default renk kullanilmasi onerilir.

## Frontend Kod Ornekleri

### Fetch ile dashboard cekme

```ts
const API_BASE_URL = "http://127.0.0.1:8000";

export async function getDashboard(userId: number, year: number, month: number) {
  const url = new URL(`${API_BASE_URL}/dashboard/`);
  url.searchParams.set("user_id", String(userId));
  url.searchParams.set("year", String(year));
  url.searchParams.set("month", String(month));
  url.searchParams.set("include_ai", "true");

  const res = await fetch(url);

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.detail || "Dashboard verisi alinamadi");
  }

  return res.json();
}
```

### Kullanici olusturma

```ts
export async function createUser() {
  const res = await fetch("http://127.0.0.1:8000/users/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: "Demo Kullanici",
      email: null,
      monthly_income: 10000
    })
  });

  if (!res.ok) throw new Error("Kullanici olusturulamadi");
  return res.json();
}
```

### Manuel islem ekleme

```ts
export async function createTransaction(userId: number) {
  const res = await fetch("http://127.0.0.1:8000/transactions/manual", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      user_id: userId,
      date: "2026-05-15",
      description: "Starbucks",
      amount: 180,
      type: "expense",
      category: null,
      sub_category: null,
      note: "Kafe harcamasi"
    })
  });

  if (!res.ok) throw new Error("Islem eklenemedi");
  return res.json();
}
```

### Dosya yukleme

```ts
export async function uploadTransactions(userId: number, file: File) {
  const formData = new FormData();
  formData.append("user_id", String(userId));
  formData.append("file", file);

  const res = await fetch("http://127.0.0.1:8000/transactions/upload", {
    method: "POST",
    body: formData
  });

  if (!res.ok) throw new Error("Dosya yuklenemedi");
  return res.json();
}
```

## Entegrasyon Sirasinda Dikkat

- `user_id` olmadan cogu endpoint calismaz.
- `POST /demo/load-student-data` ve `DELETE /demo/clear-student-data` body degil query parametresi bekler.
- `POST /ai/advice` body degil query parametresi bekler.
- `include_ai=true` dashboard response'unu yavaslatabilir. Ilk ekranda hizli yukleme istenirse once `include_ai=false`, sonra AI icin ayri istek atilabilir.
- Expense islemleri response'ta negatif amount ile gelir. Ekranda gider tutari gostermek icin `Math.abs(transaction.amount)` kullan.
- Analiz endpointleri sadece ilgili ay/yildaki kayitlara bakar. Demo veriler Nisan 2026 ve Mayis 2026 icin hazirdir.
- `month` 1-12 arasi olmali. Gecersiz ay FastAPI/server hatasina sebep olabilir.
- Kategori isimleri Turkce string olarak gelir; frontend'de enum gibi degil, string map gibi davranmak daha esnek olur.
- Backend'de login/auth yok. Hackathon demosu icin user secimi localStorage veya basit dropdown ile yapilabilir.

## Minimum Demo Senaryosu

Frontend test etmek icin en kisa yol:

1. `POST /users/` ile kullanici olustur.
2. Donen `id` degerini al.
3. `POST /demo/load-student-data?user_id={id}` cagir.
4. `GET /dashboard/?user_id={id}&year=2026&month=5&include_ai=true` cagir.
5. `cards`, `charts`, `alerts`, `quick_insights`, `advice.text` alanlarini ekrana bas.

## Ornek API Client

```ts
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, options);

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.detail || `API error: ${res.status}`);
  }

  return res.json();
}

export const api = {
  users: () => request<User[]>("/users/"),
  createUser: (body: {
    name: string;
    email?: string | null;
    monthly_income: number;
  }) =>
    request<User>("/users/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }),
  dashboard: (userId: number, year: number, month: number, includeAi = true) =>
    request<DashboardResponse>(
      `/dashboard/?user_id=${userId}&year=${year}&month=${month}&include_ai=${includeAi}`
    ),
  loadDemo: (userId: number) =>
    request("/demo/load-student-data?user_id=" + userId, {
      method: "POST"
    })
};
```

## Proje Dosya Yapisi

```text
fincoach-backend/
|-- app/
|   |-- main.py
|   |-- database.py
|   |-- models.py
|   |-- schemas.py
|   |-- crud.py
|   |-- routers/
|   |   |-- users.py
|   |   |-- transactions.py
|   |   |-- demo.py
|   |   |-- analytics.py
|   |   |-- ai.py
|   |   |-- dashboard.py
|   |   |-- budgets.py
|   |-- services/
|       |-- categorizer.py
|       |-- analytics_service.py
|       |-- ai_service.py
|-- requirements.txt
|-- spendwise.db
|-- readme.md
```
