import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';
import { BankTransaction, Invoice, ConstructionObject } from '../../types';
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
  CreditCard,
  ChevronDown,
  ChevronUp,
  Wallet,
  Banknote
} from 'lucide-react';

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
    bankFeesTotal: 0,
    loanPaymentsTotal: 0,
    cashWithdrawalTotal: 0,
    netChange: 0,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    cash_withdrawal: true,
    bank_fees: false,
    loan_payment: false,
    transfer: true,
    other: true,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDirector = user?.role === 'director';

  // Load objects for assignment
  useEffect(() => {
    const loadObjects = async () => {
      const response = await apiService.getObjects();
      if (response.success && response.data) {
        setObjects(response.data);
      }
    };
    loadObjects();
  }, []);

  // Load saved bank transactions on mount
  useEffect(() => {
    const loadSavedTransactions = async () => {
      setIsLoading(true);
      const response = await apiService.getBankTransactions();
      if (response.success && response.data) {
        const txData = response.data.transactions || [];
        setTransactions(txData);
        setStats({
          count: response.data.count || txData.length || 0,
          totalDebit: response.data.totalDebit || 0,
          totalCredit: response.data.totalCredit || 0,
          bankFeesTotal: response.data.bankFeesTotal || 0,
          loanPaymentsTotal: response.data.loanPaymentsTotal || 0,
          cashWithdrawalTotal: response.data.cashWithdrawalTotal || 0,
          netChange: response.data.netChange || 0,
        });
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
        
        // Save transactions to Google Sheets
        if (txData.length > 0) {
          const saveResponse = await apiService.saveBankTransactions(txData);
          
          if (saveResponse.success && saveResponse.data) {
            const { insertedCount, duplicateCount } = saveResponse.data;
            if (insertedCount > 0) {
              setSuccessMessage(`Записани ${insertedCount} нови транзакции. ${duplicateCount > 0 ? `${duplicateCount} дубликати пропуснати.` : ''}`);
            } else if (duplicateCount > 0) {
              setSuccessMessage(`Всички ${duplicateCount} транзакции вече съществуват в базата.`);
            }
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
            bankFeesTotal: reloadResponse.data.bankFeesTotal || 0,
            loanPaymentsTotal: reloadResponse.data.loanPaymentsTotal || 0,
            cashWithdrawalTotal: reloadResponse.data.cashWithdrawalTotal || 0,
            netChange: reloadResponse.data.netChange || 0,
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
    const tx = transactions[txIndex];
    const obj = objects.find(o => o.id === objectId);
    
    // Save to database if transaction has ID
    if (tx.id) {
      try {
        const response = await apiService.updateBankTransaction(tx.id, {
          objectId,
          objectName: obj?.name || '',
          status: objectId ? 'matched' : 'unmatched',
        });
        
        console.log('Update bank transaction response:', response);
        
        if (response.success) {
          // Update locally only on success
          const updatedTransactions = [...transactions];
          updatedTransactions[txIndex] = {
            ...updatedTransactions[txIndex],
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
    } else {
      // No ID - just update locally (new transaction not saved yet)
      const updatedTransactions = [...transactions];
      updatedTransactions[txIndex] = {
        ...updatedTransactions[txIndex],
        objectId,
        objectName: obj?.name || null,
        status: objectId ? 'matched' : 'unmatched',
      };
      setTransactions(updatedTransactions);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const clearData = () => {
    setTransactions([]);
    setStats({ count: 0, totalDebit: 0, totalCredit: 0, bankFeesTotal: 0, loanPaymentsTotal: 0, cashWithdrawalTotal: 0, netChange: 0 });
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Group transactions by category
  const groupedTransactions = {
    cash_withdrawal: transactions.filter(tx => tx.category === 'cash_withdrawal'),
    bank_fees: transactions.filter(tx => tx.category === 'bank_fees'),
    loan_payment: transactions.filter(tx => tx.category === 'loan_payment'),
    transfer: transactions.filter(tx => tx.category === 'transfer'),
    other: transactions.filter(tx => !tx.category || tx.category === 'other'),
  };

  const categoryInfo: Record<string, { title: string; icon: React.ReactNode; bgColor: string; textColor: string; description: string }> = {
    cash_withdrawal: {
      title: 'Изтеглени пари в брой',
      icon: <Banknote className="w-5 h-5" />,
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
      description: 'Картови транзакции на каса',
    },
    bank_fees: {
      title: 'Банкови услуги',
      icon: <Landmark className="w-5 h-5" />,
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
      description: 'Автоматични такси, усвояване на кредит',
    },
    loan_payment: {
      title: 'Погасяване на кредит',
      icon: <CreditCard className="w-5 h-5" />,
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600',
      description: 'Общофирмени разходи',
    },
    transfer: {
      title: 'Преводи по фактури',
      icon: <FileText className="w-5 h-5" />,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      description: 'Плащания към доставчици',
    },
    other: {
      title: 'Други операции',
      icon: <Wallet className="w-5 h-5" />,
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-600',
      description: 'Некатегоризирани транзакции',
    },
  };

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
        <p className="text-gray-500">Качете CSV от Asset Bank за анализ и категоризация</p>
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
                    -{stats.totalDebit.toLocaleString('bg-BG', { minimumFractionDigits: 2 })} лв
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
                    +{stats.totalCredit.toLocaleString('bg-BG', { minimumFractionDigits: 2 })} лв
                  </p>
                  <p className="text-sm text-gray-500">Приходи</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  stats.netChange >= 0 ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <Wallet className={`w-5 h-5 ${stats.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <p className={`text-lg font-bold ${stats.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.netChange >= 0 ? '+' : ''}{stats.netChange.toLocaleString('bg-BG', { minimumFractionDigits: 2 })} лв
                  </p>
                  <p className="text-sm text-gray-500">Промяна</p>
                </div>
              </div>
            </div>
          </div>

          {/* Categorized Transactions */}
          <div className="space-y-4">
            {(Object.keys(groupedTransactions) as Array<keyof typeof groupedTransactions>).map(category => {
              const txList = groupedTransactions[category];
              if (txList.length === 0) return null;

              const info = categoryInfo[category];
              const isExpanded = expandedCategories[category];
              const categoryTotal = txList.reduce((sum, tx) => 
                sum + (tx.type === 'debit' ? -tx.amount : tx.amount), 0
              );

              return (
                <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${info.bgColor}`}>
                        <span className={info.textColor}>{info.icon}</span>
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">{info.title}</h3>
                        <p className="text-sm text-gray-500">{txList.length} транзакции • {info.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-bold ${categoryTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {categoryTotal >= 0 ? '+' : ''}{categoryTotal.toLocaleString('bg-BG', { minimumFractionDigits: 2 })} лв
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Transaction List */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 divide-y divide-gray-100">
                      {txList.map((tx, index) => {
                        const globalIndex = transactions.indexOf(tx);
                        
                        return (
                          <div key={index} className="p-4">
                            <div className="flex items-start gap-4">
                              {/* Icon */}
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                tx.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                              }`}>
                                {tx.type === 'credit' ? (
                                  <TrendingUp className="w-4 h-4 text-green-600" />
                                ) : (
                                  <TrendingDown className="w-4 h-4 text-red-600" />
                                )}
                              </div>
                              
                              {/* Details */}
                              <div className="flex-grow min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-gray-900">
                                    {tx.displayName || tx.counterpartyName || tx.description || 'Без описание'}
                                  </span>
                                  {tx.isCompanyExpense && (
                                    <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                                      Общофирмен
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {tx.date}
                                  </span>
                                  {tx.reference && <span>Реф: {tx.reference}</span>}
                                  {tx.invoiceRef && (
                                    <span className="text-blue-600 font-medium">
                                      Фактура: {tx.invoiceRef}
                                    </span>
                                  )}
                                </div>

                                {tx.purpose && tx.category === 'transfer' && (
                                  <p className="text-sm text-gray-400 mt-1 truncate">
                                    {tx.purpose}
                                  </p>
                                )}

                                {/* Object Assignment - for all transfer transactions (debit AND credit) */}
                                {category === 'transfer' && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-gray-400" />
                                    <select
                                      value={tx.objectId || 0}
                                      onChange={(e) => handleObjectAssign(globalIndex, Number(e.target.value) || null)}
                                      className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                                  </div>
                                )}
                              </div>
                              
                              {/* Amount */}
                              <div className="text-right flex-shrink-0">
                                <p className={`text-lg font-bold ${
                                  tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {tx.type === 'credit' ? '+' : '-'}
                                  {tx.amount.toLocaleString('bg-BG', { minimumFractionDigits: 2 })} лв
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Landmark className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-800">Обобщение на разходите</h3>
                <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Изтеглени в брой:</span>
                    <span className="ml-2 font-medium text-green-700">
                      {stats.cashWithdrawalTotal.toLocaleString('bg-BG', { minimumFractionDigits: 2 })} лв
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Банкови такси:</span>
                    <span className="ml-2 font-medium text-blue-900">
                      {stats.bankFeesTotal.toLocaleString('bg-BG', { minimumFractionDigits: 2 })} лв
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Погасяване кредит:</span>
                    <span className="ml-2 font-medium text-blue-900">
                      {stats.loanPaymentsTotal.toLocaleString('bg-BG', { minimumFractionDigits: 2 })} лв
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Преводи по фактури:</span>
                    <span className="ml-2 font-medium text-blue-900">
                      {groupedTransactions.transfer
                        .filter(tx => tx.type === 'debit')
                        .reduce((sum, tx) => sum + tx.amount, 0)
                        .toLocaleString('bg-BG', { minimumFractionDigits: 2 })} лв
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Зачислени към обекти:</span>
                    <span className="ml-2 font-medium text-blue-900">
                      {transactions.filter(tx => tx.objectId).length} транзакции
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
            Качете CSV файл от Asset Bank, за да анализирате банковите транзакции 
            и да ги категоризирате по обекти.
          </p>
        </div>
      )}
    </div>
  );
};
