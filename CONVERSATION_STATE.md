# БАРИН АЛП System - Conversation State
**Последна актуализация:** 29 декември 2025

## 📋 Обобщение на проекта

**Проект:** PWA за управление на строителна фирма "БАРИН АЛП"
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** n8n workflows
- **База данни:** Google Sheets (ID: `1Mvg9vxzp7LyYwNor0i8o8LvqYiF0ID4WD3Af58zkVTo`)
- **URL на n8n:** `https://n8n.simeontsvetanovn8nworkflows.site`
- **Deployed:** GitHub Pages

---

## ✅ Завършени задачи

### 1. Dashboard включва банкови транзакции
- Workflow 16 обновен да смята bank income/expenses в общите суми

### 2. CORS проблем с банкови транзакции - РЕШЕН
- Проблем: PUT заявки блокирани от CORS preflight
- Решение: Сменен на POST метод
- Файлове:
  - `src/config/api.ts` - endpoint: `/barin-alp/bank-transactions/update`
  - `src/services/api.ts` - използва `api.post()` вместо `api.put()`
  - `n8n-workflows/19-update-bank-transaction.json` - POST метод, id в body

### 3. Inconsistent object expenses - РЕШЕН
- Проблем: Разходите по обекти се смятаха различно на различни страници
- Решение: Унифициран калкулация = фактури + банкови debit + кеш разходи
- Файлове: `ObjectsPage.tsx`, `ObjectDetailPage.tsx`

### 4. Comprehensive Object Detail View
- Добавени секции за:
  - Банкови плащания (с тотали)
  - Касови транзакции (с тотали)
  - Фактури
  - Инвентар
  - Техници
- Stats grid с 5 карти

### 5. Google Sheets Quota Protection - РЕШЕН
- Проблем: Error 429 "Too many requests" при много API calls
- Решение:
  - 30-секундно кеширане на API отговори
  - Последователно зареждане с паузи (200-300ms)
  - Комбиниран endpoint за object details
- Файлове:
  - `src/services/api.ts` - cache система + `getObjectDetails()` + `getObjectDetailsFallback()`
  - `n8n-workflows/22-get-object-details.json` - комбиниран workflow

### 6. Bank Statement Parsing & Categorization
- Категории: Банкови такси, Кредити, Преводи, Други
- Collapsible секции с тотали
- Object assignment за transfer expenses

---

## ⚠️ Pending Tasks (Чакащи действия от потребителя)

### 1. Обнови n8n workflow 19
- Трябва да е POST метод
- Path: `/barin-alp/bank-transactions/update`
- ID се подава в body, не в URL

### 2. Импортирай workflow 22 в n8n
- Файл: `n8n-workflows/22-get-object-details.json`
- Path: `/barin-alp/objects/:id/details`
- Провери Google Sheets credentials

---

## 📁 Ключови файлове

### Frontend
- `src/pages/Objects/ObjectDetailPage.tsx` - детайли на обект (всички данни)
- `src/pages/Objects/ObjectsPage.tsx` - списък с обекти + калкулирани разходи
- `src/pages/BankStatements/BankStatementsPage.tsx` - банкови извлечения
- `src/services/api.ts` - API service с кеширане
- `src/config/api.ts` - API endpoints конфигурация

### n8n Workflows
- `01-login.json` - автентикация
- `02-get-objects.json` - списък обекти
- `14-get-transactions.json` - касови транзакции
- `16-get-dashboard-stats.json` - dashboard статистики
- `17-parse-bank-statement.json` - парсиране на банково извлечение
- `19-update-bank-transaction.json` - обновяване на банкова транзакция (POST!)
- `20-get-bank-transactions.json` - списък банкови транзакции
- `22-get-object-details.json` - комбиниран endpoint (НОВ)

---

## 🗄️ Google Sheets Structure

### BankTransactions колони (M-P за object assignment):
- M: objectId
- N: objectName
- O: isCompanyExpense
- P: status

### Transactions колони:
- objectId, objectName за връзка с обекти

---

## 🐛 Известни проблеми

1. **Quota limits** - Google Sheets има лимит 60 заявки/минута/потребител
   - Решение: Кеширане + последователно зареждане
   - Алтернатива: PostgreSQL/MySQL база данни

2. **CORS** - n8n webhooks трябва да са настроени с `allowedOrigins: "*"`

---

## 💡 Бъдещи подобрения

1. Backend база данни вместо Google Sheets
2. Push notifications
3. Offline mode (Service Worker)
4. Export to PDF/Excel
5. Графики и статистики

---

## 🔧 Команди за продължаване

```bash
# Стартиране на dev server
cd "e:\VISUAL STUDIO\BARIN ALP_system"
npm run dev

# Build за production
npm run build

# Deploy
git add -A
git commit -m "описание"
git push
```

---

## 📝 Последни commits

1. `d1bb7cd` - Add caching and quota protection
2. `9532c67` - Add comprehensive object detail view
3. Bank statement improvements
4. CORS fix for bank transactions
