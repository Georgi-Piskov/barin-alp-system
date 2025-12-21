import { useState, useEffect, useRef } from 'react';
import { X, Package, Camera, Trash2, Upload, Loader2, AlertCircle } from 'lucide-react';
import { InventoryItem, ConstructionObject, User } from '../../types';
import { apiService } from '../../services/api';

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

// Compress image to reduce size
const compressImage = (base64: string, maxWidth = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // Scale down if too large
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Convert to compressed JPEG
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = () => resolve(base64); // Return original on error
    img.src = base64;
  });
};

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
  const [pendingPhotos, setPendingPhotos] = useState<string[]>([]); // New photos to upload
  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
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
    setUploadError(null);

    try {
      // Upload any pending photos to Google Drive first
      let uploadedPhotoUrls: string[] = [...formData.photos];
      let failedUploads = 0;
      
      for (const pendingPhoto of pendingPhotos) {
        // Only upload if it's a base64 image (not already a URL)
        if (pendingPhoto.startsWith('data:')) {
          // Compress the image first
          const compressedPhoto = await compressImage(pendingPhoto);
          
          const response = await apiService.uploadPhoto(
            compressedPhoto,
            `${formData.name || 'item'}_${Date.now()}.jpg`,
            item?.id,
            formData.name
          );
          
          console.log('Photo upload response:', response);
          
          // Handle different response formats
          let photoUrl: string | null = null;
          if (response.success) {
            if (response.data?.url) {
              photoUrl = response.data.url;
            } else if (typeof response.data === 'string') {
              photoUrl = response.data;
            }
          }
          
          if (photoUrl) {
            console.log('Photo URL to save:', photoUrl);
            uploadedPhotoUrls.push(photoUrl);
          } else {
            // Don't save base64 - it's too large for Google Sheets
            console.warn('Photo upload failed or no URL returned, skipping photo');
            failedUploads++;
          }
        } else {
          uploadedPhotoUrls.push(pendingPhoto);
        }
      }
      
      console.log('Final photos array to save:', uploadedPhotoUrls);
      
      if (failedUploads > 0) {
        setUploadError(`${failedUploads} снимка(и) не можаха да се качат. Проверете дали workflow 13-upload-photo е активен в n8n.`);
      }
      
      await onSave({ ...formData, photos: uploadedPhotoUrls });
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Convert files to base64 and compress
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        // Compress the image immediately for preview
        const compressed = await compressImage(base64, 800, 0.7);
        // Add to pending photos instead of formData directly
        setPendingPhotos(prev => [...prev, compressed]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (index: number) => {
    // Check if it's from existing photos or pending photos
    if (index < formData.photos.length) {
      setFormData(prev => ({
        ...prev,
        photos: prev.photos.filter((_, i) => i !== index),
      }));
    } else {
      // It's a pending photo
      const pendingIndex = index - formData.photos.length;
      setPendingPhotos(prev => prev.filter((_, i) => i !== pendingIndex));
    }
  };

  // Combine existing photos with pending ones for display
  const allPhotos = [...formData.photos, ...pendingPhotos];

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
          {/* Upload Error */}
          {uploadError && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{uploadError}</span>
            </div>
          )}

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
              Снимки {pendingPhotos.length > 0 && (
                <span className="text-xs text-amber-600 ml-2">
                  ({pendingPhotos.length} нови за качване)
                </span>
              )}
            </label>
            
            {/* Photo grid */}
            {allPhotos.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                {allPhotos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Снимка ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    {/* Show indicator for pending photos */}
                    {index >= formData.photos.length && (
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-amber-500 text-white text-[10px] rounded-full">
                        Ново
                      </div>
                    )}
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
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{pendingPhotos.length > 0 ? 'Качване на снимки...' : 'Запазване...'}</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>{item ? 'Запази' : 'Създай'}</span>
                </>
              )}
            </button>
          </div>        </form>
      </div>
    </div>
  );
};