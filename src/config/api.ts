// n8n Backend Configuration
// Update these URLs when you set up your n8n workflows

export const API_CONFIG = {
  // Base URL for your n8n instance
  // Example: https://your-n8n-instance.com/webhook
  BASE_URL: import.meta.env.VITE_N8N_BASE_URL || 'https://your-n8n-instance.com/webhook',
  
  // Google Sheets ID
  SPREADSHEET_ID: '1Mvg9vxzp7LyYwNor0i8o8LvqYiF0ID4WD3Af58zkVTo',
  
  // Endpoints (these will be n8n webhook paths)
  ENDPOINTS: {
    // Auth
    LOGIN: '/barin-alp/login',
    
    // Users
    GET_USERS: '/barin-alp/users',
    
    // Objects
    GET_OBJECTS: '/barin-alp/objects',
    CREATE_OBJECT: '/barin-alp/objects/create',
    UPDATE_OBJECT: '/barin-alp/objects/update',
    DELETE_OBJECT: '/barin-alp/objects/delete',
    
    // Invoices
    GET_INVOICES: '/barin-alp/invoices',
    CREATE_INVOICE: '/barin-alp/invoices/create',
    UPDATE_INVOICE: '/barin-alp/invoices/update',
    DELETE_INVOICE: '/barin-alp/invoices/delete',
    
    // Inventory
    GET_INVENTORY: '/barin-alp/inventory',
    CREATE_INVENTORY: '/barin-alp/inventory/create',
    UPDATE_INVENTORY: '/barin-alp/inventory/update',
    DELETE_INVENTORY: '/barin-alp/inventory/delete',
    
    // Transactions
    GET_TRANSACTIONS: '/barin-alp/transactions',
    CREATE_TRANSACTION: '/barin-alp/transactions/create',
    UPDATE_TRANSACTION: '/barin-alp/transactions/update',
    DELETE_TRANSACTION: '/barin-alp/transactions/delete',
  }
};

// Helper to build full URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
