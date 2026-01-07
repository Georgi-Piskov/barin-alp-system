import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';
import { Income, ConstructionObject } from '../../types';
import { X, TrendingUp, Calendar, Building2, FileText, Link } from 'lucide-react';

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  income: Income | null;
  objects: ConstructionObject[];
  prefillData?: Partial<Income> | null; // For prefilling from bank transaction
  bankTransactionId?: number | null;
}

export const IncomeModal: React.FC<IncomeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  income,
  objects,
  prefillData,
  bankTransactionId
}) => {
  const { user } = useAuthStore();
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    description: '',
    objectId: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (income) {
        // Editing existing income
        setFormData({
          date: income.date,
          amount: income.amount.toString(),
          description: income.description || '',
          objectId: income.objectId?.toString() || ''
        });
      } else if (prefillData) {
        // Prefilled from bank transaction
        setFormData({
          date: prefillData.date || new Date().toISOString().split('T')[0],
          amount: prefillData.amount?.toString() || '',
          description: prefillData.description || '',
          objectId: prefillData.objectId?.toString() || ''
        });
      } else {
        // Creating new income
        setFormData({
          date: new Date().toISOString().split('T')[0],
          amount: '',
          description: '',
          objectId: ''
        });
      }
      setError(null);
    }
  }, [isOpen, income, prefillData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Моля, въведете валидна сума');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const objectId = formData.objectId ? Number(formData.objectId) : null;
    const selectedObject = objects.find(o => o.id === objectId);

    const incomeData = {
      date: formData.date,
      amount: parseFloat(formData.amount),
      description: formData.description,
      objectId: objectId,
      objectName: selectedObject?.name || null,
      createdBy: user?.id || 0,
      createdByName: user?.name || '',
      bankTransactionId: bankTransactionId || null
    };

    try {
      let result;
      
      if (income) {
        // Update existing
        result = await apiService.updateIncome(income.id, incomeData);
      } else {
        // Create new
        result = await apiService.createIncome(incomeData);
      }

      if (result.success) {
        onSave();
      } else {
        setError(result.error || 'Грешка при запазване');
      }
    } catch (err) {
      setError('Грешка при запазване');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {income ? 'Редактиране на приход' : 'Нов приход'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Bank Transaction Info */}
          {bankTransactionId && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-sm">
                <Link className="h-4 w-4" />
                <span>Свързан с банкова транзакция #{bankTransactionId}</span>
              </div>
            </div>
          )}
          
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Calendar className="h-4 w-4 inline mr-1" />
              Дата
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <TrendingUp className="h-4 w-4 inline mr-1" />
              Сума (лв.)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <FileText className="h-4 w-4 inline mr-1" />
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Напр.: Плащане по договор, Авансово плащане..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
            />
          </div>

          {/* Object Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Building2 className="h-4 w-4 inline mr-1" />
              Обект
            </label>
            <select
              value={formData.objectId}
              onChange={(e) => setFormData({ ...formData, objectId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">-- Без обект --</option>
              {objects.map(obj => (
                <option key={obj.id} value={obj.id}>{obj.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Изберете обект, към който да бъде зачислен прихода
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Отказ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Запазване...' : (income ? 'Запази' : 'Добави')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
