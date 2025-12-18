import { useState, useEffect } from 'react';
import { Invoice, ConstructionObject } from '../../types';
import { apiService } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { X, FileText, Building2, Calendar, Hash, Euro, FileEdit } from 'lucide-react';

interface InvoiceModalProps {
  invoice: Invoice | null;
  preselectedObjectId?: number | null;
  onSave: (data: Omit<Invoice, 'id'>) => void;
  onClose: () => void;
}

export const InvoiceModal = ({ invoice, preselectedObjectId, onSave, onClose }: InvoiceModalProps) => {
  const { user } = useAuthStore();
  const isDirector = user?.role === 'director';
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    supplier: '',
    invoiceNumber: '',
    total: 0,
    description: '',
    objectId: preselectedObjectId || null as number | null,
  });
  
  const [objects, setObjects] = useState<ConstructionObject[]>([]);
  const [isLoadingObjects, setIsLoadingObjects] = useState(true);

  useEffect(() => {
    if (invoice) {
      setFormData({
        date: invoice.date,
        supplier: invoice.supplier,
        invoiceNumber: invoice.invoiceNumber,
        total: invoice.total,
        description: invoice.description,
        objectId: invoice.objectId,
      });
    }
    loadObjects();
  }, [invoice]);

  const loadObjects = async () => {
    setIsLoadingObjects(true);
    try {
      const response = await apiService.getObjects(user?.id, user?.role);
      if (response.success && response.data) {
        setObjects(response.data);
      }
    } catch (error) {
      console.error('Error loading objects:', error);
    }
    setIsLoadingObjects(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedObject = objects.find(o => o.id === formData.objectId);
    
    onSave({
      ...formData,
      createdBy: user?.id || 0,
      createdByName: user?.name || '',
      objectName: selectedObject?.name || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {invoice ? 'Редактирай фактура' : 'Нова фактура'}
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
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Дата *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Доставчик *
            </label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="напр. Строй Материали ООД"
              required
            />
          </div>

          {/* Invoice Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Номер на фактура *
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="напр. INV-001"
                required
              />
            </div>
          </div>

          {/* Total */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Сума (EUR) *
            </label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.total}
                onChange={(e) => setFormData({ ...formData, total: parseFloat(e.target.value) || 0 })}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Описание
            </label>
            <div className="relative">
              <FileEdit className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                placeholder="Описание на покупката..."
                rows={3}
              />
            </div>
          </div>

          {/* Object Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Към обект
                {!isDirector && <span className="text-xs text-gray-500">(задължително за техници)</span>}
              </span>
            </label>
            
            {isLoadingObjects ? (
              <div className="p-4 text-center text-gray-500">
                Зареждане...
              </div>
            ) : (
              <select
                value={formData.objectId || ''}
                onChange={(e) => setFormData({ ...formData, objectId: e.target.value ? Number(e.target.value) : null })}
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  !formData.objectId && isDirector ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
                required={!isDirector}
              >
                <option value="">
                  {isDirector ? '-- Без обект (проблемен разход) --' : '-- Избери обект --'}
                </option>
                {objects.map((obj) => (
                  <option key={obj.id} value={obj.id}>
                    {obj.name} - {obj.address}
                  </option>
                ))}
              </select>
            )}
            
            {isDirector && !formData.objectId && (
              <p className="mt-1 text-xs text-red-600">
                ⚠️ Фактури без обект се маркират като проблемни разходи
              </p>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Отказ
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            {invoice ? 'Запази' : 'Създай'}
          </button>
        </div>
      </div>
    </div>
  );
};
