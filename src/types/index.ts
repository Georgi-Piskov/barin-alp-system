// User types
export interface User {
  id: number;
  username: string;
  name: string;
  role: 'director' | 'technician';
  pin: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Object (Construction Site) types
export interface ConstructionObject {
  id: number;
  name: string;
  address: string;
  status: 'active' | 'completed' | 'paused';
  totalExpenses: number;
  assignedTechnicians?: number[]; // User IDs
}

// Invoice types
export interface Invoice {
  id: number;
  date: string;
  supplier: string;
  invoiceNumber: string;
  total: number;
  description: string;
  createdBy: number;
  createdByName: string;
  objectId: number | null; // null = unassigned (problematic)
  objectName: string | null;
}

// Inventory types
export interface InventoryItem {
  id: number;
  name: string;
  category: string;
  status: 'available' | 'in-use' | 'maintenance' | 'lost';
  assignedTo: number | null; // User ID
  assignedToName: string | null;
  objectId: number | null;
  objectName: string | null;
  photos: string[]; // URLs
}

// Transaction types
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: number;
  type: TransactionType;
  userId: number;
  userName: string;
  amount: number;
  date: string;
  description: string;
  createdBy: number;
  objectId?: number | null;
  objectName?: string | null;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Dashboard stats
export interface DashboardStats {
  totalObjects: number;
  activeObjects: number;
  totalIncome: number;
  totalExpenses: number;
  unassignedExpenses: number;
  inventoryCount: number;
}
