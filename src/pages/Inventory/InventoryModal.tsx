import { useState, useEffect, useRef } from 'react';
import { X, Package, Camera, Trash2, Upload } from 'lucide-react';
import { InventoryItem, ConstructionObject, User } from '../../types';

interface InventoryModalProps {
  item: InventoryItem | null;
  objects: ConstructionObject[];
  users: User[];
  onSave: (item: Omit<InventoryItem, 'id'>) => void;
  onClose: () => void;
}

const CATEGORIES = [
  'Инструменти',
  'Машини',
  'Скелета',
  'Защитни средства',
  'Електроматериали',
  'ВиК материали',
  'Други',
];

const STATUSES = [
  { value: 'available', label: 'Наличен', color: 'green' },
  { value: 'in-use', label: 'В употреба', color: 'blue' },
  { value: 'maintenance', label: 'В ремонт', color: 'yellow' },
  { value: 'lost', label: 'Изгубен', color: 'red' },
];

export const InventoryModal = ({ item, objects, users, onSave, onClose }: InventoryModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Инструменти',
    status: 'available' as InventoryItem['status'],
    assignedTo: null as number | null,
    assignedToName: null as string | null,
    objectId: null as number | null,
    objectName: null as string | null,
    photos: [] as string[],
  });
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        category: item.category,
        status: item.status,
        assignedTo: item.assignedTo,
        assignedToName: item.assignedToName,
        objectId: item.objectId,
        objectName: item.objectName,
        photos: item.photos || [],
      });
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSaving) return;
    setIsSaving(true);

    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  const handleObjectChange = (objectId: string) => {
    if (objectId === '') {
      setFormData({ ...formData, objectId: null, objectName: null });
    } else {
      const obj = objects.find(o => o.id === Number(objectId));
      setFormData({
        ...formData,
        objectId: Number(objectId),
        objectName: obj?.name || null,
      });
    }
  };

  const handleUserChange = (userId: string) => {
    if (userId === '') {
      setFormData({ ...formData, assignedTo: null, assignedToName: null });
    } else {
      const user = users.find(u => u.id === Number(userId));
      setFormData({
        ...formData,
        assignedTo: Number(userId),
        assignedToName: user?.name || null,
      });
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Convert files to base64 or URLs
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, base64],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  // Filter technicians only
  const technicians = users.filter(u => u.role === 'technician');

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {item ? 'Редактиране на артикул' : 'Нов артикул'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Наименование *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Напр. Бормашина Bosch"
            />
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Категория *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Статус *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as InventoryItem['status'] })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              >
                {STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Assigned To & Object */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Зачислен на техник
              </label>
              <select
                value={formData.assignedTo || ''}
                onChange={(e) => handleUserChange(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              >
                <option value="">-- Няма --</option>
                {technicians.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                На обект
              </label>
              <select
                value={formData.objectId || ''}
                onChange={(e) => handleObjectChange(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              >
                <option value="">-- Няма --</option>
                {objects.map(obj => (
                  <option key={obj.id} value={obj.id}>{obj.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Снимки
            </label>
            
            {/* Photo grid */}
            {formData.photos.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Снимка ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors w-full justify-center"
            >
              <Camera className="w-5 h-5" />
              <span>Добави снимки</span>
            </button>
            <p className="text-xs text-gray-500 mt-1">
              Можете да качите няколко снимки наведнъж
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Отказ
            </button>
            <button
              type="submit"
              disabled={isSaving || !formData.name}
              className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Запазване...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>{item ? 'Запази' : 'Създай'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
