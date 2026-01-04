import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';
import { DashboardStats, Transaction, Invoice, InventoryItem } from '../../types';
import { 
  Building2, 
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Package,
  ArrowRight,
  Users,
  Receipt,
  Wallet,
  PlusCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Euro
} from 'lucide-react';
import { Link } from 'react-router-dom';

// AddFundsModal component
interface AddFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  technicians: { userId: number; userName: string }[];
  onSubmit: (data: {
    userId: number;
    userName: string;
    amount: number;
    method: 'cash' | 'bank';
    description: string;
    date: string;
  }) => Promise<void>;
}

const AddFundsModal = ({ isOpen, onClose, technicians, onSubmit }: AddFundsModalProps) => {
  const [selectedTechnician, setSelectedTechnician] = useState<number>(0);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'cash' | 'bank'>('cash');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTechnician || !amount) return;

    const technician = technicians.find(t => t.userId === selectedTechnician);
    if (!technician) return;

    setIsSubmitting(true);
    await onSubmit({
      userId: selectedTechnician,
      userName: technician.userName,
      amount: parseFloat(amount),
      method,
      description: description || `Заприходяване - ${method === 'cash' ? 'Кеш' : 'Банков превод'}`,
      date,
    });
    setIsSubmitting(false);
    
    // Reset form
    setSelectedTechnician(0);
    setAmount('');
    setMethod('cash');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-green-600" />
            Заприходяване на техник
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Technician Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Техник *
            </label>
            <select
              value={selectedTechnician}
              onChange={(e) => setSelectedTechnician(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value={0}>Избери техник...</option>
              {technicians.map((t) => (
                <option key={t.userId} value={t.userId}>
                  {t.userName}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Сума (EUR) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">€</span>
            </div>
          </div>

          {/* Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Метод на плащане
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod('cash')}
                className={`px-4 py-3 rounded-xl border-2 transition-all ${
                  method === 'cash'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                💵 Кеш
              </button>
              <button
                type="button"
                onClick={() => setMethod('bank')}
                className={`px-4 py-3 rounded-xl border-2 transition-all ${
                  method === 'bank'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                🏦 Банков превод
              </button>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дата
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание (по избор)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Напр: Аванс за материали"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Отказ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedTechnician || !amount}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <PlusCircle className="w-5 h-5" />
                  Заприходи
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Simple bar component for charts
const BarChart = ({ data, maxValue }: { data: { label: string; value: number; color?: string }[]; maxValue: number }) => {
  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 truncate max-w-[60%]">{item.label}</span>
            <span className="font-semibold text-gray-900">{item.value.toLocaleString('bg-BG')} €</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${item.color || 'bg-primary-500'}`}
              style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export const DashboardPage = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    technicians: true,
    objects: true,
    transactions: false,
  });
  
  // For technicians - their own data
  const [myInvoices, setMyInvoices] = useState<Invoice[]>([]);
  const [myInventory, setMyInventory] = useState<InventoryItem[]>([]);
  const [myTransactions, setMyTransactions] = useState<Transaction[]>([]);

  const isDirector = user?.role === 'director';

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    
    try {
      const response = await apiService.getDashboardStats();
      console.log('Dashboard stats:', response);
      
      if (response.success && response.data) {
        setStats(response.data);
      }
      
      // For technicians, load their own data
      if (!isDirector && user) {
        // Load my invoices
        const invoicesRes = await apiService.getInvoices();
        if (invoicesRes.success && invoicesRes.data) {
          const myInv = invoicesRes.data.filter(inv => inv.createdBy === user.id);
          setMyInvoices(myInv);
        }
        
        // Load my inventory
        const inventoryRes = await apiService.getInventory();
        if (inventoryRes.success && inventoryRes.data) {
          const myInv = inventoryRes.data.filter(item => item.assignedTo === user.id);
          setMyInventory(myInv);
        }
        
        // Load my transactions
        const transactionsRes = await apiService.getTransactions();
        if (transactionsRes.success && transactionsRes.data) {
          const myTx = transactionsRes.data.filter(tx => tx.userId === user.id);
          setMyTransactions(myTx);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
    
    setIsLoading(false);
  };

  const handleAddFunds = async (data: {
    userId: number;
    userName: string;
    amount: number;
    method: 'cash' | 'bank';
    description: string;
    date: string;
  }) => {
    try {
      const transaction: Omit<Transaction, 'id'> = {
        type: 'income',
        userId: data.userId,
        userName: data.userName,
        amount: data.amount,
        date: data.date,
        description: data.description,
        createdBy: user?.id || 0,
        createdByName: user?.name,
        method: data.method,
      };

      const response = await apiService.createTransaction(transaction);
      if (response.success) {
        // Reload dashboard data
        await loadData();
      }
    } catch (error) {
      console.error('Error adding funds:', error);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  // Prepare data for charts - only for directors
  const objectsChartData = isDirector 
    ? (stats?.expensesByObject || []).slice(0, 6).map((obj, idx) => ({
        label: obj.objectName,
        value: obj.totalExpenses,
        color: ['bg-primary-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'][idx % 6]
      }))
    : [];

  const maxObjectExpense = Math.max(...(stats?.expensesByObject || []).map(o => o.totalExpenses), 1);

  // Technicians for modal
  const techniciansList = stats?.technicianBalances || [];
  
  // Get current technician's balance (for technician view)
  const currentTechBalance = techniciansList.find(t => t.userId === user?.id);
  
  // Calculate technician's expenses from their invoices
  const myInvoicesTotal = myInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const myTransactionsExpenses = myTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const myTotalExpenses = myInvoicesTotal + myTransactionsExpenses;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              Добре дошъл, {user?.name}!
            </h1>
            <p className="text-primary-100">
              {isDirector ? 'Директорски панел' : 'Технически панел'} • {new Date().toLocaleDateString('bg-BG', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <button
            onClick={loadData}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            title="Опресни"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income - Directors see company total, Technicians see their own */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {isDirector 
                  ? (stats?.totalIncome || 0).toLocaleString('bg-BG')
                  : (currentTechBalance?.income || 0).toLocaleString('bg-BG')
                } €
              </p>
              <p className="text-sm text-gray-500">
                {isDirector ? 'Общо заприходени' : 'Получени средства'}
              </p>
            </div>
          </div>
        </div>

        {/* Total Expenses - Directors see company total, Technicians see their invoices + transactions */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {isDirector 
                  ? (stats?.totalExpenses || 0).toLocaleString('bg-BG')
                  : myTotalExpenses.toLocaleString('bg-BG')
                } €
              </p>
              <p className="text-sm text-gray-500">
                {isDirector ? 'Общо разходи' : 'Мои разходи'}
              </p>
            </div>
          </div>
        </div>

        {/* Net Balance - Directors see company balance, Technicians see their own */}
        {(() => {
          const techIncome = currentTechBalance?.income || 0;
          const balance = isDirector 
            ? (stats?.netBalance || 0) 
            : (techIncome - myTotalExpenses);
          return (
            <div className={`bg-white rounded-xl p-4 shadow-sm border ${
              balance >= 0 ? 'border-green-200' : 'border-red-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  balance >= 0 ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <Euro className={`w-6 h-6 ${
                    balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${
                    balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {balance.toLocaleString('bg-BG')} €
                  </p>
                  <p className="text-sm text-gray-500">
                    {isDirector ? 'Нетен баланс' : 'Мой баланс'}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Unassigned Expenses - Only for directors */}
        <div className={`bg-white rounded-xl p-4 shadow-sm border ${
          isDirector && (stats?.unassignedExpenses || 0) > 0 ? 'border-danger-200 bg-danger-50' : 'border-gray-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isDirector && (stats?.unassignedExpenses || 0) > 0 ? 'bg-danger-100' : 'bg-gray-100'
            }`}>
              <AlertTriangle className={`w-6 h-6 ${
                isDirector && (stats?.unassignedExpenses || 0) > 0 ? 'text-danger-600' : 'text-gray-400'
              }`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${
                isDirector && (stats?.unassignedExpenses || 0) > 0 ? 'text-danger-600' : 'text-gray-900'
              }`}>
                {isDirector ? (stats?.unassignedExpenses || 0).toLocaleString('bg-BG') : '0'} €
              </p>
              <p className="text-sm text-gray-500">Без обект</p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <Building2 className="w-8 h-8 text-primary-500" />
          <div>
            <p className="text-xl font-bold text-gray-900">{stats?.activeObjects || 0}</p>
            <p className="text-xs text-gray-500">{isDirector ? 'Активни обекти' : 'Мои обекти'}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <Receipt className="w-8 h-8 text-blue-500" />
          <div>
            <p className="text-xl font-bold text-gray-900">
              {isDirector ? (stats?.totalInvoices || 0) : myInvoices.length}
            </p>
            <p className="text-xs text-gray-500">{isDirector ? 'Фактури' : 'Мои фактури'}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <Users className="w-8 h-8 text-green-500" />
          <div>
            <p className="text-xl font-bold text-gray-900">{isDirector ? techniciansList.length : 1}</p>
            <p className="text-xs text-gray-500">{isDirector ? 'Техници' : 'Техник'}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <Package className="w-8 h-8 text-purple-500" />
          <div>
            <p className="text-xl font-bold text-gray-900">
              {isDirector ? (stats?.inventoryCount || 0) : myInventory.length}
            </p>
            <p className="text-xs text-gray-500">{isDirector ? 'Инвентар' : 'Мой инвентар'}</p>
          </div>
        </div>
      </div>

      {/* Unassigned Expenses Warning */}
      {isDirector && (stats?.unassignedExpenses || 0) > 0 && (
        <div className="bg-danger-50 border border-danger-200 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-danger-600" />
          </div>
          <div className="flex-grow">
            <h3 className="font-semibold text-danger-800">
              Имате фактури без обект!
            </h3>
            <p className="text-sm text-danger-600">
              {(stats?.unassignedExpenses || 0).toLocaleString('bg-BG')} € не са разпределени към обекти
            </p>
          </div>
          <Link 
            to="/invoices"
            className="px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition-colors flex items-center gap-2"
          >
            <span>Виж</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Main Content Grid */}
      <div className={`grid ${isDirector ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-6`}>
        {/* Technician Balances - Only for Directors */}
        {isDirector && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div 
              className="p-4 border-b border-gray-100 flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('technicians')}
            >
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-500" />
                Баланси на техници
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddFunds(true);
                  }}
                  className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                >
                  <PlusCircle className="w-4 h-4" />
                  Заприходи
                </button>
                {expandedSections.technicians ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
            
            {expandedSections.technicians && (
              <div className="divide-y divide-gray-100">
                {techniciansList.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Няма техници</p>
                  </div>
                ) : (
                  techniciansList.map((tech) => (
                    <div key={tech.userId} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{tech.userName}</span>
                        <span className={`text-lg font-bold ${
                          tech.balance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {tech.balance.toLocaleString('bg-BG')} €
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-green-600">
                          ↑ {tech.income.toLocaleString('bg-BG')} €
                        </span>
                        <span className="text-red-600">
                          ↓ {tech.expense.toLocaleString('bg-BG')} €
                        </span>
                      </div>
                      {/* Balance bar */}
                      <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                        {tech.income > 0 && (
                          <div 
                            className={`h-full ${tech.balance >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min((tech.expense / tech.income) * 100, 100)}%` }}
                          />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Expenses by Object - Only for Directors */}
        {isDirector && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div 
              className="p-4 border-b border-gray-100 flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('objects')}
            >
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary-500" />
                Разходи по обекти
              </h2>
              <div className="flex items-center gap-2">
                <Link 
                  to="/objects"
                  onClick={(e) => e.stopPropagation()}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                >
                  Виж всички
                  <ArrowRight className="w-4 h-4" />
                </Link>
                {expandedSections.objects ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
            
            {expandedSections.objects && (
              <div className="p-4">
                {objectsChartData.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Няма разходи по обекти</p>
                  </div>
                ) : (
                  <BarChart data={objectsChartData} maxValue={maxObjectExpense} />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div 
          className="p-4 border-b border-gray-100 flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('transactions')}
        >
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary-500" />
            Последни транзакции
          </h2>
          <div className="flex items-center gap-2">
            <Link 
              to="/transactions"
              onClick={(e) => e.stopPropagation()}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
            >
              Виж всички
              <ArrowRight className="w-4 h-4" />
            </Link>
            {expandedSections.transactions ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
        
        {expandedSections.transactions && (
          <div className="divide-y divide-gray-100">
            {(() => {
              // For technicians, show only their transactions
              const transactionsToShow = isDirector 
                ? (stats?.recentTransactions || [])
                : myTransactions.slice(0, 5);
              
              if (transactionsToShow.length === 0) {
                return (
                  <div className="p-8 text-center text-gray-500">
                    <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Няма транзакции</p>
                  </div>
                );
              }
              
              return transactionsToShow.map((tx: any) => (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {tx.type === 'income' ? (
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{tx.userName}</p>
                      <p className="text-sm text-gray-500">{tx.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{parseFloat(tx.amount).toLocaleString('bg-BG')} €
                    </p>
                    <p className="text-xs text-gray-400">{tx.date}</p>
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/invoices"
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-primary-300 hover:shadow-md transition-all flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <Receipt className="w-5 h-5 text-primary-600" />
          </div>
          <span className="font-medium text-gray-900">Нова фактура</span>
        </Link>
        
        <Link
          to="/objects"
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-primary-300 hover:shadow-md transition-all flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <span className="font-medium text-gray-900">Обекти</span>
        </Link>
        
        <Link
          to="/inventory"
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-primary-300 hover:shadow-md transition-all flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-green-600" />
          </div>
          <span className="font-medium text-gray-900">Инвентар</span>
        </Link>
        
        <Link
          to="/transactions"
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-primary-300 hover:shadow-md transition-all flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Wallet className="w-5 h-5 text-purple-600" />
          </div>
          <span className="font-medium text-gray-900">Транзакции</span>
        </Link>
      </div>

      {/* Add Funds Modal */}
      <AddFundsModal
        isOpen={showAddFunds}
        onClose={() => setShowAddFunds(false)}
        technicians={techniciansList}
        onSubmit={handleAddFunds}
      />
    </div>
  );
};
