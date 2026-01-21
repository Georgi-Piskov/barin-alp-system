# BARIN ALP System - Състояние на проекта
**Последна актуализация:** 21 януари 2026

## 📱 PWA ПОДДРЪЖКА (14-21 януари 2026)

### Какво беше направено:

#### ✅ Progressive Web App (PWA) добавена
- Приложението вече може да се инсталира на телефон/компютър
- Работи офлайн с кеширане на ресурси
- Service Worker за background sync

#### ✅ Файлове създадени/променени:
- `vite.config.ts` - добавен VitePWA plugin
- `public/manifest.json` - PWA manifest файл
- `public/icon-192x192.png` - икона за PWA
- `public/icon-512x512.png` - голяма икона за PWA
- `public/icon.svg` - векторна икона
- `public/favicon.svg` - favicon
- `index.html` - добавени PWA мета тагове

#### ✅ Добавен npm package:
- `vite-plugin-pwa` - за генериране на service worker

### 📋 КАК ДА ИНСТАЛИРАШ PWA:
1. Отвори https://georgi-piskov.github.io/barin-alp-system/ в Chrome/Edge
2. Кликни иконата за инсталиране в адресната лента (⊕)
3. Или: три точки (⋮) → "Инсталиране на БАРИН АЛП..."

---

## 🔧 ПОПРАВКИ НА N8N WORKFLOWS (14 януари 2026)

### Проблем:
- Промените по банкови транзакции не се запазваха след refresh
- Причина: `sheetName` в workflows използваше текстово име вместо GID

### Какво беше поправено:

#### ✅ BARIN-ALP_ Update Bank Transaction.json
- Променено `sheetName` от `"BankTransactions"` на GID `1018740023`

#### ✅ HEFEST_ Update Bank Transaction.json  
- Същата поправка - използва GID вместо текстово име

### 📋 ДЕЙСТВИЯ ЗА ПОТРЕБИТЕЛЯ:
1. **Ре-импортирай поправените workflows в n8n:**
   - `n8n-workflows/BARIN-ALP_ Update Bank Transaction.json`
   - `n8n-workflows/hefest/HEFEST_ Update Bank Transaction.json`
2. **Активирай workflows**

---

## 🏦 БАНКОВИ ИЗВЛЕЧЕНИЯ - ОПРОСТЕН ИНТЕРФЕЙС (14 януари 2026)

### Какво беше направено:

#### ✅ Премахнато автоматично сортиране/групиране
- Вече **няма** автоматично групиране по тип операция (лихви, такси, главници)
- Всички транзакции се показват като плосък списък в реда на импортиране
- Потребителят сам решава какво да прави с всяка транзакция

#### ✅ Нови действия за всяка транзакция:
1. **Присвояване към обект** - dropdown за избор на строителен обект
2. **Заприходяване на потребител** (само за КРЕДИТ транзакции):
   - Вече може да се заприходява към **техник ИЛИ директор**
   - Преди беше само за техници
3. **Създаване на ПРИХОД** (само за КРЕДИТ транзакции):
   - Бутон "Приход" - създава Income запис за обект
4. **Създаване на РАЗХОД** (само за ДЕБИТ транзакции):
   - Бутон "Разход" - създава Transaction (expense) запис за обект
   - Изисква първо да е избран обект
5. **ИЗТРИВАНЕ на транзакция**:
   - Бутон "Изтрий" - за дублиращи се транзакции от овърдрафт
   - С потвърждение преди изтриване

#### ✅ Нови n8n workflows създадени:
- `BARIN-ALP_ Delete Bank Transaction.json`
- `HEFEST_ Delete Bank Transaction.json`

#### ✅ Файлове променени:
- `src/config/api.ts` - добавен `DELETE_BANK_TRANSACTION` endpoint
- `src/services/api.ts` - добавена `deleteBankTransaction()` функция
- `src/pages/BankStatements/BankStatementsPage.tsx` - пренаписана с нов интерфейс

### 📋 ДЕЙСТВИЯ ЗА ПОТРЕБИТЕЛЯ:
1. **Импортирай 2 нови workflows в n8n:**
   - `n8n-workflows/BARIN-ALP_ Delete Bank Transaction.json`
   - `n8n-workflows/hefest/HEFEST_ Delete Bank Transaction.json`
2. **Активирай workflows**

---

## 🎉 МУЛТИ-КОМПАНИЯ ПОДДРЪЖКА - ЗАВЪРШЕНА!

### Какво беше направено (12-13 януари 2026)

