import { useState, useEffect } from 'react';
import { Invoice, InvoiceItem, ConstructionObject } from '../../types';
import { apiService } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { X, FileText, Building2, Calendar, Hash, Plus, Trash2 } from 'lucide-react';

interface InvoiceModalProps {
  invoice: Invoice | null;
  preselectedObjectId?: number | null;
  onSave: (data: Omit<Invoice, 'id'>) => void;
  onClose: () => void;
}

const UNITS = [
  { value: 'бр', label: 'бр (брой)' },
  { value: 'кг', label: 'кг (килограм)' },
  { value: 'м', label: 'м (метър)' },
  { value: 'м2', label: 'м² (кв. метър)' },
  { value: 'м3', label: 'м³ (куб. метър)' },
  { value: 'л', label: 'л (литър)' },
  { value: 'торба', label: 'торба' },
  { value: 'пакет', label: 'пакет' },
  { value: 'кашон', label: 'кашон' },
  { value: 'комплект', label: 'комплект' },
];

export const InvoiceModal = ({ invoice, preselectedObjectId, onSave, onClose }: InvoiceModalProps) => {
  const { user } = useAuthStore();
  const isDirector = user?.role === 'director';
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    supplier: '',
    invoiceNumber: '',
    description: '',
    objectId: preselectedObjectId || null as number | null,
  });
  
  const [items, setItems] = useState<InvoiceItem[]>([
    { name: '', unit: 'бр', quantity: 1, unitPrice: 0, totalPrice: 0 }
  ]);
  
  const [objects, setObjects] = useState<ConstructionObject[]>([]);
  const [isLoadingObjects, setIsLoadingObjects] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (invoice) {
      setFormData({
        date: invoice.date,
        supplier: invoice.supplier,
        invoiceNumber: invoice.invoiceNumber,
        description: invoice.description,
        objectId: invoice.objectId,
      });
      if (invoice.items && invoice.items.length > 0) {
        setItems(invoice.items);
      }
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

  // Calculate total from items
  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  // Add new item
  const addItem = () => {
    setItems([...items, { name: '', unit: 'бр', quantity: 1, unitPrice: 0, totalPrice: 0 }]);
  };

  // Remove item
  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Update item
  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    const item = { ...newItems[index] };
    
    if (field === 'name' || field === 'unit') {
      item[field] = value as string;
    } else if (field === 'quantity' || field === 'unitPrice') {
      item[field] = Number(value) || 0;
      item.totalPrice = item.quantity * item.unitPrice;
    }
    
    newItems[index] = item;
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent double submit
    if (isSaving) return;
    setIsSaving(true);
    
    const selectedObject = objects.find(o => o.id === formData.objectId);
    const total = calculateTotal();
    
    // Filter out empty items
    const validItems = items.filter(item => item.name.trim() !== '');
    
    if (validItems.length === 0) {
      alert('Добавете поне един артикул');
      setIsSaving(false);
      return;
    }
    
    try {
      await onSave({
        ...formData,
        total,
        items: validItems,
        createdBy: user?.id || 0,
        createdByName: user?.name || '',
        objectName: selectedObject?.name || null,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
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
          {/* Basic Info Row */}
          <div className="grid grid-cols-2 gap-4">
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
                  placeholder="INV-001"
                  required
                />
              </div>
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

          {/* Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Артикули *
              </label>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
              >
                <Plus className="w-4 h-4" />
                Добави артикул
              </button>
            </div>
            
            <div className="space-y-2 bg-gray-50 p-3 rounded-xl">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
                <div className="col-span-4">Наименование</div>
                <div className="col-span-2">Мярка</div>
                <div className="col-span-2">К-во</div>
                <div className="col-span-2">Ед. цена €</div>
                <div className="col-span-1 text-right">Сума</div>
                <div className="col-span-1"></div>
              </div>
              
              {/* Items */}
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                    className="col-span-4 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white"
                    placeholder="Лепило за плочки"
                  />
                  <select
                    value={item.unit}
                    onChange={(e) => updateItem(index, 'unit', e.target.value)}
                    className="col-span-2 px-2 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    {UNITS.map(u => (
                      <option key={u.value} value={u.value}>{u.value}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity || ''}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    className="col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white"
                    placeholder="0"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice || ''}
                    onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                    className="col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white"
                    placeholder="0.00"
                  />
                  <div className="col-span-1 text-sm font-medium text-gray-700 text-right">
                    {item.totalPrice.toFixed(2)}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="col-span-1 p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30"
                    disabled={items.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            
            {/* Total */}
            <div className="flex justify-end items-center gap-4 pt-2 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-600">Обща сума:</span>
              <span className="text-xl font-bold text-primary-600">
                {calculateTotal().toFixed(2)} €
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Бележка (по желание)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              placeholder="Допълнителна информация..."
              rows={2}
            />
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
            type="submit"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Запазване...' : (invoice ? 'Запази' : 'Създай')}
          </button>
        </div>
      </div>
    </div>
  );
};
