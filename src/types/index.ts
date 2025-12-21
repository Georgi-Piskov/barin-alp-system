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

// Invoice Item types
export interface InvoiceItem {
  name: string;        // Наименование
  unit: string;        // Мярка (бр, кг, м, м2, м3, л, торба, пакет)
  quantity: number;    // Количество
  unitPrice: number;   // Единична цена
  totalPrice: number;  // Обща цена (quantity * unitPrice)
}

// Invoice types
export interface Invoice {
  id: number;
  date: string;
  supplier: string;
  invoiceNumber: string;
  total: number;
  description: string;
  items: InvoiceItem[]; // Списък с артикули
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
export type PaymentMethod = 'cash' | 'bank';

export interface Transaction {
  id: number;
  type: TransactionType;
  userId: number;
  userName: string;
  amount: number;
  date: string;
  description: string;
  createdBy: number;
  createdByName?: string;
  objectId?: number | null;
  objectName?: string | null;
  method?: PaymentMethod;
  invoiceId?: number | null;
}

// Technician Balance
export interface TechnicianBalance {
  userId: number;
  userName: string;
  income: number;
  expense: number;
  balance: number;
}

// Expenses by Object
export interface ObjectExpenses {
  objectId: number;
  objectName: string;
  totalExpenses: number;
  invoiceCount: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Dashboard stats
export interface DashboardStats {
  // Overview
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  unassignedExpenses: number;
  
  // Counts
  totalObjects: number;
  activeObjects: number;
  totalInvoices: number;
  totalTransactions: number;
  inventoryCount?: number;
  
  // Detailed data
  technicianBalances: TechnicianBalance[];
  expensesByObject: ObjectExpenses[];
  
  // Recent data
  recentTransactions?: Transaction[];
  recentInvoices?: Invoice[];
}

// Bank Transaction types
export interface BankTransaction {
  id?: number;
  date: string;
  reference: string;
  description: string;
  displayName?: string;
  type: 'debit' | 'credit';
  amount: number;
  balance?: number;
  currency: string;
  iban?: string;
  category?: 'bank_fees' | 'loan_payment' | 'transfer' | 'other';
  counterpartyName?: string;
  invoiceRef?: string;
  purpose?: string;
  isCompanyExpense?: boolean;
  objectId?: number | null;
  objectName?: string | null;
  status: 'matched' | 'unmatched';
  matchedInvoiceId?: number;
}

export interface BankStatementParseResult {
  transactions: BankTransaction[];
  count: number;
  totalDebit: number;
  totalCredit: number;
  bankFeesTotal?: number;
  loanPaymentsTotal?: number;
  netChange?: number;
}