#### ✅ Добавена поддръжка за втора компания - ХЕФЕСТ ООД

**Структура:**
- **БАРИН АЛП** - Синя тема, sheetId: `1Mvg9vxzp7LyYwNor0i8o8LvqYiF0ID4WD3Af58zkVTo`, endpoint prefix: `/barin-alp/`
- **ХЕФЕСТ ООД** - Оранжева тема, sheetId: `1hv4XAfHhScA40Bm1kQ3I-Ih4SJuCBpOJxTOYDNb167g`, endpoint prefix: `/hefest/`

#### ✅ 29 HEFEST n8n workflows създадени

Всички workflows са в папка `n8n-workflows/hefest/`:
- HEFEST_ Login.json
- HEFEST_ Get Users.json
- HEFEST_ Get Objects.json
- HEFEST_ Create Object.json
- HEFEST_ Update Object.json
- HEFEST_ Delete Object.json (с Find Row Code node за правилно изтриване)
- HEFEST_ Get Invoices.json
- HEFEST_ Create Invoice.json
- HEFEST_ Update Invoice.json
- HEFEST_ Delete Invoice.json
- HEFEST_ Get Inventory.json
- HEFEST_ Create Inventory Item.json
- HEFEST_ Update Inventory Item.json
- HEFEST_ Delete Inventory Item.json
- HEFEST_ Get Transactions.json
- HEFEST_ Create Transaction.json
- HEFEST_ Update Transaction.json
- HEFEST_ Delete Transaction.json
- HEFEST_ Get Dashboard Stats.json
- HEFEST_ Get Incomes.json
- HEFEST_ Create Income.json
- HEFEST_ Update Income.json
- HEFEST_ Delete Income.json
- HEFEST_ Get Bank Transactions.json
- HEFEST_ Save Bank Transactions.json
- HEFEST_ Update Bank Transaction.json
- HEFEST_ Parse Bank Statement CSV.json
- HEFEST_ Get Object Details.json
- HEFEST_ Upload Photo to Drive.json

**Важно за workflows:**
- Document mode: "From list" с "HEFEST_DB" (не By ID)
- Всички endpoints са с prefix `/hefest/` (не `/barin-alp/`)
- webhookId-та са уникални (hefest-login, hefest-objects, etc.)

#### ✅ Frontend промени

**Файлове променени:**

1. **src/config/api.ts**
   - Добавен `apiPrefix` в Company interface
   - Динамични endpoints чрез `getEndpoints()` функция
   - `setApiPrefix()` за смяна на endpoint prefix
   - API_CONFIG.ENDPOINTS e getter, който връща динамични endpoints

2. **src/store/authStore.ts**
   - Добавена `clearCompany()` функция за бутона "Друга фирма"
   - **СИНХРОННА** инициализация на apiPrefix при зареждане (без race condition)
   - `setCompany()` извиква `setApiPrefix()` за правилни endpoints

3. **src/pages/Login/LoginPage.tsx**
   - Използва `clearCompany()` за бутона "< Друга фирма"

#### 📋 ДЕЙСТВИЯ ЗА ПОТРЕБИТЕЛЯ

##### 🔴 ТРЯБВА ДА СЕ НАПРАВЯТ:

1. **Импортирай 29 HEFEST workflows в n8n**
   - Файловете са в `n8n-workflows/hefest/`
   - Импортирай всеки JSON файл
   - Активирай всички workflows

2. **Сподели HEFEST Google Sheet**
   - Отвори: https://docs.google.com/spreadsheets/d/1hv4XAfHhScA40Bm1kQ3I-Ih4SJuCBpOJxTOYDNb167g
   - Share → Добави имейла от n8n credentials (GP Google Sheets account 3)
   - Дай Editor достъп

3. **Добави потребители в HEFEST_DB**
   - В sheet "Users" добави редове с id, username, name, role, pin
   - Пример: 1, GP, Георги Писков, director, 1234

4. **Тествай**
   - Избери ХЕФЕСТ от началния екран
   - Влез с потребител от HEFEST_DB
   - Провери дали виждаш празни данни (не данни от БАРИН)

---

## Предишни промени (12 януари 2026)

### ✅ Техниците виждат само СВОИТЕ разходи и приходи по обекти

**Проблем:** Техниците виждаха всички разходи по обектите (от всички техници и директори), което ги объркваше.

**Решение:** Сега техниците виждат само:
- ✅ Своите фактури (createdBy === currentUserId)
- ✅ Своите транзакции (userId === currentUserId)
- ✅ Своите приходи (createdBy === currentUserId)
- ✅ Свой баланс (мои приходи - мои разходи)

