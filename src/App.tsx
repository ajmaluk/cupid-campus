import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { MobileLayout } from './components/MobileLayout';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { useStore } from './store/useStore';
import { supabase } from './lib/supabase';

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup')); // Added Signup
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Welcome = lazy(() => import('./pages/Welcome'));
const Discover = lazy(() => import('./pages/Discover'));
const Matches = lazy(() => import('./pages/Matches'));
const Chat = lazy(() => import('./pages/Chat'));
const ChatDetail = lazy(() => import('./pages/ChatDetail'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Admin = lazy(() => import('./pages/Admin'));

const LoadingScreen = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/onboarding" element={<MobileLayout><Onboarding /></MobileLayout>} />
        <Route path="/welcome" element={<MobileLayout><Welcome /></MobileLayout>} />
        <Route path="/discover" element={<MobileLayout><Discover /></MobileLayout>} />
        <Route path="/matches" element={<MobileLayout><Matches /></MobileLayout>} />
        <Route path="/chat" element={<MobileLayout><Chat /></MobileLayout>} />
        <Route path="/chat/:id" element={<MobileLayout><ChatDetail /></MobileLayout>} />
        <Route path="/profile" element={<MobileLayout><Profile /></MobileLayout>} />
        <Route path="/edit-profile" element={<MobileLayout><Onboarding isEditing={true} /></MobileLayout>} />
        <Route path="/settings" element={<MobileLayout><Settings /></MobileLayout>} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  const { setCurrentUser } = useStore();

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Refresh profile data
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) setCurrentUser(data);
          });
      } else {
        // No session, ensure store is cleared
        setCurrentUser(null);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setCurrentUser]);

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Suspense fallback={<LoadingScreen />}>
        <Sidebar />
        <div className="md:pl-64 min-h-screen transition-all duration-300">
          <AnimatedRoutes />
        </div>
        <BottomNav />
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
