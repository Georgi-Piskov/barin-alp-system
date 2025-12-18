import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';
import { ConstructionObject } from '../../types';
import { 
  Building2, 
  TrendingDown, 
  AlertTriangle,
  Package,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage = () => {
  const { user } = useAuthStore();
  const [objects, setObjects] = useState<ConstructionObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isDirector = user?.role === 'director';

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    const response = await apiService.getObjects(user?.id, user?.role);
    if (response.success && response.data) {
      setObjects(response.data);
    }
    setIsLoading(false);
  };

  const totalExpenses = objects.reduce((sum, obj) => sum + obj.totalExpenses, 0);
  const activeObjects = objects.filter((obj) => obj.status === 'active').length;

  // Mock unassigned expenses for demo
  const unassignedExpenses = isDirector ? 1250 : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Objects */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activeObjects}</p>
              <p className="text-sm text-gray-500">Активни обекти</p>
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {totalExpenses.toLocaleString('bg-BG')} €
              </p>
              <p className="text-sm text-gray-500">Общи разходи</p>
            </div>
          </div>
        </div>

        {/* Unassigned Expenses - Only for Directors */}
        {isDirector && (
          <div className={`bg-white rounded-xl p-4 shadow-sm border ${
            unassignedExpenses > 0 ? 'border-danger-200 bg-danger-50' : 'border-gray-100'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                unassignedExpenses > 0 ? 'bg-danger-100' : 'bg-gray-100'
              }`}>
                <AlertTriangle className={`w-5 h-5 ${
                  unassignedExpenses > 0 ? 'text-danger-600' : 'text-gray-400'
                }`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${
                  unassignedExpenses > 0 ? 'text-danger-600' : 'text-gray-900'
                }`}>
                  {unassignedExpenses.toLocaleString('bg-BG')} €
                </p>
                <p className="text-sm text-gray-500">Незачислени разходи</p>
              </div>
            </div>
          </div>
        )}

        {/* Inventory */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-500">Инвентар</p>
            </div>
          </div>
        </div>
      </div>

      {/* Unassigned Expenses Warning */}
      {isDirector && unassignedExpenses > 0 && (
        <div className="bg-danger-50 border border-danger-200 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-danger-600" />
          </div>
          <div className="flex-grow">
            <h3 className="font-semibold text-danger-800">
              Имате незачислени разходи!
            </h3>
            <p className="text-sm text-danger-600">
              {unassignedExpenses.toLocaleString('bg-BG')} € чакат да бъдат разпределени към обекти
            </p>
          </div>
          <Link 
            to="/invoices?filter=unassigned"
            className="px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition-colors flex items-center gap-2"
          >
            <span>Виж</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Objects List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {isDirector ? 'Всички обекти' : 'Моите обекти'}
          </h2>
          <Link 
            to="/objects"
            className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
          >
            Виж всички
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="divide-y divide-gray-100">
          {objects.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Няма намерени обекти</p>
            </div>
          ) : (
            objects.slice(0, 5).map((object) => (
              <Link
                key={object.id}
                to={`/objects/${object.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    object.status === 'active' ? 'bg-green-500' :
                    object.status === 'paused' ? 'bg-yellow-500' : 'bg-gray-400'
                  }`} />
                  <div>
                    <h3 className="font-medium text-gray-900">{object.name}</h3>
                    <p className="text-sm text-gray-500">{object.address}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {object.totalExpenses.toLocaleString('bg-BG')} €
                  </p>
                  <p className="text-xs text-gray-500">Разходи</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
