import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Profile, Match, AdminRecommendation } from '../types';

interface AppState {
  currentUser: Profile | null;
  setCurrentUser: (user: Profile | null) => void;
  
  potentialMatches: Profile[];
  setPotentialMatches: (profiles: Profile[]) => void;
  removePotentialMatch: (id: string) => void;
  
  matches: Match[];
  setMatches: (matches: Match[]) => void;
  
  recommendations: AdminRecommendation[]; // Mock database for recommendations
  addRecommendation: (rec: AdminRecommendation) => void;

  swipes: string[]; // Track all swiped user IDs (Left or Right)
  addSwipe: (id: string) => void;
  removeSwipe: (id: string) => void;
  removeAllSwipes: () => void;

  // Security & Safety
  blockedUsers: string[];
  blockUser: (userId: string) => void;
  reportUser: (userId: string, reason: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      
      potentialMatches: [],
      setPotentialMatches: (profiles) => set({ potentialMatches: profiles }),
      removePotentialMatch: (id) => set((state) => ({
        potentialMatches: state.potentialMatches.filter(p => p.id !== id)
      })),
      
      matches: [],
      setMatches: (matches) => set({ matches: matches }),
      
      recommendations: [],
      addRecommendation: (rec) => set((state) => ({ recommendations: [...state.recommendations, rec] })),

      swipes: [],
      addSwipe: (id) => set((state) => ({ swipes: [...state.swipes, id] })),
      removeSwipe: (id) => set((state) => ({ swipes: state.swipes.filter(sid => sid !== id) })),
      removeAllSwipes: () => set({ swipes: [] }),

      blockedUsers: [],
      blockUser: (userId) => set((state) => ({ 
        blockedUsers: [...state.blockedUsers, userId],
        potentialMatches: state.potentialMatches.filter(p => p.id !== userId),
        matches: state.matches.filter(m => m.user2 !== userId) // Remove from matches too
      })),
      reportUser: (userId, reason) => {
        console.log(`[REPORT] User ${userId} reported for: ${reason}`);
        // In real app, send to Supabase 'reports' table
        set((state) => ({ 
          blockedUsers: [...state.blockedUsers, userId], // Auto-block on report
          potentialMatches: state.potentialMatches.filter(p => p.id !== userId),
          matches: state.matches.filter(m => m.user2 !== userId)
        }));
      }
    }),
    {
      name: 'cupid-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
      partialize: (state) => ({ 
        currentUser: state.currentUser, 
        matches: state.matches,
        recommendations: state.recommendations,
        blockedUsers: state.blockedUsers,
        swipes: state.swipes
        // Don't persist potentialMatches to force a refresh/re-calc on reload
      }),
    }
  )
);
