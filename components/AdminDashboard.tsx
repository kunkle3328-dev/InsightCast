import React, { useState } from 'react';
import { useUserManagement } from '../hooks/useUserManagement';
import { ChartBarIcon, UsersIcon, ServerIcon, AetherWaveLogo, LogOutIcon, CreditCardIcon, EditIcon, CheckCircleIcon, MenuIcon, LoadingSpinnerIcon } from './icons';
import { User } from '../types';

type View = 'overview' | 'users' | 'settings';

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string; }> = ({ icon, title, value }) => (
  <div className="bg-[var(--bg-surface-1)] p-6 rounded-lg border border-[var(--border-primary)] backdrop-blur-sm transition-all duration-300 hover:border-[var(--border-accent)]/50 hover:shadow-[0_0_25px_var(--shadow-glow)] hover:-translate-y-1">
    <div className="flex items-center space-x-4">
      <div className="bg-[var(--bg-accent-primary)]/10 p-3 rounded-full border border-[var(--border-primary)]">
        {icon}
      </div>
      <div>
        <p className="text-sm text-[var(--text-secondary)]">{title}</p>
        <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
      </div>
    </div>
  </div>
);

const UserManagementTab: React.FC = () => {
    const { users, loading, updateUserCredits, updateUserTier } = useUserManagement();
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [creditsToAdd, setCreditsToAdd] = useState(0);
    const [selectedTier, setSelectedTier] = useState<User['tier']>('Free');
    const [isSavingUser, setIsSavingUser] = useState(false);
    
    const handleEditClick = (user: User) => {
        setEditingUser(user);
        setCreditsToAdd(0);
        setSelectedTier(user.tier);
    }

    const handleSaveChanges = () => {
        if (editingUser) {
            setIsSavingUser(true);
            // Simulate async operation
            setTimeout(() => {
                const newTotal = editingUser.credits + creditsToAdd;
                updateUserCredits(editingUser.id, newTotal < 0 ? 0 : newTotal);
                updateUserTier(editingUser.id, selectedTier);
                setIsSavingUser(false);
                setEditingUser(null);
            }, 1000);
        }
    };
    
    const tierColorMap: { [key in User['tier']]: string } = {
        Free: 'bg-gray-500/20 text-gray-300',
        Creator: 'bg-sky-500/20 text-sky-300',
        Pro: 'bg-violet-500/20 text-violet-300',
    };

    if (loading) return <div className="flex justify-center items-center p-8"><LoadingSpinnerIcon className="w-8 h-8"/></div>

    return (
        <div className="bg-[var(--bg-surface-1)] border border-[var(--border-primary)] rounded-lg overflow-x-auto backdrop-blur-sm">
            <table className="w-full text-left min-w-[600px]">
                <thead className="bg-[var(--bg-surface-2)]">
                    <tr>
                        <th className="p-4 font-semibold">User Email</th>
                        <th className="p-4 font-semibold">Name</th>
                        <th className="p-4 font-semibold">Tier</th>
                        <th className="p-4 font-semibold">Credits</th>
                        <th className="p-4 font-semibold text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id} className="border-t border-[var(--border-primary)]/50 hover:bg-[var(--bg-accent-primary)]/5">
                            <td className="p-4 text-[var(--text-primary)]">{user.email}</td>
                            <td className="p-4 text-[var(--text-secondary)]">{user.name}</td>
                            <td className="p-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${tierColorMap[user.tier]}`}>{user.tier}</span></td>
                            <td className="p-4 font-mono font-bold text-[var(--text-primary)]">{user.credits.toLocaleString()}</td>
                            <td className="p-4 text-right">
                                <button onClick={() => handleEditClick(user)} className="p-2 text-[var(--text-accent-primary)] hover:bg-[var(--bg-accent-primary)]/20 rounded-md">
                                    <EditIcon className="w-5 h-5"/>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg" onClick={() => setEditingUser(null)}>
                    <div className="bg-[var(--bg-surface-glass)] border border-[var(--text-accent-secondary)]/50 rounded-lg p-6 w-full max-w-md shadow-2xl shadow-[var(--shadow-color-secondary)]/20" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[var(--text-accent-secondary)]">Edit User: {editingUser.name}</h3>
                        <p className="text-sm text-[var(--text-secondary)] mb-4">{editingUser.email}</p>
                        
                        <div className="space-y-4">
                             <div>
                                <label htmlFor="user-tier" className="block text-sm font-medium text-[var(--text-accent-secondary)] mb-1">User Tier</label>
                                <select id="user-tier" value={selectedTier} onChange={(e) => setSelectedTier(e.target.value as User['tier'])} className="w-full bg-[var(--bg-surface-2)] border border-[var(--text-accent-secondary)]/30 rounded-md p-2 text-white focus:ring-2 focus:ring-[var(--border-accent)]">
                                    <option value="Free">Free</option>
                                    <option value="Creator">Creator</option>
                                    <option value="Pro">Pro</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="credits-to-add" className="block text-sm font-medium text-[var(--text-accent-secondary)] mb-1">Add/Remove Credits (Current: {editingUser.credits})</label>
                                <input
                                    type="number"
                                    id="credits-to-add"
                                    value={creditsToAdd}
                                    onChange={(e) => setCreditsToAdd(parseInt(e.target.value, 10) || 0)}
                                    placeholder="e.g., 500 or -50"
                                    className="w-full bg-[var(--bg-surface-2)] border border-[var(--text-accent-secondary)]/30 rounded-md p-2 text-white focus:ring-2 focus:ring-[var(--border-accent)]"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end space-x-2">
                            <button onClick={() => setEditingUser(null)} className="px-4 py-2 text-sm font-semibold text-gray-300 bg-gray-500/20 rounded-md hover:bg-gray-500/40">Cancel</button>
                            <button onClick={handleSaveChanges} disabled={isSavingUser} className="flex items-center justify-center w-32 px-4 py-2 text-sm font-semibold text-white bg-[var(--bg-accent-secondary)] hover:bg-[var(--bg-accent-secondary)]/80 rounded-md shadow-lg shadow-[var(--shadow-color-secondary)]/50 disabled:opacity-50 disabled:cursor-wait">
                                {isSavingUser ? <LoadingSpinnerIcon className="w-5 h-5"/> : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// FIX: Made the 'label' prop optional as it is not used in the component.
const ToggleSwitch: React.FC<{ label?: string; enabled: boolean; onToggle: () => void; }> = ({ enabled, onToggle }) => (
    <div
      onClick={onToggle}
      className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${enabled ? 'bg-[var(--bg-accent-primary)]' : 'bg-[var(--bg-surface-2)]'}`}
    >
      <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${enabled ? 'translate-x-6' : ''}`} />
    </div>
);


const SystemSettingsTab: React.FC = () => {
    const [settings, setSettings] = useState({
        premiumVoices: true,
        userSignups: true,
        maintenanceMode: false,
    });
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const handleToggle = (key: keyof typeof settings) => {
        setSettings(prev => ({...prev, [key]: !prev[key]}));
        setIsSaved(false);
    }
    
    const handleSave = () => {
        setIsSavingSettings(true);
        // In a real app, this would be an API call
        console.log("Saving settings:", settings);
        setTimeout(() => {
            setIsSavingSettings(false);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        }, 1500);
    }

    return (
        <div className="space-y-6">
            <div className="p-6 bg-[var(--bg-surface-1)] border border-[var(--border-primary)] rounded-lg backdrop-blur-sm">
                <h3 className="text-xl font-bold text-shadow-primary mb-4">Feature Flags</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-[var(--bg-surface-2)]/50 rounded-md">
                        <div>
                            <p className="font-semibold text-[var(--text-primary)]">Enable Premium Voices</p>
                            <p className="text-sm text-[var(--text-secondary)]">Allow users to select and use high-cost premium voices.</p>
                        </div>
                        <ToggleSwitch enabled={settings.premiumVoices} onToggle={() => handleToggle('premiumVoices')} />
                    </div>
                     <div className="flex justify-between items-center p-4 bg-[var(--bg-surface-2)]/50 rounded-md">
                        <div>
                            <p className="font-semibold text-[var(--text-primary)]">Enable New User Signups</p>
                            <p className="text-sm text-[var(--text-secondary)]">Allow new users to create accounts (currently disabled).</p>
                        </div>
                        <ToggleSwitch enabled={settings.userSignups} onToggle={() => handleToggle('userSignups')} />
                    </div>
                </div>
            </div>
             <div className="p-6 bg-[var(--bg-danger)]/10 border border-[var(--border-danger)] rounded-lg backdrop-blur-sm">
                <h3 className="text-xl font-bold text-[var(--text-danger)] mb-4">Maintenance Mode</h3>
                <div className="flex justify-between items-center p-4 bg-black/20 rounded-md">
                    <div>
                        <p className="font-semibold text-[var(--text-primary)]">Activate Maintenance Mode</p>
                        <p className="text-sm text-[var(--text-secondary)]">Disables access to the main app for non-admin users.</p>
                    </div>
                    <ToggleSwitch enabled={settings.maintenanceMode} onToggle={() => handleToggle('maintenanceMode')} />
                </div>
            </div>
            <div className="flex justify-end">
                <button 
                    onClick={handleSave}
                    disabled={isSavingSettings || isSaved}
                    className="flex items-center justify-center space-x-2 w-40 px-5 py-2 text-sm font-semibold text-white bg-[var(--bg-accent-primary)] rounded-md hover:bg-[var(--bg-accent-primary-hover)] transition shadow-[0_0_15px_var(--shadow-color-accent)] disabled:opacity-50 disabled:cursor-wait"
                >
                    {isSavingSettings ? <LoadingSpinnerIcon className="w-5 h-5"/> : isSaved ? <CheckCircleIcon className="w-5 h-5"/> : <ServerIcon className="w-5 h-5"/>}
                    <span>{isSavingSettings ? 'Saving...' : isSaved ? 'Settings Saved!' : 'Save Settings'}</span>
                </button>
            </div>
        </div>
    )
}

interface AdminSidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeView, setActiveView, onLogout, isOpen, onClose }) => {
  const NavItem: React.FC<{ view: View; label: string; icon: React.ReactNode }> = ({ view, label, icon }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`flex items-center space-x-3 w-full p-3 rounded-md text-left transition-colors ${
        activeView === view
          ? 'bg-[var(--bg-accent-primary)]/20 text-[var(--text-accent-primary)]'
          : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
      }`}
    >
      {icon}
      <span className="font-semibold">{label}</span>
    </button>
  );

  return (
    <>
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-[var(--bg-surface-glass)] border-r border-[var(--border-primary)] p-4 flex flex-col justify-between backdrop-blur-lg transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          <div className="flex items-center space-x-3 p-3 mb-6">
            <AetherWaveLogo className="w-8 h-8" />
            <h1 className="text-xl font-bold text-shadow-primary">Admin Panel</h1>
          </div>
          <nav className="space-y-2">
            <NavItem view="overview" label="Overview" icon={<ChartBarIcon className="w-5 h-5" />} />
            <NavItem view="users" label="Users" icon={<UsersIcon className="w-5 h-5" />} />
            <NavItem view="settings" label="Settings" icon={<ServerIcon className="w-5 h-5" />} />
          </nav>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center space-x-3 w-full p-3 rounded-md text-left text-[var(--text-secondary)] hover:bg-[var(--bg-danger)]/20 hover:text-[var(--text-danger)] transition"
        >
          <LogOutIcon className="w-5 h-5" />
          <span className="font-semibold">Logout</span>
        </button>
      </aside>
      {isOpen && <div onClick={onClose} className="fixed inset-0 z-20 bg-black/60 md:hidden" />}
    </>
  );
};


const AdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const [activeView, setActiveView] = useState<View>('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { users } = useUserManagement();
    
    const totalCredits = users.reduce((acc, user) => acc + user.credits, 0);
    const viewTitles: Record<View, string> = {
        overview: 'Dashboard Overview',
        users: 'User Management',
        settings: 'System Settings',
    };

    return (
        <div className="flex min-h-screen futuristic-bg text-[var(--text-primary)]">
            <AdminSidebar 
                activeView={activeView} 
                setActiveView={setActiveView} 
                onLogout={onLogout}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-shadow-primary">{viewTitles[activeView]}</h1>
                    <button 
                        onClick={() => setIsSidebarOpen(true)} 
                        className="md:hidden p-2 -mr-2 text-[var(--text-accent-primary)] hover:bg-[var(--bg-accent-primary)]/20 rounded-md"
                        aria-label="Open menu"
                    >
                        <MenuIcon className="w-6 h-6" />
                    </button>
                </div>
                
                {activeView === 'overview' && (
                    <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <StatCard icon={<ChartBarIcon className="w-6 h-6 text-[var(--text-accent-primary)]" />} title="Podcasts Generated" value="1,428" />
                        <StatCard icon={<UsersIcon className="w-6 h-6 text-[var(--text-accent-primary)]" />} title="Total Users" value={users.length.toString()} />
                        <StatCard icon={<CreditCardIcon className="w-6 h-6 text-[var(--text-accent-primary)]" />} title="Total Credits in System" value={totalCredits.toLocaleString()} />
                        <StatCard icon={<ServerIcon className="w-6 h-6 text-[var(--text-accent-primary)]" />} title="API Calls (24h)" value="78,593" />
                        <StatCard icon={<UsersIcon className="w-6 h-6 text-[var(--text-accent-primary)]" />} title="Active Users (24h)" value="105" />
                        <StatCard icon={<CreditCardIcon className="w-6 h-6 text-[var(--text-accent-primary)]" />} title="Revenue (Month)" value="$1,250" />
                    </section>
                )}
                 {activeView === 'users' && <UserManagementTab />}
                 {activeView === 'settings' && <SystemSettingsTab />}
            </main>
        </div>
    );
};

export default AdminDashboard;