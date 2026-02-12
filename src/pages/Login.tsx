import { useState } from 'react';
import { Heart, Sparkles, ArrowRight, Mail, Loader2, Lock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { setCurrentUser } = useStore();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Strict Domain Check
    if (!email.trim().endsWith('@cet.ac.in')) {
      setError('Access restricted to @cet.ac.in emails only.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      if (error) throw error;
      
      if (data.user) {
        // Check if profile exists and is complete
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profile && profile.name && profile.age && profile.photos && profile.photos.length > 0) {
          // Profile exists and is complete -> Go to app
          setCurrentUser(profile);
          navigate('/discover');
        } else {
          // New user or incomplete profile -> Go to onboarding
          navigate('/onboarding');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background overflow-x-hidden">
      
      {/* Left Side - Brand & Visuals (Desktop Only) */}
      <div className="hidden md:flex w-1/2 relative bg-black/40 items-center justify-center overflow-hidden border-r border-white/5">
        {/* Animated Background for Left Side */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] opacity-40" 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], rotate: [0, -45, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-20%] right-[-20%] w-[800px] h-[800px] bg-purple-500/20 rounded-full blur-[120px] opacity-40" 
        />

        <div className="relative z-10 flex flex-col items-center text-center p-12 max-w-xl">
           <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="w-32 h-32 bg-gradient-to-tr from-primary to-purple-600 rounded-[40px] flex items-center justify-center shadow-2xl shadow-primary/30 mx-auto transform rotate-12">
              <Heart className="text-white w-16 h-16 fill-current" />
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-6xl font-bold text-white mb-6 tracking-tight"
          >
            CETea
          </motion.h1>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-xl text-gray-300 leading-relaxed"
          >
            The exclusive dating platform for CET students. <br/>
            Find your match, make connections, and spark something new.
          </motion.p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full md:w-1/2 relative flex flex-col items-center justify-center p-0 md:p-6 bg-background min-h-[100dvh] md:h-auto">
        {/* Mobile Background Blobs */}
        <div className="md:hidden absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-60" 
          />
          <motion.div 
            animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[120px] opacity-60" 
          />
        </div>

        {/* Desktop Background Subtle Glow */}
        <div className="hidden md:block absolute inset-0 overflow-hidden pointer-events-none">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px]" />
        </div>

        {/* Glass Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="z-10 w-full md:max-w-md min-h-full md:min-h-0 md:h-auto bg-black/40 md:bg-white/5 backdrop-blur-3xl md:backdrop-blur-2xl border-none md:border md:border-white/10 rounded-none md:rounded-[40px] p-6 md:p-8 md:shadow-2xl relative overflow-hidden flex flex-col justify-center"
        >
          {/* Shine effect */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50" />

          {/* Logo on Mobile Only */}
          <div className="flex justify-center mb-8 relative md:hidden shrink-0">
            <motion.div 
              animate={{ rotate: [12, 0, 12] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="w-20 h-20 bg-gradient-to-tr from-primary to-purple-600 rounded-[24px] flex items-center justify-center shadow-lg shadow-primary/40 relative z-10"
            >
              <Heart className="text-white w-10 h-10 fill-current drop-shadow-md" />
            </motion.div>
            
            {/* Floating elements */}
            <motion.div 
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 right-10 text-yellow-300"
            >
              <Sparkles size={24} />
            </motion.div>
          </div>

          <div className="text-center space-y-3 mb-10 shrink-0">
            {/* Unified title for both Mobile and Desktop */}
            <h1 className="text-3xl font-bold tracking-tight text-white">Welcome Back</h1>
            <p className="text-gray-400">Enter your details to access your account</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.form 
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
              onSubmit={handleAuth}
            >
              <div className="flex justify-center mb-8 bg-black/30 p-1.5 rounded-2xl shrink-0 border border-white/5">
                <button
                  type="button"
                  className="flex-1 py-3 rounded-xl text-sm font-bold transition-all bg-primary text-white shadow-lg shadow-primary/20"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/signup')}
                  className="flex-1 py-3 rounded-xl text-sm font-bold transition-all text-gray-400 hover:text-white hover:bg-white/5"
                >
                  Sign Up
                </button>
              </div>

              <div className="space-y-5">
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={20} />
                  <input 
                    type="email" 
                    placeholder="College Email (@cet.ac.in)" 
                    className="w-full bg-black/20 border border-white/10 rounded-2xl h-14 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:bg-black/40 focus:ring-1 focus:ring-primary/50 transition-all text-base font-medium"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                    autoCapitalize="none"
                    inputMode="email"
                    autoComplete="username"
                  />
                </div>

                {/* Password Field - Always Show */}
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={20} />
                  <input 
                    type="password" 
                    placeholder="Password"
                    className="w-full bg-black/20 border border-white/10 rounded-2xl h-14 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:bg-black/40 focus:ring-1 focus:ring-primary/50 transition-all text-base font-medium"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <p className="text-red-200 text-sm font-medium">
                    {error}
                  </p>
                </motion.div>
              )}

              <Button 
                className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-primary to-purple-600 hover:to-purple-500 text-white shadow-xl shadow-primary/25 transition-all active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-70 mt-6 border border-white/10"
                disabled={loading || !email || !password}
              >
                {loading ? <Loader2 className="animate-spin" /> : (
                  <>
                    Login
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </motion.form>
          </AnimatePresence>
          
          <div className="mt-8 text-center shrink-0">
            <p className="text-xs text-gray-500 leading-relaxed">
              <span className="text-primary/80 font-medium">Only for @cet.ac.in students</span>
            </p>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-8 text-center z-20"
        >
          <p className="text-gray-600 text-xs uppercase tracking-widest font-bold">Made with ❤️ for CET</p>
        </motion.div>
      </div>
    </div>
  );
}
