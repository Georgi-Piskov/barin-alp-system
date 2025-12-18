import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Building2, Lock, User, Loader2, AlertCircle } from 'lucide-react';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const navigate = useNavigate();
  
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    const success = await login(username, pin);
    if (success) {
      navigate('/dashboard');
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-4">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">БАРИН АЛП</h1>
          <p className="text-primary-200">Система за управление</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            Вход в системата
          </h2>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-danger-50 border border-danger-100 rounded-lg flex items-center gap-2 text-danger-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div>
              <label 
                htmlFor="username" 
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Потребителско име
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl 
                           focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
                           transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Въведете потребител"
                  required
                  autoComplete="username"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* PIN Field */}
            <div>
              <label 
                htmlFor="pin" 
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                ПИН код
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pin}
                  onChange={handlePinChange}
                  className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl 
                           focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
                           transition-all duration-200 bg-gray-50 focus:bg-white
                           tracking-[0.5em] text-center font-mono text-lg"
                  placeholder="••••"
                  required
                  maxLength={4}
                  autoComplete="current-password"
                  disabled={isLoading}
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                Въведете 4-цифрен ПИН код
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !username || pin.length !== 4}
              className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 
                       text-white font-semibold rounded-xl shadow-lg 
                       shadow-primary-500/30 hover:shadow-primary-500/40
                       transition-all duration-200 
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Влизане...</span>
                </>
              ) : (
                <span>Вход</span>
              )}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              Демо: director1 / 7087 или tech1 / 1234
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-primary-300 text-sm mt-6">
          © 2024 БАРИН АЛП. Всички права запазени.
        </p>
      </div>
    </div>
  );
};
