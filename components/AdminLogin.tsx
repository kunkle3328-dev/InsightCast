import React, { useState } from 'react';
import { LogoIcon, ShieldCheckIcon } from './icons';

interface AdminLoginProps {
  onLogin: (password: string) => boolean;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onLogin(password);
    if (!success) {
      setError('Invalid credentials. Please try again.');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center futuristic-bg p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <LogoIcon className="w-16 h-16 text-[var(--text-accent-primary)] mx-auto" />
            <h1 className="text-3xl font-bold text-shadow-primary mt-4">Admin Access</h1>
        </div>
        <form 
            onSubmit={handleSubmit}
            className="bg-[var(--bg-surface-glass)] border border-[var(--border-primary)] rounded-lg shadow-2xl shadow-cyan-500/10 p-8 space-y-6"
        >
            <div>
                <label className="block text-sm font-medium text-[var(--text-accent-primary)] mb-2" htmlFor="username">
                    Username
                </label>
                <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    readOnly
                    className="w-full bg-[var(--bg-surface-2)] border border-[var(--border-secondary)] rounded-md p-3 text-gray-400 cursor-not-allowed"
                />
            </div>
            <div>
                 <label className="block text-sm font-medium text-[var(--text-accent-primary)] mb-2" htmlFor="password">
                    Password
                </label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                    className="w-full bg-[var(--bg-surface-2)] border border-[var(--border-secondary)] rounded-md p-3 text-white focus:ring-2 focus:ring-[var(--border-accent)] focus:border-[var(--border-accent)]"
                />
            </div>

            {error && <p className="text-[var(--text-danger)] text-sm">{error}</p>}
            
            <button 
                type="submit"
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-[var(--bg-accent-primary)] text-white font-semibold rounded-md shadow-lg hover:bg-[var(--bg-accent-primary-hover)] transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-[0_0_20px_var(--shadow-color-accent)]"
            >
                <ShieldCheckIcon className="w-5 h-5" />
                <span>Login</span>
            </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;