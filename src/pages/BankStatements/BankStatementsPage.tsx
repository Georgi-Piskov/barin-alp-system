import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';
import { BankTransaction, Invoice, ConstructionObject, Income } from '../../types';
import { 
  FileUp,
  FileText,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Calendar,
  Search,
  Building2,
  Landmark,
  PlusCircle,
  Edit3,
  Save
} from 'lucide-react';
import { IncomeModal } from '../Incomes/IncomeModal';

export const BankStatementsPage = () => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [_invoices, setInvoices] = useState<Invoice[]>([]);
  const [objects, setObjects] = useState<ConstructionObject[]>([]);
  const [stats, setStats] = useState({
    count: 0,
    totalDebit: 0,
    totalCredit: 0,
    netChange: 0,
    aggregatedFeesTotal: 0,
    aggregatedFeesCount: 0,
    overdraftPairsRemoved: 0,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingTxId, setEditingTxId] = useState<number | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filters
  const [filterType, setFilterType] = useState<'all' | 'debit' | 'credit'>('all');
  const [filterUnassigned, setFilterUnassigned] = useState(false);
  
  // State for Income Modal from bank transaction
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [incomeFromBankTx, setIncomeFromBankTx] = useState<Partial<Income> | null>(null);
  const [selectedBankTxId, setSelectedBankTxId] = useState<number | null>(null);

  const isDirector = user?.role === 'director';

  // Load objects for assignment
  useEffect(() => {
    const loadObjects = async () => {
      try {
        const response = await apiService.getObjects();
        if (response.success && response.data) {
          setObjects(response.data);
        }
      } catch (err) {
        console.error('Error loading objects:', err);
      }
    };
    loadObjects();
  }, []);

  // Load saved bank transactions on mount
  useEffect(() => {
    const loadSavedTransactions = async () => {
      setIsLoading(true);
      try {
        const response = await apiService.getBankTransactions();
        if (response.success && response.data) {
          const txData = response.data.transactions || [];
          setTransactions(txData);
          setStats({
            count: response.data.count || txData.length || 0,
            totalDebit: response.data.totalDebit || 0,
            totalCredit: response.data.totalCredit || 0,
            netChange: response.data.netChange || 0,
            aggregatedFeesTotal: response.data.aggregatedFeesTotal || 0,
            aggregatedFeesCount: response.data.aggregatedFeesCount || 0,
            overdraftPairsRemoved: response.data.overdraftPairsRemoved || 0,
          });
        }
      } catch (err) {
        console.error('Error loading bank transactions:', err);
        setError('Грешка при зареждане на банкови транзакции');
      }
      setIsLoading(false);
    };
    loadSavedTransactions();
  }, []);

  // Load invoices for matching
  const loadInvoices = async () => {
    const response = await apiService.getInvoices();
    if (response.success && response.data) {
      setInvoices(response.data);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      setSelectedFile(file);
      setError(null);
    } else {
      setError('Моля, изберете CSV файл');
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const csvText = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(selectedFile, 'windows-1251');
      });

      await loadInvoices();

      const response = await apiService.parseBankStatement(csvText);
      
      console.log('Bank statement response:', response);
      
      if (response.success && response.data) {
        const txData = response.data.transactions || [];
        
        // Show parsing info
        const parseInfo: string[] = [];
        if (response.data.overdraftPairsRemoved && response.data.overdraftPairsRemoved > 0) {
          parseInfo.push(`${response.data.overdraftPairsRemoved} овърдрафт дублирания премахнати`);
        }
        if (response.data.aggregatedFeesCount && response.data.aggregatedFeesCount > 0) {
          parseInfo.push(`${response.data.aggregatedFeesCount} такси обединени (${response.data.aggregatedFeesTotal}€)`);
        }
        
        // Save transactions to Google Sheets
        if (txData.length > 0) {
          const saveResponse = await apiService.saveBankTransactions(txData);
          
          if (saveResponse.success && saveResponse.data) {
            const { insertedCount, duplicateCount } = saveResponse.data;
            let msg = '';
            if (insertedCount > 0) {
              msg = `Записани ${insertedCount} нови транзакции.`;
            }
            if (duplicateCount > 0) {
              msg += ` ${duplicateCount} дубликати пропуснати.`;
            }
            if (parseInfo.length > 0) {
              msg += ' ' + parseInfo.join('. ') + '.';
            }
            setSuccessMessage(msg || 'Обработката завърши.');
          }
        }
        
        // Reload from database to get IDs
        const reloadResponse = await apiService.getBankTransactions();
        if (reloadResponse.success && reloadResponse.data) {
          const reloadedData = reloadResponse.data.transactions || [];
          setTransactions(reloadedData);
          setStats({
            count: reloadResponse.data.count || reloadedData.length || 0,
            totalDebit: reloadResponse.data.totalDebit || 0,
            totalCredit: reloadResponse.data.totalCredit || 0,
            netChange: reloadResponse.data.netChange || 0,
            aggregatedFeesTotal: reloadResponse.data.aggregatedFeesTotal || 0,
            aggregatedFeesCount: reloadResponse.data.aggregatedFeesCount || 0,
            overdraftPairsRemoved: reloadResponse.data.overdraftPairsRemoved || 0,
          });
        }
      } else {
        setError(response.error || 'Грешка при парсване на файла');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Грешка при обработка на файла');
    }

    setIsLoading(false);
  };

  const handleObjectAssign = async (txIndex: number, objectId: number | null) => {
    const tx = filteredTransactions[txIndex];
    const obj = objects.find(o => o.id === objectId);
    
    // Find actual index in full transactions array
    const actualIndex = transactions.findIndex(t => t.id === tx.id);
    if (actualIndex === -1) return;
    
    // Save to database if transaction has ID
    if (tx.id) {
      try {
        const response = await apiService.updateBankTransaction(tx.id, {
          objectId,
          objectName: obj?.name || '',
          status: objectId ? 'matched' : 'unmatched',
        });
        
        if (response.success) {
          // Update locally only on success
          const updatedTransactions = [...transactions];
          updatedTransactions[actualIndex] = {
            ...updatedTransactions[actualIndex],
            objectId,
            objectName: obj?.name || null,
            status: objectId ? 'matched' : 'unmatched',
          };
          setTransactions(updatedTransactions);
          setSuccessMessage('Транзакцията е зачислена към обекта');
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          setError(response.error || 'Грешка при запазване');
          setTimeout(() => setError(null), 5000);
        }
      } catch (err) {
        console.error('Error updating transaction:', err);
        setError('Грешка при запазване на промените');
        setTimeout(() => setError(null), 5000);
      }
    }
  };

  const startEditDescription = (tx: BankTransaction) => {
    setEditingTxId(tx.id || null);
    setEditDescription(tx.displayName || tx.description || '');
  };

  const saveDescription = async (txIndex: number) => {
    const tx = filteredTransactions[txIndex];
    const actualIndex = transactions.findIndex(t => t.id === tx.id);
    if (actualIndex === -1 || !tx.id) return;

    try {
      const response = await apiService.updateBankTransaction(tx.id, {
        displayName: editDescription,
      });
      
      if (response.success) {
        const updatedTransactions = [...transactions];
        updatedTransactions[actualIndex] = {
          ...updatedTransactions[actualIndex],
          displayName: editDescription,
        };
        setTransactions(updatedTransactions);
        setEditingTxId(null);
        setEditDescription('');
        setSuccessMessage('Описанието е запазено');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.error || 'Грешка при запазване');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      console.error('Error updating description:', err);
      setError('Грешка при запазване');
      setTimeout(() => setError(null), 5000);
    }
  };

  // Create income from bank transaction (credit)
  const handleCreateIncomeFromTx = (tx: BankTransaction) => {
    setIncomeFromBankTx({
      date: tx.date,
      amount: tx.amount,
      description: tx.displayName || tx.counterpartyName || tx.description || 'Банков приход',
      objectId: tx.objectId || null,
      objectName: tx.objectName || null,
      bankTransactionId: tx.id || null,
    });
    setSelectedBankTxId(tx.id || null);
    setIsIncomeModalOpen(true);
  };

  const handleIncomeSaved = () => {
    setIsIncomeModalOpen(false);
    setIncomeFromBankTx(null);
    setSelectedBankTxId(null);
    setSuccessMessage('Приходът е записан успешно!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const clearData = () => {
    setTransactions([]);
    setStats({ count: 0, totalDebit: 0, totalCredit: 0, netChange: 0, aggregatedFeesTotal: 0, aggregatedFeesCount: 0, overdraftPairsRemoved: 0 });
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    if (filterType === 'debit' && tx.type !== 'debit') return false;
    if (filterType === 'credit' && tx.type !== 'credit') return false;
    if (filterUnassigned && tx.objectId) return false;
    return true;
  });

  // Count unassigned
  const unassignedCount = transactions.filter(tx => !tx.objectId).length;

  if (!isDirector) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-danger-500" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Достъпът е ограничен</h2>
          <p className="text-gray-500">Само директорите могат да виждат банкови извлечения</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Банкови извлечения</h1>
        <p className="text-gray-500">Качете CSV от Asset Bank и разпределете транзакциите по обекти</p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col items-center">
          <div 
            className={`w-full max-w-md border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              selectedFile 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-300 hover:border-primary-500 hover:bg-gray-50'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {selectedFile ? (
              <>
                <FileText className="w-12 h-12 mx-auto mb-3 text-green-600" />
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </>
            ) : (
              <>
                <FileUp className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="font-medium text-gray-900">Изберете CSV файл</p>
                <p className="text-sm text-gray-500 mt-1">
                  Кликнете или провлачете файл тук
                </p>
              </>
            )}
          </div>

          {error && (
            <div className="mt-4 px-4 py-2 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mt-4 px-4 py-2 bg-green-50 text-green-600 rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4" />
              {successMessage}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {selectedFile && (
              <button
                onClick={clearData}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Изчисти
              </button>
            )}
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isLoading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Обработка...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Анализирай
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {transactions.length > 0 && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{stats.count}</p>
                  <p className="text-sm text-gray-500">Транзакции</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-red-600">
                    -{stats.totalDebit.toLocaleString('bg-BG', { minimumFractionDigits: 2 })} €
                  </p>
                  <p className="text-sm text-gray-500">Разходи</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600">
                    +{stats.totalCredit.toLocaleString('bg-BG', { minimumFractionDigits: 2 })} €
                  </p>
                  <p className="text-sm text-gray-500">Приходи</p>
                </div>
              </div>
            </div>

            <div className={`bg-white rounded-xl p-4 shadow-sm border ${
              unassignedCount > 0 ? 'border-red-200 bg-red-50' : 'border-gray-100'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  unassignedCount > 0 ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                  <AlertTriangle className={`w-5 h-5 ${unassignedCount > 0 ? 'text-red-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <p className={`text-xl font-bold ${unassignedCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {unassignedCount}
                  </p>
                  <p className="text-sm text-gray-500">Без обект</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Филтър:</span>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filterType === 'all' 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Всички
                </button>
                <button
                  onClick={() => setFilterType('debit')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filterType === 'debit' 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Разходи
                </button>
                <button
                  onClick={() => setFilterType('credit')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filterType === 'credit' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Приходи
                </button>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterUnassigned}
                  onChange={(e) => setFilterUnassigned(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600">Само без обект</span>
              </label>

              <span className="text-sm text-gray-400 ml-auto">
                Показани: {filteredTransactions.length} от {transactions.length}
              </span>
            </div>
          </div>

          {/* Transaction List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {filteredTransactions.map((tx, index) => (
                <div key={tx.id || index} className={`p-4 ${!tx.objectId ? 'bg-red-50/30' : ''}`}>
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      tx.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {tx.type === 'credit' ? (
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    
                    {/* Details */}
                    <div className="flex-grow min-w-0">
                      {/* Description - editable */}
                      <div className="flex items-center gap-2 mb-1">
                        {editingTxId === tx.id ? (
                          <div className="flex items-center gap-2 flex-grow">
                            <input
                              type="text"
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              className="flex-grow px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              autoFocus
                            />
                            <button
                              onClick={() => saveDescription(index)}
                              className="p-1 text-green-600 hover:bg-green-100 rounded"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setEditingTxId(null); setEditDescription(''); }}
                              className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="font-medium text-gray-900">
                              {tx.displayName || tx.counterpartyName || tx.description || 'Без описание'}
                            </span>
                            <button
                              onClick={() => startEditDescription(tx)}
                              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                              title="Редактирай описание"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {tx.date}
                        </span>
                        {tx.reference && <span className="text-xs">Реф: {tx.reference.slice(0, 20)}...</span>}
                      </div>

                      {tx.purpose && (
                        <p className="text-sm text-gray-400 mt-1 truncate">
                          {tx.purpose}
                        </p>
                      )}

                      {/* Object Assignment */}
                      <div className="mt-3 flex items-center gap-3 flex-wrap">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <select
                          value={tx.objectId || 0}
                          onChange={(e) => handleObjectAssign(index, Number(e.target.value) || null)}
                          className={`text-sm border rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                            tx.objectId ? 'border-green-300 bg-green-50' : 'border-gray-200'
                          }`}
                        >
                          <option value={0}>-- Изберете обект --</option>
                          {objects.map(obj => (
                            <option key={obj.id} value={obj.id}>{obj.name}</option>
                          ))}
                        </select>
                        
                        {tx.objectName && (
                          <span className="text-sm text-green-600 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Зачислен
                          </span>
                        )}
                        
                        {/* Create Income button for credit transactions */}
                        {tx.type === 'credit' && (
                          <button
                            onClick={() => handleCreateIncomeFromTx(tx)}
                            className="ml-auto px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1"
                          >
                            <PlusCircle className="w-4 h-4" />
                            Създай приход
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                      <p className={`text-lg font-bold ${
                        tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {tx.type === 'credit' ? '+' : '-'}
                        {tx.amount.toLocaleString('bg-BG', { minimumFractionDigits: 2 })} €
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Landmark className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-800">Обобщение</h3>
                <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Общо разходи:</span>
                    <span className="ml-2 font-medium text-red-600">
                      -{stats.totalDebit.toLocaleString('bg-BG', { minimumFractionDigits: 2 })} €
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Общо приходи:</span>
                    <span className="ml-2 font-medium text-green-600">
                      +{stats.totalCredit.toLocaleString('bg-BG', { minimumFractionDigits: 2 })} €
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Зачислени към обекти:</span>
                    <span className="ml-2 font-medium text-blue-900">
                      {transactions.filter(tx => tx.objectId).length} транзакции
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Нетна промяна:</span>
                    <span className={`ml-2 font-medium ${stats.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.netChange >= 0 ? '+' : ''}{stats.netChange.toLocaleString('bg-BG', { minimumFractionDigits: 2 })} €
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!isLoading && transactions.length === 0 && !selectedFile && (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Няма качени извлечения
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Качете CSV файл от Asset Bank, за да разпределите банковите транзакции по обекти.
          </p>
        </div>
      )}

      {/* Income Modal for creating income from bank transaction */}
      <IncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => {
          setIsIncomeModalOpen(false);
          setIncomeFromBankTx(null);
          setSelectedBankTxId(null);
        }}
        onSave={handleIncomeSaved}
        income={null}
        objects={objects}
        prefillData={incomeFromBankTx}
        bankTransactionId={selectedBankTxId}
      />
    </div>
  );
};
