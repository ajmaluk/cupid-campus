import { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
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

const ProtectedRoute = () => {
  const { currentUser } = useStore();
  if (!currentUser) return <Navigate to="/" replace />;
  return <Outlet />;
};

const PublicRoute = () => {
  const { currentUser } = useStore();
  if (currentUser) return <Navigate to="/discover" replace />;
  return <Outlet />;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        {/* Onboarding - Semi-protected (needs auth but maybe not full profile) */}
        {/* For now leaving it accessible, as it handles its own redirects */}
        <Route path="/onboarding" element={<MobileLayout><Onboarding /></MobileLayout>} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/welcome" element={<MobileLayout><Welcome /></MobileLayout>} />
          <Route path="/discover" element={<MobileLayout><Discover /></MobileLayout>} />
          <Route path="/matches" element={<MobileLayout><Matches /></MobileLayout>} />
          <Route path="/chat" element={<MobileLayout><Chat /></MobileLayout>} />
          <Route path="/chat/:id" element={<MobileLayout><ChatDetail /></MobileLayout>} />
          <Route path="/profile" element={<MobileLayout><Profile /></MobileLayout>} />
          <Route path="/edit-profile" element={<MobileLayout><Onboarding isEditing={true} /></MobileLayout>} />
          <Route path="/settings" element={<MobileLayout><Settings /></MobileLayout>} />
          <Route path="/admin" element={<Admin />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  const { setCurrentUser, setMatches, setRecommendations } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check active session on mount
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Refresh profile data
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (data) setCurrentUser(data);

          // Fetch Matches with Profile details
          const { data: matchesData, error: matchesError } = await supabase
            .from('matches')
            .select(`
              *,
              u1:profiles!user1(*),
              u2:profiles!user2(*)
            `)
            .or(`user1.eq.${session.user.id},user2.eq.${session.user.id}`);

          if (!matchesError && matchesData) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const formattedMatches = matchesData.map((m: any) => {
               const isUser1 = m.user1 === session.user.id;
               const otherProfile = isUser1 ? m.u2 : m.u1;
               return {
                 ...m,
                 profile: otherProfile
               };
            });
            setMatches(formattedMatches);
          }

          // Fetch Recommendations
          const { data: recsData, error: recsError } = await supabase
            .from('admin_recommendations')
            .select('*')
            .eq('target_user_id', session.user.id);

          if (!recsError && recsData) {
             setRecommendations(recsData);
          }
        } else {
          // No session, ensure store is cleared
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Error initializing app:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setCurrentUser, setMatches, setRecommendations]);

  if (isLoading) {
    return <LoadingScreen />;
  }

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
