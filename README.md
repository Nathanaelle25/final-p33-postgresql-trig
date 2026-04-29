# PostgreSQL Trigger/View/SP
PostgreSQL'in gücünü keşfet — trigger, view, stored procedure ile Fat Database Mimari

![Zorluk](https://img.shields.io/badge/Zorluk-Zor-red)
![Puan](https://img.shields.io/badge/Puan-55-blue)
![Hafta](https://img.shields.io/badge/Hafta-4-gray)
![Lisans](https://img.shields.io/badge/License-MIT-green)
![Durum](https://img.shields.io/badge/Durum-Tamamland%C4%B1-success)

## 👤 Kimlik Bilgileri
**Öğrenci:** Nathanaelle Bopti Ngah Bong  
**Öğrenci No:** 24080410150  
**Ders:** BMU1208 · Web Tabanlı Programlama  
**Ders Yürütücüsü:** Dr. Öğr. Üyesi Davut ARI  
**Kurum:** Bitlis Eren Üniversitesi — Mühendislik-Mimarlık Fakültesi

---

## 🎯 Genel Bakış
Bu proje, "Fat Database, Thin Application" (Şişman Veritabanı, Zayıf Uygulama) yaklaşımıyla geliştirilmiş bir envanter yönetim sistemi backend'idir. Stok düşürme, uyarılar, raporlama ve trend analizi gibi iş mantıkları; Trigger'lar, View'lar, Stored Procedure'lar ve Window Function'lar kullanılarak doğrudan **PostgreSQL** içinde uygulanmıştır. Bu sayede veri tutarlılığı en üst düzeye çıkarılmış ve ACID garantileri tam anlamıyla kullanılmıştır.

---

## 🎥 Demo
**🔗 Yerel Demo:** http://localhost:3000  
**👤 Demo Hesabı:** `demo@example.com` · `demo123`

---

## 📸 Ekran Görüntüleri

| Ürünler Listesi | Sipariş Oluşturma | Satış Raporları |
| :---: | :---: | :---: |
| ![Products](repo/docs/screenshots/01-api-products.png.png) | ![Orders](repo/docs/screenshots/07_api_isolation.png.jpeg) | ![Reports](repo/docs/screenshots/05_api_search.png.jpeg) |

### Diğer Ekran Görüntüleri
| Veritabanı Yapısı | Migration İşlemleri | Denetim Günlüğü (Audit) |
| :---: | :---: | :---: |
| ![DB Structure](repo/docs/screenshots/02_db_structure.png) | ![Migration](repo/docs/screenshots/06_migration_terminal.png.jpeg) | ![Audit Log](repo/docs/screenshots/04_audit_log.png.jpeg) |

---

## ✨ Temel Özellikler
✅ **Trigger:** Otomatik stok düşürme (`trg_deduct_stock`)  
✅ **Trigger:** Kritik stok uyarısı (`trg_low_stock_alert`)  
✅ **Trigger:** Denetim günlüğü / Audit logging (`trg_audit_log`)  
✅ **Trigger:** Otomatik `updated_at` güncelleme (`trg_set_updated_at`)  
✅ **View:** Düşük stoklu ürünler raporu (`v_low_stock_products`)  
✅ **View:** Günlük satış özeti (`v_daily_sales_summary`)  
✅ **Materialized View:** Ürün performans analizi (`mv_product_performance`)  
✅ **Stored Procedure:** Atomik sipariş oluşturma (`sp_create_order`)  
✅ **Window Functions:** LAG, LEAD ve RANK ile 30 günlük satış trendi (`v_sales_trend_30days`)  
✅ **Transaction Isolation:** Serializable demo endpoint'i  
✅ **JSONB + Full-text Search:** Esnek ürün özellikleri ve hızlı metin arama  
✅ **Partitioning:** Büyük tablolarda performans demosu  

---

## 🧰 Teknoloji Yığını
- **Veritabanı:** PostgreSQL 18
- **Backend:** Node.js + Express
- **DB Client:** node-postgres (pg)
- **Yönetim Arayüzü:** pgAdmin 4
- **Test:** Jest + Supertest
- **Raporlama:** Python + reportlab + psycopg
- **Deployment:** Neon Serverless PostgreSQL (veya Yerel)

---

## 📊 ER Diyagramı
![ER Diagram](repo/docs/er_diagram.png)

```mermaid
erDiagram
    products ||--o{ order_items : "contains"
    orders ||--o{ order_items : "has"
    products ||--o{ stock_movements : "tracks"
    products ||--o{ alerts : "triggers"

    products {
        int id PK
        varchar name
        int stock
        int min_stock_level
    }
    orders {
        int id PK
        varchar status
        numeric total_amount
    }
    order_items {
        int id PK
        int order_id FK
        int product_id FK
        int quantity
    }
    stock_movements {
        int id PK
        int product_id FK
        varchar movement_type
    }
    alerts {
        int id PK
        varchar alert_type
    }
    audit_log {
        int id PK
        varchar table_name
        varchar action
    }
```

---

## 🚀 Kurulum

### Gereksinimler
- PostgreSQL ≥ 15 (18 ile test edildi)
- Node.js ≥ 18
- Python 3 (PDF raporlama için)

### Adımlar
```bash
# 1) Repoyu klonlayın
git clone https://github.com/Nathanaelle25/final-p33-postgresql-trig.git
cd final-p33-postgresql-trig

# 2) Ortam değişkenlerini yapılandırın
cp .env.example .env
# .env dosyasını kendi veritabanı bilgilerinizle güncelleyin

# 3) Bağımlılıkları yükleyin
npm install

# 4) Migration'ları ve seed verilerini çalıştırın
npm run migrate
npm run db:seed

# 5) Sunucuyu başlatın
npm start
# http://localhost:3000 adresinden erişilebilir
```

---

## 📡 API Uç Noktaları (Endpoints)
- `GET /api/products?search=kelime` → Ürünleri listele / ara
- `POST /api/orders` → Yeni sipariş oluştur (atomik SP çağrısı)
- `GET /api/reports/trend` → 30 günlük satış trendi (window functions)
- `GET /api/reports/daily-sales` → Günlük satış özeti
- `GET /api/demo/isolation` → Serializable transaction demosu

---

## 🎥 API Demo Kaydı
Sistemin tüm uç noktalarının (endpoints) nasıl çalıştığını gösteren kısa demo kaydı:

![API Demo Recording](repo/docs/recordings/demo.gif)

### API Yanıt Örnekleri (JSON)
| Endpoint | Açıklama | Ekran Görüntüsü |
| :--- | :--- | :--- |
| `GET /api/products` | Ürün Listesi | [Görüntüle](repo/docs/screenshots/api_products.png) |
| `GET /api/reports/trend` | Satış Trendi | [Görüntüle](repo/docs/screenshots/api_reports_trend.png) |
| `GET /api/demo/isolation` | İzolasyon Testi | [Görüntüle](repo/docs/screenshots/api_isolation.png) |

---

## ⚡ Partitioning Demo
The `stock_movements` table is partitioned by month. Queries automatically target the correct partition:

![Partitioning Demo](repo/docs/screenshots/partitioning_demo.png.png)

Example query:
```sql
EXPLAIN ANALYZE
SELECT * FROM stock_movements
WHERE created_at >= '2026-04-01' AND created_at < '2026-05-01';
```

---

## 🔍 Index Performance Demo
Veritabanı sorgularının hızını artırmak için `products` tablosundaki `name` alanı indekslenmiştir. Aşağıda indeksli ve indekssiz sorgu arasındaki fark görülmektedir:

### 1. İndekssiz (Sequential Scan)
Veritabanı tüm satırları tek tek kontrol eder.
```text
Seq Scan on products (actual time=0.090..0.162 rows=1 loops=1)
  Filter: (name = 'Product 500')
  Rows Removed by Filter: 1004
```
![Seq Scan](repo/docs/screenshots/index_seq_scan.png)

### 2. İndeksli (Index Scan)
Veritabanı indeksi kullanarak doğrudan ilgili kayda gider.
```text
Index Scan using idx_products_name on products (actual time=0.077..0.077 rows=1 loops=1)
  Index Cond: (name = 'Product 500')
```
![Index Scan](repo/docs/screenshots/index_index_scan.png)

> [!IMPORTANT]
> İndeks kullanımı, veri seti büyüdükçe (milyonlarca satır) milisaniyeler ile saniyeler arasındaki farkı yaratır.

---

## 🧪 Testler
```bash
npm test
```

---

## 📁 Proje Yapısı
```text
.
├── README.md                   (bu dosya — genel bakış, kurulum, demo)
├── PROJE-RAPORU.md             (markdown formatında detaylı proje raporu)
├── LICENSE                     (MIT lisansı)
├── .env.example                (ortam değişkeni şablonu)
└── repo/                       (kaynak kodlar)
    ├── migrations/             (SQL migration dosyaları)
    ├── src/                    (Node.js backend)
    ├── scripts/                (yardımcı scriptler, PDF rapor oluşturucu)
    ├── tests/                  (Jest + Supertest testleri)
    └── docs/                   (ekran görüntüleri, diyagramlar)
```

---

## 🛣 Yol Haritası
- [x] **V1 — MVP (Mevcut Teslimat)**
- [ ] **V2 —** Row Level Security (RLS) iyileştirmeleri, `pg_cron` ile MV yenileme
- [ ] **V3 —** `pgvector` ile anlamsal (semantic) arama desteği

---

## 🤝 Katkı
Bu proje, **Bitlis Eren Üniversitesi — Bilgisayar Mühendisliği** bölümünde **BMU1208 Web Tabanlı Programlama** dersi final projesi olarak geliştirilmiştir.

**Ders Yürütücüsü:** Dr. Öğr. Üyesi Davut ARI

---

## 📚 Kaynakça (Sources)
- **PostgreSQL Official Documentation** — [Link](https://www.postgresql.org/docs/)
- **OWASP Top 10 Guidelines** — [Link](https://owasp.org/www-project-top-ten/)
- **Stack Overflow** — PL/pgSQL triggers and function discussions.
- **ReportLab Documentation** — Python PDF generation library.
- **Statista 2024 Database Market Report** — Market trend analysis.
- **DB-Engines Ranking** — Database popularity metrics.

---

## 📜 Lisans
MIT © 2026 **Nathanaelle Bopti Ngah Bong**

---

## 🙋‍♂️ İletişim
- **E-posta:** ngahbongnathy@gmail.com
- **Ders:** BMU1208 · Web Tabanlı Programlama
- **Kurum:** Bitlis Eren Üniversitesi — Mühendislik-Mimarlık Fakültesi

---
<sub>🤖 Bu projede AI asistanları (Claude Code, GitHub Copilot, Cursor) kullanılmıştır. Tüm mimari kararlar ve uygulama süreçleri öğrenci tarafından yönetilmiştir.</sub>
