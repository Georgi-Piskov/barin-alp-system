import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';
import { ConstructionObject, User, Invoice, InventoryItem, BankTransaction, Transaction } from '../../types';
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Users, 
  Edit, 
  Trash2,
  FileText,
  Package,
  TrendingDown,
  TrendingUp,
  Calendar,
  Wrench,
  CheckCircle,
  Clock,
  AlertTriangle,
  Landmark,
  Banknote
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    
    try {
      // Use combined endpoint to reduce API calls and avoid quota limits
      const result = await apiService.getObjectDetails(Number(id));
      
      if (result.success && result.data) {
        const loadedObject = result.data.object || null;
        
        // Security check: Technicians can only view objects they are assigned to
        if (!isDirector && loadedObject) {
          const isAssigned = loadedObject.assignedTechnicians?.includes(user?.id as number);
          if (!isAssigned) {
            console.warn('Access denied: User not assigned to this object');
            navigate('/objects');
            return;
          }
        }
        
        setObject(loadedObject);
        setTechnicians(result.data.technicians || []);
        setInvoices(result.data.invoices || []);
        setInventory(result.data.inventory || []);
        setBankTransactions(result.data.bankTransactions || []);
        setTransactions(result.data.transactions || []);
      } else {
        console.error('Failed to load object details:', result.error);
      }
    } catch (error) {
      console.error('Error loading object details:', error);
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
      console.log('Saving object data:', objectData);
      const response = await apiService.updateObject(object.id, objectData);
      console.log('Update response:', response);
      if (response.success && response.data) {
        console.log('Setting object to:', response.data);
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
      <div className={`grid grid-cols-2 ${isDirector ? 'lg:grid-cols-5' : 'lg:grid-cols-3'} gap-4`}>
        {/* Total Expenses - Only for Directors */}
        {isDirector && (
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {(
                    invoices.reduce((sum, inv) => sum + inv.total, 0) + 
                    bankTransactions.filter(tx => tx.type === 'debit').reduce((sum, tx) => sum + tx.amount, 0) +
                    transactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0)
                  ).toLocaleString('bg-BG')} €
                </p>
                <p className="text-xs text-gray-500">Общи разходи</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{isDirector ? invoices.length : invoices.filter(inv => inv.createdBy === user?.id).length}</p>
              <p className="text-xs text-gray-500">{isDirector ? 'Фактури' : 'Мои фактури'}</p>
            </div>
          </div>
        </div>

        {/* Bank Transactions - Only for Directors */}
        {isDirector && (
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Landmark className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{bankTransactions.length}</p>
                <p className="text-xs text-gray-500">Банкови</p>
              </div>
            </div>
          </div>
        )}

        {/* Cash Transactions - Only for Directors */}
        {isDirector && (
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Banknote className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{transactions.length}</p>
                <p className="text-xs text-gray-500">Транзакции</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{inventory.length}</p>
              <p className="text-xs text-gray-500">Инвентар</p>
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

      {/* Second row - Bank & Transactions - Only for Directors */}
      {isDirector && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Bank Transactions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Landmark className="w-5 h-5" />
              Банкови плащания
            </h2>
            {bankTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Landmark className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Няма банкови плащания за този обект</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bankTransactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        tx.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {tx.type === 'credit' ? (
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{tx.counterpartyName || tx.displayName || 'Банково плащане'}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(tx.date).toLocaleDateString('bg-BG')}</span>
                          {tx.invoiceRef && (
                            <>
                              <span>•</span>
                              <span>Ф-ра: {tx.invoiceRef}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'credit' ? '+' : '-'}{tx.amount.toLocaleString('bg-BG')} €
                      </p>
                    </div>
                  </div>
                ))}
                {bankTransactions.length > 5 && (
                  <Link 
                    to="/bank-statements"
                    className="block text-center text-primary-600 hover:text-primary-700 font-medium py-2"
                  >
                    Виж всички {bankTransactions.length} плащания →
                  </Link>
                )}
                {/* Summary */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Общо разходи:</span>
                  <span className="font-bold text-red-600">
                    -{bankTransactions.filter(tx => tx.type === 'debit').reduce((sum, tx) => sum + tx.amount, 0).toLocaleString('bg-BG')} €
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500">Общо приходи:</span>
                  <span className="font-bold text-green-600">
                    +{bankTransactions.filter(tx => tx.type === 'credit').reduce((sum, tx) => sum + tx.amount, 0).toLocaleString('bg-BG')} €
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cash Transactions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Banknote className="w-5 h-5" />
            Касови транзакции
          </h2>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Banknote className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Няма касови транзакции за този обект</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      tx.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {tx.type === 'income' ? (
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{tx.description || (tx.type === 'income' ? 'Приход' : 'Разход')}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(tx.date).toLocaleDateString('bg-BG')}</span>
                        <span>•</span>
                        <span>{tx.userName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString('bg-BG')} €
                    </p>
                  </div>
                </div>
              ))}
              {transactions.length > 5 && (
                <Link 
                  to="/transactions"
                  className="block text-center text-primary-600 hover:text-primary-700 font-medium py-2"
                >
                  Виж всички {transactions.length} транзакции →
                </Link>
              )}
              {/* Summary */}
              {transactions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Общо разходи:</span>
                    <span className="font-bold text-red-600">
                      -{transactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0).toLocaleString('bg-BG')} €
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">Общо приходи:</span>
                    <span className="font-bold text-green-600">
                      +{transactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0).toLocaleString('bg-BG')} €
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Third row - Invoices & Inventory */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Invoices */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {isDirector ? `Фактури (${invoices.length})` : `Мои фактури (${invoices.filter(inv => inv.createdBy === user?.id).length})`}
          </h2>
          {(() => {
            const displayInvoices = isDirector ? invoices : invoices.filter(inv => inv.createdBy === user?.id);
            if (displayInvoices.length === 0) {
              return (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Няма фактури за този обект</p>
                </div>
              );
            }
            return (
              <div className="space-y-3">
                {displayInvoices.slice(0, 5).map((invoice) => (
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
                      <p className="font-bold text-gray-900">{invoice.total.toLocaleString('bg-BG')} €</p>
                    </div>
                  </div>
                ))}
                {displayInvoices.length > 5 && (
                  <Link 
                    to="/invoices"
                    className="block text-center text-primary-600 hover:text-primary-700 font-medium py-2"
                  >
                    Виж всички {displayInvoices.length} фактури →
                  </Link>
                )}
                {isDirector && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Общо по фактури:</span>
                      <span className="font-bold text-gray-900">
                        {displayInvoices.reduce((sum, inv) => sum + inv.total, 0).toLocaleString('bg-BG')} €
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Inventory */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Инвентар на обекта ({inventory.length})
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
