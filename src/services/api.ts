import axios from 'axios';
import { API_CONFIG, buildApiUrl } from '../config/api';
import {
  User,
  ConstructionObject,
  Invoice,
  InventoryItem,
  Transaction,
  ApiResponse,
  DashboardStats,
  BankStatementParseResult,
  BankTransaction,
} from '../types';

// Create axios instance
const api = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// For development/demo - mock data
// Set to false when n8n backend is ready, or use env variable
const DEMO_MODE = false; // n8n backend is now active!

// ==================== CACHING ====================
// Simple cache to reduce API calls and avoid quota limits
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache: Map<string, CacheEntry<unknown>> = new Map();
const CACHE_TTL = 30000; // 30 seconds cache

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    console.log(`Cache hit: ${key}`);
    return entry.data as T;
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

function clearCache(keyPrefix?: string): void {
  if (keyPrefix) {
    for (const key of cache.keys()) {
      if (key.startsWith(keyPrefix)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
}

// Mock users data (matches your Google Sheet)
const MOCK_USERS: User[] = [
  { id: 1, username: 'director1', name: 'Георги Директор', role: 'director', pin: '7087' },
  { id: 2, username: 'director2', name: 'Иван Директор', role: 'director', pin: '1234' },
  { id: 3, username: 'tech1', name: 'Петър Техник', role: 'technician', pin: '1234' },
  { id: 4, username: 'tech2', name: 'Стоян Техник', role: 'technician', pin: '1234' },
  { id: 5, username: 'tech3', name: 'Димитър Техник', role: 'technician', pin: '1234' },
];

// Mock objects
const MOCK_OBJECTS: ConstructionObject[] = [
  { id: 1, name: 'бул. Витошка 10', address: 'ж.к. Младост 4', status: 'active', totalExpenses: 5000, assignedTechnicians: [3, 4] },
  { id: 2, name: 'Обект Люлин', address: 'ж.к. Люлин бл. 2', status: 'active', totalExpenses: 8500, assignedTechnicians: [4, 5] },
  { id: 3, name: 'Обект Младост', address: 'ж.к. Младост 4', status: 'active', totalExpenses: 12300, assignedTechnicians: [3] },
];

export const apiService = {
  // ==================== AUTH ====================
  async login(username: string, pin: string): Promise<ApiResponse<User>> {
    if (DEMO_MODE) {
      // Demo mode - check against mock data
      const user = MOCK_USERS.find(
        (u) => u.username === username && u.pin === pin
      );
      
      if (user) {
        return { success: true, data: user };
      }
      return { success: false, error: 'Грешно потребителско име или ПИН' };
    }

    try {
      const response = await api.post(buildApiUrl(API_CONFIG.ENDPOINTS.LOGIN), {
        username,
        pin,
      });
      
      console.log('Login response from n8n:', response.data);
      
      // n8n returns { success: true, data: {...} } or { success: false, error: '...' }
      if (response.data?.success && response.data?.data) {
        const userData = response.data.data;
        // Ensure role is correctly mapped
        if (userData.role) {
          userData.role = userData.role.toLowerCase();
        }
        return { success: true, data: userData };
      } else if (response.data?.success === false) {
        return { success: false, error: response.data.error || 'Грешно потребителско име или ПИН' };
      }
      
      // Fallback: handle different response formats
      const userData = response.data?.user || response.data;
      if (userData && userData.role) {
        userData.role = userData.role.toLowerCase();
      }
      
      return { success: true, data: userData };
    } catch (error: unknown) {
      console.error('Login error:', error);
      if (axios.isAxiosError(error)) {
        return { 
          success: false, 
          error: error.response?.data?.message || error.response?.data?.error || 'Грешка при вход' 
        };
      }
      return { success: false, error: 'Грешка при свързване' };
    }
  },

  // ==================== OBJECTS ====================
  async getObjects(userId?: number, role?: string): Promise<ApiResponse<ConstructionObject[]>> {
    if (DEMO_MODE) {
      // If technician, filter by assigned objects
      if (role === 'technician' && userId) {
        const filtered = MOCK_OBJECTS.filter(
          (obj) => obj.assignedTechnicians?.includes(userId)
        );
        return { success: true, data: filtered };
      }
      return { success: true, data: MOCK_OBJECTS };
    }

    try {
      const response = await api.get(buildApiUrl(API_CONFIG.ENDPOINTS.GET_OBJECTS), {
        params: { userId, role },
      });
      
      console.log('Get Objects response from n8n:', response.data);
      
      // n8n returns { data: [...] } format
      if (response.data?.data && Array.isArray(response.data.data)) {
        return { success: true, data: response.data.data };
      }
      
      // Handle array response
      if (Array.isArray(response.data)) {
        return { success: true, data: response.data };
      }
      
      return { success: true, data: [] };
    } catch (error) {
      console.error('Get Objects error:', error);
      return { success: false, error: 'Грешка при зареждане на обекти' };
    }
  },

  async createObject(object: Omit<ConstructionObject, 'id'>): Promise<ApiResponse<ConstructionObject>> {
    if (DEMO_MODE) {
      const newObject = { ...object, id: Date.now() };
      MOCK_OBJECTS.push(newObject);
      return { success: true, data: newObject };
    }

    try {
      const response = await api.post(
        buildApiUrl(API_CONFIG.ENDPOINTS.CREATE_OBJECT),
        object
      );
      
      console.log('Create Object response from n8n:', response.data);
      
      // n8n returns { success: true, data: {...} }
      if (response.data?.success && response.data?.data) {
        return { success: true, data: response.data.data };
      }
      
      // Fallback for direct object response
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Create Object error:', error);
      return { success: false, error: 'Грешка при създаване на обект' };
    }
  },

  async updateObject(id: number, updates: Partial<ConstructionObject>): Promise<ApiResponse<ConstructionObject>> {
    if (DEMO_MODE) {
      const index = MOCK_OBJECTS.findIndex((o) => o.id === id);
      if (index !== -1) {
        MOCK_OBJECTS[index] = { ...MOCK_OBJECTS[index], ...updates };
        return { success: true, data: MOCK_OBJECTS[index] };
      }
      return { success: false, error: 'Обектът не е намерен' };
    }

    try {
      const response = await api.put(
        buildApiUrl(API_CONFIG.ENDPOINTS.UPDATE_OBJECT),
        { id, ...updates }
      );
      
      console.log('Update Object response from n8n:', response.data);
      
      // n8n returns { success: true, data: {...} }
      if (response.data?.success && response.data?.data) {
        return { success: true, data: response.data.data };
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Update Object error:', error);
      return { success: false, error: 'Грешка при обновяване на обект' };
    }
  },

  async deleteObject(id: number): Promise<ApiResponse<void>> {
    if (DEMO_MODE) {
      const index = MOCK_OBJECTS.findIndex((o) => o.id === id);
      if (index !== -1) {
        MOCK_OBJECTS.splice(index, 1);
        return { success: true };
      }
      return { success: false, error: 'Обектът не е намерен' };
    }

    try {
      await api.delete(buildApiUrl(API_CONFIG.ENDPOINTS.DELETE_OBJECT), {
        data: { id },
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Грешка при изтриване на обект' };
    }
  },

  // ==================== INVOICES ====================
  async getInvoices(objectId?: number): Promise<ApiResponse<Invoice[]>> {
    if (DEMO_MODE) {
      return { success: true, data: [] };
    }

    try {
      const response = await api.get(buildApiUrl(API_CONFIG.ENDPOINTS.GET_INVOICES), {
        params: { objectId },
      });
      
      console.log('Get Invoices RAW response from n8n:', JSON.stringify(response.data, null, 2));
      
      // Parse items from JSON string if needed
      const parseInvoiceItems = (invoice: any): Invoice => {
        // Parse items - could be string, array, or undefined
        let items = invoice.items;
        
        // Check if items is in wrong column (objectName might contain JSON)
        if ((!items || items === '[]' || items === '') && invoice.objectName) {
          // Check if objectName looks like JSON array
          if (typeof invoice.objectName === 'string' && invoice.objectName.startsWith('[')) {
            try {
              items = JSON.parse(invoice.objectName);
              // Clear objectName since it was actually items
              invoice.objectName = null;
              invoice.objectId = null;
            } catch {
              // Not JSON, keep as objectName
            }
          }
        }
        
        if (typeof items === 'string') {
          try {
            items = JSON.parse(items);
          } catch {
            items = [];
          }
        }
        if (!Array.isArray(items)) {
          items = [];
        }
        
        return {
          ...invoice,
          items,
          total: Number(invoice.total) || 0,
          objectId: invoice.objectId ? Number(invoice.objectId) : null,
          createdBy: Number(invoice.createdBy) || 0,
        };
      };
      
      // n8n returns { data: [...] } format
      if (response.data?.data && Array.isArray(response.data.data)) {
        const invoices = response.data.data.map(parseInvoiceItems);
        console.log('Parsed invoices:', invoices);
        return { success: true, data: invoices };
      }
      
      if (Array.isArray(response.data)) {
        const invoices = response.data.map(parseInvoiceItems);
        console.log('Parsed invoices:', invoices);
        return { success: true, data: invoices };
      }
      
      return { success: true, data: [] };
    } catch (error) {
      console.error('Get Invoices error:', error);
      return { success: false, error: 'Грешка при зареждане на фактури', data: [] };
    }
  },

  async createInvoice(invoice: Omit<Invoice, 'id'>): Promise<ApiResponse<Invoice>> {
    if (DEMO_MODE) {
      const newInvoice = { ...invoice, id: Date.now() };
      return { success: true, data: newInvoice };
    }

    try {
      const response = await api.post(
        buildApiUrl(API_CONFIG.ENDPOINTS.CREATE_INVOICE),
        invoice
      );
      
      console.log('Create Invoice response from n8n:', response.data);
      
      if (response.data?.success && response.data?.data) {
        return { success: true, data: response.data.data };
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Create Invoice error:', error);
      return { success: false, error: 'Грешка при създаване на фактура' };
    }
  },

  async updateInvoice(id: number, updates: Partial<Invoice>): Promise<ApiResponse<Invoice>> {
    if (DEMO_MODE) {
      return { success: false, error: 'Demo mode' };
    }

    try {
      const response = await api.put(
        buildApiUrl(API_CONFIG.ENDPOINTS.UPDATE_INVOICE),
        { id, ...updates }
      );
      
      console.log('Update Invoice response from n8n:', response.data);
      
      if (response.data?.success && response.data?.data) {
        return { success: true, data: response.data.data };
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Update Invoice error:', error);
      return { success: false, error: 'Грешка при обновяване на фактура' };
    }
  },

  async deleteInvoice(id: number): Promise<ApiResponse<void>> {
    if (DEMO_MODE) {
      return { success: true };
    }

    try {
      await api.delete(buildApiUrl(API_CONFIG.ENDPOINTS.DELETE_INVOICE), {
        data: { id },
      });
      return { success: true };
    } catch (error) {
      console.error('Delete Invoice error:', error);
      return { success: false, error: 'Грешка при изтриване на фактура' };
    }
  },

  // ==================== INVENTORY ====================
  async getInventory(objectId?: number): Promise<ApiResponse<InventoryItem[]>> {
    if (DEMO_MODE) {
      return { success: true, data: [] };
    }

    try {
      const response = await api.get(buildApiUrl(API_CONFIG.ENDPOINTS.GET_INVENTORY), {
        params: { objectId },
      });
      
      console.log('Get Inventory response from n8n:', response.data);
      
      // n8n returns { data: [...] } format
      if (response.data?.data && Array.isArray(response.data.data)) {
        return { success: true, data: response.data.data };
      }
      
      if (Array.isArray(response.data)) {
        return { success: true, data: response.data };
      }
      
      return { success: true, data: [] };
    } catch (error) {
      console.error('Get Inventory error:', error);
      return { success: false, error: 'Грешка при зареждане на инвентар', data: [] };
    }
  },

  async createInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<ApiResponse<InventoryItem>> {
    if (DEMO_MODE) {
      const newItem = { ...item, id: Date.now() };
      return { success: true, data: newItem };
    }

    try {
      const response = await api.post(
        buildApiUrl(API_CONFIG.ENDPOINTS.CREATE_INVENTORY),
        item
      );
      
      console.log('Create Inventory response from n8n:', response.data);
      
      if (response.data?.success && response.data?.data) {
        return { success: true, data: response.data.data };
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Create Inventory error:', error);
      return { success: false, error: 'Грешка при създаване на артикул' };
    }
  },

  async updateInventoryItem(id: number, updates: Partial<InventoryItem>): Promise<ApiResponse<InventoryItem>> {
    if (DEMO_MODE) {
      return { success: false, error: 'Demo mode' };
    }

    try {
      const response = await api.put(
        buildApiUrl(API_CONFIG.ENDPOINTS.UPDATE_INVENTORY),
        { id, ...updates }
      );
      
      console.log('Update Inventory response from n8n:', response.data);
      
      if (response.data?.success && response.data?.data) {
        return { success: true, data: response.data.data };
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Update Inventory error:', error);
      return { success: false, error: 'Грешка при обновяване на артикул' };
    }
  },

  async deleteInventoryItem(id: number): Promise<ApiResponse<void>> {
    if (DEMO_MODE) {
      return { success: true };
    }

    try {
      await api.delete(buildApiUrl(API_CONFIG.ENDPOINTS.DELETE_INVENTORY), {
        data: { id },
      });
      return { success: true };
    } catch (error) {
      console.error('Delete Inventory error:', error);
      return { success: false, error: 'Грешка при изтриване на артикул' };
    }
  },

  // ==================== PHOTOS ====================
  async uploadPhoto(photo: string, fileName?: string, itemId?: number, itemName?: string): Promise<ApiResponse<{ url: string; fileId: string }>> {
    if (DEMO_MODE) {
      // In demo mode, just return the base64 as-is
      return { success: true, data: { url: photo, fileId: 'demo' } };
    }

    try {
      const response = await api.post(
        buildApiUrl(API_CONFIG.ENDPOINTS.UPLOAD_PHOTO),
        {
          photo,
          fileName: fileName || `photo_${Date.now()}.jpg`,
          itemId,
          itemName,
        }
      );
      
      console.log('Upload Photo RAW response:', JSON.stringify(response.data, null, 2));
      
      // Handle different response formats from n8n
      if (response.data?.success && response.data?.data?.url) {
        return { success: true, data: response.data.data };
      }
      
      // Sometimes n8n returns data directly without wrapper
      if (response.data?.url) {
        return { success: true, data: { url: response.data.url, fileId: response.data.fileId || '' } };
      }
      
      // Try to extract from nested structure
      if (response.data?.data?.url) {
        return { success: true, data: response.data.data };
      }
      
      console.warn('Could not extract URL from response:', JSON.stringify(response.data));
      return { success: false, error: 'No URL in response' };
    } catch (error) {
      console.error('Upload Photo error:', error);
      return { success: false, error: 'Грешка при качване на снимка' };
    }
  },

  // ==================== TRANSACTIONS ====================
  async getTransactions(filters?: { userId?: number; objectId?: number; type?: string }): Promise<ApiResponse<Transaction[]>> {
    if (DEMO_MODE) {
      return { success: true, data: [] };
    }

    try {
      const response = await api.get(buildApiUrl(API_CONFIG.ENDPOINTS.GET_TRANSACTIONS), {
        params: filters,
      });
      
      console.log('Get Transactions response from n8n:', response.data);
      
      // n8n returns { data: [...] } format
      if (response.data?.data && Array.isArray(response.data.data)) {
        return { success: true, data: response.data.data };
      }
      
      if (Array.isArray(response.data)) {
        return { success: true, data: response.data };
      }
      
      return { success: true, data: [] };
    } catch (error) {
      console.error('Get Transactions error:', error);
      return { success: false, error: 'Грешка при зареждане на транзакции', data: [] };
    }
  },

  async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<ApiResponse<Transaction>> {
    if (DEMO_MODE) {
      const newTransaction = { ...transaction, id: Date.now() };
      return { success: true, data: newTransaction };
    }

    try {
      const response = await api.post(
        buildApiUrl(API_CONFIG.ENDPOINTS.CREATE_TRANSACTION),
        transaction
      );
      
      console.log('Create Transaction response from n8n:', response.data);
      
      if (response.data?.success && response.data?.data) {
        return { success: true, data: response.data.data };
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Create Transaction error:', error);
      return { success: false, error: 'Грешка при създаване на транзакция' };
    }
  },

  // ==================== DASHBOARD ====================
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    if (DEMO_MODE) {
      return { 
        success: true, 
        data: {
          totalIncome: 0,
          totalExpenses: 0,
          netBalance: 0,
          unassignedExpenses: 0,
          totalObjects: 0,
          activeObjects: 0,
          totalInvoices: 0,
          totalTransactions: 0,
          technicianBalances: [],
          expensesByObject: [],
        }
      };
    }

    try {
      const response = await api.get(buildApiUrl(API_CONFIG.ENDPOINTS.GET_DASHBOARD));
      
      console.log('Get Dashboard response from n8n:', response.data);
      
      if (response.data?.success && response.data?.data) {
        return { success: true, data: response.data.data };
      }
      
      if (response.data?.data) {
        return { success: true, data: response.data.data };
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get Dashboard error:', error);
      return { success: false, error: 'Грешка при зареждане на dashboard' };
    }
  },

  // ==================== BANK STATEMENTS ====================
  async parseBankStatement(csvContent: string): Promise<ApiResponse<BankStatementParseResult>> {
    if (DEMO_MODE) {
      return { 
        success: true, 
        data: {
          transactions: [],
          count: 0,
          totalDebit: 0,
          totalCredit: 0,
        }
      };
    }

    try {
      const response = await api.post(
        buildApiUrl(API_CONFIG.ENDPOINTS.PARSE_BANK_STATEMENT),
        { csv: csvContent }
      );
      
      console.log('Parse Bank Statement response from n8n:', response.data);
      
      if (response.data?.success && response.data?.data) {
        return { success: true, data: response.data.data };
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Parse Bank Statement error:', error);
      return { success: false, error: 'Грешка при парсване на банково извлечение' };
    }
  },

  async getBankTransactions(): Promise<ApiResponse<BankStatementParseResult>> {
    if (DEMO_MODE) {
      return { 
        success: true, 
        data: {
          transactions: [],
          count: 0,
          totalDebit: 0,
          totalCredit: 0,
        }
      };
    }

    try {
      const response = await api.get(
        buildApiUrl(API_CONFIG.ENDPOINTS.GET_BANK_TRANSACTIONS)
      );
      
      console.log('Get Bank Transactions response from n8n:', response.data);
      
      if (response.data?.success && response.data?.data) {
        return { success: true, data: response.data.data };
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get Bank Transactions error:', error);
      return { success: false, error: 'Грешка при зареждане на банкови транзакции' };
    }
  },

  async saveBankTransactions(transactions: BankTransaction[]): Promise<ApiResponse<{ insertedCount: number; duplicateCount: number }>> {
    if (DEMO_MODE) {
      return { success: true, data: { insertedCount: transactions.length, duplicateCount: 0 } };
    }

    try {
      const response = await api.post(
        buildApiUrl(API_CONFIG.ENDPOINTS.SAVE_BANK_TRANSACTIONS),
        { transactions }
      );
      
      console.log('Save Bank Transactions response from n8n:', response.data);
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Save Bank Transactions error:', error);
      return { success: false, error: 'Грешка при запазване на банкови транзакции' };
    }
  },

  async updateBankTransaction(id: number, data: { objectId?: number | null; objectName?: string; status?: string }): Promise<ApiResponse<BankTransaction>> {
    if (DEMO_MODE) {
      return { success: true };
    }

    const url = buildApiUrl(API_CONFIG.ENDPOINTS.UPDATE_BANK_TRANSACTION);
    const payload = { id, ...data };
    console.log('UPDATE BANK TX - URL:', url);
    console.log('UPDATE BANK TX - Data:', payload);

    try {
      const response = await api.post(url, payload);
      
      console.log('Update Bank Transaction response from n8n:', response.data);
      
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Update Bank Transaction error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      return { success: false, error: 'Грешка при обновяване на банкова транзакция' };
    }
  },

  // ==================== USERS ====================
  async getUsers(): Promise<ApiResponse<User[]>> {
    if (DEMO_MODE) {
      return { success: true, data: MOCK_USERS };
    }

    try {
      const response = await api.get(buildApiUrl(API_CONFIG.ENDPOINTS.GET_USERS));
      
      console.log('Get Users response from n8n:', response.data);
      
      // n8n returns { data: [...] } format
      if (response.data?.data && Array.isArray(response.data.data)) {
        return { success: true, data: response.data.data };
      }
      
      // Handle array response
      if (Array.isArray(response.data)) {
        return { success: true, data: response.data };
      }
      
      return { success: true, data: [] };
    } catch (error) {
      console.error('Get Users error:', error);
      return { success: false, error: 'Грешка при зареждане на потребители', data: [] };
    }
  },

  // ==================== OBJECT DETAILS (Combined) ====================
  // Returns all data for an object in a single API call to reduce quota usage
  async getObjectDetails(objectId: number): Promise<ApiResponse<{
    object: ConstructionObject;
    technicians: User[];
    invoices: Invoice[];
    inventory: InventoryItem[];
    bankTransactions: BankTransaction[];
    transactions: Transaction[];
  }>> {
    const cacheKey = `object-details-${objectId}`;
    
    // Check cache first
    const cached = getCached<typeof cacheKey>(cacheKey);
    if (cached) {
      return { success: true, data: cached as any };
    }

    if (DEMO_MODE) {
      const obj = MOCK_OBJECTS.find(o => o.id === objectId);
      if (!obj) return { success: false, error: 'Object not found' };
      
      return { 
        success: true, 
        data: {
          object: obj,
          technicians: [],
          invoices: [],
          inventory: [],
          bankTransactions: [],
          transactions: []
        }
      };
    }

    try {
      const endpoint = API_CONFIG.ENDPOINTS.GET_OBJECT_DETAILS.replace(':id', String(objectId));
      const response = await api.get(buildApiUrl(endpoint));
      
      console.log('Get Object Details response from n8n:', response.data);
      
      if (response.data?.success && response.data?.data) {
        setCache(cacheKey, response.data.data);
        return { success: true, data: response.data.data };
      }
      
      // Fallback to separate calls if combined endpoint not available
      console.log('Combined endpoint not available, falling back to separate calls...');
      return this.getObjectDetailsFallback(objectId);
    } catch (error) {
      console.error('Get Object Details error:', error);
      // Fallback to separate calls
      return this.getObjectDetailsFallback(objectId);
    }
  },

  // Fallback method - uses separate calls with delays to avoid quota
  async getObjectDetailsFallback(objectId: number): Promise<ApiResponse<{
    object: ConstructionObject;
    technicians: User[];
    invoices: Invoice[];
    inventory: InventoryItem[];
    bankTransactions: BankTransaction[];
    transactions: Transaction[];
  }>> {
    const cacheKey = `object-details-${objectId}`;
    
    try {
      // Add small delays between calls to avoid hitting quota
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      // Load objects (uses cache if available)
      const objectsCacheKey = 'objects-list';
      let objects = getCached<ConstructionObject[]>(objectsCacheKey);
      if (!objects) {
        const objectsResult = await this.getObjects();
        objects = objectsResult.success ? objectsResult.data || [] : [];
        setCache(objectsCacheKey, objects);
      }
      
      const object = objects.find(o => o.id === objectId);
      if (!object) {
        return { success: false, error: 'Обектът не е намерен' };
      }
      
      await delay(200);
      
      // Load users (for technicians)
      const usersCacheKey = 'users-list';
      let users = getCached<User[]>(usersCacheKey);
      if (!users) {
        const usersResult = await this.getUsers();
        users = usersResult.success ? usersResult.data || [] : [];
        setCache(usersCacheKey, users);
      }
      
      const techIds = object.assignedTechnicians || [];
      const technicians = users.filter(u => techIds.includes(u.id) && u.role === 'technician');
      
      await delay(200);
      
      // Load invoices (uses cache)
      const invoicesCacheKey = 'invoices-list';
      let allInvoices = getCached<Invoice[]>(invoicesCacheKey);
      if (!allInvoices) {
        const invoicesResult = await this.getInvoices();
        allInvoices = invoicesResult.success ? invoicesResult.data || [] : [];
        setCache(invoicesCacheKey, allInvoices);
      }
      const invoices = allInvoices.filter(inv => inv.objectId === objectId);
      
      await delay(200);
      
      // Load inventory (uses cache)
      const inventoryCacheKey = 'inventory-list';
      let allInventory = getCached<InventoryItem[]>(inventoryCacheKey);
      if (!allInventory) {
        const inventoryResult = await this.getInventory();
        allInventory = inventoryResult.success ? inventoryResult.data || [] : [];
        setCache(inventoryCacheKey, allInventory);
      }
      const inventory = allInventory.filter(item => item.objectId === objectId);
      
      await delay(200);
      
      // Load bank transactions (uses cache)
      const bankCacheKey = 'bank-transactions-list';
      let allBankTx = getCached<BankTransaction[]>(bankCacheKey);
      if (!allBankTx) {
        const bankResult = await this.getBankTransactions();
        // getBankTransactions returns { transactions: [...] } format
        allBankTx = bankResult.success && bankResult.data?.transactions ? bankResult.data.transactions : [];
        setCache(bankCacheKey, allBankTx);
      }
      const bankTransactions = (allBankTx || []).filter(tx => tx.objectId === objectId);
      
      await delay(200);
      
      // Load transactions (uses cache)
      const transactionsCacheKey = 'transactions-list';
      let allTransactions = getCached<Transaction[]>(transactionsCacheKey);
      if (!allTransactions) {
        const transactionsResult = await this.getTransactions();
        allTransactions = transactionsResult.success ? transactionsResult.data || [] : [];
        setCache(transactionsCacheKey, allTransactions);
      }
      const transactions = allTransactions.filter(tx => tx.objectId === objectId);
      
      const result = {
        object,
        technicians,
        invoices,
        inventory,
        bankTransactions,
        transactions
      };
      
      setCache(cacheKey, result);
      
      return { success: true, data: result };
    } catch (error) {
      console.error('Get Object Details Fallback error:', error);
      return { success: false, error: 'Грешка при зареждане на данни за обекта' };
    }
  },

  // Clear cache (call after mutations)
  clearCache(prefix?: string): void {
    clearCache(prefix);
  }
};
