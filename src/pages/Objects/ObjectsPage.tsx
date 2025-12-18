import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';
import { ConstructionObject } from '../../types';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter,
  MapPin,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Users
} from 'lucide-react';
import { ObjectModal } from './ObjectModal';

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: 'Активен', color: 'bg-green-100 text-green-700' },
  completed: { label: 'Завършен', color: 'bg-gray-100 text-gray-700' },
  paused: { label: 'На изчакване', color: 'bg-yellow-100 text-yellow-700' },
};

export const ObjectsPage = () => {
  const { user } = useAuthStore();
  const isDirector = user?.role === 'director';
  
  const [objects, setObjects] = useState<ConstructionObject[]>([]);
  const [filteredObjects, setFilteredObjects] = useState<ConstructionObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingObject, setEditingObject] = useState<ConstructionObject | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  useEffect(() => {
    loadObjects();
  }, [user]);

  useEffect(() => {
    filterObjects();
  }, [objects, searchTerm, statusFilter]);

  const loadObjects = async () => {
    setIsLoading(true);
    const response = await apiService.getObjects(user?.id, user?.role);
    if (response.success && response.data) {
      setObjects(response.data);
    }
    setIsLoading(false);
  };

  const filterObjects = () => {
    let filtered = [...objects];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        obj => obj.name.toLowerCase().includes(term) || 
               obj.address.toLowerCase().includes(term)
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(obj => obj.status === statusFilter);
    }
    
    setFilteredObjects(filtered);
  };

  const handleCreate = () => {
    setEditingObject(null);
    setIsModalOpen(true);
  };

  const handleEdit = (object: ConstructionObject) => {
    setEditingObject(object);
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Сигурни ли сте, че искате да изтриете този обект?')) {
      const response = await apiService.deleteObject(id);
      if (response.success) {
        setObjects(objects.filter(obj => obj.id !== id));
      }
    }
    setOpenMenuId(null);
  };

  const handleSave = async (objectData: Omit<ConstructionObject, 'id'>) => {
    if (editingObject) {
      const response = await apiService.updateObject(editingObject.id, objectData);
      if (response.success && response.data) {
        setObjects(objects.map(obj => 
          obj.id === editingObject.id ? response.data! : obj
        ));
      }
    } else {
      const response = await apiService.createObject(objectData);
      if (response.success && response.data) {
        setObjects([...objects, response.data]);
      }
    }
    setIsModalOpen(false);
    setEditingObject(null);
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Обекти</h1>
          <p className="text-gray-500">
            {isDirector ? 'Всички строителни обекти' : 'Моите обекти'}
          </p>
        </div>
        {isDirector && (
          <button 
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30"
          >
            <Plus className="w-5 h-5" />
            <span>Нов обект</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Търси по име или адрес..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white appearance-none cursor-pointer"
          >
            <option value="all">Всички статуси</option>
            <option value="active">Активни</option>
            <option value="paused">На изчакване</option>
            <option value="completed">Завършени</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-700">
            {objects.filter(o => o.status === 'active').length}
          </p>
          <p className="text-sm text-green-600">Активни</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-yellow-700">
            {objects.filter(o => o.status === 'paused').length}
          </p>
          <p className="text-sm text-yellow-600">На изчакване</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-gray-700">
            {objects.filter(o => o.status === 'completed').length}
          </p>
          <p className="text-sm text-gray-600">Завършени</p>
        </div>
      </div>

      {/* Objects Grid */}
      {filteredObjects.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || statusFilter !== 'all' 
              ? 'Няма намерени обекти' 
              : 'Все още няма обекти'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all'
              ? 'Опитайте с други критерии за търсене'
              : 'Създайте първия си строителен обект'}
          </p>
          {isDirector && !searchTerm && statusFilter === 'all' && (
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Създай обект</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredObjects.map((object) => (
            <div
              key={object.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Card Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      object.status === 'active' ? 'bg-green-100' :
                      object.status === 'paused' ? 'bg-yellow-100' : 'bg-gray-100'
                    }`}>
                      <Building2 className={`w-5 h-5 ${
                        object.status === 'active' ? 'text-green-600' :
                        object.status === 'paused' ? 'text-yellow-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{object.name}</h3>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusLabels[object.status].color}`}>
                        {statusLabels[object.status].label}
                      </span>
                    </div>
                  </div>
                  
                  {isDirector && (
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === object.id ? null : object.id)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-500" />
                      </button>
                      
                      {openMenuId === object.id && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                          <Link
                            to={`/objects/${object.id}`}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Преглед</span>
                          </Link>
                          <button
                            onClick={() => handleEdit(object)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Редактирай</span>
                          </button>
                          <button
                            onClick={() => handleDelete(object.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger-600 hover:bg-danger-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Изтрий</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{object.address}</span>
                </div>
                
                {object.assignedTechnicians && object.assignedTechnicians.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{object.assignedTechnicians.length} техник(а)</span>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Разходи</span>
                    <span className="text-lg font-bold text-gray-900">
                      {object.totalExpenses.toLocaleString('bg-BG')} €
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <Link
                to={`/objects/${object.id}`}
                className="block px-4 py-3 bg-gray-50 text-center text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors"
              >
                Виж детайли →
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <ObjectModal
          object={editingObject}
          onSave={handleSave}
          onClose={() => {
            setIsModalOpen(false);
            setEditingObject(null);
          }}
        />
      )}
    </div>
  );
};
