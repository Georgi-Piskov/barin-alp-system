import { FileText, Plus } from 'lucide-react';

export const InvoicesPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Фактури</h1>
          <p className="text-gray-500">Управление на фактури и разходи</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors">
          <Plus className="w-5 h-5" />
          <span>Нова фактура</span>
        </button>
      </div>

      <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Страницата се разработва
        </h3>
        <p className="text-gray-500">
          Тук ще се показват всички фактури и разходни документи
        </p>
      </div>
    </div>
  );
};
