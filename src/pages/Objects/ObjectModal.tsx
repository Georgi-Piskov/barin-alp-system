import { useState, useEffect } from 'react';
import { ConstructionObject, User } from '../../types';
import { apiService } from '../../services/api';
import { X, Building2, MapPin, Users, Check } from 'lucide-react';

interface ObjectModalProps {
  object: ConstructionObject | null;
  onSave: (data: Omit<ConstructionObject, 'id'>) => void;
  onClose: () => void;
}

export const ObjectModal = ({ object, onSave, onClose }: ObjectModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    status: 'active' as 'active' | 'completed' | 'paused',
    totalExpenses: 0,
    assignedTechnicians: [] as number[],
  });
  
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [isLoadingTechnicians, setIsLoadingTechnicians] = useState(true);

  useEffect(() => {
    if (object) {
      setFormData({
        name: object.name,
        address: object.address,
        status: object.status,
        totalExpenses: object.totalExpenses,
        assignedTechnicians: object.assignedTechnicians || [],
      });
    }
    loadTechnicians();
  }, [object]);

  const loadTechnicians = async () => {
    setIsLoadingTechnicians(true);
    try {
      const response = await apiService.getUsers();
      if (response.success && response.data) {
        const techs = response.data.filter(u => u.role === 'technician');
        setTechnicians(techs);
      } else {
        setTechnicians([]);
      }
    } catch (error) {
      console.error('Error loading technicians:', error);
      setTechnicians([]);
    }
    setIsLoadingTechnicians(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const toggleTechnician = (techId: number) => {
    setFormData(prev => ({
      ...prev,
      assignedTechnicians: prev.assignedTechnicians.includes(techId)
        ? prev.assignedTechnicians.filter(id => id !== techId)
        : [...prev.assignedTechnicians, techId]
    }));
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
              <Building2 className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {object ? 'Редактирай обект' : 'Нов обект'}
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
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Име на обекта *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="напр. Обект Витошка"
                required
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Адрес *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="напр. ж.к. Младост 4, бл. 123"
                required
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Статус
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'active', label: 'Активен', color: 'green' },
                { value: 'paused', label: 'На изчакване', color: 'yellow' },
                { value: 'completed', label: 'Завършен', color: 'gray' },
              ].map((status) => (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, status: status.value as typeof formData.status })}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    formData.status === status.value
                      ? status.color === 'green' ? 'border-green-500 bg-green-50' :
                        status.color === 'yellow' ? 'border-yellow-500 bg-yellow-50' :
                        'border-gray-500 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                    status.color === 'green' ? 'bg-green-500' :
                    status.color === 'yellow' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`} />
                  <span className="text-xs font-medium text-gray-700">{status.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Assigned Technicians */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Зачислени техници
              </span>
            </label>
            
            {isLoadingTechnicians ? (
              <div className="p-4 text-center text-gray-500">
                Зареждане...
              </div>
            ) : technicians.length === 0 ? (
              <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-xl">
                Няма налични техници
              </div>
            ) : (
              <div className="space-y-2">
                {technicians.map((tech) => (
                  <button
                    key={tech.id}
                    type="button"
                    onClick={() => toggleTechnician(tech.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                      formData.assignedTechnicians.includes(tech.id)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        formData.assignedTechnicians.includes(tech.id)
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {tech.name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{tech.name}</p>
                        <p className="text-xs text-gray-500">@{tech.username}</p>
                      </div>
                    </div>
                    {formData.assignedTechnicians.includes(tech.id) && (
                      <Check className="w-5 h-5 text-primary-600" />
                    )}
                  </button>
                ))}
              </div>
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
            {object ? 'Запази' : 'Създай'}
          </button>
        </div>
      </div>
    </div>
  );
};
