import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';
import { BankTransaction, ConstructionObject, Income, User, Transaction, CashWithdrawal } from '../../types';
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
  Save,
  Trash2,
  UserPlus,
  MinusCircle,
  Wallet,
  Banknote
} from 'lucide-react';
import { IncomeModal } from '../Incomes/IncomeModal';

// Cash tracking starts from this date (everything before is ignored)
const CASH_TRACKING_START = '2026-05-01';

export const BankStatementsPage = () => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [objects, setObjects] = useState<ConstructionObject[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({
    count: 0,
    totalDebit: 0,
    totalCredit: 0,
    netChange: 0,
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

  // Cash withdrawal tracking
  const [cashWithdrawals, setCashWithdrawals] = useState<CashWithdrawal[]>([]);
  const [manualTransactions, setManualTransactions] = useState<Transaction[]>([]);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [cashForm, setCashForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    description: '',
  });
  const [isSavingCash, setIsSavingCash] = useState(false);

  const isDirector = user?.role === 'director';

  // Load objects, users, cash withdrawals and manual transactions
  useEffect(() => {
    const loadData = async () => {
      try {
        const [objectsRes, usersRes, cashRes, txRes] = await Promise.all([
          apiService.getObjects(),
          apiService.getUsers(),
          apiService.getCashWithdrawals(),
          apiService.getTransactions()
        ]);
        if (objectsRes.success && objectsRes.data) {
          setObjects(objectsRes.data);
        }
        if (usersRes.success && usersRes.data) {
          setUsers(usersRes.data);
        }
        if (cashRes.success && cashRes.data) {
          setCashWithdrawals(Array.isArray(cashRes.data) ? cashRes.data : []);
        }
        if (txRes.success && txRes.data) {
          setManualTransactions(Array.isArray(txRes.data) ? txRes.data : []);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };
    loadData();
  }, []);

  // Save new cash withdrawal
  const handleSaveCashWithdrawal = async () => {
    const amount = parseFloat(cashForm.amount);
    if (!cashForm.date || !amount || amount <= 0) {
      setError('Моля, въведете валидна дата и сума');
      setTimeout(() => setError(null), 5000);
      return;
    }

    setIsSavingCash(true);
    try {
      const response = await apiService.createCashWithdrawal({
        date: cashForm.date,
        amount,
        currency: 'EUR',
        description: cashForm.description || '',
        createdBy: user?.id || 0,
        createdByName: user?.name || '',
      });

      if (response.success && response.data) {
        setCashWithdrawals(prev => [...prev, response.data!]);
        setIsCashModalOpen(false);
        setCashForm({
          date: new Date().toISOString().split('T')[0],
          amount: '',
          description: '',
        });
        setSuccessMessage('Кеш тегленето е записано');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.error || 'Грешка при запазване');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      console.error('Error saving cash withdrawal:', err);
      setError('Грешка при запазване');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSavingCash(false);
    }
  };

  // Delete cash withdrawal
  const handleDeleteCashWithdrawal = async (cw: CashWithdrawal) => {
    if (!window.confirm(`Изтриване на теглене от ${cw.date} за ${cw.amount.toFixed(2)} €?`)) return;
    try {
      const response = await apiService.deleteCashWithdrawal(cw.id);
      if (response.success) {
        setCashWithdrawals(prev => prev.filter(x => x.id !== cw.id));
        setSuccessMessage('Записът е изтрит');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.error || 'Грешка при изтриване');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      console.error('Error deleting cash withdrawal:', err);
      setError('Грешка при изтриване');
      setTimeout(() => setError(null), 5000);
    }
  };

  // Load saved bank transactions on mount
  useEffect(() => {
    const loadSavedTransactions = async () => {
      try {
        const response = await apiService.getBankTransactions();
        console.log('Bank transactions response:', response);
        
        if (response.success && response.data) {
          let txData: BankTransaction[] = [];
          
          if (Array.isArray(response.data)) {
            txData = response.data;
          } else if (response.data.transactions) {
            txData = Array.isArray(response.data.transactions) ? response.data.transactions : [];
          }
          
          setTransactions(txData);
          calculateStats(txData);
        }
      } catch (err) {
        console.error('Error loading bank transactions:', err);
      } finally {
        setIsInitialLoading(false);
      }
    };
    loadSavedTransactions();
  }, []);

  const calculateStats = (txList: BankTransaction[]) => {
    const totalDebit = txList.filter(tx => tx.type === 'debit').reduce((sum, tx) => sum + tx.amount, 0);
    const totalCredit = txList.filter(tx => tx.type === 'credit').reduce((sum, tx) => sum + tx.amount, 0);
    setStats({
      count: txList.length,
      totalDebit,
      totalCredit,
      netChange: totalCredit - totalDebit,
    });
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

      const response = await apiService.parseBankStatement(csvText);
      
      console.log('Bank statement response:', response);
      
      if (response.success && response.data) {
        const txData = response.data.transactions || [];
        
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
            setSuccessMessage(msg || 'Обработката завърши.');
          }
        }
        
        // Reload from database to get IDs
        const reloadResponse = await apiService.getBankTransactions();
        if (reloadResponse.success && reloadResponse.data) {
          const reloadedData = Array.isArray(reloadResponse.data) 
            ? reloadResponse.data 
            : (reloadResponse.data.transactions || []);
          setTransactions(reloadedData);
          calculateStats(reloadedData);
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
    
    const actualIndex = transactions.findIndex(t => t.id === tx.id);
    if (actualIndex === -1) return;
    
    if (tx.id) {
      try {
        const response = await apiService.updateBankTransaction(tx.id, {
          objectId,
          objectName: obj?.name || '',
          status: objectId ? 'matched' : 'unmatched',
        });
        
        if (response.success) {
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

  // Create expense (transaction) from bank transaction (debit)
  const handleCreateExpenseFromTx = async (tx: BankTransaction) => {
    // Create a transaction (expense) linked to this bank transaction
    if (!tx.objectId) {
      setError('Моля, първо изберете обект за тази транзакция');
      setTimeout(() => setError(null), 5000);
      return;
    }

    try {
      const transactionData: Partial<Transaction> = {
        type: 'expense',
        userId: user?.id || 0,
        userName: user?.name || '',
        amount: tx.amount,
        date: tx.date,
        description: tx.displayName || tx.description || 'Банков разход',
        createdBy: user?.id || 0,
        createdByName: user?.name || '',
        objectId: tx.objectId,
        objectName: tx.objectName || '',
        method: 'bank',
      };

      const response = await apiService.createTransaction(transactionData as any);
      
      if (response.success) {
        setSuccessMessage('Разходът е записан успешно!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.error || 'Грешка при създаване на разход');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      console.error('Error creating expense:', err);
      setError('Грешка при създаване на разход');
      setTimeout(() => setError(null), 5000);
    }
  };

  // Assign transaction to user (technician or director) as income
  const handleAssignToUser = async (txIndex: number, userId: number | null) => {
    const tx = filteredTransactions[txIndex];
    const actualIndex = transactions.findIndex(t => t.id === tx.id);
    if (actualIndex === -1 || !tx.id) return;

    try {
      const selectedUser = userId ? users.find(u => u.id === userId) : null;
      
      const response = await apiService.updateBankTransaction(tx.id, {
        technicianId: userId,
        technicianName: selectedUser?.name || null,
      });
      
      if (response.success) {
        const updatedTransactions = [...transactions];
        updatedTransactions[actualIndex] = {
          ...updatedTransactions[actualIndex],
          technicianId: userId,
          technicianName: selectedUser?.name || null,
        };
        setTransactions(updatedTransactions);
        setSuccessMessage(`Преводът е ${userId ? 'заприходен на ' + selectedUser?.name : 'премахнат от потребител'}`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.error || 'Грешка при присвояване');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      console.error('Error assigning to user:', err);
      setError('Грешка при присвояване');
      setTimeout(() => setError(null), 5000);
    }
  };

  // Delete bank transaction
  const handleDeleteTransaction = async (tx: BankTransaction) => {
    if (!tx.id) return;
    
    if (!window.confirm(`Сигурни ли сте, че искате да изтриете транзакция "${tx.displayName || tx.description}" за ${tx.amount.toFixed(2)} €?`)) {
      return;
    }

    try {
      const response = await apiService.deleteBankTransaction(tx.id);
      
      if (response.success) {
        const updatedTransactions = transactions.filter(t => t.id !== tx.id);
        setTransactions(updatedTransactions);
        calculateStats(updatedTransactions);
        setSuccessMessage('Транзакцията е изтрита');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.error || 'Грешка при изтриване');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setError('Грешка при изтриване на транзакция');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleIncomeSaved = () => {
    setIsIncomeModalOpen(false);
    setIncomeFromBankTx(null);
    setSelectedBankTxId(null);
    setSuccessMessage('Приходът е записан успешно!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const clearData = () => {
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
  const unassignedCount = transactions.filter(tx => !tx.objectId && !tx.technicianId).length;

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

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 mx-auto mb-4 text-primary-500 animate-spin" />
          <p className="text-gray-500">Зареждане...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Банкови извлечения</h1>
          <p className="text-gray-500">Качете CSV от Asset Bank и разпределете транзакциите</p>
        </div>
        <button
          onClick={() => setIsCashModalOpen(true)}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Banknote className="w-5 h-5" />
          Запиши изтеглен КЕШ
        </button>
      </div>

      {/* Cash Balance Section */}
      {(() => {
        const trackedWithdrawals = cashWithdrawals.filter(w => w.date >= CASH_TRACKING_START);
        const trackedCashExpenses = manualTransactions.filter(
          t => t.method === 'cash' && t.type === 'expense' && t.date >= CASH_TRACKING_START
        );
        const totalWithdrawn = trackedWithdrawals.reduce((s, w) => s + (Number(w.amount) || 0), 0);
        const totalSpent = trackedCashExpenses.reduce((s, t) => s + (Number(t.amount) || 0), 0);
        const balance = totalWithdrawn - totalSpent;

        // Group by month (YYYY-MM)
        const monthsMap: Record<string, { withdrawn: number; spent: number }> = {};
        const monthKey = (d: string) => (d || '').slice(0, 7);
        for (const w of trackedWithdrawals) {
          const k = monthKey(w.date);
          if (!k) continue;
          if (!monthsMap[k]) monthsMap[k] = { withdrawn: 0, spent: 0 };
          monthsMap[k].withdrawn += Number(w.amount) || 0;
        }
        for (const t of trackedCashExpenses) {
          const k = monthKey(t.date);
          if (!k) continue;
          if (!monthsMap[k]) monthsMap[k] = { withdrawn: 0, spent: 0 };
          monthsMap[k].spent += Number(t.amount) || 0;
        }
        const months = Object.keys(monthsMap).sort().reverse();
        const monthLabel = (k: string) => {
          const [y, m] = k.split('-');
          const names = ['Януари','Февруари','Март','Април','Май','Юни','Юли','Август','Септември','Октомври','Ноември','Декември'];
          return `${names[parseInt(m, 10) - 1] || m} ${y}`;
        };

        return (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-sm border border-amber-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Кеш баланс</h2>
                <p className="text-xs text-gray-500">От {CASH_TRACKING_START} до днес</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-white rounded-lg p-3 border border-amber-100">
                <p className="text-xs text-gray-500 mb-1">Изтеглени</p>
                <p className="text-lg font-bold text-blue-600">
                  {totalWithdrawn.toLocaleString('bg-BG', { minimumFractionDigits: 2 })} €
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-amber-100">
                <p className="text-xs text-gray-500 mb-1">Разходвани (кеш)</p>
                <p className="text-lg font-bold text-red-600">
                  {totalSpent.toLocaleString('bg-BG', { minimumFractionDigits: 2 })} €
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-amber-100">
                <p className="text-xs text-gray-500 mb-1">Разлика</p>
                <p className={`text-lg font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {balance >= 0 ? '+' : ''}{balance.toLocaleString('bg-BG', { minimumFractionDigits: 2 })} €
                </p>
              </div>
            </div>

            {months.length > 0 && (
              <div className="bg-white rounded-lg border border-amber-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-amber-100/60">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Месец</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Изтеглени</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Разходи</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Разлика</th>
                    </tr>
                  </thead>
                  <tbody>
                    {months.map(k => {
                      const m = monthsMap[k];
                      const diff = m.withdrawn - m.spent;
                      return (
                        <tr key={k} className="border-t border-amber-50">
                          <td className="px-3 py-2 font-medium text-gray-900">{monthLabel(k)}</td>
                          <td className="px-3 py-2 text-right text-blue-600">{m.withdrawn.toLocaleString('bg-BG', { minimumFractionDigits: 2 })} €</td>
                          <td className="px-3 py-2 text-right text-red-600">{m.spent.toLocaleString('bg-BG', { minimumFractionDigits: 2 })} €</td>
                          <td className={`px-3 py-2 text-right font-semibold ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {diff >= 0 ? '+' : ''}{diff.toLocaleString('bg-BG', { minimumFractionDigits: 2 })} €
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {trackedWithdrawals.length > 0 && (
              <div className="mt-4">
                <details className="bg-white rounded-lg border border-amber-100 p-3">
                  <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                    История на тегления ({trackedWithdrawals.length})
                  </summary>
                  <div className="mt-3 max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Дата</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Сума</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Описание</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">От</th>
                          <th className="px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...trackedWithdrawals].sort((a, b) => b.date.localeCompare(a.date)).map(w => (
                          <tr key={w.id} className="border-t border-gray-100">
                            <td className="px-3 py-2 text-gray-900">{w.date}</td>
                            <td className="px-3 py-2 text-right font-medium text-blue-600">
                              {Number(w.amount).toLocaleString('bg-BG', { minimumFractionDigits: 2 })} €
                            </td>
                            <td className="px-3 py-2 text-gray-700">{w.description || '-'}</td>
                            <td className="px-3 py-2 text-gray-500 text-xs">{w.createdByName}</td>
                            <td className="px-3 py-2 text-right">
                              <button
                                onClick={() => handleDeleteCashWithdrawal(w)}
                                className="text-red-500 hover:text-red-700"
                                title="Изтрий"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </div>
            )}
          </div>
        );
      })()}

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
                  Качи и анализирай
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
                  <p className="text-sm text-gray-500">Дебит</p>
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
                  <p className="text-sm text-gray-500">Кредит</p>
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
                  <p className="text-sm text-gray-500">Неразпределени</p>
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
                  Дебит (разходи)
                </button>
                <button
                  onClick={() => setFilterType('credit')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filterType === 'credit' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Кредит (приходи)
                </button>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterUnassigned}
                  onChange={(e) => setFilterUnassigned(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600">Само неразпределени</span>
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
                <div key={tx.id || index} className={`p-4 ${!tx.objectId && !tx.technicianId ? 'bg-red-50/30' : ''}`}>
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
                        {tx.operationType && (
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{tx.operationType}</span>
                        )}
                        {tx.reference && <span className="text-xs">Реф: {String(tx.reference).slice(0, 15)}...</span>}
                      </div>

                      {tx.purpose && (
                        <p className="text-sm text-gray-400 mt-1 truncate">
                          {tx.purpose}
                        </p>
                      )}

                      {/* Actions Row */}
                      <div className="mt-3 flex items-center gap-3 flex-wrap">
                        {/* Object Assignment */}
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <select
                            value={tx.objectId || 0}
                            onChange={(e) => handleObjectAssign(index, Number(e.target.value) || null)}
                            className={`text-sm border rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                              tx.objectId ? 'border-green-300 bg-green-50' : 'border-gray-200'
                            }`}
                          >
                            <option value={0}>-- Обект --</option>
                            {objects.map(obj => (
                              <option key={obj.id} value={obj.id}>{obj.name}</option>
                            ))}
                          </select>
                        </div>
                        
                        {/* User Assignment (for credit - income to user) */}
                        {tx.type === 'credit' && (
                          <div className="flex items-center gap-2">
                            <UserPlus className="w-4 h-4 text-blue-400" />
                            <select
                              value={tx.technicianId || 0}
                              onChange={(e) => handleAssignToUser(index, Number(e.target.value) || null)}
                              className={`text-sm border rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                tx.technicianId ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                              }`}
                            >
                              <option value={0}>-- Заприходи на --</option>
                              {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.role === 'director' ? 'Директор' : 'Техник'})</option>
                              ))}
                            </select>
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 ml-auto">
                          {/* Create Income (for credit transactions) */}
                          {tx.type === 'credit' && (
                            <button
                              onClick={() => handleCreateIncomeFromTx(tx)}
                              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1"
                              title="Създай приход за обект"
                            >
                              <PlusCircle className="w-4 h-4" />
                              Приход
                            </button>
                          )}
                          
                          {/* Create Expense (for debit transactions) */}
                          {tx.type === 'debit' && (
                            <button
                              onClick={() => handleCreateExpenseFromTx(tx)}
                              className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors flex items-center gap-1"
                              title="Създай разход за обект"
                            >
                              <MinusCircle className="w-4 h-4" />
                              Разход
                            </button>
                          )}
                          
                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteTransaction(tx)}
                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1"
                            title="Изтрий транзакция"
                          >
                            <Trash2 className="w-4 h-4" />
                            Изтрий
                          </button>
                        </div>
                      </div>
                      
                      {/* Status indicators */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {tx.objectName && (
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Обект: {tx.objectName}
                          </span>
                        )}
                        {tx.technicianName && (
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Заприходен: {tx.technicianName}
                          </span>
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
                    <span className="text-blue-700">Общо дебит:</span>
                    <span className="ml-2 font-medium text-red-600">
                      -{stats.totalDebit.toLocaleString('bg-BG', { minimumFractionDigits: 2 })} €
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Общо кредит:</span>
                    <span className="ml-2 font-medium text-green-600">
                      +{stats.totalCredit.toLocaleString('bg-BG', { minimumFractionDigits: 2 })} €
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Разпределени:</span>
                    <span className="ml-2 font-medium text-blue-900">
                      {transactions.filter(tx => tx.objectId || tx.technicianId).length} от {transactions.length}
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

      {/* Cash Withdrawal Modal */}
      {isCashModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-bold text-gray-900">Запиши изтеглен кеш</h3>
              </div>
              <button
                onClick={() => setIsCashModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дата *</label>
                <input
                  type="date"
                  value={cashForm.date}
                  onChange={e => setCashForm({ ...cashForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Сума (€) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={cashForm.amount}
                  onChange={e => setCashForm({ ...cashForm, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                <input
                  type="text"
                  value={cashForm.description}
                  onChange={e => setCashForm({ ...cashForm, description: e.target.value })}
                  placeholder="Напр. теглене от банкомат"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setIsCashModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Отказ
              </button>
              <button
                onClick={handleSaveCashWithdrawal}
                disabled={isSavingCash}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSavingCash ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Запиши
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
