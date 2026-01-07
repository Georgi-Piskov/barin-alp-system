import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';
import { Income, ConstructionObject } from '../../types';
import { 
  TrendingUp, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  Building2,
  Euro,
  MoreVertical,
  Edit,
  Trash2,
  Link
} from 'lucide-react';
import { IncomeModal } from './IncomeModal';

export const IncomesPage = () => {
  const { user } = useAuthStore();
  const isDirector = user?.role === 'director';
  
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [filteredIncomes, setFilteredIncomes] = useState<Income[]>([]);
  const [objects, setObjects] = useState<ConstructionObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [objectFilter, setObjectFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    filterIncomes();
  }, [incomes, searchTerm, objectFilter]);

  const loadData = async () => {
    setIsLoading(true);
    
    // Load objects first
    const objectsResponse = await apiService.getObjects(user?.id, user?.role);
    if (objectsResponse.success && objectsResponse.data) {
      setObjects(objectsResponse.data);
    }
    
    // Load incomes
    const incomesResponse = await apiService.getIncomes();
    if (incomesResponse.success && incomesResponse.data) {
      setIncomes(incomesResponse.data);
    }
    
    setIsLoading(false);
  };

  const filterIncomes = () => {
    let filtered = [...incomes];
    
    // Technicians can only see incomes they created
    if (!isDirector) {
      filtered = filtered.filter(inc => inc.createdBy === user?.id);
    }
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        inc => inc.description?.toLowerCase().includes(term) ||
               inc.objectName?.toLowerCase().includes(term)
      );
    }
    
    // Object filter
    if (objectFilter !== 'all') {
      if (objectFilter === 'unassigned') {
        filtered = filtered.filter(inc => !inc.objectId);
      } else {
        filtered = filtered.filter(inc => inc.objectId === Number(objectFilter));
      }
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setFilteredIncomes(filtered);
  };

  const handleCreate = () => {
    setEditingIncome(null);
    setIsModalOpen(true);
  };

  const handleEdit = (income: Income) => {
    setEditingIncome(income);
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Сигурни ли сте, че искате да изтриете този приход?')) {
      const result = await apiService.deleteIncome(id);
      if (result.success) {
        setIncomes(prev => prev.filter(i => i.id !== id));
      } else {
        alert(result.error || 'Грешка при изтриване');
      }
    }
    setOpenMenuId(null);
  };

  const handleSave = async () => {
    setIsModalOpen(false);
    setEditingIncome(null);
    loadData();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('bg-BG', {
      style: 'currency',
      currency: 'BGN'
    }).format(amount);
  };

  // Calculate totals
  const totalIncome = filteredIncomes.reduce((sum, inc) => sum + (inc.amount || 0), 0);
  const assignedIncome = filteredIncomes
    .filter(inc => inc.objectId)
    .reduce((sum, inc) => sum + (inc.amount || 0), 0);
  const unassignedIncome = totalIncome - assignedIncome;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-green-600" />
            Приходи по обекти
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {filteredIncomes.length} приход{filteredIncomes.length === 1 ? '' : 'а'} • Общо: {formatCurrency(totalIncome)}
          </p>
        </div>
        
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Нов приход
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Euro className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Общо приходи</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Разпределени</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(assignedIncome)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Filter className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Неразпределени</p>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(unassignedIncome)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Търсене по описание..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          
          {/* Object Filter */}
          <div className="sm:w-64">
            <select
              value={objectFilter}
              onChange={(e) => setObjectFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">Всички обекти</option>
              <option value="unassigned">Без обект</option>
              {objects.map(obj => (
                <option key={obj.id} value={obj.id}>{obj.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Incomes List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredIncomes.length === 0 ? (
          <div className="p-12 text-center">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Няма намерени приходи
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || objectFilter !== 'all' 
                ? 'Опитайте да промените филтрите'
                : 'Добавете първия приход'}
            </p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Добави приход
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredIncomes.map((income) => (
              <div
                key={income.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {income.description || 'Приход'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {formatDate(income.date)}
                          {income.objectName && (
                            <>
                              <span className="text-gray-300 dark:text-gray-600">•</span>
                              <Building2 className="h-4 w-4" />
                              {income.objectName}
                            </>
                          )}
                          {income.bankTransactionId && (
                            <>
                              <span className="text-gray-300 dark:text-gray-600">•</span>
                              <Link className="h-4 w-4 text-blue-500" />
                              <span className="text-blue-500">Банково</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(income.amount)}
                    </span>
                    
                    {/* Actions Menu */}
                    {isDirector && (
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === income.id ? null : income.id)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <MoreVertical className="h-5 w-5 text-gray-500" />
                        </button>
                        
                        {openMenuId === income.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                            <button
                              onClick={() => handleEdit(income)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Редактирай
                            </button>
                            <button
                              onClick={() => handleDelete(income.id)}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              Изтрий
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Additional info */}
                {!income.objectId && (
                  <div className="mt-2 ml-12">
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded">
                      <Filter className="h-3 w-3" />
                      Не е разпределен към обект
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <IncomeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingIncome(null);
        }}
        onSave={handleSave}
        income={editingIncome}
        objects={objects}
      />
    </div>
  );
};
