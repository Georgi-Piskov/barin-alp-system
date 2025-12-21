import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';
import { InventoryItem, ConstructionObject, User } from '../../types';
import { 
  Package, 
  Plus, 
  Search, 
  Filter,
  Building2,
  User as UserIcon,
  MoreVertical,
  Edit,
  Trash2,
  Camera,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { InventoryModal } from './InventoryModal';

const STATUS_CONFIG = {
  'available': { label: 'Наличен', color: 'green', icon: CheckCircle },
  'in-use': { label: 'В употреба', color: 'blue', icon: Wrench },
  'maintenance': { label: 'В ремонт', color: 'yellow', icon: Clock },
  'lost': { label: 'Изгубен', color: 'red', icon: AlertTriangle },
};

// Convert Google Drive URL to thumbnail/direct view URL
const getImageUrl = (url: string): string => {
  if (!url) return '';
  
  // If it's a data URL (base64), return as-is
  if (url.startsWith('data:')) return url;
  
  // If it's a Google Drive URL, convert to thumbnail format
  // Format: https://drive.google.com/uc?export=view&id=FILE_ID
  // Or: https://drive.google.com/uc?id=FILE_ID
  const driveMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    const fileId = driveMatch[1];
    // Use lh3.googleusercontent.com for better image serving
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  
  // If it's already a direct link, return as-is
  return url;
};

export const InventoryPage = () => {
  const { user } = useAuthStore();
  const isDirector = user?.role === 'director';
  
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [objects, setObjects] = useState<ConstructionObject[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [objectFilter, setObjectFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [photoIndices, setPhotoIndices] = useState<Record<number, number>>({});

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    filterItems();
  }, [items, searchTerm, categoryFilter, statusFilter, objectFilter]);

  const loadData = async () => {
    setIsLoading(true);
    
    const [objectsRes, usersRes, inventoryRes] = await Promise.all([
      apiService.getObjects(user?.id, user?.role),
      apiService.getUsers(),
      apiService.getInventory(),
    ]);
    
    if (objectsRes.success && objectsRes.data) {
      setObjects(objectsRes.data);
    }
    if (usersRes.success && usersRes.data) {
      setUsers(usersRes.data);
    }
    if (inventoryRes.success && inventoryRes.data) {
      setItems(inventoryRes.data);
    }
    
    setIsLoading(false);
  };

  const filterItems = () => {
    let filtered = [...items];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        item => item.name.toLowerCase().includes(term) || 
                item.category.toLowerCase().includes(term)
      );
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    if (objectFilter !== 'all') {
      if (objectFilter === 'unassigned') {
        filtered = filtered.filter(item => !item.objectId);
      } else {
        filtered = filtered.filter(item => item.objectId === Number(objectFilter));
      }
    }
    
    filtered.sort((a, b) => a.name.localeCompare(b.name, 'bg'));
    setFilteredItems(filtered);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Сигурни ли сте, че искате да изтриете този артикул?')) {
      const response = await apiService.deleteInventoryItem(id);
      if (response.success) {
        setItems(items.filter(item => item.id !== id));
      }
    }
    setOpenMenuId(null);
  };

  const handleSave = async (itemData: Omit<InventoryItem, 'id'>) => {
    if (editingItem) {
      const response = await apiService.updateInventoryItem(editingItem.id, itemData);
      if (response.success && response.data) {
        setItems(items.map(item => 
          item.id === editingItem.id ? response.data! : item
        ));
      }
    } else {
      const response = await apiService.createInventoryItem(itemData);
      if (response.success && response.data) {
        setItems([...items, response.data]);
      }
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const categories = Array.from(new Set(items.map(item => item.category))).sort();

  const stats = {
    total: items.length,
    available: items.filter(i => i.status === 'available').length,
    inUse: items.filter(i => i.status === 'in-use').length,
    maintenance: items.filter(i => i.status === 'maintenance').length,
    lost: items.filter(i => i.status === 'lost').length,
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
          <h1 className="text-2xl font-bold text-gray-900">Инвентар</h1>
          <p className="text-gray-500">Управление на инструменти и материали</p>
        </div>
        <button 
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30"
        >
          <Plus className="w-5 h-5" />
          <span>Нов артикул</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Общо</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.available}</p>
              <p className="text-sm text-gray-500">Налични</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wrench className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.inUse}</p>
              <p className="text-sm text-gray-500">В употреба</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{stats.maintenance}</p>
              <p className="text-sm text-gray-500">В ремонт</p>
            </div>
          </div>
        </div>
        
        {isDirector && (
          <div className="bg-red-50 rounded-xl p-4 border border-red-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.lost}</p>
                <p className="text-sm text-red-600">Изгубени</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Търси по наименование..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
        >
          <option value="all">Всички категории</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
        >
          <option value="all">Всички статуси</option>
          <option value="available">Налични</option>
          <option value="in-use">В употреба</option>
          <option value="maintenance">В ремонт</option>
          <option value="lost">Изгубени</option>
        </select>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={objectFilter}
            onChange={(e) => setObjectFilter(e.target.value)}
            className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white appearance-none cursor-pointer"
          >
            <option value="all">Всички обекти</option>
            <option value="unassigned">Без обект</option>
            {objects.map((obj) => (
              <option key={obj.id} value={obj.id}>{obj.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' || objectFilter !== 'all'
              ? 'Няма намерени артикули' 
              : 'Все още няма инвентар'}
          </h3>
          <p className="text-gray-500 mb-4">
            Добавете първия си артикул
          </p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" />
            Нов артикул
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const statusConfig = STATUS_CONFIG[item.status];
            const StatusIcon = statusConfig.icon;
            
            return (
              <div 
                key={item.id} 
                className={`bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow ${
                  item.status === 'lost' ? 'border-red-200' : 'border-gray-200'
                }`}
              >
                {/* Photo Carousel */}
                <div className="relative h-40 bg-gray-100 group">
                  {item.photos && item.photos.length > 0 ? (
                    <>
                      <img
                        src={getImageUrl(item.photos[photoIndices[item.id] ?? (item.photos.length - 1)])}
                        alt={item.name}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setSelectedPhoto(getImageUrl(item.photos[photoIndices[item.id] ?? (item.photos.length - 1)]))}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      
                      {/* Navigation arrows - only show if multiple photos */}
                      {item.photos.length > 1 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentIndex = photoIndices[item.id] ?? (item.photos.length - 1);
                              const newIndex = currentIndex > 0 ? currentIndex - 1 : item.photos.length - 1;
                              setPhotoIndices(prev => ({ ...prev, [item.id]: newIndex }));
                            }}
                            className="absolute left-1 top-1/2 -translate-y-1/2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentIndex = photoIndices[item.id] ?? (item.photos.length - 1);
                              const newIndex = currentIndex < item.photos.length - 1 ? currentIndex + 1 : 0;
                              setPhotoIndices(prev => ({ ...prev, [item.id]: newIndex }));
                            }}
                            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16 text-gray-300" />
                    </div>
                  )}
                  
                  {/* Photo counter and dots */}
                  {item.photos && item.photos.length > 1 && (
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded-lg text-white text-xs flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      {(photoIndices[item.id] ?? (item.photos.length - 1)) + 1}/{item.photos.length}
                    </div>
                  )}
                  
                  <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1
                    ${statusConfig.color === 'green' ? 'bg-green-100 text-green-700' : ''}
                    ${statusConfig.color === 'blue' ? 'bg-blue-100 text-blue-700' : ''}
                    ${statusConfig.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : ''}
                    ${statusConfig.color === 'red' ? 'bg-red-100 text-red-700' : ''}
                  `}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                  </div>
                  
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                      className="p-1.5 bg-white/90 hover:bg-white rounded-lg shadow"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-600" />
                    </button>
                    
                    {openMenuId === item.id && (
                      <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                        <button
                          onClick={() => handleEdit(item)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Edit className="w-4 h-4" />
                          Редактирай
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Изтрий
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">{item.category}</p>
                  
                  <div className="space-y-2 text-sm">
                    {item.assignedTo && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <UserIcon className="w-4 h-4" />
                        <span>{item.assignedToName}</span>
                      </div>
                    )}
                    {item.objectId && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building2 className="w-4 h-4" />
                        <span>{item.objectName}</span>
                      </div>
                    )}
                    {!item.objectId && !item.assignedTo && (
                      <div className="text-gray-400 italic">Незачислен</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <InventoryModal
          item={editingItem}
          objects={objects}
          users={users}
          onSave={handleSave}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
          }}
        />
      )}

      {/* Photo Preview Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <img
            src={selectedPhoto}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
};
