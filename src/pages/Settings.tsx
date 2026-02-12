import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { PageTransition } from '../components/PageTransition';
import { ChevronLeft, Bell, Shield, HelpCircle, LogOut, Trash2, Heart } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function Settings() {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useStore();
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('cetea-notifications');
    return saved ? JSON.parse(saved) : true;
  });
  const [isSaving, setIsSaving] = useState(false);

  // Local state for discovery settings
  const [interestedIn, setInterestedIn] = useState<'Male' | 'Female' | 'Everyone'>(
    currentUser?.interested_in || 'Everyone'
  );

  const handleSave = async () => {
    if (!currentUser) return;
    
    setIsSaving(true);
    try {
      // Save notifications to local storage
      localStorage.setItem('cetea-notifications', JSON.stringify(notifications));

      // Update interested_in in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ interested_in: interestedIn })
        .eq('id', currentUser.id);

      if (error) throw error;

      // Update local store
      setCurrentUser({ ...currentUser, interested_in: interestedIn });
      navigate('/profile');
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      setCurrentUser(null);
      navigate('/');
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="bg-gray-900/50 backdrop-blur-md border-b border-white/5 sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-white">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold">Settings</h1>
          <Button 
            size="sm" 
            variant="ghost" 
            className="text-primary font-bold hover:bg-primary/10"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>

        <div className="p-6 space-y-8">
          {/* Discovery Settings */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider px-2">Discovery Settings</h2>
            <div className="bg-gray-900/50 rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center gap-3 mb-3">
                  <Heart className="text-primary" size={20} />
                  <span className="font-medium">Show Me</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {['Male', 'Female', 'Everyone'].map((option) => (
                    <button
                      key={option}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      onClick={() => setInterestedIn(option as any)}
                      className={`py-2 rounded-xl text-sm font-medium transition-all ${
                        interestedIn === option
                          ? 'bg-primary text-white shadow-lg shadow-primary/20'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Mock Age Range - Functionality to be added later */}
              <div className="p-4 opacity-50 pointer-events-none">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-400">Age Range</span>
                  <span className="text-sm text-gray-500">18 - 25</span>
                </div>
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-primary ml-[10%]" />
                </div>
              </div>
            </div>
          </section>

          {/* App Settings */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider px-2">App Settings</h2>
            <div className="bg-gray-900/50 rounded-2xl border border-white/5 overflow-hidden">
              <button 
                onClick={() => setNotifications(!notifications)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/5"
              >
                <div className="flex items-center gap-3">
                  <Bell className="text-yellow-500" size={20} />
                  <span className="font-medium">Notifications</span>
                </div>
                <div className={`w-11 h-6 rounded-full transition-colors relative ${notifications ? 'bg-primary' : 'bg-gray-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${notifications ? 'left-6' : 'left-1'}`} />
                </div>
              </button>

              <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/5">
                <div className="flex items-center gap-3">
                  <Shield className="text-green-500" size={20} />
                  <span className="font-medium">Privacy Policy</span>
                </div>
                <ChevronLeft size={16} className="rotate-180 text-gray-600" />
              </button>

              <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <HelpCircle className="text-blue-500" size={20} />
                  <span className="font-medium">Help & Support</span>
                </div>
                <ChevronLeft size={16} className="rotate-180 text-gray-600" />
              </button>
            </div>
          </section>

          {/* Account Actions */}
          <section className="space-y-3 pt-4">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 h-12"
              onClick={handleLogout}
            >
              <LogOut size={18} className="mr-3" />
              Log Out
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start text-gray-500 hover:text-red-400 hover:bg-red-500/5 h-12 text-sm"
            >
              <Trash2 size={18} className="mr-3" />
              Delete Account
            </Button>
          </section>

          <div className="text-center pt-8 pb-4">
            <p className="text-xs text-gray-600 font-medium">CETea v1.0.0</p>
            <p className="text-[10px] text-gray-700 mt-1">Made with ❤️ for Students</p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
