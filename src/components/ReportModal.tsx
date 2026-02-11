import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/Button';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReport: (reason: string) => void;
  userName: string;
}

const REPORT_REASONS = [
  "Inappropriate Photos",
  "Spam or Scam",
  "Harassment",
  "Fake Profile",
  "Underage",
  "Other"
];

export const ReportModal = ({ isOpen, onClose, onReport, userName }: ReportModalProps) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-6 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-3xl p-6 relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <Shield className="text-red-500" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Report {userName}</h2>
                <p className="text-xs text-gray-400">Help keep our campus safe.</p>
              </div>
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 text-gray-500 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Reasons */}
            <div className="space-y-2 mb-6">
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={`w-full text-left p-3 rounded-xl text-sm font-medium transition-all ${
                    selectedReason === reason 
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            {/* Warning Text */}
            <div className="flex gap-2 p-3 bg-yellow-500/10 rounded-xl mb-6">
              <AlertTriangle className="text-yellow-500 shrink-0" size={16} />
              <p className="text-xs text-yellow-500/80 leading-relaxed">
                This will hide {userName} from your feed and our team will review the report within 24 hours.
              </p>
            </div>

            {/* Actions */}
            <Button 
              className="w-full bg-red-500 hover:bg-red-600 text-white"
              disabled={!selectedReason}
              onClick={() => selectedReason && onReport(selectedReason)}
            >
              Submit Report
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
