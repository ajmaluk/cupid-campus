import { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { calculateCompatibility } from '../lib/matching';
import { Button } from '../components/ui/Button';
import { useStore } from '../store/useStore';
import { Users, HeartHandshake, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import type { Profile } from '../types';

export default function Admin() {
  const { currentUser, addRecommendation } = useStore();
  const [activeTab, setActiveTab] = useState<'users' | 'matchmaker'>('users');
  const [users, setUsers] = useState<Profile[]>([]);
  // const [loading, setLoading] = useState(true);

  // Fetch Users from Supabase
  useEffect(() => {
    const fetchUsers = async () => {
      // setLoading(true);
      const { data, error } = await supabase.from('profiles').select('*');
      if (!error && data) {
        setUsers(data.map(p => ({
          ...p,
          interests: p.interests || [],
          photos: p.photos || [],
        })) as Profile[]);
      }
      // setLoading(false);
    };
    fetchUsers();
  }, []);

  // Matchmaker State
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [selectedRecommended, setSelectedRecommended] = useState<string>('');
  const [recommendationType, setRecommendationType] = useState<'standard' | 'soulmate' | 'friend'>('soulmate');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Update suggestions when target changes
  const suggestedMatches = useMemo(() => {
    if (selectedTarget) {
      const targetUser = users.find(u => u.id === selectedTarget);
      if (targetUser) {
        const others = users.filter(u => u.id !== selectedTarget);
        const scored = others.map(u => ({
          profile: u,
          score: calculateCompatibility(targetUser, u)
        })).sort((a, b) => b.score - a.score);
        return scored.slice(0, 3); // Top 3
      }
    }
    return [];
  }, [selectedTarget, users]);

  const handleBan = async (id: string) => {
    if (!confirm('Are you sure you want to ban this user?')) return;
    
    // Optimistic UI
    setUsers(users.filter(u => u.id !== id));
    
    // Real Ban (Insert into bans table)
    await supabase.from('bans').insert({ user_id: id, reason: 'Admin Ban', banned_at: new Date().toISOString() });
    alert(`User ${id} banned.`);
  };

  const handleRecommend = async () => {
    if (!selectedTarget || !selectedRecommended) return;
    if (selectedTarget === selectedRecommended) {
      alert("Cannot recommend a user to themselves.");
      return;
    }

    const rec = {
      admin_id: currentUser?.id || 'admin',
      target_user_id: selectedTarget,
      recommended_user_id: selectedRecommended,
      created_at: new Date().toISOString(),
      type: recommendationType
    };

    // Store locally
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addRecommendation({ ...rec, id: Date.now().toString() } as any);
    
    // Store in DB
    await supabase.from('admin_recommendations').insert(rec);

    setSuccessMsg(recommendationType === 'soulmate' ? 'Soul Mates Linked! ✨' : 'Recommendation sent! 💘');
    setTimeout(() => setSuccessMsg(''), 3000);
    
    // Reset selection
    setSelectedTarget('');
    setSelectedRecommended('');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-3xl font-bold text-red-500 mb-4">Access Denied</h1>
          <p className="text-gray-400">You must be logged in to view this page.</p>
        </div>
      </div>
    );
  }

  // Basic admin check (in real app, this would be backend enforced)
  // For now, we trust the specific email or the is_admin flag
  const isAdmin = currentUser.id === 'admin' || currentUser.is_admin || currentUser.id.includes('admin');

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-3xl font-bold text-red-500 mb-4">Restricted Area 🚫</h1>
          <p className="text-gray-400">You do not have permission to access the Cupid Dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <h1 className="text-3xl font-bold mb-8 text-primary">Admin Dashboard</h1>
      
      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-800 pb-4">
        <button
          onClick={() => setActiveTab('users')}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
            activeTab === 'users' ? "bg-primary/20 text-primary font-bold" : "text-gray-400 hover:text-white"
          )}
        >
          <Users size={20} />
          User Management
        </button>
        <button
          onClick={() => setActiveTab('matchmaker')}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
            activeTab === 'matchmaker' ? "bg-purple-500/20 text-purple-400 font-bold" : "text-gray-400 hover:text-white"
          )}
        >
          <HeartHandshake size={20} />
          Matchmaker
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800">
          <table className="w-full text-left">
            <thead className="bg-gray-800 text-gray-400">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {users.map(user => (
                <tr key={user.id}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={user.primary_photo} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <div className="font-bold">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.course}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-400">Student</td>
                  <td className="p-4">
                    <Button 
                      variant="ghost" 
                      className="text-red-500 hover:bg-red-500/10 hover:text-red-500 px-3 py-1 text-sm h-auto"
                      onClick={() => handleBan(user.id)}
                    >
                      Ban
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Matchmaker Tab */}
      {activeTab === 'matchmaker' && (
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">Cupid's Bow 🏹</h2>
            <p className="text-gray-400">Manually set up a recommendation between two students.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
            {/* Target User (Who sees it) */}
            <div className={`space-y-4 p-6 rounded-2xl border transition-all ${
              selectedTarget ? 'bg-gray-900 border-primary/50 shadow-lg shadow-primary/10' : 'bg-gray-900 border-gray-800'
            }`}>
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">1. The Seeker</label>
                {selectedTarget && <span className="text-xs text-primary font-bold">Selected</span>}
              </div>
              <select 
                className="w-full bg-black/30 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
              >
                <option value="">Choose a student...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} • {u.course}</option>
                ))}
              </select>
              {selectedTarget ? (
                 <div className="flex items-center gap-4 mt-4 p-4 bg-black/40 rounded-xl border border-white/5">
                    <img src={users.find(u => u.id === selectedTarget)?.primary_photo} className="w-16 h-16 rounded-full object-cover border-2 border-primary" />
                    <div>
                        <div className="text-xl font-bold text-white">{users.find(u => u.id === selectedTarget)?.name}</div>
                        <div className="text-sm text-gray-400">{users.find(u => u.id === selectedTarget)?.course}</div>
                        <div className="text-xs text-gray-500 mt-1">Will see the match</div>
                    </div>
                 </div>
              ) : (
                <div className="h-24 flex items-center justify-center border-2 border-dashed border-gray-800 rounded-xl text-gray-600 text-sm">
                  Select a user to begin
                </div>
              )}
            </div>

            {/* Recommended User (The Friend) */}
            <div className={`space-y-4 p-6 rounded-2xl border transition-all ${
              selectedRecommended ? 'bg-gray-900 border-purple-500/50 shadow-lg shadow-purple-500/10' : 'bg-gray-900 border-gray-800'
            }`}>
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">2. The Match</label>
                {selectedRecommended && <span className="text-xs text-purple-400 font-bold">Selected</span>}
              </div>
              <select 
                className="w-full bg-black/30 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
                value={selectedRecommended}
                onChange={(e) => setSelectedRecommended(e.target.value)}
              >
                <option value="">Choose a student...</option>
                {/* Suggestions Logic */}
                {suggestedMatches.length > 0 && (
                  <optgroup label="✨ Top Suggestions">
                    {suggestedMatches.map(m => (
                      <option key={m.profile.id} value={m.profile.id}>
                        🔥 {m.score}% - {m.profile.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="All Students">
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} • {u.course}</option>
                  ))}
                </optgroup>
              </select>
              {selectedRecommended ? (
                 <div className="flex items-center gap-4 mt-4 p-4 bg-black/40 rounded-xl border border-white/5">
                    <img src={users.find(u => u.id === selectedRecommended)?.primary_photo} className="w-16 h-16 rounded-full object-cover border-2 border-purple-500" />
                    <div>
                        <div className="text-xl font-bold text-white">{users.find(u => u.id === selectedRecommended)?.name}</div>
                        <div className="text-sm text-gray-400">{users.find(u => u.id === selectedRecommended)?.course}</div>
                        <div className="text-xs text-gray-500 mt-1">Will be recommended</div>
                    </div>
                 </div>
              ) : (
                <div className="h-24 flex items-center justify-center border-2 border-dashed border-gray-800 rounded-xl text-gray-600 text-sm">
                  Select a user to match
                </div>
              )}
            </div>
            
            {/* Connector Line */}
            <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-gray-900 rounded-full items-center justify-center border border-gray-700 shadow-xl">
              {recommendationType === 'soulmate' ? '✨' : recommendationType === 'friend' ? '🤝' : '➡️'}
            </div>
          </div>

          {/* Connection Type */}
          <div className="flex justify-center gap-4">
             <button
               onClick={() => setRecommendationType('standard')}
               className={`px-6 py-3 rounded-xl border transition-all ${
                 recommendationType === 'standard' 
                   ? 'bg-blue-500/20 border-blue-500 text-blue-400 font-bold' 
                   : 'bg-gray-900 border-gray-800 text-gray-400'
               }`}
             >
               Standard
             </button>
             <button
               onClick={() => setRecommendationType('friend')}
               className={`px-6 py-3 rounded-xl border transition-all ${
                 recommendationType === 'friend' 
                   ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400 font-bold' 
                   : 'bg-gray-900 border-gray-800 text-gray-400'
               }`}
             >
               Friend 🤝
             </button>
             <button
               onClick={() => setRecommendationType('soulmate')}
               className={`px-6 py-3 rounded-xl border transition-all ${
                 recommendationType === 'soulmate' 
                   ? 'bg-pink-500/20 border-pink-500 text-pink-400 font-bold shadow-lg shadow-pink-500/20' 
                   : 'bg-gray-900 border-gray-800 text-gray-400'
               }`}
             >
               Soul Mate ✨
             </button>
          </div>

          <div className="flex justify-center pt-4">
            <Button 
              size="lg" 
              className={`w-full md:w-auto min-w-[200px] transition-all transform active:scale-95 ${
                recommendationType === 'soulmate'
                  ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:shadow-lg hover:shadow-purple-500/25'
                  : recommendationType === 'friend'
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                  : 'bg-gradient-to-r from-blue-600 to-blue-800'
              }`}
              onClick={handleRecommend}
              disabled={!selectedTarget || !selectedRecommended}
            >
              {recommendationType === 'soulmate' ? 'Link Soul Mates ✨' : recommendationType === 'friend' ? 'Suggest Friend 🤝' : 'Send Recommendation'}
            </Button>
          </div>

          {successMsg && (
            <div className="bg-green-500/20 border border-green-500/50 text-green-200 p-4 rounded-xl flex items-center justify-center gap-2 animate-bounce">
              <CheckCircle size={20} />
              {successMsg}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
