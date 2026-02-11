import { NavLink, useLocation } from 'react-router-dom';
import { Sparkles, Heart, User, MessageCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';

export const Sidebar = () => {
  const location = useLocation();
  const { currentUser } = useStore();
  
  const navItems = [
    { to: '/discover', icon: Sparkles, label: 'Discover' },
    { to: '/matches', icon: Heart, label: 'Matches' },
    { to: '/chat', icon: MessageCircle, label: 'Chat' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  // Don't show nav on login, onboarding, welcome, signup
  if (['/', '/onboarding', '/welcome', '/signup'].includes(location.pathname)) return null;

  return (
    <div className="hidden md:flex fixed top-0 left-0 bottom-0 w-64 bg-background border-r border-white/5 flex-col z-50 p-6">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
          <span className="text-2xl">💘</span>
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
          Cupid Campus
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => clsx(
                "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon 
                size={24} 
                className={clsx(
                  "transition-transform duration-300",
                  isActive ? "scale-110" : "group-hover:scale-110"
                )}
                fill={isActive ? "currentColor" : "none"}
              />
              <span className="font-medium">{label}</span>
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 w-1 h-8 bg-primary rounded-r-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile Mini */}
      {currentUser && (
        <div className="mt-auto pt-6 border-t border-white/5">
          <div className="flex items-center gap-3 px-2">
            <img 
              src={currentUser.primary_photo} 
              alt={currentUser.name} 
              className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-500 truncate">{currentUser.major || 'Student'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
