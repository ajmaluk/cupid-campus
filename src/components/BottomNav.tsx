import { NavLink, useLocation } from 'react-router-dom';
import { Sparkles, Heart, User, MessageCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export const BottomNav = () => {
  const location = useLocation();
  const navItems = [
    { to: '/discover', icon: Sparkles, label: 'Discover' },
    { to: '/matches', icon: Heart, label: 'Matches' },
    { to: '/chat', icon: MessageCircle, label: 'Chat' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  // Don't show nav on login, onboarding, welcome, or chat detail
  if (['/', '/onboarding', '/welcome', '/signup'].includes(location.pathname) || (location.pathname.startsWith('/chat/') && location.pathname !== '/chat')) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-background/80 backdrop-blur-xl border-t border-white/5 flex justify-around items-center z-50 max-w-[430px] mx-auto pb-4">
      {navItems.map(({ to, icon: Icon, label }) => {
        const isActive = location.pathname === to;
        return (
          <NavLink
            key={to}
            to={to}
            className="relative flex flex-col items-center justify-center w-full h-full gap-1"
          >
            {isActive && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute top-0 w-12 h-1 bg-primary rounded-b-full shadow-[0_0_10px_rgba(255,75,110,0.5)]"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <Icon 
              size={24} 
              className={clsx(
                "transition-all duration-300",
                isActive ? "text-primary scale-110" : "text-gray-500 hover:text-gray-300"
              )} 
              fill={isActive ? "currentColor" : "none"}
            />
            <span className={clsx(
              "text-[10px] font-medium transition-colors",
              isActive ? "text-white" : "text-gray-600"
            )}>
              {label}
            </span>
          </NavLink>
        );
      })}
    </div>
  );
};
