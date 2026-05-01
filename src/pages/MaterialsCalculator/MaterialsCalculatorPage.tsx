import { useEffect, useMemo, useState } from 'react';
import { Calculator, Plus, Trash2, AlertTriangle, Loader2, Package, RefreshCw } from 'lucide-react';
import { apiService } from '../../services/api';
import type { Invoice, InvoiceItem } from '../../types';

// ============================================================================
// Калкулатор за материали
// Source of truth: всички фактури → за всяка двойка (артикул, доставчик) се пази
// последната фактурирана цена + отстъпка (по дата на фактурата).
// ============================================================================

interface RequestRow {
  id: string;
  name: string;
  unit: string;
  quantity: number;
}

interface PriceRecord {
  unitPrice: number;     // Единична цена БЕЗ ДДС от фактурата
  discount: number;      // Отстъпка % от фактурата (0 ако липсва)
  unit: string;          // Мярка
  date: string;          // ISO дата на фактурата (за сравнение)
  invoiceId: number;
  invoiceNumber: string;
}

// Нормализиране на име на артикул за match
const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

// Ефективна цена за единица (след отстъпка), без ДДС
const effectivePrice = (rec: PriceRecord) =>
  rec.unitPrice * (1 - (rec.discount || 0) / 100);

const newRow = (): RequestRow => ({
  id: Math.random().toString(36).slice(2, 10),
  name: '',
  unit: 'бр',
  quantity: 1,
});

type Mode = 'single' | 'compare';

