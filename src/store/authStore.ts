import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { apiService } from '../services/api';
import { Company, COMPANIES, setApiPrefix } from '../config/api';

// Initialize apiPrefix SYNCHRONOUSLY before anything else runs
const initializeApiPrefixSync = () => {
  try {
    const stored = localStorage.getItem('barin-alp-auth');
    if (stored) {
      const { state } = JSON.parse(stored);
      if (state?.company?.id) {
        const currentCompany = COMPANIES.find(c => c.id === state.company.id);
        if (currentCompany) {
          setApiPrefix(currentCompany.apiPrefix);
          apiService.setSheetId(currentCompany.sheetId);
          console.log(`Sync initialized for ${currentCompany.name}: apiPrefix=${currentCompany.apiPrefix}, sheetId=${currentCompany.sheetId}`);
        }
      }
    }
  } catch (e) {
    console.error('Error in sync initialization:', e);
  }
};

// Run IMMEDIATELY (synchronously)
initializeApiPrefixSync();

interface AuthStore {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  setCompany: (company: Company) => void;
  login: (username: string, pin: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      company: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setCompany: (company: Company) => {
        // Always get fresh company from COMPANIES config to ensure it's up-to-date
        const freshCompany = COMPANIES.find(c => c.id === company.id) || company;
        set({ company: freshCompany });
        // Update apiService with the fresh sheetId
        apiService.setSheetId(freshCompany.sheetId);
        // Update API prefix for endpoints (barin-alp or hefest)
        setApiPrefix(freshCompany.apiPrefix);
        console.log(`Company set to: ${freshCompany.name}, apiPrefix: ${freshCompany.apiPrefix}, sheetId: ${freshCompany.sheetId}`);
      },

      login: async (username: string, pin: string) => {
        const { company } = get();
        if (!company) {
          set({ error: 'Моля, изберете фирма' });
          return false;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiService.login(username, pin);
          
          if (response.success && response.data) {
            set({
              user: response.data,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Грешно потребителско име или ПИН',
            });
            return false;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: 'Грешка при свързване със сървъра',
          });
          return false;
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          error: null,
          // Keep company selected for convenience
        });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'barin-alp-auth',
      partialize: (state) => ({
        user: state.user,
        company: state.company,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
