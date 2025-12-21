import { useState, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api';
import { BankTransaction, Invoice } from '../../types';
import { 
  FileUp,
  FileText,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Link as LinkIcon,
  Calendar,
  Search,
  Building2
} from 'lucide-react';

export const BankStatementsPage = () => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState({
    count: 0,
    totalDebit: 0,
    totalCredit: 0,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDirector = user?.role === 'director';

  // Load invoices for matching
  const loadInvoices = async () => {
    const response = await apiService.getInvoices();
    if (response.success && response.data) {
      setInvoices(response.data);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
    } else {
      setError('Моля, изберете PDF файл');
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data:application/pdf;base64, prefix
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      // Load invoices for matching
      await loadInvoices();

      // Parse PDF
      const response = await apiService.parseBankStatement(base64);
      
      if (response.success && response.data) {
        setTransactions(response.data.transactions || []);
        setStats({
          count: response.data.count || 0,
          totalDebit: response.data.totalDebit || 0,
          totalCredit: response.data.totalCredit || 0,
        });
      } else {
        setError(response.error || 'Грешка при парсване на файла');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Грешка при обработка на файла');
    }

    setIsLoading(false);
  };

  // Try to match a bank transaction to an invoice
  const findMatchingInvoice = (bankTx: BankTransaction): Invoice | null => {
    // Match by amount (±0.01) and date (±3 days)
    const bankDate = new Date(bankTx.date);
    
    return invoices.find(inv => {
      const invDate = new Date(inv.date);
      const dateDiff = Math.abs(bankDate.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24);
      const amountMatch = Math.abs(inv.total - bankTx.amount) < 0.02;
      
      return amountMatch && dateDiff <= 3;
    }) || null;
  };

  const clearData = () => {
    setTransactions([]);
    setStats({ count: 0, totalDebit: 0, totalCredit: 0 });
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
        <p className="text-gray-500">Качете PDF от Asset Bank за анализ и съпоставяне</p>
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
              accept=".pdf"
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
                <p className="font-medium text-gray-900">Изберете PDF файл</p>
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
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
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
                  <p className="text-xl font-bold text-red-600">
                    -{stats.totalDebit.toLocaleString('bg-BG', { minimumFractionDigits: 2 })} лв
                  </p>
                  <p className="text-sm text-gray-500">Дебит (разходи)</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-green-600">
                    +{stats.totalCredit.toLocaleString('bg-BG', { minimumFractionDigits: 2 })} лв
                  </p>
                  <p className="text-sm text-gray-500">Кредит (приходи)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Банкови транзакции</h2>
            </div>
            
            <div className="divide-y divide-gray-100">
              {transactions.map((tx, index) => {
                const matchedInvoice = findMatchingInvoice(tx);
                
                return (
                  <div 
                    key={index}
                    className={`p-4 ${matchedInvoice ? 'bg-green-50' : ''}`}
                  >
                    <div className="flex items-center gap-4">
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
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 truncate">
                            {tx.description || 'Без описание'}
                          </span>
                          {matchedInvoice && (
                            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Съпоставена
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {tx.date}
                          </span>
                          <span>Реф: {tx.reference}</span>
                        </div>
                        {matchedInvoice && (
                          <div className="mt-2 text-sm text-green-700 flex items-center gap-2">
                            <LinkIcon className="w-4 h-4" />
                            Фактура #{matchedInvoice.invoiceNumber} от {matchedInvoice.supplier}
                            {matchedInvoice.objectName && (
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {matchedInvoice.objectName}
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
                        <p className="text-xs text-gray-400">
                          Салдо: {tx.balance.toLocaleString('bg-BG', { minimumFractionDigits: 2 })} лв
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-800">Обобщение</h3>
                <p className="text-sm text-yellow-700">
                  {transactions.filter(tx => findMatchingInvoice(tx)).length} от {transactions.length} транзакции са съпоставени с фактури.
                  {transactions.length - transactions.filter(tx => findMatchingInvoice(tx)).length > 0 && (
                    <> Имате {transactions.filter(tx => !findMatchingInvoice(tx) && tx.type === 'debit').length} плащания без фактура.</>
                  )}
                </p>
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
            Качете PDF файл от Asset Bank, за да анализирате банковите транзакции 
            и да ги съпоставите с въведените фактури.
          </p>
        </div>
      )}
    </div>
  );
};
