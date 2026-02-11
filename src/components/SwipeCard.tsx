import { useState, memo, useMemo } from 'react';
import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { Info, Image as ImageIcon, Sparkles, MoreHorizontal, Zap } from 'lucide-react';
import type { Profile } from '../types';
import { ReportModal } from './ReportModal';
import { useStore } from '../store/useStore';
import { analyzeCompatibility } from '../lib/matching';

interface SwipeCardProps {
  profile: Profile;
  onSwipe: (direction: 'left' | 'right') => void;
  active: boolean;
}

const ImageWithLoader = ({ src, alt }: { src: string; alt: string }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-full h-full bg-gray-800">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center animate-pulse">
          <ImageIcon className="text-gray-600 w-12 h-12" />
        </div>
      )}
      <img 
        src={src} 
        alt={alt} 
        className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        draggable={false}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
};

export const SwipeCard = memo(({ profile, onSwipe, active }: SwipeCardProps) => {
  const [showInfo, setShowInfo] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const { reportUser, currentUser } = useStore();
  
  const analysis = useMemo(() => {
    if (currentUser) {
      return analyzeCompatibility(currentUser, profile);
    }
    return null;
  }, [currentUser, profile]);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  
  // Color overlays
  const likeOpacity = useTransform(x, [10, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-10, -150], [0, 1]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      onSwipe('right');
    } else if (info.offset.x < -threshold) {
      onSwipe('left');
    }
  };

  const handleReport = (reason: string) => {
    reportUser(profile.id, reason);
    setShowReport(false);
    onSwipe('left'); // Auto-swipe left on report
  };

  // Stack effect for background card
  const initialScale = active ? 1 : 0.95;
  const initialY = active ? 0 : 10;

  // Render check for mobile optimization
  if (!profile) return null;

  return (
    <>
      <motion.div
        style={{ 
          x: active ? x : 0, 
          rotate: active ? rotate : 0, 
          opacity: active ? opacity : 1, // Don't fade out background card
          zIndex: active ? 10 : 0
        }}
        drag={active ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        className={`absolute inset-0 w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-gray-900 border border-white/5 ${active ? 'cursor-grab active:cursor-grabbing' : ''}`}
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ 
          scale: showInfo ? 1 : initialScale, 
          y: showInfo ? 0 : initialY, 
          opacity: 1 
        }}
        exit={{ scale: 1.05, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <ImageWithLoader src={profile.primary_photo} alt={profile.name} />
          {/* Gradient Overlay - Deeper for better text contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black" />
        </div>

        {/* Admin Recommendation Badge */}
        {profile.is_admin_recommended && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-30 bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-1.5 rounded-full shadow-lg border border-white/20 flex items-center gap-2"
          >
            <Sparkles size={16} className="text-yellow-300 fill-yellow-300" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Cupid's Pick</span>
          </motion.div>
        )}

        {/* Swipe Indicators */}
        {active && (
          <>
            <motion.div style={{ opacity: likeOpacity }} className="absolute top-8 left-8 -rotate-12 border-4 border-green-500 rounded-lg px-4 py-1 z-20">
              <span className="text-green-500 font-bold text-4xl uppercase tracking-widest">Like</span>
            </motion.div>
            <motion.div style={{ opacity: nopeOpacity }} className="absolute top-8 right-8 rotate-12 border-4 border-red-500 rounded-lg px-4 py-1 z-20">
              <span className="text-red-500 font-bold text-4xl uppercase tracking-widest">Nope</span>
            </motion.div>
          </>
        )}

        {/* Report Button (Top Right) */}
        <button 
          onClick={(e) => { e.stopPropagation(); setShowReport(true); }}
          className="absolute top-6 right-6 p-2 bg-black/20 backdrop-blur-md rounded-full text-white/70 hover:text-white hover:bg-black/40 transition-colors z-40"
        >
          <MoreHorizontal size={24} />
        </button>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10 select-none">
          <div className="flex items-end justify-between mb-2">
            <div>
              <h2 className="text-3xl font-bold flex items-baseline gap-2">
                {profile.name} 
                <span className="text-xl font-normal opacity-90">{profile.age}</span>
              </h2>
              <p className="text-gray-300 font-medium">{profile.course}</p>
              
              {/* Compatibility Badge (New) */}
              {analysis && (
                <div className="mt-2 flex items-center gap-2">
                  <div className={`px-2 py-0.5 rounded-md border text-xs font-bold flex items-center gap-1 ${
                    analysis.percentage >= 80 ? 'bg-green-500/20 border-green-500 text-green-400' :
                    analysis.percentage >= 60 ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' :
                    'bg-gray-500/20 border-gray-500 text-gray-400'
                  }`}>
                    <Zap size={10} className="fill-current" />
                    {analysis.percentage}% Match
                  </div>
                  {analysis.academicSynergy && (
                    <div className="px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500 text-purple-300 text-xs font-bold">
                      {analysis.academicSynergy}
                    </div>
                  )}
                </div>
              )}
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }}
              className="p-2 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-colors"
            >
              <Info size={24} />
            </button>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {profile.interests.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                {tag}
              </span>
            ))}
            {profile.interests.length > 3 && (
              <span className="text-xs font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                +{profile.interests.length - 3}
              </span>
            )}
          </div>

          {/* Expanded Info */}
          {showInfo && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="space-y-4 pt-4 border-t border-white/10"
            >
              <p className="text-sm leading-relaxed text-gray-200">{profile.bio}</p>
              
              {/* Vibe Tags (New) */}
              {analysis && analysis.vibeTags.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-green-400 mb-2 flex items-center gap-1">
                    <Sparkles size={12} /> Why you match
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.vibeTags.map((tag) => (
                      <span key={tag} className="text-xs font-bold text-green-300 bg-green-900/30 border border-green-500/30 px-2 py-1 rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((tag) => (
                    <span key={tag} className="text-xs font-medium bg-white/10 px-3 py-1 rounded-full border border-white/10">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                {profile.photos.slice(1).map((photo) => (
                  <div key={photo.id} className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-800">
                    <ImageWithLoader src={photo.url} alt="" />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      <ReportModal 
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        onReport={handleReport}
        userName={profile.name}
      />
    </>
  );
});
