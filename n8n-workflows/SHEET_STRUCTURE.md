# Google Sheet Structure for BARIN-ALP

## Required Sheet Structure

### 1. Users Sheet (Колони A-E)
| Колона | Header | Type | Example |
|--------|--------|------|---------|
| A | id | Number | 1 |
| B | username | Text | director1 |
| C | name | Text | Георги Директор |
| D | role | Text | director / technician |
| E | pin | Text | 7087 |

### 2. OBJECTS Sheet (Колони A-F)
| Колона | Header | Type | Example |
|--------|--------|------|---------|
| A | ID | Number | 1 |
| B | NAME | Text | бул. Витошка 10 |
| C | ADDRESS | Text | ж.к. Младост 4 |
| D | STATUS | Text | active / paused / completed |
| E | totalExpenses | Number | 5000 |
| F | assignedTechnicians | Text | 3,4,5 (comma-separated user IDs) |

### 3. Invoices Sheet (Колони A-K)
| Колона | Header | Type | Example |
|--------|--------|------|---------|
| A | id | Number | 1 |
| B | date | Date | 2024-12-18 |
| C | supplier | Text | Строй ООД |
| D | invoiceNumber | Text | INV-001 |
| E | total | Number | 1500 |
| F | description | Text | Цимент и пясък |
| G | createdBy | Number | 1 (user ID) |
| H | createdByName | Text | Георги Директор |
| I | objectId | Number | 1 (object ID, празно ако не е присвоена) |
| J | objectName | Text | бул. Витошка 10 (ИМЕ на обект, НЕ JSON!) |
| K | items | Text | JSON string: `[{"name":"Лепило","unit":"кг","quantity":5,"unitPrice":12,"totalPrice":60}]` |

**⚠️ ВАЖНО за Invoices:**
- Колона J (objectName) трябва да съдържа САМО текст с името на обекта
- Колона K (items) съдържа JSON масив с артикулите на фактурата
- Не бъркайте двете колони!

### 4. Inventory Sheet (Колони A-I)
| Колона | Header | Type | Example |
|--------|--------|------|---------|
| A | id | Number | 1 |
| B | name | Text | Бормашина Bosch |
| C | category | Text | Инструменти / Машини / Скелета / Защитни средства / Електроматериали / ВиК материали / Други |
| D | status | Text | available / in-use / maintenance / lost |
| E | assignedTo | Number | 3 (user ID) |
| F | assignedToName | Text | Петър Техник |
| G | objectId | Number | 1 (object ID) |
| H | objectName | Text | бул. Витошка 10 |
| I | photos | Text | JSON array - ["url1", "url2"] или Google Drive URLs |

### 5. Transactions Sheet (Колони A-M)
| Колона | Header | Type | Example |
|--------|--------|------|---------|
| A | id | Number | 1 |
| B | type | Text | income / expense |
| C | userId | Number | 1 |
| D | userName | Text | Георги Директор |
| E | amount | Number | 5000 |
| F | date | Date | 2024-12-18 |
| G | description | Text | Плащане от клиент |
| H | createdBy | Number | 1 |
| I | createdByName | Text | Георги Директор |
| J | objectId | Number | 1 |
| K | objectName | Text | бул. Витошка 10 |
| L | method | Text | cash / bank |
| M | invoiceId | Number | 1 (optional, links to invoice) |

---

## ⚠️ Важни бележки

1. **Имената на колоните са case-sensitive** - трябва да съвпадат точно!

2. **ID колоните** трябва да са числа и да се инкрементират автоматично

3. **assignedTechnicians** в OBJECTS трябва да е comma-separated user IDs (напр. "3,4,5")

4. **Неприсвоени фактури** имат `objectId` = празно - показват се като "проблемни" в директорския изглед

5. **items в Invoices** - JSON масив с формат:
   ```json
   [
     {"name": "Лепило", "unit": "кг", "quantity": 5, "unitPrice": 12, "totalPrice": 60},
     {"name": "Цимент", "unit": "торба", "quantity": 10, "unitPrice": 8.5, "totalPrice": 85}
   ]
   ```

6. **Transactions type**: 
   - `income` = заприходяване (пари дадени на техник)
   - `expense` = разход (техникът е похарчил)

7. **method в Transactions**:
   - `cash` = в брой
   - `bank` = банков превод

---

## Бърза проверка на структурата

### Invoices Sheet Headers (ред 1):
```
A1: id | B1: date | C1: supplier | D1: invoiceNumber | E1: total | F1: description | G1: createdBy | H1: createdByName | I1: objectId | J1: objectName | K1: items
```

### Transactions Sheet Headers (ред 1):
```
A1: id | B1: type | C1: userId | D1: userName | E1: amount | F1: date | G1: description | H1: createdBy | I1: createdByName | J1: objectId | K1: objectName | L1: method | M1: invoiceId
```
