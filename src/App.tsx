import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { ObjectsPage, ObjectDetailPage } from './pages/Objects';
import { InvoicesPage } from './pages/Invoices';
import { IncomesPage } from './pages/Incomes';
import { InventoryPage } from './pages/Inventory';
import { TransactionsPage } from './pages/Transactions';
import { BankStatementsPage } from './pages/BankStatements';
import { MaterialsCalculatorPage } from './pages/MaterialsCalculator';
import { MainLayout } from './components/Layout';
import { ProtectedRoute } from './components/Auth';

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/objects" element={<ObjectsPage />} />
          <Route path="/objects/:id" element={<ObjectDetailPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/incomes" element={<IncomesPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/bank-statements" element={<BankStatementsPage />} />
          <Route path="/materials-calculator" element={<MaterialsCalculatorPage />} />
        </Route>

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
