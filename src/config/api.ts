// n8n Backend Configuration
// Update these URLs when you set up your n8n workflows

// Company configurations
export interface Company {
  id: string;
  name: string;
  shortName: string;
  sheetId: string;
  apiPrefix: string; // API endpoint prefix
  color: string; // For UI distinction
}

export const COMPANIES: Company[] = [
  {
    id: 'barin-alp',
    name: 'БАРИН АЛП',
    shortName: 'БАРИН',
    sheetId: '1Mvg9vxzp7LyYwNor0i8o8LvqYiF0ID4WD3Af58zkVTo',
    apiPrefix: 'barin-alp',
    color: 'primary', // Blue theme
  },
  {
    id: 'hefest',
    name: 'ХЕФЕСТ ООД',
    shortName: 'ХЕФЕСТ',
    sheetId: '1hv4XAfHhScA40Bm1kQ3I-Ih4SJuCBpOJxTOYDNb167g',
    apiPrefix: 'hefest',
    color: 'orange', // Orange theme to distinguish
  },
];

// Default company (used when no company is selected)
const DEFAULT_PREFIX = 'barin-alp';

// Current API prefix - will be updated when company is selected
let currentApiPrefix = DEFAULT_PREFIX;

// Set the current API prefix based on selected company
export const setApiPrefix = (prefix: string) => {
  currentApiPrefix = prefix;
  console.log('API prefix set to:', prefix);
};

// Get current API prefix
export const getApiPrefix = () => currentApiPrefix;

// Generate endpoints dynamically based on current company
export const getEndpoints = () => ({
  // Auth
  LOGIN: `/${currentApiPrefix}/login`,
  
  // Users
  GET_USERS: `/${currentApiPrefix}/users`,
  
  // Objects
  GET_OBJECTS: `/${currentApiPrefix}/objects`,
  CREATE_OBJECT: `/${currentApiPrefix}/objects/create`,
  UPDATE_OBJECT: `/${currentApiPrefix}/objects/update`,
  DELETE_OBJECT: `/${currentApiPrefix}/objects/delete`,
  
  // Invoices
  GET_INVOICES: `/${currentApiPrefix}/invoices`,
  CREATE_INVOICE: `/${currentApiPrefix}/invoices/create`,
  UPDATE_INVOICE: `/${currentApiPrefix}/invoices/update`,
  DELETE_INVOICE: `/${currentApiPrefix}/invoices/delete`,
  
  // Inventory
  GET_INVENTORY: `/${currentApiPrefix}/inventory`,
  CREATE_INVENTORY: `/${currentApiPrefix}/inventory/create`,
  UPDATE_INVENTORY: `/${currentApiPrefix}/inventory/update`,
  DELETE_INVENTORY: `/${currentApiPrefix}/inventory/delete`,
  
  // Photos
  UPLOAD_PHOTO: `/${currentApiPrefix}/upload-photo`,
  
  // Transactions
  GET_TRANSACTIONS: `/${currentApiPrefix}/transactions`,
  CREATE_TRANSACTION: `/${currentApiPrefix}/transactions/create`,
  UPDATE_TRANSACTION: `/${currentApiPrefix}/transactions/update`,
  DELETE_TRANSACTION: `/${currentApiPrefix}/transactions/delete`,
  
  // Dashboard
  GET_DASHBOARD: `/${currentApiPrefix}/dashboard`,
  
  // Bank Statements
  PARSE_BANK_STATEMENT: `/${currentApiPrefix}/bank-statement`,
  GET_BANK_TRANSACTIONS: `/${currentApiPrefix}/bank-transactions`,
  SAVE_BANK_TRANSACTIONS: `/${currentApiPrefix}/bank-transactions/save`,
  UPDATE_BANK_TRANSACTION: `/${currentApiPrefix}/bank-transactions/update`,
  
  // Incomes - Приходи
  GET_INCOMES: `/${currentApiPrefix}/incomes`,
  CREATE_INCOME: `/${currentApiPrefix}/incomes/create`,
  UPDATE_INCOME: `/${currentApiPrefix}/incomes/update`,
  DELETE_INCOME: `/${currentApiPrefix}/incomes/delete`,
  
  // Object Details
  GET_OBJECT_DETAILS: `/${currentApiPrefix}/objects/:id/details`,
});

export const API_CONFIG = {
  // Base URL for your n8n instance
  BASE_URL: import.meta.env.VITE_N8N_BASE_URL || 'https://n8n.simeontsvetanovn8nworkflows.site/webhook',
  
  // Default Google Sheets ID (BARIN ALP) - will be overridden by company selection
  SPREADSHEET_ID: '1Mvg9vxzp7LyYwNor0i8o8LvqYiF0ID4WD3Af58zkVTo',
  
  // Get current endpoints (dynamic based on selected company)
  get ENDPOINTS() {
    return getEndpoints();
  }
};

// Helper to build full URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
