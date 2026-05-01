import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard,
  Building2,
  FileText,
  Package,
  Receipt,
  LogOut,
  Menu,
  X,
  User,
  Landmark,
  TrendingUp,
  RefreshCw,
  Calculator,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  directorOnly?: boolean;
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Табло' },
  { to: '/objects', icon: Building2, label: 'Обекти' },
  { to: '/invoices', icon: FileText, label: 'Фактури' },
  { to: '/incomes', icon: TrendingUp, label: 'Приходи' },
  { to: '/inventory', icon: Package, label: 'Инвентар' },
  { to: '/transactions', icon: Receipt, label: 'Транзакции' },
  { to: '/materials-calculator', icon: Calculator, label: 'Калкулатор' },
  { to: '/bank-statements', icon: Landmark, label: 'Банка', directorOnly: true },
];

export const MainLayout = () => {
  const { user, company, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSwitchCompany = () => {
    logout();
    // Clear company from localStorage to show company selection
    const stored = localStorage.getItem('barin-alp-auth');
    if (stored) {
      const state = JSON.parse(stored);
      state.state.company = null;
      localStorage.setItem('barin-alp-auth', JSON.stringify(state));
    }
    navigate('/login');
  };

  // Determine theme color based on company
  const isHefest = company?.id === 'hefest';
  const themeClasses = {
    logo: isHefest ? 'bg-orange-600' : 'bg-primary-600',
    activeNav: isHefest ? 'bg-orange-50 text-orange-700' : 'bg-primary-50 text-primary-700',
    userIcon: isHefest ? 'bg-orange-100' : 'bg-primary-100',
    userIconText: isHefest ? 'text-orange-600' : 'text-primary-600',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 ${themeClasses.logo} rounded-lg flex items-center justify-center`}>
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900">{company?.shortName || 'БАРИН АЛП'}</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-gray-200">
          <div className={`w-10 h-10 ${themeClasses.logo} rounded-xl flex items-center justify-center`}>
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">{company?.shortName || 'БАРИН АЛП'}</h1>
            <p className="text-xs text-gray-500">Система за управление</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {navItems
            .filter((item) => !item.directorOnly || user?.role === 'director')
            .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? themeClasses.activeNav + ' font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 ${themeClasses.userIcon} rounded-full flex items-center justify-center`}>
              <User className={`w-5 h-5 ${themeClasses.userIconText}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500">
                {user?.role === 'director' ? 'Директор' : 'Техник'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSwitchCompany}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="Смени фирма"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm">Смени</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-gray-600 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Изход</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
