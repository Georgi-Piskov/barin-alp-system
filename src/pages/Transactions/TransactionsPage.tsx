import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';
import { Transaction, User, ConstructionObject } from '../../types';
import { 
  Receipt, 
  Plus,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Calendar,
  RefreshCw,
  X,
  Wallet,
  Building2,
  ChevronDown,
  Pencil,
  Trash2
} from 'lucide-react';

// New Transaction Modal
interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  objects: ConstructionObject[];
  onSubmit: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  editTransaction?: Transaction | null;
}

const TransactionModal = ({ isOpen, onClose, users, objects, onSubmit, editTransaction }: TransactionModalProps) => {
  const { user } = useAuthStore();
  const isDirector = user?.role === 'director';
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [selectedUser, setSelectedUser] = useState<number>(0);
  const [selectedObject, setSelectedObject] = useState<number>(0);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'cash' | 'bank'>('cash');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type);
      setSelectedUser(editTransaction.userId || 0);
      setSelectedObject(editTransaction.objectId || 0);
      setAmount(String(editTransaction.amount));
      setMethod(editTransaction.method || 'cash');
      setDescription(editTransaction.description || '');
      setDate(editTransaction.date);
    } else {
      // Reset form for new transaction
      setType('expense');
      setSelectedUser(0);
      setSelectedObject(0);
      setAmount('');
      setMethod('cash');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [editTransaction, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    
    // For income, technician is required
    if (type === 'income' && !selectedUser) return;

    // Determine target user
    let targetUserId = selectedUser;
    let targetUserName = '';
    
    if (!isDirector) {
      // Technician - always use their own info
      targetUserId = user?.id || 0;
      targetUserName = user?.name || '';
    } else if (selectedUser > 0) {
      const targetUser = users.find(u => u.id === selectedUser);
      targetUserName = targetUser?.name || '';
    } else {
      // Director's own expense - use director's info
      targetUserId = user?.id || 0;
      targetUserName = user?.name || 'Директор';
    }

    // Get selected object info
    const selectedObj = objects.find(o => o.id === selectedObject);
    
    setIsSubmitting(true);
    
    await onSubmit({
      type,
      userId: targetUserId,
      userName: targetUserName,
      amount: parseFloat(amount),
      date,
      description: description || `${type === 'income' ? 'Заприходяване' : 'Разход'} - ${method === 'cash' ? 'Кеш' : 'Банков превод'}`,
      createdBy: user?.id || 0,
      createdByName: user?.name,
      method,
      objectId: selectedObject || undefined,
      objectName: selectedObj?.name,
    });
    
    setIsSubmitting(false);
    
    // Reset form only if not editing (editing uses useEffect)
    if (!editTransaction) {
      setType('expense');
      setSelectedUser(0);
      setSelectedObject(0);
      setAmount('');
      setMethod('cash');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
    }
    onClose();
  };

  if (!isOpen) return null;

  const isEditing = !!editTransaction;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary-600" />
            {isEditing ? 'Редактирай транзакция' : 'Нова транзакция'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Transaction Type - Only directors can create income (zaprihodyavane) */}
          {isDirector ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Тип транзакция
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('income')}
                className={`px-4 py-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                  type === 'income'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                Заприходяване
              </button>
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`px-4 py-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                  type === 'expense'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <TrendingDown className="w-5 h-5" />
                Разход
              </button>
            </div>
          </div>
          ) : (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-700">
              <TrendingDown className="w-5 h-5" />
              <span className="font-medium">Разход (кеш плащане)</span>
            </div>
            <p className="text-sm text-red-600 mt-1">Запиши разход, за който нямаш фактура</p>
          </div>
          )}

          {/* User Selection - Required for income, optional for expense (only for directors) */}
          {isDirector && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === 'income' ? 'Техник *' : 'Техник (по избор)'}
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required={type === 'income'}
            >
              <option value={0}>
                {type === 'expense' ? '-- Директорски разход --' : 'Избери техник...'}
              </option>
              {users.filter(u => u.role === 'technician').map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            {type === 'expense' && selectedUser === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                💼 Разходът ще се запише като директорски (заплати, наеми, доставчици и др.)
              </p>
            )}
          </div>
          )}

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
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
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
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                🏦 Банков превод
              </button>
            </div>
          </div>

          {/* Object Selection - for expenses (both directors and technicians) */}
          {type === 'expense' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Обект {!isDirector && '*'}
              </label>
              <select
                value={selectedObject}
                onChange={(e) => setSelectedObject(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required={!isDirector}
              >
                <option value={0}>{isDirector ? '-- Без обект --' : '-- Избери обект --'}</option>
                {objects.filter(obj => isDirector || obj.assignedTechnicians?.includes(user?.id as number)).map((obj) => (
                  <option key={obj.id} value={obj.id}>
                    {obj.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                🏗️ {isDirector ? 'Избери обект ако разходът е свързан с конкретен обект' : 'Избери обекта, за който е направен разходът'}
              </p>
            </div>
          )}

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
              disabled={isSubmitting || !amount || (type === 'income' && !selectedUser) || (!isDirector && !selectedObject)}
              className={`flex-1 px-4 py-3 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                type === 'income' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isSubmitting ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isEditing ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {isEditing ? 'Запази' : (type === 'income' ? 'Заприходи' : 'Добави разход')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const TransactionsPage = () => {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [objects, setObjects] = useState<ConstructionObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterUser, setFilterUser] = useState<number>(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const isDirector = user?.role === 'director';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    
    try {
      const [transactionsRes, usersRes, objectsRes] = await Promise.all([
        apiService.getTransactions(),
        apiService.getUsers(),
        apiService.getObjects(),
      ]);
      
      if (transactionsRes.success && transactionsRes.data) {
        setTransactions(transactionsRes.data);
      }
      
      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data);
      }

      if (objectsRes.success && objectsRes.data) {
        setObjects(objectsRes.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    
    setIsLoading(false);
  };

  const handleCreateTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      if (editingTransaction) {
        // Update existing transaction
        const response = await apiService.updateTransaction(editingTransaction.id, transaction);
        if (response.success) {
          await loadData();
        }
      } else {
        // Create new transaction
        const response = await apiService.createTransaction(transaction);
        if (response.success) {
          await loadData();
        }
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setShowModal(true);
  };

  const handleDeleteTransaction = async (tx: Transaction) => {
    if (confirm(`Сигурни ли сте, че искате да изтриете тази транзакция?\n${tx.description || tx.type === 'income' ? 'Заприходяване' : 'Разход'} - ${tx.amount} €`)) {
      try {
        const response = await apiService.deleteTransaction(tx.id);
        if (response.success) {
          await loadData();
        }
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTransaction(null);
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    // Technicians can only see their own transactions
    if (!isDirector && tx.userId !== user?.id) return false;
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        tx.userName?.toLowerCase().includes(search) ||
        tx.description?.toLowerCase().includes(search) ||
        tx.objectName?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }
    
    // Type filter
    if (filterType !== 'all' && tx.type !== filterType) return false;
    
    // User filter (only for directors)
    if (isDirector && filterUser && tx.userId !== filterUser) return false;
    
    // Date filters
    if (dateFrom && tx.date < dateFrom) return false;
    if (dateTo && tx.date > dateTo) return false;
    
    return true;
  });

  // Calculate totals
  const totals = filteredTransactions.reduce((acc, tx) => {
    const amount = Number(tx.amount) || 0;
    if (tx.type === 'income') {
      acc.income += amount;
    } else {
      acc.expense += amount;
    }
    return acc;
  }, { income: 0, expense: 0 });

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterUser(0);
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = searchTerm || filterType !== 'all' || filterUser || dateFrom || dateTo;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Транзакции</h1>
          <p className="text-gray-500">{isDirector ? 'Всички заприходявания и разходи' : 'Моите заприходявания и разходи'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            title="Опресни"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">{isDirector ? 'Нова транзакция' : 'Добави разход'}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">
                +{totals.income.toLocaleString('bg-BG')} €
              </p>
              <p className="text-sm text-gray-500">Заприходени</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-red-600">
                -{totals.expense.toLocaleString('bg-BG')} €
              </p>
              <p className="text-sm text-gray-500">Разходи</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              totals.income - totals.expense >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <Wallet className={`w-5 h-5 ${
                totals.income - totals.expense >= 0 ? 'text-green-600' : 'text-red-600'
              }`} />
            </div>
            <div>
              <p className={`text-xl font-bold ${
                totals.income - totals.expense >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(totals.income - totals.expense).toLocaleString('bg-BG')} €
              </p>
              <p className="text-sm text-gray-500">Баланс</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-grow relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Търси по име, описание..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters || hasActiveFilters
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Filter className="w-5 h-5" />
            <span>Филтри</span>
            {hasActiveFilters && (
              <span className="w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                !
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тип</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Всички</option>
                <option value="income">Заприходяване</option>
                <option value="expense">Разход</option>
              </select>
            </div>
            
            {/* User Filter - Only for Directors */}
            {isDirector && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Техник</label>
                <select
                  value={filterUser}
                  onChange={(e) => setFilterUser(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value={0}>Всички</option>
                  {users.filter(u => u.role === 'technician').map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">От дата</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">До дата</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="col-span-full">
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Изчисти филтрите
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            {filteredTransactions.length} транзакции
          </h2>
        </div>
        
        <div className="divide-y divide-gray-100">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Няма транзакции
              </h3>
              <p className="text-gray-500">
                {hasActiveFilters 
                  ? 'Няма транзакции, отговарящи на филтрите' 
                  : 'Все още няма записани транзакции'}
              </p>
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <div 
                key={tx.id} 
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    tx.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {tx.type === 'income' ? (
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{tx.userName}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        tx.type === 'income' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {tx.type === 'income' ? 'Заприходяване' : 'Разход'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{tx.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {tx.date}
                      </span>
                      {tx.objectName && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {tx.objectName}
                        </span>
                      )}
                      {tx.method && (
                        <span>
                          {tx.method === 'cash' ? '💵 Кеш' : '🏦 Банка'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Amount */}
                  <div className="text-right flex-shrink-0">
                    <p className={`text-lg font-bold ${
                      tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}
                      {Number(tx.amount).toLocaleString('bg-BG')} €
                    </p>
                  </div>

                  {/* Edit/Delete buttons - only for directors */}
                  {isDirector && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleEditTransaction(tx)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Редактирай"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(tx)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Изтрий"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* New Transaction Modal */}
      <TransactionModal
        isOpen={showModal}
        onClose={handleCloseModal}
        users={users}
        objects={objects}
        onSubmit={handleCreateTransaction}
        editTransaction={editingTransaction}
      />
    </div>
  );
};
