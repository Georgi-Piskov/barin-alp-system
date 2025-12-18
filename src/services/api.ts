import axios from 'axios';
import { API_CONFIG, buildApiUrl } from '../config/api';
import {
  User,
  ConstructionObject,
  Invoice,
  InventoryItem,
  Transaction,
  ApiResponse,
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
      return { success: true, data: response.data };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return { 
          success: false, 
          error: error.response?.data?.message || 'Грешка при вход' 
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
      return { success: true, data: response.data };
    } catch (error) {
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
      return { success: true, data: response.data };
    } catch (error) {
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
      return { success: true, data: response.data };
    } catch (error) {
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
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: 'Грешка при зареждане на фактури' };
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
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: 'Грешка при създаване на фактура' };
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
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: 'Грешка при зареждане на инвентар' };
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
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: 'Грешка при създаване на инвентар' };
    }
  },

  // ==================== TRANSACTIONS ====================
  async getTransactions(objectId?: number): Promise<ApiResponse<Transaction[]>> {
    if (DEMO_MODE) {
      return { success: true, data: [] };
    }

    try {
      const response = await api.get(buildApiUrl(API_CONFIG.ENDPOINTS.GET_TRANSACTIONS), {
        params: { objectId },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: 'Грешка при зареждане на транзакции' };
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
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: 'Грешка при създаване на транзакция' };
    }
  },

  // ==================== USERS ====================
  async getUsers(): Promise<ApiResponse<User[]>> {
    if (DEMO_MODE) {
      return { success: true, data: MOCK_USERS };
    }

    try {
      const response = await api.get(buildApiUrl(API_CONFIG.ENDPOINTS.GET_USERS));
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: 'Грешка при зареждане на потребители' };
    }
  },
};
