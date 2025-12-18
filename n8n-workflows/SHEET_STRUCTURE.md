# Google Sheet Structure for BARIN-ALP

## Required Sheet Structure

### 1. Users Sheet
| Column | Type | Example |
|--------|------|---------|
| id | Number | 1 |
| username | Text | director1 |
| name | Text | Георги Директор |
| role | Text | director / technician |
| pin | Text | 7087 |

### 2. OBJECTS Sheet
| Column | Type | Example |
|--------|------|---------|
| ID | Number | 1 |
| NAME | Text | бул. Витошка 10 |
| ADDRESS | Text | ж.к. Младост 4 |
| STATUS | Text | active / paused / completed |
| totalExpenses | Number | 5000 |
| assignedTechnicians | Text | 3,4,5 (comma-separated user IDs) |

### 3. Invoices Sheet
| Column | Type | Example |
|--------|------|---------|
| id | Number | 1 |
| date | Date | 2024-12-18 |
| supplier | Text | Строй ООД |
| invoiceNumber | Text | INV-001 |
| total | Number | 1500 |
| description | Text | Цимент и пясък |
| createdBy | Number | 1 (user ID) |
| createdByName | Text | Георги Директор |
| objectId | Number | 1 (object ID, null if unassigned) |
| objectName | Text | бул. Витошка 10 |

### 4. Inventory Sheet
| Column | Type | Example |
|--------|------|---------|
| id | Number | 1 |
| name | Text | Бормашина Bosch |
| category | Text | Инструменти |
| status | Text | available / in-use / maintenance |
| assignedTo | Number | 3 (user ID) |
| assignedToName | Text | Петър Техник |
| objectId | Number | 1 (object ID) |
| objectName | Text | бул. Витошка 10 |
| photos | Text | URL1,URL2 |

### 5. Transactions Sheet
| Column | Type | Example |
|--------|------|---------|
| id | Number | 1 |
| type | Text | income / expense |
| userId | Number | 1 |
| userName | Text | Георги Директор |
| amount | Number | 5000 |
| date | Date | 2024-12-18 |
| description | Text | Плащане от клиент |
| createdBy | Number | 1 |
| objectId | Number | 1 |
| objectName | Text | бул. Витошка 10 |

---

## Important Notes

1. **Column names are case-sensitive** - make sure they match exactly

2. **ID columns** should be numbers and auto-increment

3. **assignedTechnicians** in OBJECTS should be comma-separated user IDs (e.g., "3,4,5")

4. **Unassigned invoices** have `objectId` = empty/null - these will show as "problematic" in the director view
