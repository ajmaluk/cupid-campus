import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/PageTransition';
import { Settings, Edit2, LogOut, ChevronRight, Camera, Loader2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadImage } from '../lib/cloudinary';
import { validateFace } from '../lib/faceRecognition';

export default function Profile() {
  const { currentUser, setCurrentUser } = useStore();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState(currentUser?.bio || '');
  const [isUploading, setIsUploading] = useState(false);

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      setCurrentUser(null);
      navigate('/');
    }
  };

  const saveProfile = () => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, bio: editBio });
      setIsEditing(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && currentUser) {
      const file = e.target.files[0];
      setIsUploading(true);
      try {
        const { isValid, error } = await validateFace(file);
        if (!isValid) {
            alert(error || 'Face validation failed.');
            setIsUploading(false);
            e.target.value = '';
            return;
        }

        const url = await uploadImage(file);
        setCurrentUser({ 
          ...currentUser, 
          primary_photo: url,
          photos: currentUser.photos.map(p => p.is_primary ? { ...p, url } : p)
        });
      } catch (error) {
        console.error(error);
        alert('Failed to update avatar.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleReset = () => {
    if (confirm('⚠️ WARNING: This will clear ALL your data (matches, messages, swipes) and log you out. Continue?')) {
      localStorage.removeItem('cupid-storage');
      window.location.reload();
    }
  };

  if (!currentUser) return null;

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-24 relative overflow-hidden">
        {/* Header Image */}
        <div className="relative h-72">
          <img src={currentUser.primary_photo} alt="Profile Cover" className="w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
          
          <button 
            onClick={() => navigate('/settings')}
            className="absolute top-6 right-6 p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/50 transition-colors"
          >
            <Settings size={24} />
          </button>
        </div>
        
        <div className="px-6 -mt-24 relative z-10 max-w-3xl mx-auto">
          {/* Avatar */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div className="w-full h-full rounded-full border-4 border-background overflow-hidden shadow-2xl relative">
              <img src={currentUser.primary_photo} alt="Profile Avatar" className="w-full h-full object-cover" />
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="animate-spin text-white" />
                </div>
              )}
            </div>
            {isEditing && (
              <label className="absolute bottom-0 right-0 bg-primary p-2 rounded-full text-white shadow-lg border-2 border-background cursor-pointer hover:bg-primary/90 transition-colors">
                <Camera size={16} />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploading} />
              </label>
            )}
          </div>
          
          {/* Name & Stats */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-1">{currentUser.name}, {currentUser.age}</h1>
            <p className="text-gray-400 font-medium">{currentUser.course} • {currentUser.year}</p>
          </div>

          {/* Profile Content */}
          <div className="space-y-6">
            {/* Bio Section */}
            <div className="bg-gray-900/50 backdrop-blur-sm p-5 rounded-3xl border border-white/5 relative group">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">About Me</h3>
                {!isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 text-primary bg-primary/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit2 size={14} />
                  </button>
                )}
              </div>
              
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <textarea 
                      className="w-full bg-black/20 rounded-xl p-3 text-white border border-white/10 focus:border-primary/50 outline-none resize-none h-24"
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                    />
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" onClick={saveProfile} className="flex-1">Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="flex-1">Cancel</Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-gray-200 leading-relaxed"
                  >
                    {currentUser.bio}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Interests */}
            <div className="bg-gray-900/50 backdrop-blur-sm p-5 rounded-3xl border border-white/5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Interests</h3>
                <ChevronRight size={16} className="text-gray-600" />
              </div>
              <div className="flex flex-wrap gap-2">
                {currentUser.interests.map(i => (
                  <span key={i} className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-sm text-gray-300">
                    {i}
                  </span>
                ))}
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-2">
               <button 
                 onClick={() => navigate('/edit-profile')}
                 className="w-full flex items-center justify-between p-4 bg-gray-900/30 rounded-2xl text-left hover:bg-gray-900/50 transition-all active:scale-[0.98]"
               >
                  <span className="font-medium">Edit Profile Details</span>
                  <ChevronRight size={18} className="text-gray-600" />
               </button>
               <button 
                 onClick={() => navigate('/settings')}
                 className="w-full flex items-center justify-between p-4 bg-gray-900/30 rounded-2xl text-left hover:bg-gray-900/50 transition-all active:scale-[0.98]"
               >
                  <span className="font-medium">Discovery Settings</span>
                  <ChevronRight size={18} className="text-gray-600" />
               </button>
            </div>

            <Button 
              variant="ghost" 
              className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 h-14" 
              onClick={handleLogout}
            >
              <LogOut size={18} className="mr-2" />
              Log Out
            </Button>

            <Button 
              variant="ghost" 
              className="w-full text-gray-500 hover:text-white hover:bg-white/5 h-12 text-xs uppercase tracking-wider border border-transparent hover:border-red-500/20" 
              onClick={handleReset}
            >
              <Trash2 size={14} className="mr-2" />
              Reset App Data (Debug)
            </Button>
            
            <div className="h-4" /> {/* Spacer */}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
