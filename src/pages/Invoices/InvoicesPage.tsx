import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';
import { Invoice, ConstructionObject } from '../../types';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  Building2,
  Euro,
  AlertTriangle,
  MoreVertical,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Package
} from 'lucide-react';
import { InvoiceModal } from './InvoiceModal';
// Helper to extract items from invoice (handles data in wrong columns)
const getInvoiceItems = (invoice: Invoice): { name: string; unit: string; quantity: number; unitPrice: number; totalPrice: number }[] => {
  // First check if items array is populated
  if (invoice.items && Array.isArray(invoice.items) && invoice.items.length > 0) {
    return invoice.items;
  }
  
  // Check if items is a string that needs parsing
  const itemsStr = invoice.items as unknown;
  if (typeof itemsStr === 'string' && itemsStr.startsWith('[')) {
    try {
      return JSON.parse(itemsStr);
    } catch {
      // Continue to check other fields
    }
  }
  
  // Check if objectName contains JSON (data in wrong column)
  if (invoice.objectName && typeof invoice.objectName === 'string' && invoice.objectName.startsWith('[')) {
    try {
      return JSON.parse(invoice.objectName);
    } catch {
      // Not valid JSON
    }
  }
  
  return [];
};

// Helper to get actual object name (not JSON data)
const getObjectName = (invoice: Invoice): string | null => {
  if (invoice.objectName && typeof invoice.objectName === 'string' && !invoice.objectName.startsWith('[')) {
    return invoice.objectName;
  }
  return null;
};
export const InvoicesPage = () => {
  const { user } = useAuthStore();
  const isDirector = user?.role === 'director';
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [objects, setObjects] = useState<ConstructionObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [objectFilter, setObjectFilter] = useState<string>('all');
  const [showProblematic, setShowProblematic] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchTerm, objectFilter, showProblematic]);

  const loadData = async () => {
    setIsLoading(true);
    
    // Load objects first
    const objectsResponse = await apiService.getObjects(user?.id, user?.role);
    if (objectsResponse.success && objectsResponse.data) {
      setObjects(objectsResponse.data);
    }
    
    // Load invoices
    const invoicesResponse = await apiService.getInvoices();
    if (invoicesResponse.success && invoicesResponse.data) {
      setInvoices(invoicesResponse.data);
    }
    
    setIsLoading(false);
  };

  const filterInvoices = () => {
    let filtered = [...invoices];
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        inv => inv.supplier.toLowerCase().includes(term) || 
               inv.invoiceNumber.toLowerCase().includes(term) ||
               inv.description?.toLowerCase().includes(term)
      );
    }
    
    // Object filter
    if (objectFilter !== 'all') {
      if (objectFilter === 'unassigned') {
        filtered = filtered.filter(inv => !inv.objectId);
      } else {
        filtered = filtered.filter(inv => inv.objectId === Number(objectFilter));
      }
    }
    
    // Problematic filter (unassigned)
    if (showProblematic) {
      filtered = filtered.filter(inv => !inv.objectId);
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setFilteredInvoices(filtered);
  };

  const handleCreate = () => {
    setEditingInvoice(null);
    setIsModalOpen(true);
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Сигурни ли сте, че искате да изтриете тази фактура?')) {
      const response = await apiService.deleteInvoice(id);
      if (response.success) {
        setInvoices(invoices.filter(inv => inv.id !== id));
      }
    }
    setOpenMenuId(null);
  };

  const handleSave = async (invoiceData: Omit<Invoice, 'id'>) => {
    console.log('Saving invoice:', invoiceData);
    
    if (editingInvoice) {
      const response = await apiService.updateInvoice(editingInvoice.id, invoiceData);
      console.log('Update response:', response);
      
      if (response.success && response.data) {
        setInvoices(invoices.map(inv => 
          inv.id === editingInvoice.id ? response.data! : inv
        ));
      }
    } else {
      const response = await apiService.createInvoice(invoiceData);
      console.log('Create response:', response);
      
      if (response.success && response.data) {
        setInvoices([...invoices, response.data]);
      }
    }
    setIsModalOpen(false);
    setEditingInvoice(null);
  };

  // Calculate totals
  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const problematicCount = invoices.filter(inv => !inv.objectId).length;
  const problematicAmount = invoices.filter(inv => !inv.objectId).reduce((sum, inv) => sum + inv.total, 0);

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
          <h1 className="text-2xl font-bold text-gray-900">Фактури</h1>
          <p className="text-gray-500">Управление на фактури и разходи</p>
        </div>
        <button 
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30"
        >
          <Plus className="w-5 h-5" />
          <span>Нова фактура</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
              <p className="text-sm text-gray-500">Общо фактури</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Euro className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalAmount.toLocaleString()} €</p>
              <p className="text-sm text-gray-500">Обща сума</p>
            </div>
          </div>
        </div>
        
        {isDirector && (
          <>
            <div 
              className={`rounded-xl p-4 border cursor-pointer transition-all ${
                showProblematic 
                  ? 'bg-red-100 border-red-300' 
                  : 'bg-white border-gray-200 hover:border-red-300'
              }`}
              onClick={() => setShowProblematic(!showProblematic)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  showProblematic ? 'bg-red-200' : 'bg-red-100'
                }`}>
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{problematicCount}</p>
                  <p className="text-sm text-red-600">Проблемни</p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Euro className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{problematicAmount.toLocaleString()} €</p>
                  <p className="text-sm text-red-600">Без обект</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Търси по доставчик, номер или описание..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={objectFilter}
            onChange={(e) => setObjectFilter(e.target.value)}
            className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white appearance-none cursor-pointer"
          >
            <option value="all">Всички обекти</option>
            {isDirector && <option value="unassigned">Без обект (проблемни)</option>}
            {objects.map((obj) => (
              <option key={obj.id} value={obj.id}>{obj.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Invoices List */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || objectFilter !== 'all' || showProblematic
              ? 'Няма намерени фактури' 
              : 'Все още няма фактури'}
          </h3>
          <p className="text-gray-500 mb-4">
            {showProblematic 
              ? 'Няма фактури без зачислен обект'
              : 'Добавете първата си фактура'}
          </p>
          {!showProblematic && (
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="w-4 h-4" />
              Нова фактура
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Номер</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Доставчик</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Обект</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Материали</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Сума</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => {
                  const items = getInvoiceItems(invoice);
                  const objectName = getObjectName(invoice);
                  const hasObject = Boolean(invoice.objectId) || Boolean(objectName);
                  
                  return (
                  <React.Fragment key={invoice.id}>
                    <tr 
                      className={`hover:bg-gray-50 cursor-pointer ${!hasObject ? 'bg-red-50' : ''} ${expandedId === invoice.id ? 'bg-blue-50' : ''}`}
                      onClick={() => items.length > 0 && setExpandedId(expandedId === invoice.id ? null : invoice.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {items.length > 0 ? (
                            expandedId === invoice.id ? (
                              <ChevronUp className="w-4 h-4 text-blue-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )
                          ) : (
                            <Calendar className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="text-sm text-gray-900">
                            {new Date(invoice.date).toLocaleDateString('bg-BG')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{invoice.supplier}</p>
                          {invoice.description && (
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{invoice.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {hasObject && objectName ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{objectName}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-sm font-medium">Без обект</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {items.length > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg">
                            <Package className="w-4 h-4" />
                            <span className="text-sm font-medium">{items.length}</span>
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-bold ${!hasObject ? 'text-red-600' : 'text-gray-900'}`}>
                          {invoice.total.toLocaleString()} €
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === invoice.id ? null : invoice.id)}
                            className="p-1 hover:bg-gray-100 rounded-lg"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-500" />
                          </button>
                          
                          {openMenuId === invoice.id && (
                            <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                              <button
                                onClick={() => handleEdit(invoice)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Edit className="w-4 h-4" />
                                Редактирай
                              </button>
                              <button
                                onClick={() => handleDelete(invoice.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                                Изтрий
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Expanded items row */}
                    {expandedId === invoice.id && items.length > 0 && (
                      <tr key={`${invoice.id}-items`} className="bg-blue-50">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="ml-6">
                            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Материали във фактурата:</p>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-left text-xs text-gray-500">
                                    <th className="pb-1">Наименование</th>
                                    <th className="pb-1">Мярка</th>
                                    <th className="pb-1 text-right">К-во</th>
                                    <th className="pb-1 text-right">Ед. цена</th>
                                    <th className="pb-1 text-right">Сума</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {items.map((item, idx) => (
                                    <tr key={idx} className="border-t border-blue-100">
                                      <td className="py-1 text-gray-900">{item.name}</td>
                                      <td className="py-1 text-gray-600">{item.unit}</td>
                                      <td className="py-1 text-right text-gray-900">{item.quantity}</td>
                                      <td className="py-1 text-right text-gray-600">{Number(item.unitPrice).toFixed(2)} €</td>
                                      <td className="py-1 text-right font-medium text-gray-900">{Number(item.totalPrice).toFixed(2)} €</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <InvoiceModal
          invoice={editingInvoice}
          onSave={handleSave}
          onClose={() => {
            setIsModalOpen(false);
            setEditingInvoice(null);
          }}
        />
      )}
    </div>
  );
};
