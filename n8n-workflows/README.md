# n8n Workflows за BARIN-ALP

## 📋 Предварителни изисквания

1. **Google Sheets Credential в n8n**
   - Отиди в n8n → Settings → Credentials
   - Добави "Google Sheets OAuth2 API"
   - Свържи с Google акаунт, който има достъп до таблицата

2. **Google Sheet трябва да има следните колони:**
   
   **Users sheet:**
   - id, username, name, role, pin
   
   **OBJECTS sheet:**
   - ID, NAME, ADDRESS, STATUS, totalExpenses, assignedTechnicians

---

## 🚀 Инсталация на Workflows

### Метод 1: Импортиране на JSON файлове

1. Отвори n8n
2. Кликни "+ Create Workflow"
3. Кликни на менюто (⋮) горе вдясно
4. Избери "Import from File..."
5. Импортирай файловете в следния ред:
   - `01-login.json`
   - `02-get-objects.json`
   - `03-create-object.json`
   - `04-update-object.json`
   - `05-delete-object.json`
   - `06-get-users.json`

### Метод 2: Ръчно създаване

Ако импортирането не работи, създай workflows ръчно по описанията по-долу.

---

## 🔧 След импортиране

За ВСЕКИ workflow:

1. **Отвори workflow-а**

2. **Конфигурирай Google Sheets node:**
   - Кликни на Google Sheets node
   - В "Credential to connect with" избери твоя Google Sheets credential
   - Провери дали Document ID е правилен: `1Mvg9vxzp7LyYwNor0i8o8LvqYiF0ID4WD3Af58zkVTo`
   - Избери правилния Sheet (Users или OBJECTS)

3. **Активирай workflow-а:**
   - Кликни на toggle бутона горе вдясно
   - Трябва да стане "Active"

4. **Копирай Production URL:**
   - Кликни на Webhook node
   - Копирай "Production URL" (не Test URL!)

---

## 📡 Webhook URLs

След като активираш workflows, URL-ите ще бъдат:

| Workflow | Method | URL |
|----------|--------|-----|
| Login | POST | `https://n8n.simeontsvetanovn8nworkflows.site/webhook/barin-alp/login` |
| Get Objects | GET | `https://n8n.simeontsvetanovn8nworkflows.site/webhook/barin-alp/objects` |
| Create Object | POST | `https://n8n.simeontsvetanovn8nworkflows.site/webhook/barin-alp/objects/create` |
| Update Object | PUT | `https://n8n.simeontsvetanovn8nworkflows.site/webhook/barin-alp/objects/update` |
| Delete Object | DELETE | `https://n8n.simeontsvetanovn8nworkflows.site/webhook/barin-alp/objects/delete` |
| Get Users | GET | `https://n8n.simeontsvetanovn8nworkflows.site/webhook/barin-alp/users` |

---

## 🧪 Тестване

### Тест Login:
```bash
curl -X POST https://n8n.simeontsvetanovn8nworkflows.site/webhook/barin-alp/login \
  -H "Content-Type: application/json" \
  -d '{"username": "director1", "pin": "7087"}'
```

### Тест Get Objects:
```bash
curl https://n8n.simeontsvetanovn8nworkflows.site/webhook/barin-alp/objects
```

### Тест Create Object:
```bash
curl -X POST https://n8n.simeontsvetanovn8nworkflows.site/webhook/barin-alp/objects/create \
  -H "Content-Type: application/json" \
  -d '{"name": "Тест обект", "address": "Тестов адрес", "status": "active", "totalExpenses": 0, "assignedTechnicians": [3, 4]}'
```

---

## ⚠️ Важно

1. **CORS:** Workflows са конфигурирани с `allowedOrigins: "*"` за да работят от GitHub Pages

2. **Сигурност:** В продукция е добре да ограничиш origins само до твоя домейн

3. **Sheet колони:** Колоните в Google Sheet трябва да съвпадат точно с тези в workflows

---

## 🐛 Troubleshooting

**Проблем: 404 от webhook**
- Провери дали workflow-ът е активен (Active toggle)
- Провери дали използваш Production URL, не Test URL

**Проблем: Грешка от Google Sheets**
- Провери credentials
- Провери дали sheet name-ът съвпада точно (case-sensitive)
- Провери дали колоните съществуват

**Проблем: CORS грешка**
- Провери allowedOrigins в Webhook node options