export const MaterialsCalculatorPage = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('single');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [rows, setRows] = useState<RequestRow[]>([newRow()]);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const res = await apiService.getInvoices();
      if (res.success && res.data) {
        setInvoices(res.data);
      }
    } catch (e) {
      console.error('Error loading invoices:', e);
    }
    setIsLoading(false);
  };

  // ===== Изграждане на индекс цени =====
  // priceIndex[itemKey][supplier] = последната PriceRecord
  // suppliers — всички уникални доставчици
  // itemSuggestions — всички уникални имена на артикули (за datalist)
  const { priceIndex, suppliers, itemSuggestions, itemUnitDefaults } = useMemo(() => {
    const idx: Record<string, Record<string, PriceRecord>> = {};
    const supplierSet = new Set<string>();
    const nameSet = new Set<string>();
    const unitDefaults: Record<string, string> = {};

    // Сортирай по дата ASC, за да може последната фактура (с по-късна дата) да презапише
    const sorted = [...invoices].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    for (const inv of sorted) {
      const supplier = (inv.supplier || '').trim();
      if (!supplier) continue;
      supplierSet.add(supplier);
      const items: InvoiceItem[] = Array.isArray(inv.items) ? inv.items : [];
      for (const it of items) {
        const name = (it.name || '').trim();
        if (!name || !it.unitPrice || it.unitPrice <= 0) continue;
        const key = normalize(name);
        nameSet.add(name);
        if (!unitDefaults[key]) unitDefaults[key] = it.unit || 'бр';
        if (!idx[key]) idx[key] = {};
        const rec: PriceRecord = {
          unitPrice: Number(it.unitPrice) || 0,
          discount: Number(it.discount) || 0,
          unit: it.unit || 'бр',
          date: inv.date || '',
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber || '',
        };
        // Последната по дата печели (sorted ASC → последната итерация е най-нова)
        idx[key][supplier] = rec;
      }
    }

    return {
      priceIndex: idx,
      suppliers: Array.from(supplierSet).sort((a, b) => a.localeCompare(b, 'bg')),
      itemSuggestions: Array.from(nameSet).sort((a, b) => a.localeCompare(b, 'bg')),
      itemUnitDefaults: unitDefaults,
    };
  }, [invoices]);

  // Auto-избор на първи доставчик ако няма избран
  useEffect(() => {
    if (!selectedSupplier && suppliers.length > 0) {
      setSelectedSupplier(suppliers[0]);
    }
  }, [suppliers, selectedSupplier]);

  // ===== Мутации редове =====
  const updateRow = (id: string, patch: Partial<RequestRow>) => {
    setRows(rs => rs.map(r => {
      if (r.id !== id) return r;
      const next = { ...r, ...patch };
      // Ако се сменя името и имаме default мярка → авто-попълни
      if (patch.name !== undefined) {
        const u = itemUnitDefaults[normalize(patch.name)];
        if (u) next.unit = u;
      }
      return next;
    }));
  };
  const addRow = () => setRows(rs => [...rs, newRow()]);
  const removeRow = (id: string) => setRows(rs => rs.length === 1 ? rs : rs.filter(r => r.id !== id));
  const clearAll = () => setRows([newRow()]);

  // ===== Изчисление за РЕЖИМ 1 (един доставчик) =====
  const singleResult = useMemo(() => {
    if (!selectedSupplier) return null;
    const lines = rows
      .filter(r => r.name.trim())
      .map(r => {
        const key = normalize(r.name);
        const rec = priceIndex[key]?.[selectedSupplier];
        if (!rec) {
          return {
            row: r,
            available: false as const,
            unitPrice: 0,
            discount: 0,
            effective: 0,
            lineTotal: 0,
            lastDate: '',
          };
        }
        const eff = effectivePrice(rec);
        return {
          row: r,
          available: true as const,
          unitPrice: rec.unitPrice,
          discount: rec.discount,
          effective: eff,
          lineTotal: eff * (Number(r.quantity) || 0),
          lastDate: rec.date,
          invoiceNumber: rec.invoiceNumber,
        };
      });
    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    const vat = subtotal * 0.20;
    const total = subtotal + vat;
    const missing = lines.filter(l => !l.available).length;
    return { lines, subtotal, vat, total, missing };
  }, [rows, priceIndex, selectedSupplier]);

  // ===== Изчисление за РЕЖИМ 2 (сравнение) =====
  const compareResult = useMemo(() => {
    const validRows = rows.filter(r => r.name.trim());
    // За всеки доставчик → общо за поръчката + брой налични артикула
    const perSupplier = suppliers.map(sup => {
      let subtotal = 0;
      let availableCount = 0;
      const lineMap: Record<string, number | null> = {};
      for (const r of validRows) {
        const key = normalize(r.name);
        const rec = priceIndex[key]?.[sup];
        if (rec) {
          const lineTotal = effectivePrice(rec) * (Number(r.quantity) || 0);
          subtotal += lineTotal;
          availableCount++;
          lineMap[r.id] = lineTotal;
        } else {
          lineMap[r.id] = null;
        }
      }
      return {
        supplier: sup,
        subtotal,
        vat: subtotal * 0.20,
        total: subtotal * 1.20,
        availableCount,
        totalCount: validRows.length,
        lineMap,
      };
    });
    // Сортирай: пълни поръчки първо (по обща цена ASC), после непълни
    perSupplier.sort((a, b) => {
      const aFull = a.availableCount === a.totalCount ? 1 : 0;
      const bFull = b.availableCount === b.totalCount ? 1 : 0;
      if (aFull !== bFull) return bFull - aFull;
      return a.subtotal - b.subtotal;
    });
    return { validRows, perSupplier };
  }, [rows, priceIndex, suppliers]);

  // ===== UI =====
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calculator className="w-7 h-7 text-primary-600" />
            Калкулатор за материали
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Бърза оценка на стойност на поръчка по последните фактурни цени
          </p>
        </div>
        <button
          onClick={loadInvoices}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Обнови данни
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-xl border border-gray-200">
          <p className="text-xs text-gray-500">Фактури в базата</p>
          <p className="text-lg font-bold text-gray-900">{invoices.length}</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-200">
          <p className="text-xs text-gray-500">Уникални артикули</p>
          <p className="text-lg font-bold text-gray-900">{itemSuggestions.length}</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-200">
          <p className="text-xs text-gray-500">Доставчици</p>
          <p className="text-lg font-bold text-gray-900">{suppliers.length}</p>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setMode('single')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            mode === 'single'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Изчисление по доставчик
        </button>
        <button
          onClick={() => setMode('compare')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            mode === 'compare'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Сравнение между доставчици
        </button>
      </div>

      {/* Materials list — общо за двата режима */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-600" />
            Списък материали
          </h2>
          <div className="flex gap-2">
            <button
              onClick={clearAll}
              className="text-sm text-gray-500 hover:text-red-600"
            >
              Изчисти
            </button>
            <button
              onClick={addRow}
              className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
            >
              <Plus className="w-4 h-4" />
              Добави
            </button>
          </div>
        </div>

        <datalist id="calc-item-suggestions">
          {itemSuggestions.map(n => <option key={n} value={n} />)}
        </datalist>

        <div className="space-y-2">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
            <div className="col-span-7">Наименование</div>
            <div className="col-span-2">Мярка</div>
            <div className="col-span-2">Количество</div>
            <div className="col-span-1"></div>
          </div>

          {rows.map(row => (
            <div key={row.id} className="grid grid-cols-12 gap-2 items-center">
              <input
                type="text"
                value={row.name}
                onChange={e => updateRow(row.id, { name: e.target.value })}
                className="col-span-12 sm:col-span-7 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white"
                placeholder="напр. Лепило за плочки"
                list="calc-item-suggestions"
                autoComplete="off"
              />
              <input
                type="text"
                value={row.unit}
                onChange={e => updateRow(row.id, { unit: e.target.value })}
                className="col-span-5 sm:col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white"
                placeholder="бр"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={row.quantity || ''}
                onChange={e => updateRow(row.id, { quantity: Number(e.target.value) || 0 })}
                className="col-span-5 sm:col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white"
                placeholder="0"
              />
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                disabled={rows.length === 1}
                className="col-span-2 sm:col-span-1 p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-10 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Зареждане на фактурни данни...
        </div>
      )}

      {/* Empty state */}
      {!isLoading && suppliers.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>
            Няма налични фактури в базата. Въведете поне една фактура с артикули,
            за да може калкулаторът да предложи цени.
          </div>
        </div>
      )}

      {/* ===== РЕЖИМ 1: По избран доставчик ===== */}
      {!isLoading && mode === 'single' && suppliers.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm font-medium text-gray-700">Доставчик:</label>
            <select
              value={selectedSupplier}
              onChange={e => setSelectedSupplier(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white min-w-[200px]"
            >
              {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {singleResult && singleResult.lines.length === 0 && (
            <p className="text-sm text-gray-500">Добавете артикули в списъка отгоре.</p>
          )}

          {singleResult && singleResult.lines.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                      <th className="pb-2">Артикул</th>
                      <th className="pb-2 text-right">К-во</th>
                      <th className="pb-2 text-right">Ед. цена</th>
                      <th className="pb-2 text-right">Отст. %</th>
                      <th className="pb-2 text-right">Ефективна</th>
                      <th className="pb-2 text-right">Сума</th>
                      <th className="pb-2 text-xs text-gray-400">Източник</th>
                    </tr>
                  </thead>
                  <tbody>
                    {singleResult.lines.map((l, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-2 text-gray-900">
                          {l.row.name}
                          <span className="text-gray-400 ml-1">({l.row.unit})</span>
                        </td>
                        <td className="py-2 text-right">{l.row.quantity}</td>
                        {l.available ? (
                          <>
                            <td className="py-2 text-right text-gray-700">{l.unitPrice.toFixed(2)} €</td>
                            <td className="py-2 text-right text-gray-500">{l.discount ? `${l.discount}%` : '–'}</td>
                            <td className="py-2 text-right text-gray-700">{l.effective.toFixed(2)} €</td>
                            <td className="py-2 text-right font-semibold text-gray-900">{l.lineTotal.toFixed(2)} €</td>
                            <td className="py-2 text-xs text-gray-400">
                              {l.lastDate?.slice(0, 10)} • {l.invoiceNumber}
                            </td>
                          </>
                        ) : (
                          <td colSpan={5} className="py-2 text-xs text-yellow-700 bg-yellow-50 rounded px-2">
                            <AlertTriangle className="w-3 h-3 inline mr-1" />
                            Няма история на цена за този артикул при избрания доставчик
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="pt-3 border-t border-gray-200 space-y-1">
                <div className="flex justify-end items-center gap-4">
                  <span className="text-sm text-gray-500">Сума без ДДС:</span>
                  <span className="text-base font-semibold w-32 text-right">{singleResult.subtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-end items-center gap-4">
                  <span className="text-sm text-gray-500">ДДС (20%):</span>
                  <span className="text-base font-semibold w-32 text-right">{singleResult.vat.toFixed(2)} €</span>
                </div>
                <div className="flex justify-end items-center gap-4 pt-2 border-t border-gray-300">
                  <span className="text-sm font-medium text-gray-700">Общо с ДДС:</span>
                  <span className="text-xl font-bold text-primary-600 w-32 text-right">{singleResult.total.toFixed(2)} €</span>
                </div>
                {singleResult.missing > 0 && (
                  <p className="text-xs text-yellow-700 text-right pt-1">
                    ⚠ {singleResult.missing} артикул(а) без история — не са включени в сумата
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== РЕЖИМ 2: Сравнение ===== */}
      {!isLoading && mode === 'compare' && suppliers.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-4">
          {compareResult.validRows.length === 0 && (
            <p className="text-sm text-gray-500">Добавете артикули в списъка отгоре.</p>
          )}

          {compareResult.validRows.length > 0 && (
            <>
              <h3 className="font-semibold text-gray-900">Цена на поръчката при всеки доставчик</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                      <th className="pb-2">Доставчик</th>
                      <th className="pb-2 text-right">Налични артикули</th>
                      <th className="pb-2 text-right">Сума без ДДС</th>
                      <th className="pb-2 text-right">ДДС (20%)</th>
                      <th className="pb-2 text-right">Общо с ДДС</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compareResult.perSupplier.map((s, i) => {
                      const isFull = s.availableCount === s.totalCount;
                      const isCheapestFull = isFull && i === 0;
                      return (
                        <tr
                          key={s.supplier}
                          className={`border-b border-gray-100 ${isCheapestFull ? 'bg-green-50' : ''}`}
                        >
                          <td className="py-2 font-medium text-gray-900">
                            {s.supplier}
                            {isCheapestFull && (
                              <span className="ml-2 text-xs px-2 py-0.5 bg-green-600 text-white rounded-full">
                                най-евтино
                              </span>
                            )}
                          </td>
                          <td className={`py-2 text-right ${isFull ? 'text-gray-700' : 'text-yellow-700 font-medium'}`}>
                            {s.availableCount} / {s.totalCount}
                            {!isFull && ' ⚠'}
                          </td>
                          <td className="py-2 text-right text-gray-700">{s.subtotal.toFixed(2)} €</td>
                          <td className="py-2 text-right text-gray-500">{s.vat.toFixed(2)} €</td>
                          <td className={`py-2 text-right font-semibold ${isCheapestFull ? 'text-green-700' : 'text-gray-900'}`}>
                            {s.total.toFixed(2)} €
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Detailed breakdown — line by supplier matrix */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Детайл по артикули</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                        <th className="pb-2">Артикул</th>
                        {compareResult.perSupplier.map(s => (
                          <th key={s.supplier} className="pb-2 text-right whitespace-nowrap px-2">
                            {s.supplier}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {compareResult.validRows.map(r => {
                        // Find min total for this row (only suppliers that have it)
                        const totals = compareResult.perSupplier.map(s => s.lineMap[r.id]);
                        const valid = totals.filter((v): v is number => v !== null);
                        const min = valid.length > 0 ? Math.min(...valid) : null;
                        return (
                          <tr key={r.id} className="border-b border-gray-100">
                            <td className="py-2 text-gray-900">
                              {r.name}
                              <span className="text-gray-400 ml-1">({r.quantity} {r.unit})</span>
                            </td>
                            {compareResult.perSupplier.map(s => {
                              const v = s.lineMap[r.id];
                              if (v === null) {
                                return <td key={s.supplier} className="py-2 text-right text-gray-300 px-2">–</td>;
                              }
                              const isMin = min !== null && v === min;
                              return (
                                <td
                                  key={s.supplier}
                                  className={`py-2 text-right px-2 ${isMin ? 'font-bold text-green-700 bg-green-50' : 'text-gray-700'}`}
                                >
                                  {v.toFixed(2)} €
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  💡 Зеленото маркира най-евтиния доставчик за всеки ред. „–" = няма история на този артикул при този доставчик.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
