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
            <LogoIcon className="w-16 h-16 text-cyan-400 mx-auto" />
            <h1 className="text-3xl font-bold text-shadow-cyan mt-4">Admin Access</h1>
        </div>
        <form 
            onSubmit={handleSubmit}
            className="bg-black/20 border border-cyan-500/20 rounded-lg shadow-2xl shadow-cyan-500/10 p-8 space-y-6"
        >
            <div>
                <label className="block text-sm font-medium text-cyan-300 mb-2" htmlFor="username">
                    Username
                </label>
                <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    readOnly
                    className="w-full bg-black/30 border border-cyan-500/30 rounded-md p-3 text-gray-400 cursor-not-allowed"
                />
            </div>
            <div>
                 <label className="block text-sm font-medium text-cyan-300 mb-2" htmlFor="password">
                    Password
                </label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                    className="w-full bg-black/30 border border-cyan-500/30 rounded-md p-3 text-white focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}
            
            <button 
                type="submit"
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-cyan-600 font-semibold rounded-md shadow-lg hover:bg-cyan-500 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-[0_0_20px_theme(colors.cyan.500)]"
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
