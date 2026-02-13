import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { sortProfilesByCompatibility, analyzeCompatibility, type MatchAnalysis } from '../lib/matching';
import { SwipeCard } from '../components/SwipeCard';
import { MatchModal } from '../components/MatchModal';
import type { Profile } from '../types';
import { Loader2, RotateCcw, AlertCircle } from 'lucide-react';

export default function Discover() {
  const navigate = useNavigate();
  const { currentUser, potentialMatches, setPotentialMatches, removePotentialMatch, matches, setMatches, recommendations, blockedUsers, swipes, addSwipe, removeSwipe, removeAllSwipes } = useStore();
  const [matchModalData, setMatchModalData] = useState<{ profile: Profile; analysis: MatchAnalysis; matchId: number } | null>(null);
  const [loading, setLoading] = useState(potentialMatches.length === 0);
  const [error, setError] = useState('');
  const [noMoreProfiles, setNoMoreProfiles] = useState(false);
  
  // Undo Feature State
  const [lastSwipedProfile, setLastSwipedProfile] = useState<Profile | null>(null);
  const undoTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    const fetchProfiles = async () => {
      setLoading(true);
      setError('');
      
      // 0. Sync Swipes from DB (Source of Truth)
      const { data: dbSwipes, error: swipesError } = await supabase
        .from('swipes')
        .select('swiped_id')
        .eq('swiper_id', currentUser.id);

      if (swipesError) {
        console.error('Error syncing swipes:', swipesError);
      }

      const dbSwipedIds = dbSwipes?.map(s => s.swiped_id) || [];
      
      // Filter blocked/matched/swiped
      const matchedIds = matches.map(m => m.user2 === currentUser.id ? m.user1 : m.user2);
      const blockedIds = blockedUsers;
      const allSwipedIds = [...new Set([...swipes, ...dbSwipedIds])]; // Merge local and DB
      
      const ignoredIds = [...new Set([...matchedIds, ...blockedIds, ...allSwipedIds, currentUser.id])];

      // 1. Fetch potential matches from Supabase
      // Optimized: Filter on server side to reduce data transfer
      let query = supabase
        .from('profiles')
        .select('*');

      // Server-side Filtering
      if (ignoredIds.length > 0) {
        // Note: Supabase/PostgREST has a limit on URL length. 
        // If ignoredIds is huge (e.g. > 1000), this might fail.
        // For a college app, it's likely fine. If it fails, we fallback to client-side.
        if (ignoredIds.length < 500) {
           query = query.not('id', 'in', `(${ignoredIds.join(',')})`);
        }
      }

      if (currentUser.interested_in !== 'Everyone') {
        query = query.eq('gender', currentUser.interested_in);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching profiles:', error);
        setError('Failed to load profiles. Please check your connection.');
        setLoading(false);
        return;
      }

      // Type-safe mapping
      let availableProfiles = (data || []).map((p) => ({
        ...p,
        interests: p.interests || [],
        photos: p.photos || [],
      })) as Profile[];

      // Client-side filtering (Double check / Fallback for large lists)
      availableProfiles = availableProfiles.filter(p => 
        !ignoredIds.includes(p.id) &&
        // Gender Filtering (Redundant if server-side works, but safe)
        (currentUser.interested_in === 'Everyone' || p.gender === currentUser.interested_in) &&
        (p.interested_in === 'Everyone' || p.interested_in === currentUser.gender)
      );

      if (availableProfiles.length === 0) {
        setNoMoreProfiles(true);
        setLoading(false);
        return;
      }
      
      setNoMoreProfiles(false); // Reset if we found new ones

      // 2. Check for Admin Recommendations
      const recommendationsForUser = recommendations.filter(rec => rec.target_user_id === currentUser.id);
      const recommendedIds = recommendationsForUser.map(rec => rec.recommended_user_id);
      const soulmateIds = recommendationsForUser
        .filter(rec => rec.type === 'soulmate')
        .map(rec => rec.recommended_user_id);

      // Mark recommended profiles
      availableProfiles = availableProfiles.map(p => ({
        ...p,
        is_admin_recommended: recommendedIds.includes(p.id),
        is_soulmate: soulmateIds.includes(p.id)
      }));

      // 3. Sort by Compatibility (Standard Logic)
      const sorted = sortProfilesByCompatibility(currentUser, availableProfiles);

      // 4. Force Recommendations to Top (Soulmates FIRST)
      const finalStack = [
        ...sorted.filter(p => p.is_soulmate), // Soulmates (Highest Priority)
        ...sorted.filter(p => p.is_admin_recommended && !p.is_soulmate), // Standard Recommendations
        ...sorted.filter(p => !p.is_admin_recommended) // Others
      ];

      setPotentialMatches(finalStack);
      setLoading(false);
    };

    if (potentialMatches.length === 0 && !noMoreProfiles) {
      fetchProfiles();
    }
  }, [currentUser, potentialMatches.length, navigate, setPotentialMatches, recommendations, matches, blockedUsers, swipes, noMoreProfiles]);

  const handleSwipe = useCallback(async (direction: 'left' | 'right', profile: Profile) => {
    if (!currentUser) return;
    
    // Save for undo
    setLastSwipedProfile(profile);
    
    // Clear previous undo timeout
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    // Auto-clear undo after 4 seconds
    undoTimeoutRef.current = window.setTimeout(() => {
      setLastSwipedProfile(null);
    }, 4000);

    // Optimistic UI update
    removePotentialMatch(profile.id);
    addSwipe(profile.id);

    // Save to DB (Background)
    const { error: swipeError } = await supabase.from('swipes').insert({
      swiper_id: currentUser.id,
      swiped_id: profile.id,
      liked: direction === 'right'
    });

    if (swipeError) console.error('Swipe error:', swipeError);

    if (direction === 'right') {
      // Check if it's a match!
      const { data: otherSwipe } = await supabase
        .from('swipes')
        .select('*')
        .eq('swiper_id', profile.id)
        .eq('swiped_id', currentUser.id)
        .eq('liked', true)
        .maybeSingle();

      const isInstantMatch = profile.is_admin_recommended || profile.is_soulmate;

      if ((otherSwipe || isInstantMatch) && currentUser) {
        // IT'S A MATCH!
        // Soulmates get a compatibility boost in the analysis
        const analysis = analyzeCompatibility(currentUser, profile);
        if (profile.is_soulmate) {
          analysis.score = 100;
          analysis.percentage = 100;
          analysis.vibeTags.unshift('Soul Mate ✨');
        }
        
        if (isInstantMatch && !otherSwipe) {
           const { error: matchError } = await supabase.from('matches').insert({
             user1: currentUser.id,
             user2: profile.id,
             compatibility_score: analysis.score
           });
           if (matchError) console.error("Error creating instant match:", matchError);
        }

        const matchId = Date.now();
        setMatches([...matches, { 
          id: matchId, 
          user1: currentUser.id, 
          user2: profile.id, 
          compatibility_score: analysis.score, 
          created_at: new Date().toISOString(),
          profile: profile
        }]);
        setMatchModalData({ profile, analysis, matchId });
        setLastSwipedProfile(null); // Cannot undo a match
      }
    }
  }, [currentUser, matches, removePotentialMatch, setMatches, addSwipe]);

  const handleUndo = () => {
    if (lastSwipedProfile) {
      setPotentialMatches([lastSwipedProfile, ...potentialMatches]);
      removeSwipe(lastSwipedProfile.id);
      setLastSwipedProfile(null);
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    }
  };

  const handleResetSwipes = async () => {
    if (!currentUser) return;
    setLoading(true);
    
    try {
      // 1. Delete matches involving current user (Reset everything)
      const { error: matchesError } = await supabase
        .from('matches')
        .delete()
        .or(`user1.eq.${currentUser.id},user2.eq.${currentUser.id}`);

      if (matchesError) throw matchesError;

      // 2. Delete swipes from Supabase
      const { error: swipesError } = await supabase
        .from('swipes')
        .delete()
        .eq('swiper_id', currentUser.id);

      if (swipesError) throw swipesError;

      // 3. Clear local store
      removeAllSwipes();
      setMatches([]); // Clear matches locally
      setLastSwipedProfile(null);
      setNoMoreProfiles(false);
      setPotentialMatches([]); // Trigger re-fetch
    } catch (err) {
      console.error('Error resetting swipes:', err);
      setError('Failed to reset swipes. Please try again.');
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Header */}
      <div className="h-20 flex items-center justify-between px-8 z-10 bg-gradient-to-b from-background via-background/95 to-transparent">
        <div className="flex items-center gap-3 md:hidden">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
            <span className="text-2xl">💘</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">Cupid Campus</h1>
        </div>
        <div className="flex items-center gap-4 ml-auto">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-white font-bold">{currentUser.name}</span>
            <span className="text-xs text-gray-400">{currentUser.major}</span>
          </div>
          <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-primary to-purple-600">
            <img src={currentUser.primary_photo} className="w-full h-full rounded-full object-cover border-2 border-background" />
          </div>
        </div>
      </div>

      {/* Card Stack */}
      <div className="flex-1 relative max-w-md mx-auto w-full mb-32 mt-8 px-4 md:px-0">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <Loader2 size={48} className="animate-spin text-primary mb-4" />
            <p className="text-gray-400 animate-pulse">Finding matches near you...</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={40} className="text-red-500" />
            </div>
            <p className="text-lg font-bold text-white mb-2">Oops!</p>
            <p className="text-gray-400 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-2 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <AnimatePresence>
              {potentialMatches.slice(0, 2).map((profile, index) => (
                <SwipeCard
                  key={profile.id}
                  profile={profile}
                  active={index === 0}
                  onSwipe={(dir) => handleSwipe(dir, profile)}
                />
              )).reverse()} 
              {/* Reverse so first in array is on top (rendered last) */}
            </AnimatePresence>

            {potentialMatches.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 text-gray-500">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4 animate-pulse">
                  <span className="text-4xl">🔍</span>
                </div>
                <p className="text-lg">No more profiles nearby.</p>
                <p className="text-sm mt-2">Check back later!</p>
                <button 
                  onClick={handleResetSwipes} 
                  className="mt-6 px-6 py-2 bg-gray-800 rounded-full text-sm hover:bg-gray-700 transition-colors border border-gray-700"
                >
                  Reset Swipes & Refresh
                </button>
              </div>
            )}

            {/* Undo Button */}
            {lastSwipedProfile && potentialMatches.length > 0 && (
              <button 
                onClick={handleUndo}
                className="absolute bottom-4 left-4 z-20 p-3 bg-gray-800/80 backdrop-blur-md rounded-full text-yellow-500 shadow-lg border border-yellow-500/20 hover:bg-gray-700 transition-all active:scale-95"
              >
                <RotateCcw size={20} />
              </button>
            )}
          </>
        )}
      </div>

      {matchModalData && (
        <MatchModal 
          isOpen={!!matchModalData} 
          onClose={() => setMatchModalData(null)} 
          matchedProfile={matchModalData.profile} 
          currentUser={currentUser}
          analysis={matchModalData.analysis}
          matchId={matchModalData.matchId}
        />
      )}
    </div>
  );
}
