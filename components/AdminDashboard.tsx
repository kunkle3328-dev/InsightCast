import React, { useState } from 'react';
import { useUserManagement } from '../hooks/useUserManagement';
import { ChartBarIcon, UsersIcon, ServerIcon, LogoIcon, LogOutIcon, CreditCardIcon, EditIcon } from './icons';
import { User } from '../types';

type Tab = 'overview' | 'users' | 'system';

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string; }> = ({ icon, title, value }) => (
  <div className="bg-black/20 p-6 rounded-lg border border-cyan-500/20">
    <div className="flex items-center space-x-4">
      <div className="bg-cyan-500/10 p-3 rounded-full">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  </div>
);

const UserManagement: React.FC = () => {
    const { users, loading, updateUserCredits } = useUserManagement();
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [creditsToAdd, setCreditsToAdd] = useState(0);

    const handleSaveCredits = () => {
        if (editingUser) {
            const newTotal = editingUser.credits + creditsToAdd;
            updateUserCredits(editingUser.id, newTotal < 0 ? 0 : newTotal);
            setEditingUser(null);
            setCreditsToAdd(0);
        }
    };
    
    if (loading) return <div>Loading users...</div>

    return (
        <div className="bg-black/20 border border-cyan-500/20 rounded-lg overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-black/30">
                    <tr>
                        <th className="p-4 font-semibold">User Email</th>
                        <th className="p-4 font-semibold">Name</th>
                        <th className="p-4 font-semibold">Credits</th>
                        <th className="p-4 font-semibold text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id} className="border-t border-cyan-500/10 hover:bg-cyan-500/5">
                            <td className="p-4 text-gray-300">{user.email}</td>
                            <td className="p-4 text-gray-400">{user.name}</td>
                            <td className="p-4 font-mono font-bold text-white">{user.credits.toLocaleString()}</td>
                            <td className="p-4 text-right">
                                <button onClick={() => setEditingUser(user)} className="p-2 text-cyan-400 hover:bg-cyan-500/20 rounded-md">
                                    <EditIcon className="w-5 h-5"/>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg" onClick={() => setEditingUser(null)}>
                    <div className="bg-black/40 border border-indigo-500/50 rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-indigo-300">Edit Credits for {editingUser.name}</h3>
                        <p className="text-sm text-gray-400">Current Balance: {editingUser.credits}</p>
                        <div className="mt-4">
                            <label htmlFor="credits-to-add" className="block text-sm font-medium text-indigo-200 mb-1">Add/Remove Credits</label>
                            <input
                                type="number"
                                id="credits-to-add"
                                value={creditsToAdd}
                                onChange={(e) => setCreditsToAdd(parseInt(e.target.value, 10))}
                                placeholder="e.g., 500 or -50"
                                className="w-full bg-black/30 border border-indigo-500/30 rounded-md p-2 text-white"
                            />
                        </div>
                        <div className="mt-6 flex justify-end space-x-2">
                            <button onClick={() => setEditingUser(null)} className="px-4 py-2 text-sm font-semibold text-gray-300 bg-gray-500/20 rounded-md hover:bg-gray-500/40">Cancel</button>
                            <button onClick={handleSaveCredits} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

const AdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const { users } = useUserManagement();
    
    const totalCredits = users.reduce((acc, user) => acc + user.credits, 0);

    return (
        <div className="p-8 text-white min-h-screen futuristic-bg">
            <header className="flex justify-between items-center mb-8">
                <div className="flex items-center space-x-3">
                    <LogoIcon className="w-8 h-8 text-cyan-400" />
                    <h1 className="text-3xl font-bold text-shadow-cyan">Admin Dashboard</h1>
                </div>
                 <button onClick={onLogout} className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-gray-300 bg-gray-500/20 rounded-md hover:bg-red-500/20 hover:text-red-300 transition">
                    <LogOutIcon className="w-5 h-5"/>
                    <span>Logout</span>
                </button>
            </header>
            
            <nav className="flex space-x-2 border-b border-cyan-500/20 mb-8">
                <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 font-semibold ${activeTab === 'overview' ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-gray-400'}`}>Overview</button>
                <button onClick={() => setActiveTab('users')} className={`px-4 py-2 font-semibold ${activeTab === 'users' ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-gray-400'}`}>User Management</button>
                <button onClick={() => setActiveTab('system')} className={`px-4 py-2 font-semibold ${activeTab === 'system' ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-gray-400'}`}>System Status</button>
            </nav>

            <div className="">
                {activeTab === 'overview' && (
                    <section className="grid md:grid-cols-3 gap-8">
                        <StatCard icon={<ChartBarIcon className="w-6 h-6 text-cyan-400" />} title="Podcasts Generated" value="1,428" />
                        <StatCard icon={<UsersIcon className="w-6 h-6 text-cyan-400" />} title="Total Users" value={users.length.toString()} />
                        <StatCard icon={<CreditCardIcon className="w-6 h-6 text-cyan-400" />} title="Total Credits in System" value={totalCredits.toLocaleString()} />
                        <StatCard icon={<ServerIcon className="w-6 h-6 text-cyan-400" />} title="API Calls (24h)" value="78,593" />
                        <StatCard icon={<UsersIcon className="w-6 h-6 text-cyan-400" />} title="Active Users (24h)" value="105" />
                        <StatCard icon={<CreditCardIcon className="w-6 h-6 text-cyan-400" />} title="Revenue (Month)" value="$1,250" />
                    </section>
                )}
                 {activeTab === 'users' && (
                    <section>
                         <h2 className="text-2xl font-bold mb-4 text-shadow-cyan">Manage Users & Credits</h2>
                         <UserManagement />
                    </section>
                )}
                 {activeTab === 'system' && (
                    <section>
                         <h2 className="text-2xl font-bold mb-4 text-shadow-cyan">System Health</h2>
                         <div className="bg-black/20 border border-cyan-500/20 rounded-lg p-6 max-w-md">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-300">Gemini API Status</span>
                                <span className="flex items-center space-x-2 text-green-400">
                                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                                    <span>Operational</span>
                                </span>
                            </div>
                         </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;