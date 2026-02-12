import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Profile, Match, AdminRecommendation } from '../types';

import { supabase } from '../lib/supabase';

interface AppState {
  currentUser: Profile | null;
  setCurrentUser: (user: Profile | null) => void;
  
  potentialMatches: Profile[];
  setPotentialMatches: (profiles: Profile[]) => void;
  removePotentialMatch: (id: string) => void;
  
  matches: Match[];
  setMatches: (matches: Match[]) => void;
  
  recommendations: AdminRecommendation[]; // Mock database for recommendations
  setRecommendations: (recs: AdminRecommendation[]) => void;
  addRecommendation: (rec: AdminRecommendation) => void;

  swipes: string[]; // Track all swiped user IDs (Left or Right)
  addSwipe: (id: string) => void;
  removeSwipe: (id: string) => void;
  removeAllSwipes: () => void;

  // Security & Safety
  blockedUsers: string[];
  blockUser: (userId: string) => void;
  reportUser: (userId: string, reason: string) => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
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
      setRecommendations: (recs) => set({ recommendations: recs }),
      addRecommendation: (rec) => set((state) => ({ recommendations: [...state.recommendations, rec] })),

      swipes: [],
      addSwipe: (id) => set((state) => ({ swipes: [...state.swipes, id] })),
      removeSwipe: (id) => set((state) => ({ swipes: state.swipes.filter(sid => sid !== id) })),
      removeAllSwipes: () => set({ swipes: [] }),

      blockedUsers: [],
      blockUser: (userId) => set((state) => ({ 
        blockedUsers: [...state.blockedUsers, userId],
        potentialMatches: state.potentialMatches.filter(p => p.id !== userId),
        matches: state.matches.filter(m => m.user1 !== userId && m.user2 !== userId) // Remove from matches too
      })),
      reportUser: async (userId, reason) => {
        const currentUser = get().currentUser;
        
        // Optimistic update
        set((state) => ({ 
          blockedUsers: [...state.blockedUsers, userId], // Auto-block on report
          potentialMatches: state.potentialMatches.filter(p => p.id !== userId),
          matches: state.matches.filter(m => m.user1 !== userId && m.user2 !== userId)
        }));

        if (currentUser) {
           try {
             await supabase.from('reports').insert({
               reporter_id: currentUser.id,
               reported_user_id: userId,
               reason: reason
             });
           } catch (err) {
             console.error("Failed to submit report to backend:", err);
             // We keep the local block active for safety
           }
        }
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
