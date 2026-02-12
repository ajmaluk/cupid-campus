import type { ReactNode } from 'react';

interface MobileLayoutProps {
  children: ReactNode;
  className?: string;
}

export function MobileLayout({ children, className = '' }: MobileLayoutProps) {
  return (
    <div className={`w-full h-full min-h-screen mx-auto sm:max-w-[430px] sm:border-x sm:border-[#333] sm:shadow-[0_0_50px_rgba(0,0,0,0.5)] md:max-w-none md:border-none md:shadow-none flex flex-col relative overflow-y-auto bg-background ${className}`}>
      {children}
    </div>
  );
}
