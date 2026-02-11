import { motion, AnimatePresence } from 'framer-motion';
import type { Profile } from '../types';
import type { MatchAnalysis } from '../lib/matching';
import { Button } from './ui/Button';

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchedProfile: Profile;
  currentUser: Profile;
  analysis?: MatchAnalysis;
}

export const MatchModal = ({ isOpen, onClose, matchedProfile, currentUser, analysis }: MatchModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-6"
        >
          <div className="w-full max-w-sm text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="mb-8"
            >
              <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500 italic">
                It's a Match!
              </h1>
              {analysis && (
                <div className="mt-2 inline-block px-4 py-1 rounded-full bg-white/10 border border-white/20">
                  <span className="text-green-400 font-bold">{analysis.percentage}% Compatible</span>
                </div>
              )}
            </motion.div>

            <div className="flex justify-center items-center gap-4 mb-8 relative h-40">
              <motion.div
                initial={{ x: -100, rotate: -20, opacity: 0 }}
                animate={{ x: -20, rotate: -10, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="w-32 h-32 rounded-full border-4 border-white overflow-hidden absolute left-1/2 -ml-16 shadow-2xl"
              >
                <img src={currentUser.primary_photo} className="w-full h-full object-cover" />
              </motion.div>
              <motion.div
                initial={{ x: 100, rotate: 20, opacity: 0 }}
                animate={{ x: 20, rotate: 10, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="w-32 h-32 rounded-full border-4 border-white overflow-hidden absolute right-1/2 -mr-16 shadow-2xl"
              >
                <img src={matchedProfile.primary_photo} className="w-full h-full object-cover" />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-white mb-8 space-y-4"
            >
              <p className="text-lg">
                You and {matchedProfile.name} have similar vibes!
              </p>
              
              {analysis && analysis.vibeTags.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                  {analysis.vibeTags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-xs bg-purple-500/20 text-purple-200 px-3 py-1 rounded-full border border-purple-500/30">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="space-y-3"
            >
              <Button className="w-full" onClick={onClose}>
                Send a Message
              </Button>
              <Button variant="ghost" className="w-full" onClick={onClose}>
                Keep Swiping
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
