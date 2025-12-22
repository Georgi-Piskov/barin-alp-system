import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';
import { ConstructionObject, User, Invoice, InventoryItem, BankTransaction } from '../../types';
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Users, 
  Edit, 
  Trash2,
  FileText,
  Package,
  Receipt,
  TrendingDown,
  Calendar,
  Wrench,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { ObjectModal } from './ObjectModal';

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Активен', color: 'text-green-700', bg: 'bg-green-100' },
  completed: { label: 'Завършен', color: 'text-gray-700', bg: 'bg-gray-100' },
  paused: { label: 'На изчакване', color: 'text-yellow-700', bg: 'bg-yellow-100' },
};

export const ObjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isDirector = user?.role === 'director';

  const [object, setObject] = useState<ConstructionObject | null>(null);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setIsLoading(true);
    
    // Load all data in parallel
    const [objectsRes, usersRes, invoicesRes, inventoryRes, bankTxRes] = await Promise.all([
      apiService.getObjects(user?.id, user?.role),
      apiService.getUsers(),
      apiService.getInvoices(),
      apiService.getInventory(),
      apiService.getBankTransactions(),
    ]);
    
    if (objectsRes.success && objectsRes.data) {
      const found = objectsRes.data.find(obj => obj.id === Number(id));
      setObject(found || null);
    }
    
    if (usersRes.success && usersRes.data) {
      setTechnicians(usersRes.data.filter(u => u.role === 'technician'));
    }
    
    if (invoicesRes.success && invoicesRes.data) {
      // Filter invoices for this object
      setInvoices(invoicesRes.data.filter(inv => inv.objectId === Number(id)));
    }
    
    if (inventoryRes.success && inventoryRes.data) {
      // Filter inventory for this object
      setInventory(inventoryRes.data.filter(item => item.objectId === Number(id)));
    }
    
    if (bankTxRes.success && bankTxRes.data?.transactions) {
      // Filter bank transactions for this object (debit + transfer category)
      setBankTransactions(
        bankTxRes.data.transactions.filter(
          (tx: BankTransaction) => tx.objectId === Number(id) && tx.type === 'debit' && tx.category === 'transfer'
        )
      );
    }
    
    setIsLoading(false);
  };

  const handleEdit = () => {
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (object && window.confirm('Сигурни ли сте, че искате да изтриете този обект?')) {
      const response = await apiService.deleteObject(object.id);
      if (response.success) {
        navigate('/objects');
      }
    }
  };

  const handleSave = async (objectData: Omit<ConstructionObject, 'id'>) => {
    if (object) {
      const response = await apiService.updateObject(object.id, objectData);
      if (response.success && response.data) {
        setObject(response.data);
      }
    }
    setIsModalOpen(false);
  };

  const getAssignedTechnicianNames = () => {
    if (!object?.assignedTechnicians) return [];
    return technicians.filter(t => object.assignedTechnicians?.includes(t.id));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!object) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Обектът не е намерен</h2>
        <p className="text-gray-500 mb-4">Обектът може да е изтрит или нямате достъп до него</p>
        <Link
          to="/objects"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Към обектите
        </Link>
      </div>
    );
  }

  const assignedTechs = getAssignedTechnicianNames();

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to="/objects"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Назад към обектите</span>
      </Link>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className={`h-2 ${
          object.status === 'active' ? 'bg-green-500' :
          object.status === 'paused' ? 'bg-yellow-500' : 'bg-gray-400'
        }`} />
        
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                object.status === 'active' ? 'bg-green-100' :
                object.status === 'paused' ? 'bg-yellow-100' : 'bg-gray-100'
              }`}>
                <Building2 className={`w-7 h-7 ${
                  object.status === 'active' ? 'text-green-600' :
                  object.status === 'paused' ? 'text-yellow-600' : 'text-gray-600'
                }`} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{object.name}</h1>
                <div className="flex items-center gap-2 mt-1 text-gray-500">
                  <MapPin className="w-4 h-4" />
                  <span>{object.address}</span>
                </div>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${statusLabels[object.status].bg} ${statusLabels[object.status].color}`}>
                  {statusLabels[object.status].label}
                </span>
              </div>
            </div>

            {isDirector && (
              <div className="flex gap-2">
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Редактирай</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-danger-50 text-danger-700 rounded-lg hover:bg-danger-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Изтрий</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {(invoices.reduce((sum, inv) => sum + inv.total, 0) + bankTransactions.reduce((sum, tx) => sum + tx.amount, 0)).toLocaleString('bg-BG')} €
              </p>
              <p className="text-sm text-gray-500">Общи разходи</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
              <p className="text-sm text-gray-500">Фактури</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{inventory.length}</p>
              <p className="text-sm text-gray-500">Инвентар</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Receipt className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{bankTransactions.length}</p>
              <p className="text-sm text-gray-500">Банкови плащания</p>
            </div>
          </div>
        </div>
      </div>

      {/* Assigned Technicians */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Зачислени техници
          </h2>
        </div>
        
        <div className="p-4">
          {assignedTechs.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Няма зачислени техници</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {assignedTechs.map((tech) => (
                <div
                  key={tech.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                >
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold">
                    {tech.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{tech.name}</p>
                    <p className="text-sm text-gray-500">@{tech.username}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Placeholder sections for future */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Последни фактури
          </h2>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Няма фактури за този обект</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{invoice.supplier}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(invoice.date).toLocaleDateString('bg-BG')}</span>
                        <span>•</span>
                        <span>{invoice.invoiceNumber}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{invoice.total.toLocaleString()} €</p>
                  </div>
                </div>
              ))}
              {invoices.length > 5 && (
                <Link 
                  to="/invoices"
                  className="block text-center text-primary-600 hover:text-primary-700 font-medium py-2"
                >
                  Виж всички {invoices.length} фактури →
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Инвентар на обекта
          </h2>
          {inventory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Няма инвентар за този обект</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inventory.slice(0, 5).map((item) => {
                const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
                  'available': { icon: CheckCircle, color: 'text-green-600 bg-green-100', label: 'Наличен' },
                  'in-use': { icon: Wrench, color: 'text-blue-600 bg-blue-100', label: 'В употреба' },
                  'maintenance': { icon: Clock, color: 'text-yellow-600 bg-yellow-100', label: 'В ремонт' },
                  'lost': { icon: AlertTriangle, color: 'text-red-600 bg-red-100', label: 'Изгубен' },
                };
                const status = statusConfig[item.status] || statusConfig['available'];
                const StatusIcon = status.icon;
                
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${status.color.split(' ')[1]}`}>
                        <Package className={`w-5 h-5 ${status.color.split(' ')[0]}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </div>
                  </div>
                );
              })}
              {inventory.length > 5 && (
                <Link 
                  to="/inventory"
                  className="block text-center text-primary-600 hover:text-primary-700 font-medium py-2"
                >
                  Виж всичко ({inventory.length} артикула) →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <ObjectModal
          object={object}
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};
