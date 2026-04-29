# PROJE-SABLON (TR/EN)

---

## 🇹🇷 TÜRKÇE (TURKISH)

### 👤 Kimlik Bilgileri
- **Öğrenci:** Nathanaelle Bopti Ngah Bong  
- **Öğrenci No:** 24080410150  
- **Ders:** BMU1208 · Web Tabanlı Programlama  
- **Ders Yürütücüsü:** Dr. Öğr. Üyesi Davut ARI  
- **Kurum:** Bitlis Eren Üniversitesi — Mühendislik-Mimarlık Fakültesi  

### 🎯 Proje Özeti
PostgreSQL trigger, view, stored procedure ve window function'lar kullanılarak geliştirilmiş envanter yönetim sistemi. İş mantığı uygulama katmanı yerine doğrudan veritabanı içinde (Fat Database, Thin Application) kurgulanmıştır.

### ✨ Temel Özellikler
- Otomatik stok düşürme trigger'ı  
- Kritik stok uyarısı trigger'ı  
- Denetim günlüğü (audit log) trigger'ı  
- Atomik sipariş oluşturma için stored procedure  
- Raporlama görünümleri (günlük satış, düşük stok)  
- 30 günlük trend analizi için window function'lar  
- Partitioning + İndeks performans demosu  

### 🧰 Teknoloji Yığını
- PostgreSQL 18  
- Node.js + Express  
- node-postgres (pg)  
- Jest + Supertest  
- Python (raporlama)  

### 🚀 Kurulum
1. Repoyu klonlayın  
2. `.env` dosyasını yapılandırın  
3. Migration'ları ve seed verilerini çalıştırın  
4. Sunucuyu başlatın (`npm start`)  

### 📸 Demo
Ekran görüntüleri `repo/docs/screenshots/` klasöründedir.  

### 📚 Kaynakça
- PostgreSQL Resmi Dokümantasyonu
- OWASP Top 10 Güvenlik Rehberi
- Stack Overflow (PL/pgSQL tartışmaları)
- ReportLab Dokümantasyonu (PDF oluşturma)
- Statista 2024 Veritabanı Pazar Raporu
- DB-Engines Sıralaması

### 📚 Sources
- PostgreSQL Official Documentation
- OWASP Top 10 Guidelines
- Stack Overflow (PL/pgSQL triggers)
- ReportLab documentation (Python PDF)
- Statista 2024 Database Market Report
- DB-Engines Ranking

### 📜 License
MIT © 2026 Nathanaelle Bopti Ngah Bong

---

## 🇺🇸 ENGLISH

### 👤 Identity
- **Student:** Nathanaelle Bopti Ngah Bong  
- **Student No:** 24080410150  
- **Course:** BMU1208 · Web-Based Programming  
- **Instructor:** Dr. Öğr. Üyesi Davut ARI  
- **Institution:** Bitlis Eren University — Faculty of Engineering and Architecture  

### 🎯 Project Summary
Inventory management backend using PostgreSQL triggers, views, stored procedures, and window functions. Business logic is handled inside the database (fat database, thin application).  

### ✨ Key Features
- Automatic stock deduction trigger  
- Low-stock alert trigger  
- Audit log trigger  
- Stored procedure for atomic order creation  
- Views for reporting (daily sales, low stock)  
- Window functions for 30-day trend analysis  
- Partitioning + Index performance demo  

### 🧰 Tech Stack
- PostgreSQL 18  
- Node.js + Express  
- node-postgres (pg)  
- Jest + Supertest  
- Python (reporting)  

### 🚀 Setup
1. Clone repo  
2. Configure `.env`  
3. Run migrations + seed data  
4. Start server (`npm start`)  

### 📸 Demo
Screenshots are in `repo/docs/screenshots/`.  

### 📜 License
MIT © 2026 Nathanaelle Bopti Ngah Bong
