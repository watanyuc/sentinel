import { useState, type FormEvent } from 'react';
import { Shield } from 'lucide-react';
import { login } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

export const LoginPage = () => {
  const [email, setEmail] = useState('admin@sentinel.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await login(email, password);
      setAuth(token, user);
    } catch {
      setError('Invalid credentials. Try admin@sentinel.com / password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-accent-blue rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wider">SENTINEL</h1>
          <p className="text-sm text-gray-400 mt-1">MT5 Trading Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-bg-primary border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent-blue transition-colors"
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-bg-primary border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent-blue transition-colors"
              required
            />
          </div>

          {error && (
            <p className="text-xs text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-center text-xs text-gray-600">
            Mock credentials pre-filled above
          </p>
        </form>
      </div>
    </div>
  );
};