**Директорите продължават да виждат всичко.**

**Файлове променени:**
- `src/pages/Objects/ObjectsPage.tsx` - филтриране на разходи/приходи по потребител за техници
- `src/pages/Objects/ObjectDetailPage.tsx` - добавени секции "Мои приходи", "Мои разходи", "Мой баланс", "Мои транзакции"

### ✅ Техниците могат да добавят разходи в кеш (транзакции)

**Проблем:** Само директорите можеха да създават транзакции. Техниците нямаха как да запишат кеш разходи без фактура.

**Решение:**
- ✅ Техниците могат да добавят разходи (expense) от страница "Транзакции"
- ✅ Техниците ТРЯБВА да изберат обект (задължително поле)
- ✅ Техниците виждат само обектите, към които са зачислени
- ✅ Техниците НЕ могат да правят заприходявания (само директори)
- ✅ Транзакцията се записва на името на техника
- ✅ Разходът се отразява в баланса на техника и в баланса на обекта

**Файлове променени:**
- `src/pages/Transactions/TransactionsPage.tsx` - добавен бутон и форма за техници

---

## Предишни промени (11 януари 2026)

### ✅ Завършени функционалности

#### 1. Ново групиране на банкови транзакции по тип операция
Банковите транзакции сега се обработват по различен начин според **тип операция** от CSV файла:

| Тип операция | Действие |
|--------------|----------|
| **Усвояване на кредит** | ❌ Пренебрегва се (не се показва) |
| **Банково вземане лихва** | 📊 Групират се като "Лихви (X бр.)" |
| **Банково вземане главница** | 💰 Групират се като "Главници по кредити (X бр.)" |
| **Кредитен превод** | ✅ Остава отделно за разпределяне по обекти |
| **Автоматична такса** | 🏦 Групират се като "Банкови такси (X бр.)" |
| **Картови транзакции** | ✅ Остава отделно за разпределяне по обекти |
| **Вътрешно банков превод** | ✅ Остава отделно за разпределяне по обекти |
| **Издължаване на кредит** | ❌ Пренебрегва се (не се показва) |

**Файлове променени:**
- `n8n-workflows/17-parse-bank-statement.json` - нова логика за групиране

#### 2. Заприходяване на техници за кредитни транзакции
За кредитни (входящи) преводи сега има възможност да се заприходят директно на техници:

**Защо е нужно:**
- Когато има превод директно в сметката на техник
- Техникът после ще купи материали и ще вземе фактури
- Ако се отнесе като разход за обект, разходът ще се дублира когато се въведат фактурите

**UI промени:**
- Dropdown "Заприходи на техник" (само за credit транзакции)
- Показва се името на техника ако е заприходен
- Бутон "Създай приход" остава за създаване на приход за обект

**Файлове променени:**
- `src/pages/BankStatements/BankStatementsPage.tsx` - добавен UI за техници
- `src/types/index.ts` - добавени `technicianId`, `technicianName`, `operationType`
- `src/services/api.ts` - обновен API метод за поддръжка на техници
- `n8n-workflows/19-update-bank-transaction.json` - добавени полета за техници

#### 3. Фиксирани грешки
- ✅ Фикс за `reference.slice is not a function` - конвертиране на reference към string
- ✅ Добавено начално зареждане (loading state) за избягване на бял екран
- ✅ Try-catch блокове в useEffect hooks за robust error handling

### 📋 Необходими действия от потребителя

#### 🔴 ВАЖНО - Трябва да се направят:

1. **Реимпортиране на n8n workflows:**
   - `17-parse-bank-statement.json` - новото групиране по тип операция
   - `19-update-bank-transaction.json` - добавена поддръжка за technicianId/technicianName

2. **Добавяне на колони в Google Sheets:**
   
   Таблица **BankTransactions** трябва да има следните нови колони:
   - `technicianId` (може да е празна)
   - `technicianName` (може да е празна)
   - `operationType` (за съхранение на типа операция от CSV)

3. **Тестване:**
   - Качване на банково извлечение от Asset Bank
   - Проверка на групирането (лихви, главници, такси)
   - Тест на заприходяване на техник

---

## Технически детайли

### Структура на проекта
```
BARIN ALP System
├── React 18 + TypeScript + Vite
├── Tailwind CSS за стилизация
├── n8n workflows за backend логика
└── Google Sheets като база данни
```

