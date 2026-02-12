import React from 'react';
import { Check, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface VerificationProps {
  email: string;
  otp: string;
  setOtp: (otp: string) => void;
  resendTimer: number;
  handleResend: () => void;
  onChangeEmail: () => void;
}

export const Verification: React.FC<VerificationProps> = ({ 
  email, 
  otp, 
  setOtp, 
  resendTimer, 
  handleResend,
  onChangeEmail
}) => {
  return (
    <div className="space-y-8 text-center py-4">
      <motion.div 
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary mb-6"
      >
        <Check size={48} />
      </motion.div>
      
      <div>
        <h3 className="text-xl font-bold text-white">Check your Inbox</h3>
        <p className="text-gray-400 mt-2">
          We sent a verification code to <br/>
          <span className="text-white font-medium bg-white/10 px-2 py-1 rounded-md">{email}</span>
        </p>
        <p className="text-xs text-yellow-500/80 mt-2 font-medium">
            ⚠️ Check your Spam/Junk folder if not received!
        </p>
        <button 
          onClick={onChangeEmail}
          className="text-primary text-sm font-bold mt-4 flex items-center gap-1 mx-auto hover:text-primary/80 transition-colors"
        >
          <Edit2 size={14} /> Change Email
        </button>
      </div>

      <div className="space-y-3">
        <input 
          type="text"
          placeholder="000000" 
          autoFocus
          className="w-full bg-black/20 border border-white/10 rounded-3xl py-6 text-center text-4xl tracking-[0.5em] text-white focus:border-primary/50 outline-none font-mono placeholder:text-gray-700 transition-all focus:bg-black/30"
          maxLength={6}
          inputMode="numeric"
          pattern="[0-9]*"
          value={otp}
          onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
        />
        <p className="text-xs text-gray-500">
          Did not receive the code? <span 
            className={`text-white cursor-pointer hover:underline ${resendTimer > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleResend}
          >
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend'}
          </span>
        </p>
      </div>
    </div>
  );
};
