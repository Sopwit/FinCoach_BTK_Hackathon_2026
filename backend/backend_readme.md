# Akıllı Harcama Dedektifi Backend

Akıllı Harcama Dedektifi, kullanıcıların gelir ve gider işlemlerini analiz ederek finansal farkındalık kazanmasını sağlayan yapay zekâ destekli bir backend projesidir.

Bu sistem gerçek banka API entegrasyonu kullanmadan çalışır. Kullanıcılar harcamalarını manuel olarak girebilir, CSV/Excel dosyası yükleyebilir veya hazır demo veri setiyle sistemi deneyebilir.

Uygulama; harcamaları otomatik kategorilere ayırır, geçmiş aylarla karşılaştırır, tekrar eden ödemeleri ve sık harcama alışkanlıklarını tespit eder. Ayrıca bütçe limitleri, finansal sağlık skoru ve AI destekli öneri sistemi içerir.

Bu proje yatırım tavsiyesi vermez. Sadece harcama analizi, bütçe farkındalığı ve tasarruf önerileri sunar.

---

## Proje Amacı

Bu projenin amacı, kullanıcıların kendi finansal verilerini daha anlaşılır hale getirmektir.

Sistem şu sorulara cevap üretir:

- Bu ay toplam gelirim ve giderim ne kadar?
- En çok hangi kategoriye harcama yaptım?
- Geçen aya göre hangi harcamalarım arttı?
- Dışarıdan yemek, kafe veya market gibi alışkanlıklarım sıklaşmış mı?
- Spotify, Netflix, telefon faturası gibi tekrar eden ödemelerim var mı?
- Belirlediğim bütçe limitlerini aştım mı?
- Finansal sağlık skorum kaç?
- Harcamalarımı daha dengeli yönetmek için ne yapabilirim?

---

## Kullanılan Teknolojiler

- Python
- FastAPI
- Uvicorn
- SQLite
- SQLAlchemy
- Pydantic
- Pandas
- OpenPyXL
- Python Multipart
- Python Dotenv
- Email Validator
- Google Gemini API
- CORS Middleware

---

## Temel Özellikler

- Kullanıcı oluşturma
- Manuel gelir/gider işlemi ekleme
- CSV/Excel dosyasından işlem yükleme
- Hazır öğrenci demo verisi yükleme
- Demo verisini temizleme
- İşlem listeleme
- İşlem filtreleme
- İşlem güncelleme
- İşlem silme
- Otomatik kategori ve alt kategori algılama
- Küçük/büyük harf, boşluk, tire, alt tire gibi farklı yazımları algılama
- Aylık gelir/gider özeti
- Kategori bazlı harcama analizi
- Geçen ay - bu ay karşılaştırması
- Tekrar eden ödeme / abonelik tespiti
- Sık harcama alışkanlığı tespiti
- Kategori bazlı bütçe limiti oluşturma
- Bütçe limiti aşım kontrolü
- Finansal sağlık skoru
- Frontend için hazır dashboard response yapısı
- AI destekli kişisel harcama önerisi
- Gemini API yoksa fallback öneri sistemi

---

## Proje Klasör Yapısı

```text
fincoach-backend/
│
├── app/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── crud.py
│   │
│   ├── routers/
│   │   ├── users.py
│   │   ├── transactions.py
│   │   ├── demo.py
│   │   ├── analytics.py
│   │   ├── ai.py
│   │   ├── dashboard.py
│   │   └── budgets.py
│   │
│   └── services/
│       ├── categorizer.py
│       ├── analytics_service.py
│       └── ai_service.py
│
├── .env
├── requirements.txt
├── spendwise.db
└── README.md
```

---

## Kurulum

Projeyi aç:

```powershell
cd D:\btkhackathon\fincoach-backend
```

Sanal ortam oluştur:

```powershell
py -m venv .venv
```

Sanal ortamı aktif et:

```powershell
.venv\Scripts\activate
```

PowerShell izin hatası verirse:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.venv\Scripts\activate
```

Gerekli paketleri kur:

```powershell
pip install -r requirements.txt
```

Eğer `requirements.txt` yoksa paketleri manuel kur:

```powershell
pip install fastapi uvicorn sqlalchemy pydantic python-dotenv python-multipart pandas openpyxl email-validator google-generativeai
```

Kurulumdan sonra requirements dosyasını oluştur veya güncelle:

```powershell
pip freeze > requirements.txt
```

---

## Ortam Değişkenleri

Proje kök dizininde `.env` dosyası oluştur:

```env
GEMINI_API_KEY=BURAYA_GEMINI_API_KEY_GELECEK
```

Gemini API key yoksa sistem çalışmaya devam eder. Bu durumda AI cevabı yerine fallback öneri sistemi kullanılır.

---

## Projeyi Çalıştırma

Backend’i çalıştır:

```powershell
uvicorn app.main:app --reload --port 8000
```

Ana endpoint:

```text
http://127.0.0.1:8000
```

Swagger dokümantasyonu:

```text
http://127.0.0.1:8000/docs
```

---

## Veritabanı

Projede SQLite kullanılmaktadır.

Veritabanı dosyası:

```text
spendwise.db
```

Uygulama ilk çalıştığında tablolar otomatik oluşturulur.

Test aşamasında veritabanını sıfırlamak için:

```powershell
Remove-Item spendwise.db
```

Sonra uygulamayı tekrar çalıştır:

```powershell
uvicorn app.main:app --reload --port 8000
```


---

## CSV/Excel Formatı

Örnek CSV:

```csv
date,description,amount,type
2026-04-01,KYK Burs,3000,income
2026-04-02,BIM Market,-420,expense
2026-04-03,Trendyol Yemek,-280,expense
2026-04-05,Spotify,-59.99,expense
2026-05-01,KYK Burs,3000,income
2026-05-03,Trendyol Yemek,-430,expense
2026-05-12,Netflix,-229.99,expense
```