### База данни (Google Sheets)
**ID:** 1Mvg9vxzp7LyYwNor0i8o8LvqYiF0ID4WD3Af58zkVTo

**Таблици:**
- Users - потребители (директор, техници)
- ConstructionObjects - строителни обекти
- Invoices - фактури
- Inventory - инвентар
- Transactions - транзакции
- Incomes - приходи
- BankTransactions - банкови транзакции (нови колони: technicianId, technicianName, operationType)

### n8n Backend
**URL:** https://n8n.simeontsvetanovn8nworkflows.site/webhook

**Workflows (общо 22):**
- 01-22: Различни CRUD операции
- 17: Parse Bank Statement (ОБНОВЕН - групиране по тип операция)
- 19: Update Bank Transaction (ОБНОВЕН - поддръжка за техници)
- 20: Get Bank Transactions

### GitHub Repository
- **Repo:** https://github.com/Georgi-Piskov/barin-alp-system.git
- **Branch:** main
- **Последен commit:** d3e6cc4 - "feat: Group transactions by operation type + technician assignment for credits"
- **GitHub Pages:** Активен (deploy на всеки push)

---

## История на функционалностите

### Приходи (Incomes)
- ✅ Пълна CRUD функционалност
- ✅ Връзка с обекти
- ✅ Показване в object cards и detail pages
- ✅ Баланс на обекти (приходи - разходи)
- ✅ Създаване на приход от банкова транзакция

### Банкови извлечения
- ✅ Качване на CSV от Asset Bank (windows-1251 encoding)
- ✅ Парсване с групиране по тип операция
- ✅ Плосък списък (без категории)
- ✅ Филтри: тип (всички/дебит/кредит), само неразпределени
- ✅ Редактиране на описание (inline)
- ✅ Присвояване на обект (всички транзакции)
- ✅ Заприходяване на техник (кредитни транзакции)
- ✅ Създаване на приход (кредитни транзакции)
- ✅ Визуална индикация за неразпределени (червен фон)

### Dashboard
- ✅ Статистика за обекти
- ✅ Баланси на техници (включва фактури създадени от техници)
- ✅ Общофирмени разходи

### Обекти (Construction Objects)
- ✅ CRUD операции
- ✅ Детайлна страница с транзакции
- ✅ Показване на приходи и баланс
- ✅ Сортиране по активност

### Фактури (Invoices)
- ✅ CRUD операции
- ✅ Връзка с обекти и техници
- ✅ Статуси (pending, approved, rejected)
- ✅ Филтри по обект и статус

### Инвентар
- ✅ CRUD операции
- ✅ Връзка с обекти

---

## Известни проблеми и ограничения

### Нуждаещи се от внимание:
1. ⚠️ GitHub Pages може да има cache - използвай Ctrl+Shift+R за hard refresh
2. ⚠️ CSV файловете от Asset Bank трябва да са в windows-1251 encoding
3. ⚠️ При първо зареждане може да се появи "Зареждане..." екран

### Бъдещи подобрения:
- [ ] Offline support (PWA cache)
- [ ] Bulk операции за банкови транзакции
- [ ] Експорт на отчети (PDF/Excel)
- [ ] Нотификации за нови фактури

---

## Как да продължиш работата

### Стартиране на dev server:
```powershell
cd "e:\VISUAL STUDIO\BARIN ALP_system"
npm run dev
```
URL: http://localhost:3000/barin-alp-system/

### Билдване:
```powershell
npm run build
```

### Deploy:
```powershell
git add -A
git commit -m "your message"
git push
```
GitHub Pages автоматично deploy-ва след push.

---

## Контекст за AI асистента

### Валута
- EUR (€) навсякъде в приложението

### Роли
- **director** - пълен достъп
- **technician** - ограничен достъп (обекти, фактури, инвентар)

### Банкова система
- Asset Bank
- CSV формат със semicolon (;) разделител
- Колони: IBAN, Дата, Дб/Кр, Сума, Валута, Наредител, Получател, Тип операция, Основание, Референция

### Типове операции в банката:
Вижте таблицата по-горе за детайлно описание на обработката.

---

## Следващи стъпки (когато продължим)

1. Тестване на новото групиране на транзакции с реално банково извлечение
2. Тестване на заприходяване на техници
3. Евентуално добавяне на отчети/статистика за групираните транзакции
4. Разглеждане на нови функционалности според нуждите на потребителя

---

**Забележка:** Всички промени са комитнати и пушнати към GitHub. Приложението е готово за тестване след реимпортиране на workflows и добавяне на новите колони в Google Sheets.
